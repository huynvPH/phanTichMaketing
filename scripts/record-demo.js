// Ghi lại video demo 6 tính năng chính của ứng dụng bằng Playwright Screencast API.
// KHÔNG mock AI: mọi lệnh gọi /api/ai/* là thật, có thể mất 20-90s mỗi lần.
// Yêu cầu: `npm run dev` (hoặc chay_ung_dung.bat) đã chạy sẵn ở BASE_URL trước khi gọi script này.
// Dùng: node scripts/record-demo.js   (HEADED=1 để xem trình duyệt, BASE_URL=... để đổi địa chỉ,
//       DEMO_MODEL=<model id, vd ag/gemini-3.6-flash-high> để đổi model AI khi Gemini hết quota,
//       DEMO_GEMINI_KEY=<khóa Gemini thật> bắt buộc cho clip 8 (Thêm API Key) để ghi hình bước Kiểm tra Gemini,
//       ONLY=7 hoặc ONLY=1,3 để chỉ ghi 1 vài clip theo index, bỏ trống = ghi hết như cũ)
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEMO_DIR = path.join(ROOT_DIR, 'demo-videos');
// Ghi webm thô + dựng mp4 tạm ở NGOÀI thư mục dự án (temp OS), không phải demo-videos/raw:
// file watcher của Vite dev server theo dõi cả thư mục dự án, nếu thấy file .webm còn đang
// mở/khoá (Chromium đang ghi hình) thì fs.watch ném EBUSY chưa bắt -> crash luôn cả Vite.
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'phantichmarketing-demo-'));
const RAW_DIR = path.join(WORK_DIR, 'raw');

// Trạng thái dialog dùng chung: confirm() được accept ngay, alert() (AI báo lỗi) được ghi lại để clip fail rõ ràng.
const dialogState = { lastAlertMessage: null };
// Thời gian chờ AI thật đo được của từng clip, in ra báo cáo cuối cùng.
const aiWaitLog = [];

// Dữ liệu mẫu: 1 thương hiệu HƯ CẤU để demo xuyên suốt các clip.
const DEMO = {
  productName: 'Serum Trà Xanh GreenLeaf Trị Mụn',
  industry: 'Mỹ phẩm chăm sóc da',
  targetAudience: 'Nữ 18-28 tuổi, da dầu mụn, đang tìm sản phẩm trị mụn dịu nhẹ không gây bào mòn da, hay tham khảo review trên TikTok trước khi mua.',
  businessGoal: 'Tăng doanh số Shopee & TikTok Shop thêm 30% trong quý tới, xây dựng lại niềm tin sau khi đối thủ tung chiến dịch bóc phốt ngành mỹ phẩm trộn.',
  customerPainRaw: [
    'Da em dầu mụn xài bao nhiêu loại serum rồi mà không hết, cứ hết mụn này lại lên mụn khác.',
    'Sợ nhất là mấy loại trị mụn mạnh quá làm da bong tróc đỏ ửng, ra đường không dám nhìn ai luôn.',
    'Em từng mua serum tràm trà 1 lần bị kích ứng nổi mẩn đỏ khắp mặt, giờ thấy chữ "trà" là ngại xài lại.',
    'Muốn tìm loại nào dịu nhẹ mà vẫn trị được mụn ẩn, không cần rửa mặt xong da căng rát.',
    'Giá cả cũng quan trọng, sinh viên như em không có nhiều tiền để thử hết loại này loại kia.',
    'Xem review trên TikTok thấy ai cũng khen nhưng không biết có phải quảng cáo không, sợ mua hớ.',
    'Em cần sản phẩm có giấy kiểm nghiệm rõ ràng, minh bạch thành phần vì da em dễ dị ứng.',
    'Đi làm cả ngày về mệt, chỉ muốn quy trình chăm da đơn giản 2-3 bước là đủ, không cầu kỳ.',
    'Có bạn dùng xong 2 tuần thấy mụn giảm hẳn nhưng em thì chưa thấy hiệu quả rõ, không biết da em có hợp không.',
    'Ưng nhất là được đổi trả nếu dùng không hợp, chứ mua online sợ nhất là ôm hàng không dùng được.',
  ].join('\n'),
  competitorAndOffer: 'Cam kết hoàn tiền 100% trong 30 ngày nếu không giảm mụn rõ rệt, tặng kèm bộ rửa mặt dịu nhẹ trị giá 150.000đ, có giấy kiểm nghiệm Bộ Y Tế đính kèm mỗi đơn hàng.',
  competitorTranscript1: 'Video đối thủ A (TikTok, 45s): Mở đầu diễn viên hoảng hốt "Đừng bao giờ mua serum trị mụn nếu chưa xem video này!", sau đó đưa tờ giấy kiểm nghiệm lên khoe cận cảnh, kể câu chuyện bị lừa mua hàng trộn hóa chất, rồi giới thiệu sản phẩm của họ kèm mã giảm giá chớp nhoáng, kết thúc bằng lời kêu gọi "chốt đơn ngay kẻo hết ưu đãi".',
  competitorTranscript2: 'Video đối thủ B (TikTok, 58s): Một bạn gái quay video "review thật 7 ngày dùng serum", có hình ảnh trước/sau, lồng tiếng chia sẻ nỗi lo da nhạy cảm dễ kích ứng, bác sĩ da liễu mặc áo blouse xuất hiện xác nhận thành phần an toàn, chốt lại bằng ưu đãi mua 2 tặng 1 trong hôm nay.',
  strategyTone: 'Chân thành, gần gũi như bạn thân tư vấn, thỉnh thoảng dí dỏm nhưng luôn có bằng chứng khoa học đi kèm',
  newProjectName: 'Kem Dưỡng Ẩm HoaSen Baby',
};

// Dữ liệu mẫu riêng cho clip 07 (Hướng dẫn: Lấy Comment Từ Link MXH) — theo tutorial-07-spec.md.
const CLIP07 = {
  fbUrl: 'https://www.facebook.com/groups/depchanhsagroup',
  filterLine: 'chỉ lấy bài hỏi về kem chống nắng, trị mụn, chăm sóc da',
};

// ---- Helpers dùng chung ----

const pause = (page, ms = 800) => page.waitForTimeout(ms);

// Gõ như người thật: chuỗi ngắn thì gõ từng ký tự, chuỗi dài (textarea) thì fill() cho nhanh.
async function typeHuman(locator, text) {
  await locator.scrollIntoViewIfNeeded();
  if (text.length < 80) {
    await locator.pressSequentially(text, { delay: 35 });
  } else {
    await locator.fill(text);
  }
}

