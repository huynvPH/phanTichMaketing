import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { YoutubeTranscript } from 'youtube-transcript';
import { testAIConnection, callAI, fetchProviderModels, getDefaultModels, PROMPT_TEMPLATES } from './aiService.js';
import { testNotionConnection, listNotionTargets, createNotionResearchPage } from './notionService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, '..', 'config.json');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Helper: Đọc cấu hình cục bộ
function loadConfig() {
  let fileData = {};
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      fileData = JSON.parse(data);
    }
  } catch (err) {
    console.error('Lỗi khi đọc config.json:', err.message);
  }
  return {
    openaiApiKey: process.env.OPENAI_API_KEY || fileData.openaiApiKey || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || fileData.anthropicApiKey || '',
    geminiApiKey: process.env.GEMINI_API_KEY || fileData.geminiApiKey || '',
    openrouterApiKey: process.env.OPENROUTER_API_KEY || fileData.openrouterApiKey || '',
    openrouterModel: process.env.OPENROUTER_MODEL || fileData.openrouterModel || 'Gemini 3.6 Flash',
    nineRouterApiKey: process.env.NINEROUTER_API_KEY || fileData.nineRouterApiKey || '',
    nineRouterBaseUrl: process.env.NINEROUTER_BASE_URL || fileData.nineRouterBaseUrl || 'http://localhost:20128/v1',
    nineRouterModel: process.env.NINEROUTER_MODEL || fileData.nineRouterModel || 'ag/claude-sonnet-4-6',
    localBaseUrl: process.env.LOCAL_BASE_URL || fileData.localBaseUrl || 'http://localhost:20128/v1',
    localModel: process.env.LOCAL_MODEL || fileData.localModel || 'ag/claude-sonnet-4-6',
    notionToken: process.env.NOTION_TOKEN || fileData.notionToken || '',
    notionParentId: process.env.NOTION_PARENT_ID || fileData.notionParentId || '',
    notionParentType: process.env.NOTION_PARENT_TYPE || fileData.notionParentType || 'page',
    defaultProvider: process.env.DEFAULT_PROVIDER || fileData.defaultProvider || 'gemini',
    defaultModel: process.env.DEFAULT_MODEL || fileData.defaultModel || 'gemini-3.6-flash',
  };
}

// Helper: Lưu cấu hình cục bộ (chỉ ghi khi không ở môi trường serverless readonly)
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.warn('Không thể ghi config.json (môi trường Vercel):', e.message);
  }
}

// Helper: Đọc client keys gửi từ trình duyệt (cho Vercel / serverless)
function getClientKeys(req) {
  if (req.headers['x-client-keys']) {
    try {
      return JSON.parse(decodeURIComponent(req.headers['x-client-keys']));
    } catch {}
  }
  return {};
}

