import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export function getDefaultModels(provider) {
  switch (provider) {
    case 'gemini':
      return [
        { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Khuyên dùng)', tag: 'Google Miễn Phí', provider: 'gemini', category: 'Google' },
        { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', tag: 'Google Miễn Phí', provider: 'gemini', category: 'Google' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tag: 'Google Cao Cấp', provider: 'gemini', category: 'Google' },
        { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', tag: 'Google', provider: 'gemini', category: 'Google' },
      ];
    case 'openai':
      return [
        { id: 'gpt-4o', name: 'GPT-4o (Khuyên dùng)', tag: 'OpenAI Direct', provider: 'openai', category: 'OpenAI' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Nhanh & Tiết kiệm)', tag: 'OpenAI Direct', provider: 'openai', category: 'OpenAI' },
        { id: 'o3-mini', name: 'o3-mini (Tư duy sâu)', tag: 'OpenAI Direct', provider: 'openai', category: 'OpenAI' },
        { id: 'o1', name: 'o1 (Reasoning cao cấp)', tag: 'OpenAI Direct', provider: 'openai', category: 'OpenAI' },
      ];
    case 'claude':
      return [
        { id: 'claude-3-7-sonnet-latest', name: 'Claude 3.7 Sonnet (Mới nhất)', tag: 'Anthropic Direct', provider: 'claude', category: 'Claude' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Chuẩn VoC)', tag: 'Anthropic Direct', provider: 'claude', category: 'Claude' },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Siêu tốc)', tag: 'Anthropic Direct', provider: 'claude', category: 'Claude' },
      ];
    case '9router':
      return [
        { id: 'ag/claude-sonnet-4-6', name: 'Claude Sonnet (9Router)', tag: '9Router', provider: '9router', category: '9Router' },
        { id: 'ag/gemini-3.7-flash-high', name: 'Gemini 3.7 Flash High (9Router)', tag: '9Router', provider: '9router', category: '9Router' },
        { id: 'ag/gemini-3.6-flash-high', name: 'Gemini 3.6 Flash High (9Router)', tag: '9Router', provider: '9router', category: '9Router' },
      ];
    case 'openrouter':
      return [
        { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (OpenRouter)', tag: 'Rẻ 99%', provider: 'openrouter', category: 'OpenRouter' },
        { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (Lý luận sâu)', tag: 'OpenRouter', provider: 'openrouter', category: 'OpenRouter' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)', tag: 'OpenRouter', provider: 'openrouter', category: 'OpenRouter' },
        { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (OpenRouter)', tag: 'OpenRouter', provider: 'openrouter', category: 'OpenRouter' },
      ];
    case 'local':
      return [
        { id: 'local-model', name: 'Local Model (Ollama / LM Studio)', tag: 'Offline 0đ', provider: 'local', category: 'Local AI' },
      ];
    default:
      return [];
  }
}

export async function fetchProviderModels(provider, apiKey, customBaseUrl) {
  try {
    if (provider === 'gemini') {
      if (!apiKey) return getDefaultModels('gemini');
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`);
      if (!res.ok) return getDefaultModels('gemini');
      const data = await res.json();
      const models = (data.models || [])
        .filter(m => m.supportedGenerationMethods?.includes('generateContent') && m.name.startsWith('models/gemini'))
        .filter(m => !m.name.includes('-tts') && !m.name.includes('-image') && !m.name.includes('embedding') && !m.name.includes('transcribe'))
        .map(m => {
          const id = m.name.replace('models/', '');
          return {
            id,
            name: m.displayName || id,
            provider: 'gemini',
            tag: 'Google Direct',
            category: 'Google'
          };
        });
      // Sort priority
      models.sort((a, b) => {
        if (a.id.includes('3.6') || a.id.includes('flash-latest')) return -1;
        if (b.id.includes('3.6') || b.id.includes('flash-latest')) return 1;
        return 0;
      });
      return models.length > 0 ? models : getDefaultModels('gemini');
    }
    else if (provider === 'openai') {
      if (!apiKey) return getDefaultModels('openai');
      const openai = new OpenAI({ apiKey });
      const res = await openai.models.list();
      const chatModels = (res.data || [])
        .filter(m => m.id.startsWith('gpt-') || m.id.startsWith('o1') || m.id.startsWith('o3') || m.id.startsWith('chatgpt-'))
        .filter(m => !m.id.includes('realtime') && !m.id.includes('audio') && !m.id.includes('transcribe') && !m.id.includes('tts'))
        .map(m => ({
          id: m.id,
          name: m.id,
          provider: 'openai',
          tag: 'OpenAI Direct',
          category: 'OpenAI'
        }));
      return chatModels.length > 0 ? chatModels : getDefaultModels('openai');
    }
    else if (provider === '9router') {
      const baseURL = customBaseUrl || 'http://localhost:20128/v1';
      const res = await fetch(`${baseURL.replace(/\/$/, '')}/models`, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      });
      if (!res.ok) return getDefaultModels('9router');
      const data = await res.json();
      const models = (data.data || []).map(m => ({
        id: m.id,
        name: m.name || m.id,
        provider: '9router',
        tag: '9Router',
        category: '9Router'
      }));
      return models.length > 0 ? models : getDefaultModels('9router');
    }
    else if (provider === 'openrouter') {
      const res = await fetch('https://openrouter.ai/api/v1/models');
      if (!res.ok) return getDefaultModels('openrouter');
      const data = await res.json();
      const models = (data.data || [])
        .slice(0, 40)
        .map(m => ({
          id: m.id,
          name: m.name || m.id,
          provider: 'openrouter',
          tag: 'OpenRouter',
          category: 'OpenRouter'
        }));
      return models.length > 0 ? models : getDefaultModels('openrouter');
    }
    else if (provider === 'local') {
      const baseURL = customBaseUrl || 'http://localhost:11434/v1';
      const res = await fetch(`${baseURL.replace(/\/$/, '')}/models`);
      if (!res.ok) return getDefaultModels('local');
      const data = await res.json();
      const models = (data.data || []).map(m => ({
        id: m.id,
        name: m.id,
        provider: 'local',
        tag: 'Offline 0đ',
        category: 'Local AI'
      }));
      return models.length > 0 ? models : getDefaultModels('local');
    }
    else if (provider === 'claude') {
      return getDefaultModels('claude');
    }
  } catch (err) {
    console.warn(`Lỗi fetchProviderModels cho ${provider}:`, err.message);
    return getDefaultModels(provider);
  }
  return getDefaultModels(provider);
}

export async function testAIConnection(provider, apiKey, model, customBaseUrl) {
  try {
    let modelsList = [];
    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey });
      const res = await openai.models.list();
      modelsList = await fetchProviderModels('openai', apiKey);
      return { 
        success: true, 
        message: `Kết nối OpenAI thành công! (${res.data.length} models sẵn sàng)`,
        models: modelsList 
      };
    } 
    else if (provider === 'claude') {
      const anthropic = new Anthropic({ apiKey });
      await anthropic.messages.create({
        model: model || 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Ping' }],
      });
      modelsList = getDefaultModels('claude');
      return { 
        success: true, 
        message: 'Kết nối Claude (Anthropic) thành công!',
        models: modelsList 
      };
    } 
    else if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const candidateModels = [
        (model === 'gemini-1.5-flash' || model === 'gemini-2.5-flash' || !model) ? 'gemini-3.6-flash' : model,
        'gemini-flash-latest'
      ];
      let lastError;
      for (const mName of candidateModels) {
        try {
          const m = genAI.getGenerativeModel({ model: mName });
          await m.generateContent('Ping');
          modelsList = await fetchProviderModels('gemini', apiKey);
          return { 
            success: true, 
            message: `Kết nối Google Gemini (${mName}) thành công! Tìm thấy ${modelsList.length} models khả dụng.`,
            models: modelsList 
          };
        } catch (e) {
          lastError = e;
        }
      }
      throw lastError;
    }
    else if (provider === '9router') {
      const baseURL = customBaseUrl || 'http://localhost:20128/v1';
      modelsList = await fetchProviderModels('9router', apiKey, baseURL);
      return { 
        success: true, 
        message: `Kết nối 9Router (${baseURL}) thành công! Tìm thấy ${modelsList.length} models.`,
        models: modelsList 
      };
    }
    else if (provider === 'openrouter') {
      modelsList = await fetchProviderModels('openrouter', apiKey);
      return { 
        success: true, 
        message: `Kết nối OpenRouter thành công! Tải được ${modelsList.length} models phổ biến.`,
        models: modelsList 
      };
    }
    else if (provider === 'local') {
      const baseURL = customBaseUrl || 'http://localhost:11434/v1';
      modelsList = await fetchProviderModels('local', apiKey, baseURL);
      return { 
        success: true, 
        message: `Kết nối Local AI (${baseURL}) thành công! Tìm thấy ${modelsList.length} models.`,
        models: modelsList 
      };
    }
    throw new Error('Nhà cung cấp không hợp lệ');
  } catch (error) {
    return { success: false, message: error.message || 'Lỗi không xác định khi kết nối' };
  }
}

export async function callAI({ provider, apiKey, model, systemPrompt, userPrompt, jsonMode = false, customBaseUrl }) {
  if (provider !== 'local' && !apiKey) {
    throw new Error(`Chưa cấu hình API Key cho ${provider.toUpperCase()}`);
  }

  // OpenAI-compatible providers: OpenAI, OpenRouter, 9Router, Local (Ollama/LM Studio)
  if (['openai', 'openrouter', '9router', 'local'].includes(provider)) {
    const baseURL = provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1'
      : provider === '9router'
      ? (customBaseUrl || 'http://localhost:20128/v1')
      : provider === 'local'
      ? (customBaseUrl || 'http://localhost:11434/v1')
      : undefined;

    const defaultModel = provider === '9router'
      ? 'ag/claude-sonnet-4-6'
      : provider === 'openrouter'
      ? 'deepseek/deepseek-chat'
      : provider === 'local'
      ? 'llama3.2'
      : 'gpt-4o';

    const client = new OpenAI({
      apiKey: apiKey || 'local-no-key',
      ...(baseURL && { baseURL }),
      ...(provider === 'openrouter' && {
        defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'Marketing AI Hub' },
      }),
    });

    const response = await client.chat.completions.create({
      model: model || defaultModel,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    });
    return response.choices[0]?.message?.content || '';
  }

  if (provider === 'claude') {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt || undefined,
      messages: [{ role: 'user', content: userPrompt }],
    });
    return response.content[0]?.text || '';
  }

  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(apiKey);
    const primaryModel = (model === 'gemini-1.5-flash' || model === 'gemini-2.5-flash' || !model) ? 'gemini-3.6-flash' : model;
    
    // Danh sách model ứng viên xếp theo thứ tự ưu tiên
    const candidateModels = Array.from(new Set([
      primaryModel,
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-2.5-pro'
    ]));

    let lastError;
    for (const targetModel of candidateModels) {
      // Mỗi model thử tối đa 2 lần (nếu gặp 503 thì chờ 1.2 giây rồi retry)
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const geminiModel = genAI.getGenerativeModel({
            model: targetModel,
            systemInstruction: systemPrompt || undefined,
            generationConfig: {
              temperature: 0.7,
              ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
            },
          });
          const result = await geminiModel.generateContent(userPrompt);
          return result.response.text();
        } catch (err) {
          lastError = err;
          const is503 = err.message?.includes('503') || err.message?.includes('high demand');
          if (is503 && attempt === 1) {
            // Chờ 1.2s trước khi thử lại model này
            await new Promise((r) => setTimeout(r, 1200));
            continue;
          }
          console.warn(`Gemini model ${targetModel} gặp lỗi (${err.message}). Chuyển sang model ứng viên tiếp theo...`);
          break; // Chuyển sang model tiếp theo trong danh sách
        }
      }
    }
    throw lastError;
  }

  throw new Error(`Nhà cung cấp ${provider} chưa được hỗ trợ`);
}

/**
 * Mẫu Prompts chuyên sâu cho từng nhánh nghiên cứu theo chuẩn sơ đồ
 */
export const PROMPT_TEMPLATES = {
  all_in_one_research: {
    name: 'Tổng hợp Tầng 1 - Nghiên cứu Khách hàng Toàn diện Cấp Quản lý (Executive All-in-One)',
    systemPrompt: `Bạn là Giám đốc Nghiên cứu Thị trường & Tình báo Khách hàng (Chief Growth Officer & Customer Intelligence Director) hàng đầu.
Nhiệm vụ của bạn là nhận toàn bộ bản Brief từ Ban Giám Đốc/Sếp (gồm: Sản phẩm, Ngành hàng, Khách hàng mục tiêu, Mục tiêu/Quyết định kinh doanh, Nỗi đau/Dữ liệu thô VoC, Đối thủ & Đề xuất Offer) và thực hiện PHÂN TÍCH TOÀN DIỆN CẢ 5 NHÁNH CỦA TẦNG 1: CUSTOMER RESEARCH trong một lần chạy duy nhất.

NGUYÊN TẮC BẮT BUỘC:
1. Tính nhất quán & liên kết: 5 nhánh phải móc xích chặt chẽ với nhau (Nỗi đau VoC giải thích tại sao khách search từ khóa đó, và đó là lỗ hổng để đánh bại đối thủ bằng Offer không thể từ chối).
2. Kỷ luật Dữ liệu & Chống Ảo giác (Strict Grounding):
   - Tuyệt đối giữ nguyên trích dẫn nguyên văn phản hồi từ khách hàng. Nếu dữ liệu đầu vào KHÔNG có câu nói trực tiếp thì KHÔNG ĐƯỢC TỰ BỊA quote mà ghi 'Chưa có trích dẫn trực tiếp trong dữ liệu'.
   - Phân định rõ ràng: Luận điểm nào có dữ liệu đối chứng trực tiếp (Verified) và Luận điểm nào là suy luận/giả định chiến lược cần kiểm chứng thêm (Hypotheses).
   - Mọi con số/phần trăm đều là ước lượng định tính mô hình (qualitative estimate), không khẳng định là số liệu thực nghiệm nếu chưa có mẫu đo đếm.
3. Độ sắc bén cho Cấp Quản lý: Tóm tắt bức tranh toàn cảnh (executiveSummary) và các ưu tiên chiến lược (topStrategicPriorities) phải cô đọng, định hướng hành động cao.
4. Bắt buộc có khối thẩm định dữ liệu 'dataVerificationReport'.

BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON DUY NHẤT (không markdown bọc ngoài nếu jsonMode) theo cấu trúc chuẩn:
{
  "dataVerificationReport": {
    "inputSufficiencyScore": 80,
    "qualityRating": "Good",
    "hallucinationRisk": "Low",
    "verifiedInsightsCount": 6,
    "unverifiedHypothesesCount": 2,
    "dataGapsIdentified": [
      "Khoảng trống thông tin 1 chưa có trong dữ liệu",
      "Khoảng trống thông tin 2 cần làm rõ thêm"
    ],
    "analystNotice": "Nhận định ngắn gọn về độ vững chắc của bằng chứng và lưu ý cho nhà quản lý trước khi ra quyết định"
  },
  "executiveSummary": "Tóm lược bức tranh chiến lược cốt lõi 3-4 câu dành riêng cho sếp/ban giám đốc.",
  "topStrategicPriorities": [
    "Ưu tiên chiến lược 1: hành động cụ thể cần làm ngay",
    "Ưu tiên chiến lược 2: định vị đòn bẩy",
    "Ưu tiên chiến lược 3: đòn đánh chuyển đổi"
  ],
  "framing": {
    "clarifiedGoal": "Mục tiêu quyết định kinh doanh cốt lõi đã được định khung sắc bén",
    "solidFacts": ["Những dữ kiện thực tế đã chắc chắn"],
    "hypotheses": ["Những giả định then chốt cần kiểm chứng"],
    "criticalQuestions": ["Top 3 câu hỏi nghiên cứu sống còn phải giải quyết"],
    "stoppingConditions": "Dấu hiệu/điều kiện để dừng nghiên cứu và chuyển ngay sang thực thi"
  },
  "search": {
    "summary": "Đánh giá xu hướng tìm kiếm và nhu cầu chủ động của khách hàng",
    "intentClusters": [
      {
        "theme": "Chủ đề / Nhóm nhu cầu tìm kiếm",
        "searchIntent": "Thông tin / So sánh / Giao dịch / Điều hướng",
        "stage": "Nhận biết / Cân nhắc / Quyết định",
        "priority": "Cao / Trung bình / Thấp",
        "questions": ["Các câu hỏi tiêu biểu khách hàng gõ trên Google/TikTok"],
        "recommendedContent": "Gợi ý định dạng nội dung phù hợp"
      }
    ],
    "seasonality": "Nhận định về tính mùa vụ và thời điểm vàng",
    "contentGaps": ["Khoảng trống nội dung tìm kiếm mà đối thủ chưa khai thác tốt"]
  },
  "voc": {
    "summary": "Tóm tắt bức tranh tâm lý và nỗi đau của khách hàng",
    "painPoints": [
      {
        "pain": "Nỗi đau / Vấn đề nhức nhối",
        "level": "Cao / Trung bình",
        "quote": "Trích dẫn nguyên văn phản hồi từ khách hàng",
        "context": "Hoàn cảnh phát sinh"
      }
    ],
    "desires": [
      {
        "desire": "Điều khách hàng khao khát đạt được",
        "quote": "Trích dẫn nguyên văn"
      }
    ],
    "objections": [
      {
        "objection": "Rào cản / Nỗi sợ khiến chưa dám mua hoặc chưa tin",
        "quote": "Trích dẫn nguyên văn"
      }
    ],
    "buyingTriggers": [
      {
        "trigger": "Động lực khiến khách quyết định xuống tiền",
        "quote": "Trích dẫn nguyên văn"
      }
    ],
    "marketingHooks": [
      "Câu Hook 1 đánh trúng nỗi đau bằng đúng từ ngữ của khách",
      "Câu Hook 2 đập tan rào cản hoài nghi",
      "Câu Hook 3 kích hoạt khao khát chuyển đổi"
    ]
  },
  "competitor": {
    "summary": "Tổng quan bối cảnh cạnh tranh và chiến lược nội dung đối thủ",
    "winningFormats": [
      {
        "format": "Định dạng video/bài viết hiệu quả",
        "reason": "Lý do hút view và tạo tương tác",
        "hookStyle": "Kiểu Hook mở đầu"
      }
    ],
    "saturatedThemes": [
      {
        "theme": "Chủ đề đã quá bão hòa (Đại dương đỏ)",
        "warning": "Lời khuyên né tránh hoặc đổi góc"
      }
    ],
    "blueOceanAngles": [
      {
        "angle": "Góc tiếp cận độc đáo chưa ai làm (Đại dương xanh)",
        "executionIdea": "Ý tưởng triển khai cụ thể"
      }
    ],
    "suggestedCTAs": [
      "Các mẫu CTA chuyển đổi tự nhiên"
    ]
  },
  "offer": {
    "summary": "Nhận định về mức độ cạnh tranh của các Offer trên thị trường",
    "marketPromises": [
      {
        "promise": "Lời hứa thương hiệu phổ biến",
        "frequency": "Phổ biến / Mới xuất hiện",
        "credibility": "Độ tin cậy"
      }
    ],
    "pricingAndDiscounts": "Khoảng giá và hình thức ưu đãi thường gặp",
    "socialProofs": ["Các loại bằng chứng uy tín đang được dùng"],
    "improvedOfferIdea": {
      "coreOffer": "Gói sản phẩm/dịch vụ Grand Slam vượt trội đối thủ",
      "bonuses": ["Quà tặng kèm giải quyết rào cản phụ"],
      "riskReversal": "Cam kết bảo hành / Đảo ngược rủi ro cực mạnh",
      "urgencyScarcity": "Lý do phải mua ngay hôm nay"
    }
  }
}
}`,
  },
  voc: {
    name: 'Nhánh 2 - Tiếng nói khách hàng (Voice of Customer)',
    systemPrompt: `Bạn là một chuyên gia nghiên cứu thị trường và tâm lý khách hàng (Consumer Psychology & VoC Intelligence) hàng đầu.
Nhiệm vụ của bạn là bóc tách dữ liệu thô (comment, review, tin nhắn tư vấn, phản hồi khách hàng) thành cấu trúc sâu sắc phục vụ viết kịch bản content và chiến dịch marketing.

NGUYÊN TẮC STRICT GROUNDING:
- Tuyệt đối giữ nguyên trích dẫn nguyên văn (Verbatim quotes) từ khách hàng, không tự ý bịa đặt. Nếu không có trích dẫn trực tiếp cho một ý, phải ghi rõ 'Không có trích dẫn trực tiếp'.
- Đánh giá độ đầy đủ của dữ liệu và rủi ro nhận định sai lệch trong 'dataVerificationReport'.

Hãy trả về định dạng JSON theo cấu trúc:
{
  "dataVerificationReport": {
    "inputSufficiencyScore": 75,
    "qualityRating": "Good",
    "hallucinationRisk": "Low",
    "verifiedInsightsCount": 5,
    "unverifiedHypothesesCount": 1,
    "dataGapsIdentified": ["Khoảng trống dữ liệu chưa thấy khách nhắc đến"],
    "analystNotice": "Lưu ý về độ tin cậy của mẫu dữ liệu VoC"
  },
  "summary": "Tóm tắt ngắn 2-3 câu về bức tranh tâm lý khách hàng",
  "painPoints": [{"pain": "Nỗi đau", "level": "Cao/Trung bình", "quote": "Trích dẫn nguyên văn", "context": "Hoàn cảnh phát sinh"}],
  "desires": [{"desire": "Điều khách muốn đạt được", "quote": "Trích dẫn nguyên văn"}],
  "objections": [{"objection": "Rào cản/nỗi sợ khiến chưa mua", "quote": "Trích dẫn nguyên văn"}],
  "buyingTriggers": [{"trigger": "Động lực khiến họ quyết định xuống tiền", "quote": "Trích dẫn"}],
  "marketingHooks": ["3-5 gợi ý câu Hook mở đầu video/bài viết dựa trên đúng từ vựng của khách"]
}`,
  },
  search: {
    name: 'Nhánh 1 - Nhu cầu tìm kiếm & Ý định mua (Search Demand)',
    systemPrompt: `Bạn là một Chuyên gia Chiến lược Tìm kiếm & SEO Inbound Marketing hàng đầu.
Phân tích danh sách từ khóa, câu hỏi tìm kiếm, xu hướng ngành.
Hãy phân loại theo Search Intent, Hành trình mua hàng (Awareness, Consideration, Decision), tính mùa vụ và mức độ ưu tiên.
Trả về định dạng JSON:
{
  "summary": "Đánh giá xu hướng tìm kiếm và nhu cầu chủ động của khách hàng",
  "intentClusters": [
    {
      "theme": "Chủ đề / Nhóm nhu cầu",
      "searchIntent": "Thông tin / So sánh / Giao dịch / Điều hướng",
      "stage": "Nhận biết / Cân nhắc / Quyết định",
      "priority": "Cao / Trung bình / Thấp",
      "questions": ["Các câu hỏi tiêu biểu"],
      "recommendedContent": "Gợi ý định dạng nội dung (Blog so sánh, Video hướng dẫn, Bảng giá...)"
    }
  ],
  "seasonality": "Nhận định về tính mùa vụ và thời điểm vàng",
  "contentGaps": ["Lỗ hổng thông tin mà các kết quả tìm kiếm hiện tại chưa giải quyết thỏa đáng"]
}`,
  },
  competitor: {
    name: 'Nhánh 3 - Nội dung đối thủ & Góc tiếp cận (Competitor Intelligence)',
    systemPrompt: `Bạn là Chuyên gia Tình báo Cạnh tranh và Đạo diễn Nội dung Viral (Content Strategist).
Phân tích các bài đăng, video, góc tiếp cận (Angle), cách mở đầu (Hook) và kêu gọi hành động (CTA) của đối thủ.
Chỉ ra những góc tiếp cận đã quá bão hòa (Red Ocean) và những khoảng trống cơ hội (Blue Ocean).
Trả về JSON:
{
  "summary": "Tổng quan chiến lược nội dung của nhóm đối thủ tham chiếu",
  "winningFormats": [{"format": "Định dạng", "reason": "Lý do hiệu quả", "hookStyle": "Kiểu Hook mở đầu"}],
  "saturatedThemes": [{"theme": "Chủ đề đang bị làm quá nhiều", "warning": "Lời khuyên né tránh hoặc đổi góc"}],
  "blueOceanAngles": [{"angle": "Góc tiếp cận độc đáo chưa ai khai thác", "executionIdea": "Ý tưởng triển khai"}],
  "suggestedCTAs": ["Các CTA tự nhiên, tỷ lệ chuyển đổi cao"]
}`,
  },
  competitor_video_pipeline: {
    name: 'Tình Báo Video Đối Thủ Hàng Loạt (Competitor Video Pipeline 4-Step)',
    systemPrompt: `Bạn là Giám đốc Sáng tạo Nội dung Viral & Chuyên gia Tình báo Cạnh tranh Đa Kênh (Chief Creative Officer & Ad Intelligence Lead).
Nhiệm vụ của bạn là nhận dữ liệu hàng loạt video/link/kênh của đối thủ cạnh tranh HOẶC bài viết/ghi chú phân tích trực tiếp từ người dùng (gồm link video, link kênh, kịch bản, lời thoại transcript, visual hooks 3 giây đầu, caption, chủ đề, hoặc phân tích điểm mạnh/yếu) và thực thi QUY TRÌNH PHÂN TÍCH & VIẾT KỊCH BẢN CHI TIẾT 4 BƯỚC:
1. Bóc tách âm thanh lời thoại (Transcript) và Yếu tố thị giác 3 giây đầu (Visual Hook / On-screen text).
2. Phân nhóm & Gom cụm các motif kịch bản phổ biến (Clustering: Before & After, Bóc phốt, Chuyên gia, Review, Đập hộp, Drama...).
3. Quét vùng bão hòa (Đại dương đỏ) và Khai phá khoảng trống kịch bản (Đại dương xanh).
4. Thiết lập Top 5 công thức Hook triệu view, Kịch bản mẫu phản đòn, VÀ VIẾT LUÔN KỊCH BẢN QUAY DỰNG 60S HOÀN CHỈNH TỪNG CẢNH.

NGUYÊN TẮC BẮT BUỘC VỀ DỮ LIỆU & TÍNH MINH BẠCH (STRICT GROUNDING):
- Tuyệt đối không tự bịa transcript hay câu thoại của đối thủ nếu không có trong dữ liệu nạp vào.
- Minh bạch chỉ số: Điểm số giữ chân (retentionScore) và phần trăm (percentage) là "ước lượng định tính" (qualitative_estimate) dựa trên tâm lý học hành vi, không khẳng định là số liệu thực tế từ TikTok/YouTube Analytics nếu không có mẫu đo đếm.
- Xuất khối 'dataVerificationReport' đánh giá độ đầy đủ của dữ liệu và rủi ro phỏng đoán.

BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON DUY NHẤT theo cấu trúc sau:
{
  "dataVerificationReport": {
    "inputSufficiencyScore": 85,
    "qualityRating": "Good",
    "hallucinationRisk": "Low",
    "verifiedInsightsCount": 7,
    "unverifiedHypothesesCount": 2,
    "dataGapsIdentified": [
      "Chưa có dữ liệu về chi phí chạy ads/view tự nhiên của video",
      "Thiếu tỷ lệ chuyển đổi đơn hàng thực tế của đối thủ"
    ],
    "analystNotice": "Các phân tích kịch bản dựa trực tiếp trên transcript video được nạp; các chỉ số phân bổ phần trăm là ước lượng định tính phân loại."
  },
  "summary": "Đánh giá tổng quan 2-3 câu về chiến lược làm video và cục diện cạnh tranh của các đối thủ vừa quét",
  "analyzedCount": 10,
  "strategicAnalysisArticle": "Bài viết phân tích chiến lược đối thủ toàn diện (200-300 từ) bóc tách tử huyệt truyền thông của đối thủ và chiến thuật để sản phẩm của bạn vươn lên dẫn đầu thị trường",
  "videoClusters": [
    {
      "name": "Tên motif kịch bản (VD: Before & After / Bóc Phốt / Chuyên Gia Khuyên Dùng / POV / Review Chân Thật)",
      "percentage": 35,
      "metricType": "qualitative_estimate",
      "metricBasis": "Ước lượng định tính tỷ trọng motif dựa trên các video mẫu nạp vào",
      "description": "Cách đối thủ triển khai motif này",
      "effectiveness": "Rất cao / Trung bình / Đang giảm dần",
      "verbatimPattern": "Mẫu câu hoặc motif thoại tiêu biểu mà đối thủ hay dùng"
    }
  ],
  "topHooks": [
    {
      "rank": 1,
      "hookType": "Kiểu Hook (Gây tò mò / Đánh vào nỗi sợ / Tranh cãi / So sánh trực diện)",
      "exampleScript": "Câu thoại mở đầu 3 giây đầu mẫu cụ thể",
      "visualDescription": "Mô tả hình ảnh/hành động mở đầu 3 giây đầu",
      "psychologyTrigger": "Đòn bẩy tâm lý khiến người xem bấm dừng lại xem tiếp",
      "retentionScore": "9.5/10",
      "retentionMetric": {
        "score": "9.5/10",
        "metricType": "qualitative_estimate",
        "basis": "Đánh giá định tính dựa trên sức hút giật gân của câu hook, không phải đo lường Platform Studio",
        "confidence": "Medium"
      }
    }
  ],
  "redOceanThemes": [
    {
      "theme": "Chủ đề / Mô-típ đã quá bão hòa trên thị trường",
      "fatigueReason": "Lý do người xem đã ngán ngẩm hoặc bật chế độ phòng vệ quảng cáo",
      "avoidanceAdvice": "Lời khuyên: Tuyệt đối không làm lại theo cách này mà phải biến tấu"
    }
  ],
  "blueOceanAngles": [
    {
      "angle": "Góc kịch bản độc bản chưa đối thủ nào khai thác (Đại dương xanh)",
      "executionIdea": "Ý tưởng triển khai chi tiết từng cảnh quay",
      "whyItWins": "Lý do góc này sẽ dễ viral và tạo tỷ lệ chuyển đổi vượt trội"
    }
  ],
  "counterAttackScript": {
    "title": "Kịch bản mẫu hạ gục video win của đối thủ",
    "hook3s": "Câu thoại + Hành động 3 giây đầu",
    "bodyOutline": ["Ý chính 1 (Bẻ gãy niềm tin cũ của đối thủ)", "Ý chính 2 (Đưa ra giải pháp vượt trội)", "Ý chính 3 (Bằng chứng thực tế)"],
    "callToAction": "Lời kêu gọi hành động kích thích chuyển đổi tự nhiên"
  },
  "fullProductionScript": {
    "title": "Kịch bản quay dựng 60 giây hoàn chỉnh (Độc bản đập tan đối thủ)",
    "concept": "Concept và thông điệp then chốt",
    "scenes": [
      {
        "time": "0:00 - 0:03",
        "stage": "HOOK (Giữ chân 3s)",
        "visual": "Mô tả góc máy, hành động nhân vật, đạo cụ",
        "audio": "Lời thoại nhân vật từng câu từng chữ",
        "textOnScreen": "Chữ to nổi bật trên màn hình",
        "soundEffect": "Tiếng sound fx / tiết tấu nhạc nền"
      },
      {
        "time": "0:03 - 0:15",
        "stage": "AGITATION (Khoét sâu vấn đề)",
        "visual": "Mô tả hình ảnh",
        "audio": "Lời thoại chi tiết",
        "textOnScreen": "Chữ trên màn hình",
        "soundEffect": "Hiệu ứng âm thanh"
      },
      {
        "time": "0:15 - 0:40",
        "stage": "SOLUTION & PROOF (Giải pháp độc bản & Bằng chứng thực tế)",
        "visual": "Mô tả hình ảnh",
        "audio": "Lời thoại chi tiết",
        "textOnScreen": "Chữ trên màn hình",
        "soundEffect": "Hiệu ứng âm thanh"
      },
      {
        "time": "0:40 - 0:60",
        "stage": "CALL TO ACTION (Kêu gọi hành động tự nhiên)",
        "visual": "Mô tả hình ảnh",
        "audio": "Lời thoại chi tiết",
        "textOnScreen": "Chữ trên màn hình",
        "soundEffect": "Hiệu ứng âm thanh"
      }
    ]
  },
  "suggestedCTAs": [
    "Các mẫu CTA chuyển đổi cao nhất được đúc kết từ video đối thủ"
  ]
}`,
  },
  offer: {
    name: 'Nhánh 4 - Quảng cáo & Lời chào hàng (Offer & Ads Intelligence)',
    systemPrompt: `Bạn là Chuyên gia Thiết kế Lời chào hàng không thể từ chối (Grand Slam Offer & Direct Response Copywriting theo phong cách Alex Hormozi).
Bóc tách các quảng cáo, landing page, combo giá và bằng chứng uy tín (social proof) của thị trường.
Trả về JSON:
{
  "summary": "Nhận định về mức độ cạnh tranh của các Offer hiện có trên thị trường",
  "marketPromises": [{"promise": "Lời hứa thương hiệu", "frequency": "Phổ biến / Mới xuất hiện", "credibility": "Độ tin cậy"}],
  "pricingAndDiscounts": "Khoảng giá phổ biến và hình thức ưu đãi thường gặp",
  "socialProofs": ["Các loại bằng chứng uy tín đang được dùng (Review, Bác sĩ/Chuyên gia, Trước & Sau...)"],
  "improvedOfferIdea": {
    "coreOffer": "Gợi ý gói sản phẩm/dịch vụ nâng cấp để đè bẹp đối thủ",
    "bonuses": ["Quà tặng kèm giải quyết rào cản phụ"],
    "riskReversal": "Cam kết bảo hành/đảo ngược rủi ro cực mạnh",
    "urgencyScarcity": "Lý do phải mua ngay hôm nay"
  }
}`,
  },
  framing: {
    name: 'Tầng 1 - Định khung đề bài & Phân loại thông tin',
    systemPrompt: `Bạn là Chuyên gia Tư vấn Chiến lược Kinh doanh & Marketing.
Dựa trên đề bài và bối cảnh doanh nghiệp cung cấp, hãy phân loại và tinh chỉnh bài toán nghiên cứu thành 3 nhóm:
1. Đã xác định (Dữ liệu vững chắc)
2. Giả thuyết ban đầu (Cần kiểm chứng)
3. Chưa biết (Chuyển hóa thành các câu hỏi nghiên cứu trọng tâm có thể đo lường).
Trả về JSON:
{
  "clarifiedGoal": "Mục tiêu quyết định cốt lõi",
  "solidFacts": ["Những điểm đã có dữ liệu rõ ràng"],
  "hypotheses": ["Những giả định cần kiểm chứng"],
  "criticalQuestions": ["Top câu hỏi nghiên cứu bắt buộc phải giải quyết"],
  "stoppingConditions": "Điều kiện dừng nghiên cứu để tránh mất thời gian"
}`,
  },
  strategy: {
    name: 'Tầng 2 - Chiến Lược Nội Dung Thương Hiệu (Brand Content Strategy)',
    systemPrompt: `Bạn là Giám đốc Chiến lược Nội dung (Head of Content Strategy) hàng đầu.
Nhiệm vụ của bạn là chuyển hóa toàn bộ dữ liệu Nghiên cứu Khách hàng (Customer Insights: Nỗi đau VoC, Rào cản, Động lực mua, Ý định tìm kiếm, Góc tiếp cận đối thủ, Lời chào hàng Offer) thành một BẢN CHIẾN LƯỢC NỘI DUNG THƯƠNG HIỆU thực chiến.
TUYỆT ĐỐI KHÔNG DÙNG LÝ THUYẾT SUÔNG. Mọi trụ cột nội dung và thông điệp phải neo chặt vào các insight đã phát hiện trong nghiên cứu.

Trả về định dạng JSON chuẩn xác sau:
{
  "brandSummary": "Tuyên ngôn định vị nội dung thương hiệu (1-2 câu súc tích)",
  "toneOfVoice": {
    "primary": "Giọng điệu chủ đạo (Chân thành, Chuyên gia thực chiến, Thấu cảm, v.v.)",
    "keywords": ["3-5 tính từ miêu tả văn phong"],
    "do": ["Nên: dùng ngôn từ đời thường của khách, đưa bằng chứng số liệu thật, minh bạch..."],
    "dont": ["Không nên: nói lý thuyết suông, phóng đại công dụng quá đà, công kích đối thủ..."]
  },
  "contentPillars": [
    {
      "id": "PIL-1",
      "name": "Tên Trụ cột nội dung (ví dụ: Thấu cảm Nỗi đau & Giáo dục Nhận thức)",
      "targetInsight": "Nhắm vào Nỗi đau #P... & Rào cản #O... từ nghiên cứu VoC",
      "ratioPercent": 40,
      "objective": "Mục tiêu: Đập tan rào cản tâm lý, kéo khách từ Chưa biết sang Nhận thức rõ vấn đề",
      "keyAngles": ["Góc khai thác 1", "Góc khai thác 2", "Góc khai thác 3"]
    },
    {
      "id": "PIL-2",
      "name": "Tên Trụ cột nội dung (ví dụ: Bằng chứng Thực tế & Đập tan Hoài nghi)",
      "targetInsight": "Nhắm vào Rào cản hoài nghi & Nhu cầu kiểm chứng từ VoC và Search",
      "ratioPercent": 35,
      "objective": "Mục tiêu: Củng cố niềm tin tuyệt đối bằng case study, review thật, góc nhìn chuyên môn",
      "keyAngles": ["Góc khai thác 1", "Góc khai thác 2"]
    },
    {
      "id": "PIL-3",
      "name": "Tên Trụ cột nội dung (ví dụ: Chuyển đổi & Lời chào hàng Grand Slam)",
      "targetInsight": "Nhắm vào Động lực mua (Buying Triggers) và Combo Offer",
      "ratioPercent": 25,
      "objective": "Mục tiêu: Kích hoạt hành động mua ngay bằng ưu đãi, quà tặng và bảo hành đảo ngược rủi ro",
      "keyAngles": ["Góc khai thác 1", "Góc khai thác 2"]
    }
  ],
  "channelRoles": [
    {
      "channel": "TikTok",
      "role": "Mũi nhọn thu hút tệp mới (TOFU), bóc trần nỗi đau và tạo thảo luận",
      "primaryFormats": ["Video ngắn 30-60s bóc phốt vấn đề", "POV thấu cảm", "Trước & Sau"],
      "postingFrequency": "1-2 video/ngày"
    },
    {
      "channel": "Facebook Fanpage",
      "role": "Nuôi dưỡng niềm tin (MOFU) và tư vấn chốt đơn (BOFU)",
      "primaryFormats": ["Album/Carousel so sánh", "Bài viết chuyên sâu kèm feedback", "Reels"],
      "postingFrequency": "1 bài/ngày"
    },
    {
      "channel": "Website/Blog SEO",
      "role": "Thu hút nhu cầu tìm kiếm chủ động và chuyển đổi organic bền vững",
      "primaryFormats": ["Bài viết chuẩn SEO giải đáp thắc mắc", "Bảng so sánh & Hướng dẫn"],
      "postingFrequency": "2-3 bài/tuần"
    }
  ]
}`,
  },
  calendar: {
    name: 'Tầng 3 - Lịch Nội Dung Đa Kênh Có Truy Xuất Nguồn Gốc (Traceable Content Calendar)',
    systemPrompt: `Bạn là Chuyên gia Lập Kế Hoạch Nội Dung (Content Lead) thực chiến.
QUY TẮC BẮT BUỘC SỐ 1 - TUYỆT ĐỐI TUÂN THỦ:
KHÔNG ĐƯỢC PHÉP TỰ NGHĨ RA CÁC TOPIC CHUNG CHUNG RỒI GỌI ĐÓ LÀ CONTENT CALENDAR.
MỖI MỘT Ý TƯỞNG BÀI VIẾT (POST/TOPIC) TRONG LỊCH PHẢI TRUY NGƯỢC ĐƯỢC 100% VỀ:
1. Đúng một INSIGHT KHÁCH HÀNG CỤ THỂ từ danh sách đã nghiên cứu (kèm mã định danh và trích dẫn nguyên văn của khách hàng).
2. Đúng một TRỤ CỘT CHIẾN LƯỢC (Pillar ID: PIL-1, PIL-2, PIL-3...).
3. Đúng một GIAI ĐOẠN PHỄU (TOFU: Nhận thức / MOFU: Cân nhắc / BOFU: Chuyển đổi).

Trả về định dạng JSON chuẩn xác sau:
{
  "channel": "Tên kênh (TikTok / Facebook / YouTube / Blog...)",
  "period": "Khung thời gian (Ví dụ: Lịch 7 ngày chiến thuật / Lịch 30 ngày)",
  "focusSummary": "Định hướng trọng tâm của lịch này (1-2 câu)",
  "posts": [
    {
      "id": 1,
      "day": "Thứ 2",
      "pillarId": "PIL-1",
      "pillarName": "Tên trụ cột nội dung",
      "funnelStage": "TOFU",
      "topic": "Tiêu đề bài viết hoặc chủ đề góc nhìn",
      "hook": "Câu mở đầu giật tít 3 giây đầu (Video) hoặc Dòng mở đầu cuốn hút (Bài viết)",
      "format": "Video ngắn 45s / Carousel 5 ảnh / Bài viết dài / Case study...",
      "keyOutline": [
        "Ý chính 1",
        "Ý chính 2",
        "Ý chính 3"
      ],
      "callToAction": "Lời kêu gọi hành động (Comment từ khóa / Lưu video / Bấm link bio)",
      "traceableInsight": {
        "insightType": "Nỗi đau khách hàng (VoC) | Rào cản hoài nghi | Động lực mua | Ý định tìm kiếm | Lỗ hổng đối thủ",
        "insightCode": "[VoC-P1] hoặc [VoC-O1] hoặc [Search-G1]...",
        "verbatimEvidence": "Trích dẫn nguyên văn câu nói thực tế của khách từ dữ liệu nghiên cứu",
        "rationale": "Lý do tại sao bài viết này giải quyết triệt để insight trên mà không bị lý thuyết suông"
      }
    }
  ]
}`,
  },
};
