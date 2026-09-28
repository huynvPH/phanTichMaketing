import { Client } from '@notionhq/client';

// Helpers dựng block Notion (rút gọn các literal lặp lại bên dưới)
const rt = (content, annotations) => ({ type: 'text', text: { content }, ...(annotations && { annotations }) });
const block = (type, rich_text, extra) => ({ object: 'block', type, [type]: { rich_text, ...extra } });
const h2 = (text) => block('heading_2', [rt(text)]);
const para = (text) => block('paragraph', [rt(text)]);
const callout = (text, emoji, color) => block('callout', [rt(text)], { icon: { emoji }, color });
const bullet = (rich_text) => block('bulleted_list_item', rich_text);
const section = (arr, title, fn) => (arr?.length ? [h2(title), ...arr.map(fn)] : []);

export async function testNotionConnection(token) {
  try {
    const notion = new Client({ auth: token });
    const user = await notion.users.me({});
    return {
      success: true,
      message: `Kết nối Notion thành công! Đang đăng nhập dưới tên: ${user.name || user.id}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Không thể kết nối với Notion API. Kiểm tra lại Internal Integration Token.',
    };
  }
}

export async function listNotionTargets(token) {
  try {
    const notion = new Client({ auth: token });
    const response = await notion.search({
      page_size: 30,
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time',
      },
    });

    const targets = response.results.map((item) => {
      let title = 'Không tên';
      if (item.object === 'page') {
        const titleProp = Object.values(item.properties || {}).find((p) => p.type === 'title');
        title = titleProp?.title?.[0]?.plain_text || item.id;
      } else if (item.object === 'database') {
        title = item.title?.[0]?.plain_text || item.id;
      }

      return {
        id: item.id,
        type: item.object, // 'page' or 'database'
        title: title || `Untitled ${item.object}`,
        url: item.url,
      };
    });

    return { success: true, targets };
  } catch (error) {
    return { success: false, error: error.message, targets: [] };
  }
}

/**
 * Xuất dữ liệu nghiên cứu hoặc Lịch nội dung vào Notion dưới dạng một Trang (Docs) hoàn chỉnh
 */
export async function createNotionResearchPage({ token, parentId, parentType, title, moduleName, analysisJson }) {
  if (!token) throw new Error('Chưa cấu hình Notion Token');
  if (!parentId) throw new Error('Vui lòng chọn hoặc nhập Page ID / Database ID đích trên Notion');

  const notion = new Client({ auth: token });

  // Tóm tắt cốt lõi thực tế
  const summaryText =
    analysisJson?.executiveSummary ||
    analysisJson?.focusSummary ||
    analysisJson?.summary ||
    analysisJson?.brandSummary ||
    analysisJson?.clarifiedGoal;

  const childrenBlocks = [
    callout(
      `Báo cáo: ${moduleName || 'Marketing Research'} | Thời gian tạo: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`,
      '📊',
      'blue_background'
    ),
  ];

  if (summaryText) {
    childrenBlocks.push(h2('1. Tóm tắt cốt lõi (Executive Summary)'), para(String(summaryText).slice(0, 1800)));
  }

  // 1. Nếu là Lịch Nội Dung (Content Calendar)
  if (analysisJson?.posts && Array.isArray(analysisJson.posts)) {
    childrenBlocks.push(h2(`2. Lịch Nội Dung Kênh ${analysisJson.channel || ''} (${analysisJson.period || ''})`));

    analysisJson.posts.forEach((post) => {
      const trace = post.traceableInsight || {};
      const outlineStr = Array.isArray(post.keyOutline) ? post.keyOutline.join(' | ') : (post.keyOutline || '');

      let postContent = `📌 [${post.day || 'Bài'}] [${post.funnelStage || 'TOFU'}] [${post.pillarName || post.pillarId || 'Pillar'}]\n`;
      postContent += `Tiêu đề/Hook: ${post.topic || ''}\n"${post.hook || ''}"\n\n`;
      if (outlineStr) postContent += `📝 Dàn ý: ${outlineStr}\n\n`;
      if (trace.insightCode || trace.insightType) {
        postContent += `🔍 TRUY XUẤT INSIGHT: ${trace.insightCode || ''} - ${trace.insightType || ''}\n`;
      }
      if (trace.verbatimEvidence) {
        postContent += `💬 Bằng chứng trích dẫn khách: "${trace.verbatimEvidence}"\n`;
      }
      if (trace.rationale) {
        postContent += `💡 Giải pháp: ${trace.rationale}\n`;
      }
      if (post.callToAction) {
        postContent += `🎯 CTA: ${post.callToAction}`;
      }

      childrenBlocks.push(callout(postContent.slice(0, 1900), '📅', 'gray_background'));
    });
  }

  // 2. Nếu là VoC (Tiếng nói khách hàng)
  if (analysisJson?.painPoints || analysisJson?.objections) {
    childrenBlocks.push(
      ...section(analysisJson.painPoints, '2. Nỗi đau & Rào cản của khách hàng (Pain Points)', (p) =>
        bullet([
          rt(`[${p.level || 'Ưu tiên'}] ${p.pain}: `, { bold: true }),
          rt(p.quote ? `"${p.quote}"` : '', { italic: true }),
        ])
      ),
      ...section(analysisJson.objections, '3. Rào cản & Nỗi sợ khiến khách hàng ngập ngừng', (o) =>
        bullet([rt(`${o.objection}: `, { bold: true }), rt(o.quote ? `"${o.quote}"` : '', { italic: true })])
      ),
      ...section(analysisJson.marketingHooks, '4. Gợi ý Hook truyền thông từ ngôn từ khách hàng', (h) =>
        block('quote', [rt(String(h).slice(0, 1800))])
      )
    );
  }

  // 3. Nếu là Search Demand (Nhu cầu tìm kiếm)
  childrenBlocks.push(
    ...section(analysisJson?.intentClusters, '2. Phân nhóm Ý định tìm kiếm & Hành trình mua', (c) =>
      bullet([
        rt(`${c.theme} [${c.stage} | ${c.searchIntent}]: `, { bold: true }),
        rt(`Gợi ý định dạng: ${c.recommendedContent || ''}`),
      ])
    )
  );

  // 4. Nếu là Competitor (Nội dung đối thủ)
  if (analysisJson?.winningFormats || analysisJson?.saturatedThemes) {
    childrenBlocks.push(
      ...section(analysisJson.winningFormats, '2. Định dạng chiến thắng (Winning Formats) cần học hỏi', (wf) =>
        bullet([rt(`${wf.format}: `, { bold: true }), rt(`${wf.reason} | Hook: ${wf.hookStyle || ''}`)])
      ),
      ...section(analysisJson.saturatedThemes, '3. Cảnh báo chủ đề đã bão hòa (Cần tránh/đổi góc)', (st) =>
        bullet([rt(`${st.theme}: `, { bold: true }), rt(st.warning || '')])
      )
    );
  }

  // 5. Nếu là Offer & Quảng cáo
  if (analysisJson?.improvedOfferIdea) {
    childrenBlocks.push(h2('2. Chiến lược Offer vượt trội đề xuất'));
    const offer = analysisJson.improvedOfferIdea;
    if (offer.coreOffer) {
      childrenBlocks.push(callout(`Gói cốt lõi: ${offer.coreOffer}`, '💎', 'green_background'));
    }
    if (offer.riskReversal) {
      childrenBlocks.push(bullet([rt('Đảo ngược rủi ro/Cam kết: ', { bold: true }), rt(offer.riskReversal)]));
    }
  }

  // 6. Nếu là Content Strategy (Chiến lược nội dung)
  if (analysisJson?.contentPillars || analysisJson?.brandSummary) {
    if (analysisJson.brandSummary) {
      childrenBlocks.push(callout(`🎯 Định vị nội dung: ${analysisJson.brandSummary}`, '💡', 'purple_background'));
    }

    childrenBlocks.push(
      ...section(analysisJson.contentPillars, '2. Các Trụ Cột Nội Dung Cốt Lõi (Content Pillars)', (p) =>
        bullet([
          rt(`[${p.id || 'Pillar'}] ${p.name} (${p.ratioPercent || 0}%): `, { bold: true }),
          rt(`${p.objective || ''} | Insight: ${p.targetInsight || ''}`),
        ])
      ),
      ...section(analysisJson.channelRoles, '3. Phân Vai Trò Theo Kênh', (cr) =>
        bullet([
          rt(`${cr.channel} (${cr.postingFrequency || ''}): `, { bold: true }),
          rt(`${cr.role} | Định dạng: ${cr.primaryFormats?.join(', ') || ''}`),
        ])
      )
    );
  }

  // Tạo trang: Tương thích cả parent là Database lẫn Page
  const pageTitle = title || `Báo Cáo - ${new Date().toLocaleDateString('vi-VN')}`;
  let newPage;

  if (parentType === 'database') {
    let titlePropKey = 'title';
    try {
      const parentDb = await notion.databases.retrieve({ database_id: parentId });
      const found = Object.entries(parentDb.properties || {}).find(([_, val]) => val.type === 'title');
      if (found) titlePropKey = found[0];
    } catch {}

    newPage = await notion.pages.create({
      parent: { database_id: parentId },
      properties: {
        [titlePropKey]: {
          title: [{ type: 'text', text: { content: pageTitle } }],
        },
      },
      children: childrenBlocks.slice(0, 90),
    });
  } else {
    newPage = await notion.pages.create({
      parent: { page_id: parentId },
      properties: {
        title: [{ type: 'text', text: { content: pageTitle } }],
      },
      children: childrenBlocks.slice(0, 90),
    });
  }

  // Đẩy tiếp toàn bộ các block còn lại theo từng đợt 90 block (vượt qua giới hạn 100 block/request của Notion)
  for (let i = 90; i < childrenBlocks.length; i += 90) {
    try {
      await notion.blocks.children.append({
        block_id: newPage.id,
        children: childrenBlocks.slice(i, i + 90),
      });
    } catch (appendErr) {
      console.warn(`Lỗi khi nối thêm block vào Notion (đợt ${Math.floor(i / 90) + 1}):`, appendErr.message);
    }
  }

  return {
    success: true,
    pageId: newPage.id,
    url: newPage.url,
    message: 'Đã xuất báo cáo sang Notion thành công!',
  };
}