// Cuộn mượt bằng mouse.wheel trong vùng <main> (chính container có overflow-y-auto, không phải window).
async function slowScroll(page, main, totalDelta = 1000, steps = 6) {
  const box = await main.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + Math.min(200, box.height / 3));
  const perStep = Math.round(totalDelta / steps);
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, perStep);
    await page.waitForTimeout(220);
  }
}

// Chặn cho tới khi resultLocator hiện ra HOẶC app bắn alert() báo lỗi AI HOẶC failureLocator hiện ra
// (thông báo lỗi hiển thị ngay trên trang, không qua dialog — dùng cho các bước crawl). Trả về số ms đã chờ thật.
async function waitForResultOrAlert(page, resultLocator, timeoutMs, failureLocator) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (dialogState.lastAlertMessage) {
      throw new Error(`AI báo lỗi qua alert(): ${dialogState.lastAlertMessage}`);
    }
    if (failureLocator && (await failureLocator.isVisible().catch(() => false))) {
      throw new Error('Crawl thất bại: trang báo "Không crawl được".');
    }
    if (await resultLocator.isVisible().catch(() => false)) {
      return Date.now() - start;
    }
    await page.waitForTimeout(1000);
  }
  throw new Error('Hết thời gian chờ (5 phút) mà chưa thấy kết quả AI.');
}

// Bấm nút gọi AI, giữ lại ~4s hiệu ứng loading rồi CẮT đoạn chờ dài: dừng ghi hình, đợi kết quả thật,
// ghi hình tiếp phần b (part mới) và chèn overlay báo thời gian chờ thật đã lược bỏ.
// failureLocator (tuỳ chọn): ném lỗi ngay khi thấy thông báo thất bại trên trang (dùng cho bước crawl).
// overlayText (tuỳ chọn): (seconds) => html text, để tuỳ biến nội dung overlay ⏩ (mặc định là text AI).
async function aiStep(page, rec, { trigger, resultLocator, failureLocator, loadingHoldMs = 4000, overlayText }) {
  dialogState.lastAlertMessage = null;
  await trigger();
  await page.waitForTimeout(loadingHoldMs);
  await rec.stopPart();

  const waitedMs = await waitForResultOrAlert(page, resultLocator, 5 * 60 * 1000, failureLocator);

  await rec.startPart();
  const seconds = Math.round(waitedMs / 1000);
  const text = overlayText ? overlayText(seconds) : `⏩ AI trả kết quả sau ${seconds}s (đã lược đoạn chờ)`;
  await page.screencast.showOverlay(
    `<div style="position:fixed;bottom:64px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,.92);color:#fff;padding:14px 22px;border-radius:12px;font:600 20px system-ui, sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35);white-space:nowrap">${text}</div>`,
    { duration: 1500 }
  );
  await page.waitForTimeout(1600);
  return seconds;
}

// Hiện overlay nhãn bước (nếu có) trong phần lớn thời lượng hold SONG SONG với hành động, rồi đợi đủ
// tới khi videoTime() - t0 >= holdSec. t0 là mốc VIDEO time đã chốt sẵn (xem step() và mark s01 ở main()).
// LƯU Ý: page.screencast.showOverlay()/showChapter() CHẶN (await) tới hết `duration` mới resolve (đã kiểm
// chứng thực nghiệm) — vì vậy KHÔNG await ở đây, chỉ bắn đi để overlay tự hiện/tự ẩn trong lúc action() chạy.
async function holdFrom(rec, t0, holdSec, overlayLabel, action) {
  if (overlayLabel) {
    rec.page.screencast
      .showOverlay(
        `<div style="position:fixed;top:28px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,.92);color:#fff;padding:10px 20px;border-radius:10px;font:600 18px system-ui, sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35);white-space:nowrap">${overlayLabel}</div>`,
        { duration: Math.round(holdSec * 1000 * 0.7) }
      )
      .catch(() => {});
  }
  await action();
  const elapsedMs = Math.round((rec.videoTime() - t0) * 1000);
  const remainMs = Math.round(holdSec * 1000) - elapsedMs;
  if (remainMs > 0) await rec.page.waitForTimeout(remainMs);
}

// Bọc 1 bước theo bảng spec: mark(id) để chốt thời điểm mốc VIDEO time rồi giữ đủ holdSec (xem holdFrom).
async function step(rec, id, holdSec, overlayLabel, action) {
  await holdFrom(rec, rec.mark(id), holdSec, overlayLabel, action);
}

// Quản lý các phần (part) webm của 1 clip: mỗi lần start/stop tạo 1 file part-N.webm, nối lại lúc dựng video.
// Đồng thời theo dõi VIDEO time (tổng thời lượng thật các part đã ghi + phần part đang ghi dở) để đặt mốc (mark)
// cho từng bước — dùng làm mốc `start` khi lồng tiếng (dub) sau này.
function createClipRecorder(page, index, slug) {
  const rawPrefix = path.join(RAW_DIR, `${String(index).padStart(2, '0')}-${slug}`);
  const parts = [];
  const marks = [];
  let partCount = 0;
  let actionsHandle = null;
  let finishedPartsMs = 0;
  let currentPartStartedAt = null;
  // Option cố định của caption hành động, dùng chung cho startPart() và showActions() (bật lại sau hideActions()).
  const ACTIONS_OPTS = { cursor: 'pointer', duration: 600, fontSize: 22, position: 'bottom-right' };

  async function startPart() {
    partCount += 1;
    const partPath = `${rawPrefix}-part${partCount}.webm`;
    // size = ĐÚNG viewport (1440x810): screencast chỉ scale được XUỐNG chứ không phóng to lên,
    // nếu để 1920x1080 ở đây thì trang chỉ chiếm góc trên-trái, phần còn lại bị viền xám.
    // Phóng lên 1920x1080 thật sự ở bước ffmpeg (concatToMp4) bằng scale filter.
    await page.screencast.start({ path: partPath, size: { width: 1440, height: 810 } });
    parts.push(partPath);
    currentPartStartedAt = Date.now();
    // Bật lại con trỏ chuột hoạt hình + tiêu đề hành động mỗi lần bắt đầu 1 part mới.
    actionsHandle = await page.screencast.showActions(ACTIONS_OPTS);
  }

  async function stopPart() {
    if (actionsHandle) {
      await actionsHandle.dispose().catch(() => {});
      actionsHandle = null;
    }
    if (currentPartStartedAt !== null) {
      finishedPartsMs += Date.now() - currentPartStartedAt;
      currentPartStartedAt = null;
    }
    await page.screencast.stop();
  }

  // Ẩn caption hành động khi cần gõ dữ liệu nhạy cảm (vd API key) — input type=password đã ẩn ký tự,
  // nhưng caption bottom-right vẫn in lại chuỗi đã gõ nên phải tắt hẳn caption trong lúc gõ.
  async function hideActions() {
    if (actionsHandle) {
      await actionsHandle.dispose().catch(() => {});
      actionsHandle = null;
    }
  }

  // Bật lại caption hành động sau khi ẩn (hideActions), dùng lại đúng option như lúc mở part mới.
  async function showActions() {
    actionsHandle = await page.screencast.showActions(ACTIONS_OPTS);
  }

  // Tổng thời lượng VIDEO (giây) đã ghi được tính tới thời điểm gọi: các part đã đóng + phần part đang mở dở.
  function videoTime() {
    const liveMs = currentPartStartedAt !== null ? Date.now() - currentPartStartedAt : 0;
    return Math.round((finishedPartsMs + liveMs) / 10) / 100;
  }

  // Chốt mốc thời gian video cho 1 bước (id theo spec, vd 's06'), trả về giá trị mốc để step() dùng lại.
  function mark(id) {
    const t = videoTime();
    marks.push({ id, t });
    return t;
  }

  return { rawPrefix, parts, slug, page, marks, startPart, stopPart, videoTime, mark, hideActions, showActions };
}

