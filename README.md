# 🚀 Marketing AI Research Hub (Multi-LLM + Intelligent Crawler + Notion Integration)

> **Hệ thống Tình báo Cạnh tranh, Nghiên cứu Thị trường & Lập Chiến lược Nội dung Toàn diện**  
> Kết nối trực tiếp đa mô hình AI hàng đầu (**OpenAI, Claude, Gemini, DeepSeek, OpenRouter, 9Router, Local LLM**), tích hợp công cụ cào dữ liệu tự động (**Crawl4AI + Playwright**) và đồng bộ 1-click sang **Notion**.

---

## 🌟 ĐẶC ĐIỂM NỔI BẬT & CÔNG NGHỆ CỐT LÕI

### 1. 🧠 Đa Trí Tuệ Nhân Tạo (Multi-LLM Orchestration)
- **Hỗ trợ không giới hạn nhà cung cấp:**
  - **OpenAI:** GPT-4o, GPT-4o-mini, o1, o3-mini.
  - **Anthropic Claude:** Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3.5 Haiku.
  - **Google Gemini:** Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 1.5 Pro/Flash.
  - **OpenRouter & 9Router:** Truy cập hơn 200+ mô hình nguồn mở & thương mại (DeepSeek-V3, DeepSeek-R1, Llama 3.3 70B, Qwen 2.5...).
  - **Local AI (Ollama / LM Studio):** Chạy offline hoàn toàn trên máy tính cá nhân, miễn phí 100%, bảo mật tuyệt đối.
- **Model Switcher linh hoạt:** Chuyển đổi mô hình phân tích ngay trên thanh công cụ trong tích tắc.

### 2. 🕷️ Bộ Công Cụ Cào Dữ Liệu Tự Động (AI Crawler Engine)
- Tích hợp sâu **Crawl4AI + Playwright Chromium** chạy ngầm qua FastAPI:
  - **Web & Search Crawling:** Tự động tìm kiếm Google / DuckDuckGo và cào sạch nội dung trang đích, làm sạch bằng thuật toán BM25 và Pruning Content Filter.
  - **Social & Comment Mining:** Thu thập bình luận thực tế của người dùng từ Facebook, mạng xã hội (hỗ trợ lưu profile đăng nhập Playwright).
  - **YouTube Transcript Extractor:** Tự động bóc tách phụ đề và lời thoại video YouTube / YouTube Shorts chỉ với 1-click để phân tích kịch bản đối thủ.

### 3. 🎯 Nghiên Cứu Thị Trường 3 Tầng & 4 Nhánh (Evidence-Based Research)
- **Cơ chế Input Health & Data Verification:** Đánh giá độ tin cậy của dữ liệu đầu vào; gắn nhãn minh bạch giữa *Dữ liệu thực chứng (Fact-based)* và *Giả định phân tích của AI (Hypothesis)*.
- **Tầng 1 - Định khung đề bài (Framing):** Phân loại dữ liệu theo 3 cấp độ: *Đã có số liệu rõ (Xanh)*, *Giả thuyết ban đầu (Cam)*, và *Chưa biết / Cần kiểm chứng (Tím)*.
- **Nhánh 1 - Nhu cầu tìm kiếm (Search Demand):** Bóc tách Search Intent theo từng giai đoạn phễu mua hàng (TOFU, MOFU, BOFU) và phát hiện Lỗ hổng nội dung (Content Gaps).
- **Nhánh 2 - Tiếng nói khách hàng (Voice of Customer - VoC):** Bóc tách Nỗi đau (Pain points), Rào cản mua hàng (Objections), Động lực cốt lõi, Trích dẫn nguyên văn (Verbatim quotes) và các câu Hook mở đầu chạm cảm xúc.
- **Nhánh 3 - Nội dung đối thủ (Competitor Angles):** Giải mã các motif kịch bản chiến thắng (Winning Formats), cảnh báo chủ đề bão hòa (Red Ocean) và tìm góc khai thác ngách (Blue Ocean).
- **Nhánh 4 - Lời chào hàng không thể từ chối (Grand Slam Offer):** Tối ưu hóa Giá trị kỳ vọng, Rủi ro đảo ngược (Guarantees) và Quà tặng khan hiếm theo công thức Alex Hormozi.

### 4. 🎬 Phân Tích Video Đối Thủ & Sinh Kịch Bản Phản Đòn (Competitor Video View)
- Tự động nạp transcript video đối thủ.
- AI phân tích cấu trúc 3s Hook đầu, cấu trúc Retention giữ chân và Offer kêu gọi hành động (CTA).
- Tự động sinh kịch bản Shorts / Reels 60s phản đòn sắc bén.

### 5. 📅 Lập Chiến Lược & Lịch Nội Dung (Content Calendar & Strategy)
- Tự động chuyển đổi kết quả nghiên cứu thành **Bản đồ Trụ cột nội dung (Content Pillars)** và **Chiến lược thông điệp cốt lõi**.
- Sinh **Lịch biên tập nội dung (Content Calendar)** 30 ngày.
- **Xuất đa định dạng:**
  - Xuất bảng tính **Excel / CSV** chuẩn UTF-8 (không lỗi font tiếng Việt).
  - Xuất báo cáo nghiên cứu chi tiết định dạng **Markdown (.md)**.
  - Đồng bộ tự động 1-click sang **Notion** (tạo trang chuyên nghiệp với Callout, Bullet, Quote, Task list).

### 6. 🗂️ Quản Lý Đa Không Gian Làm Việc (Brand Workspace Manager)
- Quản lý tách biệt dữ liệu cho từng thương hiệu / sản phẩm.
- Chuyển đổi dự án mượt mà không lo ghi đè.
- Hỗ trợ Export / Import file `.json` để backup hoặc chia sẻ cấu hình dự án cho đồng đội.

