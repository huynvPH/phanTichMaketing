/**
 * Gọi API lấy danh sách Trang/Database Notion mà Integration đang được cấp quyền
 */
export async function fetchNotionTargets() {
  try {
    const res = await fetch('/api/notion/targets');
    const data = await res.json();
    return data.success && data.targets ? data.targets : [];
  } catch {
    return [];
  }
}