function checkFfmpeg() {
  const res = spawnSync('ffmpeg', ['-version']);
  return !res.error && res.status === 0;
}

// Nối các part webm của 1 clip thành 1 file .mp4 chuẩn (h264/yuv420p/30fps CFR/+faststart), xoá webm khi xong.
function concatToMp4(rec, outPath) {
  if (rec.parts.length === 0) throw new Error(`Clip ${rec.slug}: không có phần ghi hình nào.`);

  const listPath = `${rec.rawPrefix}-list.txt`;
  const listContent = rec.parts
    .map((p) => `file '${path.resolve(p).replace(/\\/g, '/').replace(/'/g, "'\\''")}'`)
    .join('\n');
  fs.writeFileSync(listPath, listContent, 'utf8');

  const result = spawnSync('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', listPath,
    '-r', '30', '-vf', 'scale=1920:1080:flags=lanczos,format=yuv420p',
    '-c:v', 'libx264', '-movflags', '+faststart',
    outPath,
  ], { encoding: 'utf8' });

  if (result.error || result.status !== 0) {
    throw new Error(`ffmpeg lỗi khi dựng ${rec.slug}: ${result.stderr || result.error}`);
  }

  for (const p of rec.parts) fs.rmSync(p, { force: true });
  fs.rmSync(listPath, { force: true });
}

// Chỉ giữ lại field không bắt đầu bằng "masked" - dùng để chặn lộ API key khi ghi hình trang Cài Đặt.
function blankMaskedFields(config) {
  const out = { ...config };
  for (const key of Object.keys(out)) {
    if (key.startsWith('masked')) out[key] = '';
  }
  return out;
}

// Chuỗi chữ số kiểu số điện thoại: >= 9 chữ số, cho phép cách/chấm/gạch ngang xen giữa.
const PHONE_LIKE_RE = /(?:\d[ .-]?){9,}/g;

// Ẩn danh dữ liệu crawl comment trước khi ghi hình: tên tác giả -> "Thành viên N" (ánh xạ ổn định theo
// tên gốc, dùng chung cho cả buổi ghi qua authorMap), số điện thoại trong nội dung -> "(đã ẩn số)".
function pseudonymizeCrawlComments(data, authorMap) {
  if (!data || !Array.isArray(data.comments)) return data;
  const comments = data.comments.map((c) => {
    const author = c.author || '';
    if (author && !authorMap.has(author)) authorMap.set(author, `Thành viên ${authorMap.size + 1}`);
    return {
      ...c,
      author: author ? authorMap.get(author) : author,
      text: typeof c.text === 'string' ? c.text.replace(PHONE_LIKE_RE, '(đã ẩn số)') : c.text,
    };
  });
  return { ...data, comments };
}

async function preflight(baseUrl) {
  let homeOk = false;
  let configJson = null;

  try {
    const res = await fetch(baseUrl, { signal: AbortSignal.timeout(5000) });
    homeOk = res.ok;
  } catch {}

  try {
    const res = await fetch(new URL('/api/config', baseUrl), { signal: AbortSignal.timeout(5000) });
    if (res.ok) configJson = await res.json();
  } catch {}

  const hasAnyProvider = Boolean(
    configJson && (configJson.hasGemini || configJson.hasOpenAI || configJson.hasClaude || configJson.hasNineRouter || configJson.hasOpenRouter)
  );

  if (!homeOk || !hasAnyProvider) {
    console.error(
      `[record-demo] Không kết nối được tới ${baseUrl} hoặc chưa cấu hình API key nào (Gemini/OpenAI/Claude/9Router/OpenRouter).\n` +
      '[record-demo] Hãy chạy `npm run dev` hoặc chay_ung_dung.bat trước, rồi thử lại.'
    );
    process.exit(1);
  }
}

// ---- Các clip ----

async function clip01ResearchCustomer(page, main, rec) {
  await typeHuman(main.getByPlaceholder('Nhập tên sản phẩm').describe('Ô nhập Tên Sản phẩm / Dịch vụ'), DEMO.productName);
  await pause(page);
  await typeHuman(main.getByPlaceholder('Mỹ phẩm, Gia dụng').describe('Ô nhập Ngành hàng / Lĩnh vực'), DEMO.industry);
  await pause(page);
  await typeHuman(main.getByPlaceholder('Độ tuổi, giới tính').describe('Ô nhập Khách hàng mục tiêu'), DEMO.targetAudience);
  await pause(page);
  await typeHuman(main.getByPlaceholder('Mục tiêu doanh số').describe('Ô nhập Mục tiêu kinh doanh cốt lõi'), DEMO.businessGoal);
  await pause(page);
  await typeHuman(main.getByPlaceholder('Dán các câu nói').describe('Ô dán Phản hồi khách hàng & Nỗi đau (VoC)'), DEMO.customerPainRaw);
  await pause(page);
  await typeHuman(main.getByPlaceholder('Chính sách dùng thử').describe('Ô nhập Ưu đãi & Cam kết'), DEMO.competitorAndOffer);
  await pause(page);

  const submitBtn = main.getByRole('button', { name: 'Bắt đầu Phân tích' }).first().describe('Nút Bắt đầu Phân tích');
  const resultHeading = main.getByRole('heading', { name: 'Bức Tranh Chiến Lược Khách Hàng' });
  const seconds = await aiStep(page, rec, { trigger: () => submitBtn.click(), resultLocator: resultHeading });
  aiWaitLog.push({ clip: '01-nghien-cuu-khach-hang', seconds });

  await slowScroll(page, main, 1000);
  await pause(page);

  const branchTabs = ['1. Định Khung', '2. Nhu Cầu Tìm Kiếm', '3. Tiếng Nói Khách Hàng (VoC)', '4. Đối Thủ', '5. Quảng Cáo & Offer'];
  for (const label of branchTabs) {
    await main.getByRole('button', { name: label, exact: true }).describe(`Tab nhánh: ${label}`).click();
    await pause(page, 700);
  }
  await main.getByRole('button', { name: 'Tất cả 5 nhánh', exact: true }).describe('Tab Tất cả 5 nhánh').click();
  await pause(page);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    main.getByRole('button', { name: /Tải Báo Cáo/ }).describe('Nút Tải Báo Cáo (.md)').click(),
  ]);
  await download.path().catch(() => {});
  await pause(page);
}

