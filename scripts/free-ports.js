// Dọn các tiến trình cũ còn giữ cổng dev trước khi `npm run dev` khởi động lại.
// Chạy tự động qua npm "predev" hook (không có gì cần làm thì thoát êm, exit code luôn = 0).
import { execSync } from 'node:child_process';
import assert from 'node:assert';

const PORTS = [3001, 5173, 11235];

// Parse output của `netstat -ano` (Windows), trả về danh sách PID (số, duy nhất)
// đang LISTEN trên đúng `port` đó. Cột địa chỉ local phải kết thúc CHÍNH XÁC bằng ":port"
// (vd ":3001" không được khớp nhầm ":30010").
function pidsListening(netstatText, port) {
  const suffix = `:${port}`;
  const pids = new Set();
  for (const line of netstatText.split(/\r?\n/)) {
    if (!line.includes('LISTENING')) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 4) continue;
    const localAddress = parts[1];
    if (!localAddress || !localAddress.endsWith(suffix)) continue;
    const pid = Number(parts[parts.length - 1]);
    if (!Number.isInteger(pid) || pid === 0 || pid === process.pid) continue;
    pids.add(pid);
  }
  return [...pids];
}

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function freePortsWin32() {
  const netstatText = execSync('netstat -ano', { encoding: 'utf8' });
  const killedPids = new Set();
  for (const port of PORTS) {
    for (const pid of pidsListening(netstatText, port)) {
      if (killedPids.has(pid)) continue;
      try {
        execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
        killedPids.add(pid);
        console.log(`[free-ports] Đã tắt tiến trình cũ PID ${pid} đang giữ cổng ${port}`);
      } catch {
        // Tiến trình có thể đã tự thoát giữa lúc liệt kê và lúc kill - bỏ qua.
      }
    }
  }
  if (killedPids.size === 0) return;

  // Đợi tối đa ~3s cho hệ điều hành giải phóng cổng thật sự (taskkill là async).
  const busy = () => PORTS.some((port) => pidsListening(execSync('netstat -ano', { encoding: 'utf8' }), port).length > 0);
  for (let i = 0; i < 10 && busy(); i++) sleepMs(300);
}

function freePortsPosix() {
  for (const port of PORTS) {
    let output;
    try {
      output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: 'utf8' });
    } catch {
      continue;
    }
    const pids = output.split(/\s+/).filter(Boolean).map(Number).filter((pid) => pid && pid !== process.pid);
    for (const pid of pids) {
      try {
        process.kill(pid, 'SIGKILL');
        console.log(`[free-ports] Đã tắt tiến trình cũ PID ${pid} đang giữ cổng ${port}`);
      } catch {
        // Tiến trình có thể đã tự thoát giữa lúc liệt kê và lúc kill - bỏ qua.
      }
    }
  }
}

function runSelfCheck() {
  const sample = [
    'Proto  Local Address          Foreign Address        State           PID',
    'TCP    0.0.0.0:3001           0.0.0.0:0              LISTENING       111',
    'TCP    0.0.0.0:30010          0.0.0.0:0              LISTENING       222',
    'TCP    127.0.0.1:3001         0.0.0.0:0              ESTABLISHED     333',
    'TCP    [::]:3001              [::]:0                 LISTENING       111',
    'TCP    0.0.0.0:11235          0.0.0.0:0              LISTENING       444',
  ].join('\r\n');

  assert.deepStrictEqual(pidsListening(sample, 3001), [111]);
  assert.deepStrictEqual(pidsListening(sample, 11235), [444]);
  assert.deepStrictEqual(pidsListening(sample, 30010), [222]); // khong dinh sang :3001

  console.log('SELFCHECK OK');
}

function main() {
  try {
    if (process.platform === 'win32') freePortsWin32();
    else freePortsPosix();
  } catch {
    // Không bao giờ để lỗi ở đây chặn `npm run dev` khởi động.
  }
}

if (process.argv.includes('--selfcheck')) {
  runSelfCheck();
} else {
  main();
}