// Helper: Tự động cân bằng ngoặc và phân tích JSON an toàn
function safeParseJson(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Thử bóc tách JSON object từ chuỗi văn bản
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    } catch {}
  }

  // Cố gắng cứu chuỗi JSON bị ngắt cụt (Token truncation) bằng cách cân bằng dấu ngoặc
  if (firstBrace !== -1) {
    let truncated = cleaned.slice(firstBrace).trim();
    truncated = truncated.replace(/,\s*$/, '');
    
    let openBraces = (truncated.match(/\{/g) || []).length;
    let closeBraces = (truncated.match(/\}/g) || []).length;
    let openBrackets = (truncated.match(/\[/g) || []).length;
    let closeBrackets = (truncated.match(/\]/g) || []).length;

    // Đóng ngoặc kép nếu chuỗi đang bị dở
    const quotes = (truncated.match(/(?<!\\)"/g) || []).length;
    if (quotes % 2 !== 0) {
      truncated += '"';
    }

    while (openBrackets > closeBrackets) {
      truncated += ']';
      closeBrackets++;
    }
    while (openBraces > closeBraces) {
      truncated += '}';
      closeBraces++;
    }

    try {
      return JSON.parse(truncated);
    } catch {}
  }

  return null;
}

// 1. API: Lấy trạng thái cấu hình
app.get('/api/config', (req, res) => {
  const cfg = loadConfig();
  const ck = getClientKeys(req);
  const geminiKey = ck.geminiApiKey || cfg.geminiApiKey;
  const openaiKey = ck.openaiApiKey || cfg.openaiApiKey;
  const claudeKey = ck.anthropicApiKey || cfg.anthropicApiKey;
  const openrouterKey = ck.openrouterApiKey || cfg.openrouterApiKey;
  const nineRouterKey = ck.nineRouterApiKey || cfg.nineRouterApiKey;
  const notionToken = ck.notionToken || cfg.notionToken;

  res.json({
    hasOpenAI: Boolean(openaiKey),
    hasClaude: Boolean(claudeKey),
    hasGemini: Boolean(geminiKey),
    hasOpenRouter: Boolean(openrouterKey),
    hasNineRouter: Boolean(nineRouterKey),
    hasLocal: Boolean(cfg.localBaseUrl),
    hasNotion: Boolean(notionToken),
    maskedOpenAI: openaiKey ? `${openaiKey.slice(0, 4)}...${openaiKey.slice(-4)}` : '',
    maskedClaude: claudeKey ? `${claudeKey.slice(0, 4)}...${claudeKey.slice(-4)}` : '',
    maskedGemini: geminiKey ? `${geminiKey.slice(0, 4)}...${geminiKey.slice(-4)}` : '',
    maskedOpenRouter: openrouterKey ? `${openrouterKey.slice(0, 7)}...${openrouterKey.slice(-4)}` : '',
    openrouterModel: cfg.openrouterModel || 'Gemini 3.6 Flash',
    maskedNineRouter: nineRouterKey ? `${nineRouterKey.slice(0, 7)}...${nineRouterKey.slice(-4)}` : '',
    nineRouterBaseUrl: ck.nineRouterBaseUrl || cfg.nineRouterBaseUrl || 'http://localhost:20128/v1',
    nineRouterModel: ck.nineRouterModel || cfg.nineRouterModel || 'ag/claude-sonnet-4-6',
    localBaseUrl: cfg.localBaseUrl || 'http://localhost:20128/v1',
    localModel: cfg.localModel || 'ag/claude-sonnet-4-6',
    maskedNotion: notionToken ? `${notionToken.slice(0, 7)}...${notionToken.slice(-4)}` : '',
    notionParentId: ck.notionParentId || cfg.notionParentId || '',
    notionParentType: ck.notionParentType || cfg.notionParentType || 'page',
    defaultProvider: cfg.defaultProvider || 'gemini',
    defaultModel: cfg.defaultModel || 'gemini-3.6-flash',
  });
});

// 2. API: Cập nhật cấu hình
app.post('/api/config', (req, res) => {
  try {
    const current = loadConfig();
    const {
      openaiApiKey,
      anthropicApiKey,
      geminiApiKey,
      openrouterApiKey,
      openrouterModel,
      nineRouterApiKey,
      nineRouterBaseUrl,
      nineRouterModel,
      localBaseUrl,
      localModel,
      notionToken,
      notionParentId,
      notionParentType,
      defaultProvider,
      defaultModel,
    } = req.body;

    const updated = {
      ...current,
      ...(openaiApiKey !== undefined && { openaiApiKey }),
      ...(anthropicApiKey !== undefined && { anthropicApiKey }),
      ...(geminiApiKey !== undefined && { geminiApiKey }),
      ...(openrouterApiKey !== undefined && { openrouterApiKey }),
      ...(openrouterModel !== undefined && { openrouterModel }),
      ...(nineRouterApiKey !== undefined && { nineRouterApiKey }),
      ...(nineRouterBaseUrl !== undefined && { nineRouterBaseUrl }),
      ...(nineRouterModel !== undefined && { nineRouterModel }),
      ...(localBaseUrl !== undefined && { localBaseUrl }),
      ...(localModel !== undefined && { localModel }),
      ...(notionToken !== undefined && { notionToken }),
      ...(notionParentId !== undefined && { notionParentId }),
      ...(notionParentType !== undefined && { notionParentType }),
      ...(defaultProvider !== undefined && { defaultProvider }),
      ...(defaultModel !== undefined && { defaultModel }),
    };

    saveConfig(updated);
    res.json({ success: true, message: 'Đã lưu cấu hình API thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. API: Test kết nối tới từng bên
app.post('/api/test-connection', async (req, res) => {
  const { provider, apiKey, model, customBaseUrl } = req.body;
  const cfg = loadConfig();

  try {
    if (provider === 'notion') {
      const token = apiKey || cfg.notionToken;
      const result = await testNotionConnection(token);
      return res.json(result);
    }

    let key = apiKey;
    let targetUrl = customBaseUrl;

    if (!key) {
      if (provider === 'openai') key = cfg.openaiApiKey;
      else if (provider === 'claude') key = cfg.anthropicApiKey;
      else if (provider === 'gemini') key = cfg.geminiApiKey;
      else if (provider === 'openrouter') key = cfg.openrouterApiKey;
      else if (provider === '9router') {
        key = cfg.nineRouterApiKey || '';
        targetUrl = targetUrl || cfg.nineRouterBaseUrl || 'http://localhost:20128/v1';
      } else if (provider === 'local') {
        key = 'local-no-key';
        targetUrl = targetUrl || cfg.localBaseUrl;
      }
    }

    const result = await testAIConnection(provider, key, model, targetUrl);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3.1 API: Lấy danh sách models động từ Provider
app.post('/api/ai/models', async (req, res) => {
  try {
    const { provider, apiKey, customBaseUrl } = req.body;
    const cfg = loadConfig();
    const ck = getClientKeys(req);

    let key = apiKey;
    let targetUrl = customBaseUrl;
    if (!key) {
      if (provider === 'gemini') key = ck.geminiApiKey || cfg.geminiApiKey;
      else if (provider === 'openai') key = ck.openaiApiKey || cfg.openaiApiKey;
      else if (provider === 'claude') key = ck.anthropicApiKey || cfg.anthropicApiKey;
      else if (provider === 'openrouter') key = ck.openrouterApiKey || cfg.openrouterApiKey;
      else if (provider === '9router') {
        key = ck.nineRouterApiKey || cfg.nineRouterApiKey || '';
        targetUrl = targetUrl || ck.nineRouterBaseUrl || cfg.nineRouterBaseUrl || 'http://localhost:20128/v1';
      } else if (provider === 'local') {
        targetUrl = targetUrl || ck.localBaseUrl || cfg.localBaseUrl || 'http://localhost:11434/v1';
      }
    }

    const models = await fetchProviderModels(provider, key, targetUrl);
    res.json({ success: true, provider, models });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. API: Lấy danh sách Pages/Databases từ Notion để người dùng chọn
app.get('/api/notion/targets', async (req, res) => {
  const cfg = loadConfig();
  const ck = getClientKeys(req);
  const token = req.query.token || ck.notionToken || cfg.notionToken;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Chưa cấu hình Notion Token' });
  }
  const result = await listNotionTargets(token);
  res.json(result);
});

// 5. API: Thực hiện phân tích AI theo quy trình
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const {
      moduleType, // 'voc' | 'search' | 'competitor' | 'offer' | 'framing'
      provider,   // '9router' | 'claude' | 'openai' | 'gemini' | 'openrouter' | 'local'
      model,
      rawData,    // Dữ liệu người dùng paste (comment, review, text)
      metadata,   // { industry, targetCustomer, currentProduct, etc. }
      customPrompt,
    } = req.body;

    const cfg = loadConfig();
    const ck = getClientKeys(req);
    let activeProvider = provider;
    if (!activeProvider) {
      if (model?.startsWith('gemini')) activeProvider = 'gemini';
      else if (model?.startsWith('gpt-')) activeProvider = 'openai';
      else if (model?.includes('claude-3') || model?.includes('claude-sonnet')) {
        if (model?.startsWith('ag/')) activeProvider = '9router';
        else activeProvider = 'claude';
      }
      else if (model === 'local-model') activeProvider = 'local';
      else activeProvider = cfg.defaultProvider || 'gemini';
    }
    let apiKey = req.body.apiKey || '';
    let targetBaseUrl = req.body.customBaseUrl;

    if (!apiKey) {
      if (activeProvider === 'openai') apiKey = ck.openaiApiKey || cfg.openaiApiKey;
      else if (activeProvider === 'claude') apiKey = ck.anthropicApiKey || cfg.anthropicApiKey;
      else if (activeProvider === 'gemini') apiKey = ck.geminiApiKey || cfg.geminiApiKey;
      else if (activeProvider === 'openrouter') apiKey = ck.openrouterApiKey || cfg.openrouterApiKey;
      else if (activeProvider === '9router') {
        apiKey = ck.nineRouterApiKey || cfg.nineRouterApiKey || '';
        targetBaseUrl = targetBaseUrl || ck.nineRouterBaseUrl || cfg.nineRouterBaseUrl || 'http://localhost:20128/v1';
      }
      else if (activeProvider === 'local') {
        apiKey = 'local';
        targetBaseUrl = targetBaseUrl || ck.localBaseUrl || cfg.localBaseUrl;
      }
    }

    if (activeProvider !== 'local' && !apiKey) {
      return res.status(400).json({
        success: false,
        error: `Bạn chưa thiết lập API Key cho ${activeProvider.toUpperCase()}. Hãy bấm vào Cài đặt để thêm key.`,
      });
    }

    const template = PROMPT_TEMPLATES[moduleType] || PROMPT_TEMPLATES.voc;
    const systemPrompt = template.systemPrompt;

    const userPrompt = `
BỐI CẢNH & PHẠM VI NGHIÊN CỨU:
- Ngành/Lĩnh vực: ${metadata?.industry || 'Chưa xác định'}
- Sản phẩm/Mô hình: ${metadata?.product || 'Chưa xác định'}
- Nhóm khách hàng mục tiêu: ${metadata?.targetAudience || 'Khách hàng tiềm năng'}
- Kênh/Nguồn dữ liệu: ${metadata?.source || 'Tổng hợp'}
${customPrompt ? `- Yêu cầu bổ sung đặc biệt: ${customPrompt}` : ''}

DỮ LIỆU ĐẦU VÀO ĐỂ BÓC TÁCH:
${typeof rawData === 'string' ? rawData : JSON.stringify(rawData, null, 2)}

Hãy bóc tách thật sắc bén, chuẩn xác, dựa trên dữ liệu thực tế và trả về đúng định dạng JSON như quy định.
`;

    const activeModel =
      model ||
      (activeProvider === 'openrouter'
        ? cfg.openrouterModel
        : activeProvider === 'local'
        ? cfg.localModel
        : undefined);

    const rawResponse = await callAI({
      provider: activeProvider,
      apiKey,
      model: activeModel,
      systemPrompt,
      userPrompt,
      customBaseUrl: targetBaseUrl,
      jsonMode: activeProvider !== 'claude', // Claude hỗ trợ xuất format JSON tự nhiên rất chuẩn
    });

    // Parse JSON an toàn bằng thuật toán cân bằng ngoặc
    const parsedData = safeParseJson(rawResponse);

    res.json({
      success: true,
      provider: activeProvider,
      model: model || 'default',
      moduleType,
      data: parsedData,
      rawText: rawResponse,
    });
  } catch (error) {
    console.error('Lỗi khi phân tích AI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5.1 API: Phân tích & trích xuất metadata từ danh sách links/kênh video đối thủ
app.post('/api/competitor/parse-links', (req, res) => {
  try {
    const { links = [] } = req.body;
    const parsed = links.map((link, idx) => {
      const url = String(link).trim();
      let platform = 'Khác';
      let id = `VID-${idx + 1}`;
      let channel = 'Đối thủ tham chiếu';
      let type = 'video';

      if (url.includes('tiktok.com')) {
        platform = 'TikTok';
        if (url.includes('/video/')) {
          const m = url.match(/\/video\/(\d+)/);
          if (m) id = m[1];
        }
        const userMatch = url.match(/@([a-zA-Z0-9_.-]+)/);
        if (userMatch) channel = `@${userMatch[1]}`;
        if (!url.includes('/video/')) type = 'channel';
      } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        platform = 'YouTube';
        if (url.includes('/shorts/')) {
          const m = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
          if (m) id = m[1];
          type = 'shorts';
        } else if (url.includes('watch?v=')) {
          const m = url.match(/v=([a-zA-Z0-9_-]+)/);
          if (m) id = m[1];
        } else if (url.includes('youtu.be/')) {
          const m = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
          if (m) id = m[1];
        } else if (url.includes('/@')) {
          type = 'channel';
          const u = url.match(/@([a-zA-Z0-9_.-]+)/);
          if (u) channel = `@${u[1]}`;
        }
      } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
        platform = 'Facebook';
        if (url.includes('/reel/')) type = 'reels';
        else if (url.includes('ads/library')) type = 'ad_library';
      } else if (url.includes('instagram.com')) {
        platform = 'Instagram';
        if (url.includes('/reel/')) type = 'reels';
      }

      return {
        url,
        platform,
        id,
        channel,
        type,
        status: 'ready'
      };
    });

    res.json({ success: true, total: parsed.length, videos: parsed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5.2 API: Tự động trích xuất phụ đề/transcript từ link YouTube / Shorts
app.post('/api/competitor/fetch-transcript', async (req, res) => {
  try {
    const { urls = [] } = req.body;
    const linkList = Array.isArray(urls)
      ? urls
      : String(urls)
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

    if (linkList.length === 0) {
      return res.status(400).json({ success: false, error: 'Chưa có link video nào được cung cấp' });
    }

    const results = [];

    for (const rawUrl of linkList) {
      const url = rawUrl.trim();
      let videoId = null;

      // Trích xuất video ID từ nhiều định dạng URL YouTube
      if (url.includes('youtube.com/shorts/')) {
        const m = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
        if (m) videoId = m[1];
      } else if (url.includes('watch?v=' || url.includes('&v='))) {
        const m = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
        if (m) videoId = m[1];
      } else if (url.includes('youtu.be/')) {
        const m = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        if (m) videoId = m[1];
      } else if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        videoId = url;
      }

      if (!videoId) {
        results.push({
          url,
          videoId: null,
          title: 'Không phải link YouTube hợp lệ',
          author: 'N/A',
          transcript: '',
          status: 'skipped',
          message: 'Hiện tại tự động cào transcript hỗ trợ tốt nhất cho YouTube & YouTube Shorts.',
        });
        continue;
      }

      // 1. Lấy thông tin tiêu đề qua oEmbed
      let title = `Video ${videoId}`;
      let author = 'Đối thủ';
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (oembedData.title) title = oembedData.title;
          if (oembedData.author_name) author = oembedData.author_name;
        }
      } catch {}

      // 2. Lấy transcript/phụ đề
      let transcriptText = '';
      let status = 'success';
      let message = 'Lấy phụ đề thành công';

      try {
        // Thử tiếng Việt trước
        let transcriptItems = [];
        try {
          transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'vi' });
        } catch {
          // Thử ngôn ngữ mặc định (Anh hoặc auto)
          transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        }

        if (Array.isArray(transcriptItems) && transcriptItems.length > 0) {
          transcriptText = transcriptItems
            .map((item) => item.text?.trim())
            .filter(Boolean)
            .join(' ');
        } else {
          status = 'no_transcript';
          message = 'Video không có phụ đề hoặc phụ đề bị tắt.';
        }
      } catch (err) {
        status = 'error';
        message = `Không lấy được transcript (${err.message || 'Phụ đề không khả dụng'})`;
      }

      results.push({
        url,
        videoId,
        title,
        author,
        transcript: transcriptText,
        status,
        message,
      });
    }

    // Ghép toàn bộ nội dung để sẵn sàng dán vào form phân tích
    const combinedBlocks = results
      .filter((r) => r.transcript)
      .map((r, i) => {
        return `=== VIDEO ${i + 1}: ${r.title} (Kênh: ${r.author}) ===\nLink: ${r.url}\n[LỜI THOẠI TRANSCRIPT]:\n${r.transcript}\n`;
      });

    const combinedText = combinedBlocks.join('\n----------------------------------------\n\n');

    res.json({
      success: true,
      total: results.length,
      successCount: results.filter((r) => r.status === 'success').length,
      results,
      combinedText,
    });
  } catch (error) {
    console.error('Lỗi khi fetch transcript:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. API: Xuất dữ liệu sang Notion
app.post('/api/notion/sync', async (req, res) => {
  try {
    const { targetId, targetType, title, moduleName, rawData, analysisJson } = req.body;
    const cfg = loadConfig();
    const ck = getClientKeys(req);
    const token = req.body.notionToken || ck.notionToken || cfg.notionToken;
    const parentId = targetId || ck.notionParentId || cfg.notionParentId;
    const parentType = targetType || ck.notionParentType || cfg.notionParentType || 'page';

    if (!token) {
      return res.status(400).json({ success: false, error: 'Chưa cấu hình Notion Token' });
    }
    if (!parentId) {
      return res.status(400).json({
        success: false,
        error: 'Chưa có Page ID / Database ID đích trên Notion. Vui lòng chọn hoặc nhập ID.',
      });
    }

    const result = await createNotionResearchPage({
      token,
      parentId,
      parentType,
      title,
      moduleName,
      rawData,
      analysisJson,
    });

    res.json(result);
  } catch (error) {
    console.error('Lỗi khi đồng bộ Notion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Phục vụ frontend nếu đã build
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server Marketing AI Hub đang chạy tại http://localhost:${PORT}`);
  });
}

export default app;