async function clip02CompetitorVideo(page, main, rec) {
  await typeHuman(main.getByPlaceholder('Mỹ phẩm, Gia dụng').describe('Ô nhập Ngành hàng / Lĩnh vực'), DEMO.industry);
  await pause(page);

  await main.getByRole('button', { name: 'Dán Transcript', exact: true }).describe('Tab Dán Transcript').click();
  await pause(page);

  await typeHuman(
    main.getByPlaceholder('Video 1:').describe('Ô dán Transcript đối thủ'),
    `${DEMO.competitorTranscript1}\n\n${DEMO.competitorTranscript2}`
  );
  await pause(page);

  const submitBtn = main.getByRole('button', { name: 'Bắt đầu Quét & Phân Tích' }).first().describe('Nút Bắt đầu Quét & Phân Tích');
  const resultHeading = main.getByRole('heading', { name: 'Bức Tranh Cạnh Tranh & Công Thức Viral' });
  const seconds = await aiStep(page, rec, { trigger: () => submitBtn.click(), resultLocator: resultHeading });
  aiWaitLog.push({ clip: '02-tinh-bao-video-doi-thu', seconds });

  await slowScroll(page, main, 1400);
  await pause(page);
}

async function clip03Strategy(page, main, rec) {
  await typeHuman(main.getByPlaceholder('Chân thành, chuyên gia').describe('Ô nhập Giọng điệu mong muốn'), DEMO.strategyTone);
  await pause(page);

  const submitBtn = main.getByRole('button', { name: 'Bắt đầu Lập Chiến Lược' }).first().describe('Nút Bắt đầu Lập Chiến Lược');
  const resultHeading = main.getByRole('heading', { name: 'Khung Chiến Lược Nội Dung Thương Hiệu' });
  const seconds = await aiStep(page, rec, { trigger: () => submitBtn.click(), resultLocator: resultHeading });
  aiWaitLog.push({ clip: '03-chien-luoc-noi-dung', seconds });

  await slowScroll(page, main, 1200);
  await pause(page);
}

async function clip04Calendar(page, main, rec) {
  await main.getByRole('button', { name: 'TikTok', exact: true }).describe('Chọn kênh TikTok').click();
  await pause(page);

  await main.locator('select').describe('Chọn khung thời gian 7 ngày').selectOption({ label: '7 ngày (Weekly Sprint)' });
  await pause(page);

  const submitBtn = main.getByRole('button', { name: 'Bắt đầu Tạo Lịch' }).first().describe('Nút Bắt đầu Tạo Lịch');
  const csvBtn = main.getByRole('button', { name: /Xuất File Excel/ });
  const seconds = await aiStep(page, rec, { trigger: () => submitBtn.click(), resultLocator: csvBtn });
  aiWaitLog.push({ clip: '04-lich-noi-dung', seconds });

  await slowScroll(page, main, 1200);
  await pause(page);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    csvBtn.describe('Nút Xuất File Excel / CSV').click(),
  ]);
  await download.path().catch(() => {});
  await pause(page);
}

async function clip05ProjectManager(page) {
  // Đọc tên dự án gốc trực tiếp từ localStorage của app (đáng tin hơn là đoán tên mặc định).
  const originalProjectName = await page.evaluate(() => {
    try {
      const list = JSON.parse(localStorage.getItem('marketing_projects_list') || '[]');
      const activeId = JSON.parse(localStorage.getItem('marketing_active_project_id') || 'null');
      const found = list.find((p) => p.id === activeId) || list[0];
      return found ? found.name : 'Dự án Nghiên cứu Chính';
    } catch {
      return 'Dự án Nghiên cứu Chính';
    }
  });

  // Modal quản lý dự án nổi trên toàn trang: khoanh vùng riêng để không đụng chữ trùng ở Header phía sau.
  const modalPanel = page.locator('div.rounded-2xl.shadow-2xl.border-slate-200');
  const openProjectModal = () => page.getByTitle('Bấm để chuyển đổi hoặc tạo dự án mới').describe('Mở Quản Lý Dự Án').click();

  await openProjectModal();
  await modalPanel.waitFor();
  await pause(page);

  await typeHuman(modalPanel.getByPlaceholder('Nhập tên dự án hoặc thương hiệu mới').describe('Ô nhập tên dự án mới'), DEMO.newProjectName);
  await pause(page);

  await modalPanel.getByRole('button', { name: 'Tạo Dự Án Mới' }).describe('Nút Tạo Dự Án Mới').click();
  await page.getByText(/Đã chuyển sang dự án/).waitFor();
  await pause(page, 1200);

  await openProjectModal();
  await modalPanel.waitFor();
  await pause(page);

  await modalPanel.getByText(originalProjectName, { exact: true }).first().describe(`Chuyển về dự án: ${originalProjectName}`).click();
  await page.getByText(/Đã chuyển sang dự án/).waitFor();
  await modalPanel.waitFor({ state: 'detached' });
  await pause(page, 1000);
}