---

## 🏗️ KIẾN TRÚC HỆ THỐNG (TECH STACK)

```
┌────────────────────────────────────────────────────────┐
│             Frontend UI (React 19 + Vite 8)            │
│         Tailwind CSS v4 • Lucide Icons • Dark Mode     │
│                 http://localhost:5173                  │
└───────────────────────────┬────────────────────────────┘
                            │ (Proxy / API)
                            ▼
┌────────────────────────────────────────────────────────┐
│             Node.js Backend (Express 5)                │
│    Orchestrator: Multi-LLM, Notion API, Transcript     │
│                 http://localhost:3001                  │
└───────────────────────────┬────────────────────────────┘
                            │ (Internal Call)
                            ▼
┌────────────────────────────────────────────────────────┐
│        Crawler Service (Python FastAPI + uv)           │
│     Crawl4AI Core • Playwright Chromium • yt-dlp       │
│                 http://127.0.0.1:11235                 │
└────────────────────────────────────────────────────────┘
```

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, Lucide React.
- **Backend API:** Node.js, Express 5, `@anthropic-ai/sdk`, `openai`, `@google/generative-ai`, `@notionhq/client`, `youtube-transcript`.
- **Crawler Service:** Python 3.12+, FastAPI, Crawl4AI, Playwright (Chromium headless), Uvicorn, Astral `uv`.

---

## ⚡ HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY

### 1. Yêu Cầu Môi Trường
- **Node.js** >= 18.x (Tải từ [nodejs.org](https://nodejs.org))
- **uv** (Package manager siêu tốc cho Python: Tải từ [astral.sh/uv](https://docs.astral.sh/uv))

### 2. Cài Đặt Ban Đầu (Lần đầu tiên)

Mở Terminal tại thư mục dự án và chạy:
```bash
# 1. Cài đặt dependencies cho Node.js (Frontend & Server)
npm install

# 2. Cài đặt môi trường Python & Playwright Chromium cho Crawler
npm run setup:crawler
```

### 3. Khởi Chạy Ứng Dụng

#### Cách 1: Khởi động 1-click (Windows)
Chỉ cần bấm đúp chuột vào file:
👉 **`chay_ung_dung.bat`**  
*(Hệ thống sẽ tự động bật đồng thời Server Node, Crawler Python, Frontend Vite và mở trình duyệt tại `http://localhost:5173`)*.

#### Cách 2: Chạy bằng dòng lệnh
```bash
npm run dev
```

---

## 🔑 HƯỚNG DẪN CẤU HÌNH API

Bấm vào nút **"Cài đặt"** (biểu tượng bánh răng) ở góc trên giao diện hoặc truy cập tab Cài đặt:

| Nhà cung cấp | Hướng dẫn lấy API Key | Ghi chú |
| :--- | :--- | :--- |
| **Google Gemini** | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | Miễn phí gói Free tier, tốc độ cực nhanh |
| **OpenRouter / 9Router** | [openrouter.ai/keys](https://openrouter.ai/keys) | Truy cập DeepSeek R1/V3, Claude, Llama 3.3 |
| **Anthropic (Claude)** | [console.anthropic.com](https://console.anthropic.com) | Khuyên dùng Claude 3.5 Sonnet cho VoC & Copywriting |
| **OpenAI (ChatGPT)** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | Tối ưu cho logic kinh doanh & Grand Slam Offer |
| **Local AI** | Cài Ollama (`http://localhost:11434/v1`) | Hoàn toàn miễn phí & offline 100% |
| **Notion Integration** | [notion.so/my-integrations](https://www.notion.so/my-integrations) | Đồng bộ báo cáo nghiên cứu trực tiếp lên Notion |

> **Lưu ý bảo mật:** Mọi API Key được lưu trữ cục bộ trong file `config.json` hoặc LocalStorage trên máy bạn, không bao giờ được gửi về máy chủ bên ngoài.

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```
phanTichMarketing/
├── crawler/                # Python Crawler Service (FastAPI + Crawl4AI + Playwright)
│   ├── server.py           # FastAPI server điều khiển crawl/search/comments
│   ├── pyproject.toml      # Cấu hình uv & dependencies Python
│   └── crawl4ai/           # Lõi crawl4ai tích hợp sẵn
├── server/                 # Node.js Express Backend
│   ├── index.js            # Entry point & API Routes
│   ├── aiService.js        # Module gọi đa mô hình LLM & Prompt Templates
│   ├── crawlerService.js   # Client giao tiếp với crawler Python
│   └── notionService.js    # Module đồng bộ Notion Block API
├── src/                    # React 19 Frontend
│   ├── components/         # CrawlPanel, ModelSelector, DataVerificationCard, ...
│   ├── views/              # ExecutiveResearch, CompetitorVideo, ContentStrategy, Calendar...
│   ├── utils/              # Project Manager, LocalStorage helper
│   ├── App.jsx             # Shell & điều hướng các View
│   └── main.jsx            # React root
├── chay_ung_dung.bat       # Script khởi động 1-click trên Windows
├── config.json             # File lưu API keys cục bộ
└── package.json            # Scripts & dependencies dự án
```

---

## 🛡️ BẢN QUYỀN & GIẤY PHÉP
Dự án được xây dựng phục vụ nghiên cứu thị trường và tối ưu hóa hiệu suất Marketing thực chiến. Phù hợp cho Solo Marketer, Marketing Agency, Content Creator và Nhà sáng lập doanh nghiệp.
