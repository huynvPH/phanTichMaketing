# 🚀 Marketing AI Research Hub (Multi-LLM + Notion Integration)

Hệ thống công cụ Tình báo Cạnh tranh & Nghiên cứu Thị trường thực chiến, kết nối trực tiếp đa mô hình AI (**Claude 3.5 Sonnet, ChatGPT GPT-4o, Google Gemini**) và đồng bộ tự động sang **Notion**.

---

## 🎯 CÁC TÍNH NĂNG NỔI BẬT

1. **Đa Trí Tuệ Nhân Tạo (Multi-LLM Switcher):**
   - **Claude 3.5 Sonnet:** Tối ưu hóa bóc tách tâm lý khách hàng (VoC), thấu cảm nỗi đau và viết kịch bản quảng cáo.
   - **OpenAI GPT-4o:** Chiến lược kinh doanh, logic phân tích và thiết kế Lời chào hàng (Grand Slam Offer).
   - **Google Gemini 1.5 Pro / Flash:** Tốc độ nhanh, xử lý dữ liệu lớn (long context).

2. **Số Hóa Quy Trình Nghiên Cứu 3 Tầng (4 Nhánh) Chuẩn Thực Chiến:**
   - **Tầng 1 - Định khung đề bài:** Phân loại thông tin theo 3 màu: *Đã có số liệu rõ (Xanh)*, *Giả thuyết ban đầu (Cam)*, và *Chưa biết / Cần nghiên cứu (Tím)*.
   - **Nhánh 1 - Nhu cầu tìm kiếm (Search Demand):** Bóc tách Search Intent, phân nhóm theo hành trình mua và tìm kiếm lỗ hổng nội dung (Content Gaps).
   - **Nhánh 2 - Tiếng nói khách hàng (Voice of Customer - VoC):** Đưa comment/review thô vào để AI trích xuất Nỗi đau (Pain points), Rào cản (Objections), Động lực mua, Trích dẫn nguyên văn (Verbatim quotes) và gợi ý Hook mở đầu video.
   - **Nhánh 3 - Nội dung đối thủ (Competitor Angles):** Bóc tách các định dạng chiến thắng (Winning Formats), cảnh báo chủ đề đã bão hòa (Red Ocean) và tìm góc tiếp cận mới (Blue Ocean).
   - **Nhánh 4 - Quảng cáo và Offer (Ads & Grand Slam Offer):** Giải mã lời hứa thương hiệu, bằng chứng (proof) và thiết kế gói ưu đãi không thể từ chối.

3. **Quản Lý Đa Dự Án (Brand Workspace Manager):**
   - Quản lý độc lập nhiều thương hiệu / sản phẩm khác nhau trên cùng một giao diện.
   - Chuyển đổi qua lại giữa các dự án mà không bị ghi đè dữ liệu.
   - Hỗ trợ xuất / nhập file dự án (`.json`) để sao lưu an toàn hoặc chia sẻ cho đồng nghiệp.

4. **Tự Động Bóc Tách Transcript / Phụ Đề Video (YouTube & Shorts):**
   - Tự động lấy toàn bộ lời thoại và metadata video đối thủ qua link YouTube chỉ với 1-click.
   - Tự động nạp lời thoại vào pipeline AI để bóc tách motif kịch bản và viết kịch bản phản đòn 60s.

5. **Xuất File Đa Định Dạng (Excel, CSV, Markdown, Notion):**
   - **Lịch Nội Dung (Content Calendar):** Xuất trực tiếp ra file **Excel / CSV** chuẩn UTF-8 (không lỗi font tiếng Việt) với đầy đủ ngày, phễu, trụ cột, câu hook và dàn ý.
   - **Báo Cáo Nghiên Cứu:** Tải trọn bộ báo cáo Tầng 1 ra file **Markdown (.md)** định dạng chuẩn để gửi sếp hoặc lưu trữ nội bộ.
   - **Tích Hợp Notion 1-Click:** Tự động tạo các trang báo cáo chuyên nghiệp trên Notion với icon, Callout, Quote, To-do và Bullet list khoa học.

6. **Bảo Mật Cục Bộ 100%:**
   - Ứng dụng chạy hoàn toàn trên máy tính của bạn (`localhost`), API Key được lưu trong file `config.json` cục bộ, không gửi về bất kỳ máy chủ trung gian nào.

---

## 💻 HƯỚNG DẪN KHỞI ĐỘNG NHANH

### Cách 1: Bấm đúp chuột vào file
Chỉ cần bấm đúp chuột vào file:
👉 **`chay_ung_dung.bat`**
Trình duyệt sẽ tự động mở trang web tại `http://localhost:5173`.

### Cách 2: Chạy bằng dòng lệnh
Mở Terminal trong thư mục dự án và gõ:
```bash
npm run dev
```

---

## 🔑 HƯỚNG DẪN CẤU HÌNH API KEYS

Bấm vào nút **"Cài đặt API"** ở góc trên cùng bên phải giao diện để nhập:

1. **OpenRouter (9router):** Lấy tại [openrouter.ai/keys](https://openrouter.ai/keys). Cho phép truy cập hơn 200+ models bao gồm DeepSeek V3, DeepSeek R1, Claude, Llama 3.3 với chi phí cực rẻ.
2. **Local AI (Chạy offline trên máy qua Ollama / LM Studio):** 
   - Hoàn toàn **0 đồng** và bảo mật tuyệt đối, không cần internet.
   - Nếu dùng **Ollama**: Cài từ [ollama.com](https://ollama.com), chạy `ollama run llama3.2` hoặc `ollama run deepseek-r1:8b`. Cổng mặc định là `http://localhost:11434/v1`.
   - Nếu dùng **LM Studio**: Bật Local Server tại cổng `http://localhost:1234/v1`.
3. **Anthropic (Claude):** Lấy tại [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
4. **OpenAI (ChatGPT):** Lấy tại [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
5. **Google Gemini:** Lấy miễn phí tại [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
6. **Notion Integration Token:**
   - Bước 1: Vào [notion.so/my-integrations](https://www.notion.so/my-integrations) ➔ Tạo `New integration` (Đặt tên: *Marketing AI Hub*) ➔ Copy **Internal Integration Secret**.
   - Bước 2: Dán token vào ô Notion trong cài đặt app.
   - Bước 3: Mở trang Notion bạn muốn lưu báo cáo ➔ Bấm dấu `···` ở góc trên cùng bên phải trang Notion ➔ Chọn `Connect to` (hoặc `Add connections`) ➔ Chọn integration bạn vừa tạo.