async function clip06Settings(page, main) {
  // Model selector: chỉ mở ra cho thấy danh sách rồi đóng lại, không đổi model đang dùng.
  const modelSelectorBtn = main.getByText('Mô hình AI đang kích hoạt').locator('xpath=..').getByRole('button').first().describe('Bộ chọn Model AI đang kích hoạt');
  await modelSelectorBtn.click();
  await pause(page, 1000);
  await modelSelectorBtn.click();
  await pause(page);

  await page.locator('aside').getByRole('button', { name: 'Đồng Bộ Notion', exact: true }).describe('Chuyển sang Đồng Bộ Notion').click();
  await pause(page, 1000);
  await slowScroll(page, main, 400, 3);
  await pause(page);

  await page.getByRole('button', { name: 'Tối', exact: true }).describe('Chuyển giao diện Tối').click();
  await pause(page, 1000);
  await page.getByRole('button', { name: 'Sáng', exact: true }).describe('Chuyển giao diện Sáng').click();
  await pause(page);

  await page.getByRole('button', { name: 'Đóng thanh bên', exact: true }).describe('Thu gọn thanh bên').click();
  await pause(page, 900);
  await page.getByRole('button', { name: 'Mở thanh bên', exact: true }).describe('Mở lại thanh bên').click();
  await pause(page);
}

// Clip 07 — Hướng dẫn: Lấy Comment Từ Link MXH (theo D:/tools/omnivoice/dub/tutorial-07-spec.md).
async function clip07LinkComments(page, main, rec) {
  // Mục 1 (Thông tin sản phẩm) phải rỗng để s04-s07 chạy đúng "crawl không lọc theo ngữ cảnh".
  const productNameVal = await main.getByPlaceholder('Nhập tên sản phẩm').inputValue();
  if (productNameVal.trim()) {
    throw new Error('Mục 1 (Thông tin sản phẩm) không rỗng — clip 07 cần chạy ở context/profile mới (vd ONLY=7).');
  }

  const linkTextarea = main.getByPlaceholder('https://www.facebook.com/groups/').describe('Ô dán link mạng xã hội');
  const vocTextarea = main.getByPlaceholder('Dán các câu nói').describe('Ô phản hồi khách hàng (VoC)');
  const loginBtn = main.getByRole('button', { name: 'Đăng nhập Facebook' }).describe('Nút Đăng nhập Facebook');
  const linkCommentsTab = main.getByRole('button', { name: 'Từ Link MXH (Comment)', exact: true }).describe('Tab Từ Link MXH (Comment)');
  const crawlBtn = main.getByRole('button', { name: 'Bắt đầu Crawl Comment' }).describe('Nút Bắt đầu Crawl Comment');
  const successNotice = main.getByText(/Đã crawl comment từ/).describe('Thông báo crawl thành công');
  const failureNotice = main.getByText(/Không crawl được/).describe('Thông báo crawl thất bại');
  const sourcesHeading = main.getByText(/^Nguồn đã crawl/).describe('Tiêu đề "Nguồn đã crawl"');
  const firstSourceRow = sourcesHeading.locator('xpath=../div[1]/div[1]');
  const submitBtn = main.getByRole('button', { name: 'Bắt đầu Phân tích' }).first().describe('Nút Bắt đầu Phân tích');

  // s01: mark đã chốt ở vòng lặp main() (markFirstStep, TRƯỚC showChapter) — dùng lại mốc đó,
  // KHÔNG mark lại ở đây (mark 2 lần cùng id sẽ ghi trùng vào marks.json và lệch mốc tính hold).
  const s01Mark = rec.marks.find((m) => m.id === 's01');
  await holdFrom(rec, s01Mark ? s01Mark.t : rec.mark('s01'), 9.5, null, async () => {
    await slowScroll(page, main, 700, 4);
    await main.getByText('Công cụ AI tự động thu thập Feedback (VoC)').describe('Tiêu đề CrawlPanel').scrollIntoViewIfNeeded();
  });

  await step(rec, 's02', 10.5, 'Bước 1 · Đăng nhập Facebook (chỉ cần 1 lần)', async () => {
    await loginBtn.hover(); // KHÔNG click: click thật sẽ mở cửa sổ Chrome đăng nhập.
  });

  await step(rec, 's03', 4.0, 'Bước 2 · Chọn thẻ "Từ Link MXH (Comment)"', async () => {
    await linkCommentsTab.click();
  });

  await step(rec, 's04', 9.5, 'Bước 3 · Dán link (mỗi dòng 1 link, tối đa 10)', async () => {
    await typeHuman(linkTextarea, CLIP07.fbUrl);
  });

  await step(rec, 's05', 4.5, null, async () => {
    await main.getByText('Đã nhận diện 1 link hợp lệ').describe('Dòng gợi ý số link hợp lệ').hover();
  });

  await step(rec, 's06', 8.0, 'Bước 4 · Bấm "Bắt đầu Crawl Comment"', async () => {
    const seconds = await aiStep(page, rec, {
      trigger: () => crawlBtn.click(),
      resultLocator: successNotice,
      failureLocator: failureNotice,
      loadingHoldMs: 5000,
      overlayText: (s) => `⏩ Crawl xong sau ${s}s (đã lược đoạn chờ)`,
    });
    aiWaitLog.push({ clip: '07-huong-dan-link-mxh-comment (không lọc)', seconds });
  });

  await step(rec, 's07', 8.0, 'Kết quả · Nguồn đã crawl', async () => {
    await successNotice.scrollIntoViewIfNeeded();
    await sourcesHeading.scrollIntoViewIfNeeded();
    await firstSourceRow.describe('Dòng nguồn đã crawl #1').hover();
  });

  await step(rec, 's08', 9.0, '🔒 Tên thành viên đã được ẩn trong video này', async () => {
    await slowScroll(page, main, 600, 4);
    await vocTextarea.scrollIntoViewIfNeeded();
    await vocTextarea.hover();
    await page.mouse.wheel(0, 150);
  });

  await step(rec, 's09', 9.5, 'Mẹo · Thêm 1 dòng mô tả để AI lọc đúng chủ đề', async () => {
    await linkTextarea.scrollIntoViewIfNeeded();
    await linkTextarea.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.press('Enter');
    await typeHuman(linkTextarea, CLIP07.filterLine);
  });

  await step(rec, 's10', 5.5, null, async () => {
    await main.getByText(/AI lọc nội dung liên quan tới/).describe('Dòng gợi ý AI lọc theo mô tả').hover();
  });

  await step(rec, 's11', 8.0, 'Bấm crawl lần nữa · AI lọc theo mô tả', async () => {
    const seconds = await aiStep(page, rec, {
      trigger: () => crawlBtn.click(),
      resultLocator: successNotice,
      failureLocator: failureNotice,
      loadingHoldMs: 5000,
      overlayText: (s) => `⏩ Crawl xong sau ${s}s (đã lược đoạn chờ)`,
    });
    aiWaitLog.push({ clip: '07-huong-dan-link-mxh-comment (có lọc AI)', seconds });
  });

  await step(rec, 's12', 6.5, 'Kết quả · Chỉ giữ nội dung liên quan', async () => {
    await sourcesHeading.scrollIntoViewIfNeeded();
    await firstSourceRow.describe('Dòng nguồn đã crawl #1 (lần 2)').hover();
  });

  await step(rec, 's13', 10.5, 'Bước cuối · Điền mục 1 rồi bấm "Bắt đầu Phân tích"', async () => {
    await slowScroll(page, main, 500, 3);
    await vocTextarea.scrollIntoViewIfNeeded();
    await vocTextarea.hover();
    await page.mouse.wheel(0, 300);
    await pause(page, 500);
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.hover(); // KHÔNG click: click thật sẽ chạy phân tích AI.
  });
}

