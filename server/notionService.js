import { Client } from '@notionhq/client';

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
 * Xuất dữ liệu nghiên cứu đã phân tích vào Notion dưới dạng một Page hoàn chỉnh
 */
export async function createNotionResearchPage({ token, parentId, parentType, title, moduleName, rawData, analysisJson }) {
  if (!token) throw new Error('Chưa cấu hình Notion Token');
  if (!parentId) throw new Error('Vui lòng chọn hoặc nhập Page ID / Database ID đích trên Notion');

  const notion = new Client({ auth: token });

  // Chuẩn bị các blocks Notion theo cấu trúc báo cáo chuyên nghiệp
  const childrenBlocks = [
    {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: `Báo cáo nghiên cứu tự động: ${moduleName || 'Marketing Research'} | Ngày tạo: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`,
            },
          },
        ],
        icon: { emoji: '📊' },
        color: 'blue_background',
      },
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '1. Tóm tắt cốt lõi (Executive Summary)' } }],
      },
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content: analysisJson.summary || analysisJson.clarifiedGoal || 'Đã phân tích tổng quan dữ liệu thành công.' },
          },
        ],
      },
    },
  ];

  // Nếu là VoC (Tiếng nói khách hàng)
  if (analysisJson.painPoints || analysisJson.objections) {
    if (analysisJson.painPoints?.length) {
      childrenBlocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '2. Nỗi đau & Rào cản của khách hàng (Pain Points)' } }],
        },
      });
      analysisJson.painPoints.forEach((p) => {
        childrenBlocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { type: 'text', text: { content: `[${p.level || 'Ưu tiên'}] ${p.pain}: ` }, annotations: { bold: true } },
              { type: 'text', text: { content: p.quote ? `"${p.quote}"` : '' }, annotations: { italic: true } },
            ],
          },
        });
      });
    }

    if (analysisJson.objections?.length) {
      childrenBlocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '3. Rào cản & Nỗi sợ khiến khách hàng ngập ngừng' } }],
        },
      });
      analysisJson.objections.forEach((o) => {
        childrenBlocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { type: 'text', text: { content: `${o.objection}: ` }, annotations: { bold: true } },
              { type: 'text', text: { content: o.quote ? `"${o.quote}"` : '' }, annotations: { italic: true } },
            ],
          },
        });
      });
    }

    if (analysisJson.marketingHooks?.length) {
      childrenBlocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '4. Gợi ý Hook truyền thông từ ngôn từ khách hàng' } }],
        },
      });
      analysisJson.marketingHooks.forEach((h) => {
        childrenBlocks.push({
          object: 'block',
          type: 'quote',
          quote: {
            rich_text: [{ type: 'text', text: { content: h } }],
          },
        });
      });
    }
  }

  // Nếu là Search Demand (Nhu cầu tìm kiếm)
  if (analysisJson.intentClusters?.length) {
    childrenBlocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '2. Phân nhóm Ý định tìm kiếm & Hành trình mua' } }],
      },
    });
    analysisJson.intentClusters.forEach((c) => {
      childrenBlocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { type: 'text', text: { content: `${c.theme} [${c.stage} | ${c.searchIntent}]: ` }, annotations: { bold: true } },
            { type: 'text', text: { content: `Gợi ý định dạng: ${c.recommendedContent || ''}` } },
          ],
        },
      });
    });
  }

  // Nếu là Competitor (Nội dung đối thủ)
  if (analysisJson.winningFormats || analysisJson.saturatedThemes) {
    if (analysisJson.winningFormats?.length) {
      childrenBlocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '2. Định dạng chiến thắng (Winning Formats) cần học hỏi' } }],
        },
      });
      analysisJson.winningFormats.forEach((wf) => {
        childrenBlocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { type: 'text', text: { content: `${wf.format}: ` }, annotations: { bold: true } },
              { type: 'text', text: { content: `${wf.reason} | Hook: ${wf.hookStyle || ''}` } },
            ],
          },
        });
      });
    }

    if (analysisJson.saturatedThemes?.length) {
      childrenBlocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '3. Cảnh báo chủ đề đã bão hòa (Cần tránh/đổi góc)' } }],
        },
      });
      analysisJson.saturatedThemes.forEach((st) => {
        childrenBlocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { type: 'text', text: { content: `${st.theme}: ` }, annotations: { bold: true } },
              { type: 'text', text: { content: st.warning || '' } },
            ],
          },
        });
      });
    }
  }

  // Nếu là Offer & Quảng cáo
  if (analysisJson.improvedOfferIdea) {
    childrenBlocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '2. Chiến lược Offer vượt trội đề xuất' } }],
      },
    });
    const offer = analysisJson.improvedOfferIdea;
    if (offer.coreOffer) {
      childrenBlocks.push({
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: [{ type: 'text', text: { content: `Gói cốt lõi: ${offer.coreOffer}` } }],
          icon: { emoji: '💎' },
          color: 'green_background',
        },
      });
    }
    if (offer.riskReversal) {
      childrenBlocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { type: 'text', text: { content: 'Đảo ngược rủi ro/Cam kết: ' }, annotations: { bold: true } },
            { type: 'text', text: { content: offer.riskReversal } },
          ],
        },
      });
    }
  }

  // Nếu là Content Strategy (Chiến lược nội dung)
  if (analysisJson.contentPillars || analysisJson.brandSummary) {
    if (analysisJson.brandSummary) {
      childrenBlocks.push({
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: [{ type: 'text', text: { content: `🎯 Định vị nội dung: ${analysisJson.brandSummary}` } }],
          icon: { emoji: '💡' },
          color: 'purple_background',
        },
      });
    }

    if (analysisJson.contentPillars?.length) {
      childrenBlocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '2. Các Trụ Cột Nội Dung Cốt Lõi (Content Pillars)' } }],
        },
      });
      analysisJson.contentPillars.forEach((p) => {
        childrenBlocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { type: 'text', text: { content: `[${p.id || 'Pillar'}] ${p.name} (${p.ratioPercent || 0}%): ` }, annotations: { bold: true } },
              { type: 'text', text: { content: `${p.objective || ''} | Insight: ${p.targetInsight || ''}` } },
            ],
          },
        });
      });
    }

    if (analysisJson.channelRoles?.length) {
      childrenBlocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '3. Phân Vai Trò Theo Kênh' } }],
        },
      });
      analysisJson.channelRoles.forEach((cr) => {
        childrenBlocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { type: 'text', text: { content: `${cr.channel} (${cr.postingFrequency || ''}): ` }, annotations: { bold: true } },
              { type: 'text', text: { content: `${cr.role} | Định dạng: ${cr.primaryFormats?.join(', ') || ''}` } },
            ],
          },
        });
      });
    }
  }

  // Nếu là Content Calendar (Lịch nội dung có truy xuất nguồn gốc)
  if (analysisJson.posts && Array.isArray(analysisJson.posts)) {
    childrenBlocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: `2. Lịch Nội Dung Kênh ${analysisJson.channel || ''} (${analysisJson.period || ''})` } }],
      },
    });

    analysisJson.posts.forEach((post) => {
      const trace = post.traceableInsight || {};
      childrenBlocks.push({
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: [
            { type: 'text', text: { content: `[${post.day || ''}] [${post.funnelStage || 'TOFU'}] [${post.pillarName || post.pillarId || 'Pillar'}]\n` }, annotations: { bold: true } },
            { type: 'text', text: { content: `📌 Tiêu đề/Hook: ${post.topic || ''}\n"${post.hook || ''}"\n\n` } },
            { type: 'text', text: { content: `🔍 TRUY XUẤT NGUỒN GỐC INSIGHT: ${trace.insightCode || ''} - ${trace.insightType || ''}\n` }, annotations: { bold: true } },
            { type: 'text', text: { content: `💬 Bằng chứng trích dẫn khách: "${trace.verbatimEvidence || 'Dựa trên VoC'}"\n` }, annotations: { italic: true } },
            { type: 'text', text: { content: `💡 Giải pháp: ${trace.rationale || ''}\n` } },
            { type: 'text', text: { content: `🎯 CTA: ${post.callToAction || ''}` } },
          ],
          icon: { emoji: '📅' },
          color: 'gray_background',
        },
      });
    });
  }

  // Khối dữ liệu thô đối chiếu
  if (rawData) {
    childrenBlocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [{ type: 'text', text: { content: 'Dữ liệu thô dùng để bóc tách' } }],
      },
    });
    childrenBlocks.push({
      object: 'block',
      type: 'code',
      code: {
        rich_text: [
          {
            type: 'text',
            text: { content: (typeof rawData === 'string' ? rawData : JSON.stringify(rawData, null, 2)).slice(0, 1800) },
          },
        ],
        language: 'plain text',
      },
    });
  }

  // Tạo trang: Hỗ trợ cả parent là database hoặc parent là page
  let newPage;
  if (parentType === 'database') {
    newPage = await notion.pages.create({
      parent: { database_id: parentId },
      properties: {
        title: {
          title: [
            {
              type: 'text',
              text: { content: title || `Nghiên cứu Marketing - ${new Date().toLocaleDateString('vi-VN')}` },
            },
          ],
        },
      },
      children: childrenBlocks.slice(0, 95), // Notion giới hạn 100 blocks mỗi request
    });
  } else {
    newPage = await notion.pages.create({
      parent: { page_id: parentId },
      properties: {
        title: [
          {
            type: 'text',
            text: { content: title || `Nghiên cứu Marketing - ${new Date().toLocaleDateString('vi-VN')}` },
          },
        ],
      },
      children: childrenBlocks.slice(0, 95),
    });
  }

  return {
    success: true,
    pageId: newPage.id,
    url: newPage.url,
    message: 'Đã tạo báo cáo trên Notion thành công!',
  };
}