// Clip 08 — Hướng dẫn: Thêm API Key vào ứng dụng (theo D:/tools/omnivoice/dub/tutorial-08-spec.md).
async function clip08AddApiKey(page, main, rec) {
  const apiKey = process.env.DEMO_GEMINI_KEY;
  if (!apiKey) {
    throw new Error('Thiếu biến môi trường DEMO_GEMINI_KEY — clip 08 cần khóa Gemini thật để ghi hình bước Kiểm tra Gemini.');
  }

  const settingsTab = page.locator('aside').getByRole('button', { name: 'Cài Đặt API', exact: true }).describe('Tab Cài Đặt API');
  const researchTab = page.locator('aside').getByRole('button', { name: 'Nghiên Cứu Khách Hàng', exact: true }).describe('Tab Nghiên Cứu Khách Hàng');

  const nineRouterLabel = main.getByText('9Router Gateway (Đa mô hình: Claude, GPT, Gemini)').describe('Nhãn card 9Router');
  const geminiLabel = main.getByText('Google Gemini API (Miễn phí 100%)').describe('Nhãn card Gemini');
  const openaiLabel = main.getByText('OpenAI API (GPT-4o, o3-mini)').describe('Nhãn card OpenAI');
  const claudeLabel = main.getByText('Anthropic Claude API (Sonnet, Haiku)').describe('Nhãn card Claude');
  const geminiFreeLink = main.getByRole('link', { name: 'Lấy API Key Miễn Phí ↗' }).describe('Link Lấy API Key Miễn Phí (Gemini)');

  const geminiInput = main.getByPlaceholder('AIzaSy...').describe('Ô nhập Gemini API Key');
  // Card cha của ô Gemini: leo lên ancestor <div rounded-xl> gần nhất để khoanh vùng nút/kết quả Kiểm tra Gemini,
  // tránh đụng nút "Kiểm tra ..." hay dòng kết quả của card 9Router/OpenAI/Claude bên cạnh.
  const geminiCard = geminiInput.locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
  const testGeminiBtn = geminiCard.getByRole('button', { name: /Kiểm tra Gemini/ }).describe('Nút Kiểm tra Gemini');
  const geminiSuccessLine = geminiCard.getByText(/Kết nối Google Gemini thành công/).describe('Dòng báo Kiểm tra Gemini thành công');
  const geminiFailureLine = geminiCard.locator('p.text-rose-600').describe('Dòng báo lỗi Kiểm tra Gemini');

  const saveTopBtn = main.getByRole('button', { name: /Lưu Cấu Hình|Đã lưu thành công/ }).first().describe('Nút Lưu Cấu Hình (trên)');

  const modelSelectorBtn = main.getByText('Mô hình AI đang kích hoạt').locator('xpath=..').getByRole('button').first().describe('Bộ chọn Model AI đang kích hoạt');
  // Danh sách model chỉ xuất hiện khi mở dropdown, là <div> liền sau nút bộ chọn (cùng cha "relative") —
  // phải khoanh vùng vào đây, nếu không regex tên model sẽ trùng luôn cả nút bộ chọn đang đóng (đã chọn sẵn model này).
  const modelDropdownPanel = modelSelectorBtn.locator('xpath=following-sibling::div[1]');
  const geminiModelOption = modelDropdownPanel.getByRole('button', { name: /^Gemini 3\.6 Flash \(Khuyên dùng\)/ }).describe('Tuỳ chọn model Gemini 3.6 Flash');

  // s01: mark đã chốt ở vòng lặp main() (markFirstStep, TRƯỚC showChapter, để hold s01 tính đúng từ t=0
  // và bao trùm luôn thời gian hiện chapter card), giống hệt cách clip07 xử lý — KHÔNG mark lại ở đây.
  const s01Mark = rec.marks.find((m) => m.id === 's01');
  await holdFrom(rec, s01Mark ? s01Mark.t : rec.mark('s01'), 9.0, null, async () => {
    await pause(page, 800);
  });

  await step(rec, 's02', 5.0, 'Bước 1 · Mở Cài Đặt API', async () => {
    await settingsTab.click();
  });

  await step(rec, 's03', 8.5, 'Các nhà cung cấp AI · chọn Google Gemini (miễn phí)', async () => {
    for (const label of [nineRouterLabel, geminiLabel, openaiLabel, claudeLabel]) {
      await label.hover();
      await pause(page, 500);
    }
    await geminiLabel.hover(); // quay lại kết thúc chuỗi hover đúng ở card Gemini (theo spec).
  });

  await step(rec, 's04', 9.0, 'Bước 2 · Lấy key miễn phí tại Google AI Studio', async () => {
    await geminiFreeLink.hover(); // KHÔNG click: click thật sẽ mở tab Google AI Studio.
  });

  await step(rec, 's05', 7.0, 'Bước 3 · Dán API key vào ô Google Gemini', async () => {
    const existing = await geminiInput.inputValue();
    if (existing.trim()) {
      throw new Error('Ô Gemini API Key không rỗng — clip 08 cần chạy ở context/profile mới (vd ONLY=8).');
    }
    await geminiInput.click();
    await rec.hideActions(); // ẩn caption hành động: input type=password chỉ ẩn ký tự chứ không ẩn caption gõ.
    await geminiInput.pressSequentially(apiKey, { delay: 35 });
    await rec.showActions();
  });

  await step(rec, 's06', 7.5, 'Bước 4 · Kiểm tra kết nối', async () => {
    await testGeminiBtn.click();
    // Lệnh test thường trả kết quả trong <1s; vẫn chờ tới 60s cho chắc, không cần cắt phần ghi hình (không dùng aiStep).
    const start = Date.now();
    for (;;) {
      if (await geminiFailureLine.isVisible().catch(() => false)) {
        const msg = await geminiFailureLine.innerText().catch(() => '(không đọc được nội dung lỗi)');
        throw new Error(`Kiểm tra Gemini thất bại: ${msg}`);
      }
      if (await geminiSuccessLine.isVisible().catch(() => false)) break;
      if (Date.now() - start > 60_000) {
        throw new Error('Hết thời gian chờ (60s) mà chưa thấy kết quả Kiểm tra Gemini.');
      }
      await page.waitForTimeout(300);
    }
    await geminiSuccessLine.hover();
  });

  await step(rec, 's07', 5.5, 'Bước 5 · Lưu Cấu Hình', async () => {
    await saveTopBtn.scrollIntoViewIfNeeded(); // cuộn lên nếu đang ở card Gemini phía dưới.
    await saveTopBtn.click();
  });

  await step(rec, 's08', 7.0, 'Bước 6 · Chọn mô hình AI', async () => {
    await modelSelectorBtn.scrollIntoViewIfNeeded();
    await modelSelectorBtn.click();
    await pause(page, 1200); // dừng lại cho thấy rõ danh sách model đang mở.
    await geminiModelOption.click();
  });

  await step(rec, 's09', 11.5, 'Hoàn tất · Đừng chia sẻ API key cho người khác', async () => {
    await researchTab.click();
    await pause(page, 800);
  });
}

// ---- Self-check (chạy: node scripts/record-demo.js --selfcheck) ----

function runSelfCheck() {
  const sample = { hasGemini: true, maskedGemini: 'AQ.A...FbNA', maskedOpenAI: '', notionParentId: 'abc' };
  const result = blankMaskedFields(sample);
  assert.strictEqual(result.maskedGemini, '');
  assert.strictEqual(result.maskedOpenAI, '');
  assert.strictEqual(result.hasGemini, true);
  assert.strictEqual(result.notionParentId, 'abc');

  const authorMap = new Map();
  const crawlSample = {
    comments: [
      { author: 'Nguyễn Văn A', text: 'Liên hệ mình qua số 0912.345.678 nhé' },
      { author: 'Nguyễn Văn A', text: 'lần 2 vẫn là A, không có số nào ở đây' },
      { author: '', text: 'không có tên tác giả' },
      { author: 'Trần Thị B', text: 'sđt 0987 654 321 hoặc 090-111-2222 đều được' },
    ],
  };
  const crawlResult = pseudonymizeCrawlComments(crawlSample, authorMap);
  assert.strictEqual(crawlResult.comments[0].author, 'Thành viên 1');
  assert.strictEqual(crawlResult.comments[1].author, 'Thành viên 1'); // ánh xạ ổn định theo tên gốc
  assert.strictEqual(crawlResult.comments[2].author, ''); // author rỗng giữ nguyên rỗng
  assert.strictEqual(crawlResult.comments[3].author, 'Thành viên 2');
  assert.ok(crawlResult.comments[0].text.includes('(đã ẩn số)'));
  assert.ok(!/\d{9,}/.test(crawlResult.comments[0].text));
  assert.strictEqual(crawlResult.comments[1].text, 'lần 2 vẫn là A, không có số nào ở đây'); // không có số -> giữ nguyên
  assert.ok(crawlResult.comments[3].text.includes('(đã ẩn số)'));
  assert.strictEqual((crawlResult.comments[3].text.match(/\(đã ẩn số\)/g) || []).length, 2);

  console.log('SELFCHECK OK');
}

// ---- Main ----

async function main() {
  await preflight(BASE_URL);

  fs.mkdirSync(DEMO_DIR, { recursive: true });
  fs.mkdirSync(RAW_DIR, { recursive: true });
  const ffmpegAvailable = checkFfmpeg();
  if (!ffmpegAvailable) {
    console.warn('[record-demo] Không tìm thấy ffmpeg trong PATH. Sẽ giữ nguyên file .webm, bỏ qua bước dựng .mp4.');
  }

  const browser = await chromium.launch({ headless: !process.env.HEADED });
  const context = await browser.newContext({
    // deviceScaleFactor mặc định = 1: screencast chỉ scale XUỐNG được, không phóng to lên,
    // để DSF > 1 mà size screencast lại đặt to hơn viewport thực (lỗi cũ) sẽ ra viền xám.
    // Độ phân giải 1920x1080 cuối cùng được phóng lên ở bước ffmpeg (xem concatToMp4).
    viewport: { width: 1440, height: 810 },
    acceptDownloads: true,
  });

  // DEMO_MODEL (tuỳ chọn): đổi model AI đang active TRƯỚC khi app load, dùng khi Gemini hết quota
  // mà chưa muốn sửa .env. App đọc model từ localStorage['marketing_selected_model'] lúc khởi động
  // (App.jsx) và fetchConfig() không ghi đè khi key này đã có sẵn.
  if (process.env.DEMO_MODEL) {
    await context.addInitScript((model) => {
      localStorage.setItem('marketing_selected_model', model);
    }, process.env.DEMO_MODEL);
  }

  const page = await context.newPage();
  page.on('dialog', async (dialog) => {
    try {
      if (dialog.type() === 'alert') {
        dialogState.lastAlertMessage = dialog.message();
        console.warn(`[record-demo] alert(): ${dialogState.lastAlertMessage}`);
      }
      await dialog.accept();
    } catch {}
  });

  // Chặn /api/config để xoá sạch các trường maskedXxx (fragment API key) trước khi trang Cài Đặt render ra.
  // Bọc try/catch: nếu server tạm thời không phản hồi được thì cho request đi tiếp bình thường,
  // tránh 1 lỗi route làm crash cả script (route handler ném lỗi là unhandled rejection).
  await page.route('**/api/config', async (route) => {
    try {
      const response = await route.fetch();
      const json = blankMaskedFields(await response.json());
      await route.fulfill({ response, json });
    } catch (err) {
      console.warn(`[record-demo] Route /api/config lỗi (${err.message}), cho request đi tiếp không che.`);
      await route.continue().catch(() => {});
    }
  });

  // Chặn /api/crawl/comments để ẩn danh tên tác giả + số điện thoại thật trước khi hiện lên video demo (clip 07).
  const commentAuthorMap = new Map();
  await page.route('**/api/crawl/comments', async (route) => {
    try {
      // timeout: 0 - crawl thật mất 40-113s+, quá lâu so với mặc định 30s của route.fetch();
      // fetch riêng bị timeout thì rơi vào catch -> route.continue() gửi request THẬT lần 2,
      // đụng độ với crawler đang giữ 1 phiên Facebook duy nhất -> crawl lần đầu cũng hỏng theo.
      const response = await route.fetch({ timeout: 0 });
      const json = pseudonymizeCrawlComments(await response.json(), commentAuthorMap);
      await route.fulfill({ response, json });
    } catch (err) {
      console.warn(`[record-demo] Route /api/crawl/comments lỗi (${err.message}), cho request đi tiếp không che.`);
      await route.continue().catch(() => {});
    }
  });

  await page.goto(BASE_URL);
  await page.getByRole('heading', { level: 1 }).first().waitFor();

  const main = page.locator('main.overflow-y-auto');

  const clipDefs = [
    { index: 1, slug: '01-nghien-cuu-khach-hang', title: '1. Nghiên Cứu Khách Hàng', description: 'AI phân tích toàn diện 5 nhánh từ dữ liệu khách hàng thực tế', tab: null, run: clip01ResearchCustomer },
    { index: 2, slug: '02-tinh-bao-video-doi-thu', title: '2. Tình Báo Video Đối Thủ', description: 'Quét & phân tích motif, hook và khoảng trống thị trường từ video đối thủ', tab: 'Tình Báo Video Đối Thủ', run: clip02CompetitorVideo },
    { index: 3, slug: '03-chien-luoc-noi-dung', title: '3. Chiến Lược Nội Dung', description: 'Chuyển hoá insight khách hàng thành trụ cột nội dung & giọng điệu thương hiệu', tab: 'Chiến Lược Nội Dung', run: clip03Strategy },
    { index: 4, slug: '04-lich-noi-dung', title: '4. Lịch Nội Dung Đa Kênh', description: 'Lên lịch đăng bài truy vết insight cho từng kênh', tab: 'Lịch Nội Dung Đa Kênh', run: clip04Calendar },
    { index: 5, slug: '05-quan-ly-du-an', title: '5. Quản Lý Dự Án & Thương Hiệu', description: 'Tạo, chuyển đổi và quản lý nhiều dự án thương hiệu', tab: null, run: clip05ProjectManager },
    { index: 6, slug: '06-giao-dien-cai-dat', title: '6. Giao Diện Cài Đặt', description: 'Cấu hình API, đồng bộ Notion và giao diện sáng / tối', tab: 'Cài Đặt API', run: clip06Settings },
    {
      index: 7,
      slug: '07-huong-dan-link-mxh-comment',
      title: '7. Hướng Dẫn: Lấy Comment Từ Link MXH',
      description: 'Dán link group / bài viết Facebook hoặc video YouTube — hệ thống tự gom bình luận',
      tab: 'Nghiên Cứu Khách Hàng',
      markFirstStep: 's01', // mark ngay khi part đầu tiên vừa mở, TRƯỚC showChapter, để hold s01 tính đúng từ t=0.
      run: clip07LinkComments,
    },
    {
      index: 8,
      slug: '08-huong-dan-them-api-key',
      title: '8. Hướng Dẫn: Thêm API Key',
      description: 'Kết nối Google Gemini miễn phí để dùng các tính năng AI',
      tab: 'Nghiên Cứu Khách Hàng',
      markFirstStep: 's01',
      run: clip08AddApiKey,
    },
  ];

  // ONLY=7 hoặc ONLY=1,3: chỉ ghi các clip có index nằm trong danh sách. Bỏ trống = ghi hết như cũ.
  const onlyIndexes = process.env.ONLY
    ? new Set(process.env.ONLY.split(',').map((s) => Number(s.trim())))
    : null;
  const clipsToRun = onlyIndexes ? clipDefs.filter((def) => onlyIndexes.has(def.index)) : clipDefs;

  const failures = [];

  for (const def of clipsToRun) {
    console.log(`\n[record-demo] === Clip ${def.slug} ===`);
    if (def.tab) {
      await page.locator('aside').getByRole('button', { name: def.tab, exact: true }).click();
      await pause(page);
    }

    const rec = createClipRecorder(page, def.index, def.slug);
    try {
      await rec.startPart();
      if (def.markFirstStep) rec.mark(def.markFirstStep);
      await page.screencast.showChapter(def.title, { description: def.description, duration: 2500 });
      await pause(page, 2600);

      await def.run(page, main, rec);
      await rec.stopPart();

      if (ffmpegAvailable) {
        // Dựng mp4 ở WORK_DIR (ngoài dự án) trước, xong xuôi mới copy 1 lần vào demo-videos/
        // (file lúc này đã đóng hẳn, không còn bị khoá nên Vite watch được bình thường).
        const tmpOutPath = path.join(WORK_DIR, `${def.slug}.mp4`);
        concatToMp4(rec, tmpOutPath);
        const finalOutPath = path.join(DEMO_DIR, `${def.slug}.mp4`);
        fs.copyFileSync(tmpOutPath, finalOutPath);
        fs.rmSync(tmpOutPath, { force: true });
        console.log(`[record-demo] Đã dựng xong: ${finalOutPath}`);
      } else {
        for (const p of rec.parts) fs.copyFileSync(p, path.join(DEMO_DIR, path.basename(p)));
      }

      if (rec.marks.length > 0) {
        const marksPath = path.join(DEMO_DIR, `${def.slug}.marks.json`);
        fs.writeFileSync(marksPath, JSON.stringify(rec.marks, null, 2), 'utf8');
        console.log(`[record-demo] Đã ghi marks: ${marksPath}`);
      }
    } catch (err) {
      await rec.stopPart().catch(() => {});
      console.error(`[record-demo] Clip ${def.slug} THẤT BẠI: ${err.message}`);
      failures.push({ slug: def.slug, error: err.message });
    }
  }

  await browser.close();
  fs.rmSync(WORK_DIR, { recursive: true, force: true });

  console.log('\n[record-demo] ===== TỔNG KẾT =====');
  for (const { clip, seconds } of aiWaitLog) {
    console.log(`  - ${clip}: chờ AI thật ${seconds}s`);
  }

  if (failures.length > 0) {
    console.error(`[record-demo] ${failures.length}/${clipsToRun.length} clip thất bại:`);
    for (const f of failures) console.error(`  - ${f.slug}: ${f.error}`);
    process.exitCode = 1;
  } else {
    console.log(`[record-demo] Hoàn tất toàn bộ ${clipsToRun.length} clip.`);
  }
}

if (process.argv.includes('--selfcheck')) {
  runSelfCheck();
} else {
  main().catch((err) => {
    console.error('[record-demo] Lỗi không mong muốn:', err);
    process.exit(1);
  });
}
