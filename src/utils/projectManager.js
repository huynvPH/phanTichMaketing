/**
 * Quản lý đa dự án / Brand Workspace cho Marketing AI Research Hub
 */

const STORAGE_KEY_PROJECTS = 'marketing_projects_list';
const STORAGE_KEY_ACTIVE_ID = 'marketing_active_project_id';
const PROJECT_DATA_PREFIX = 'marketing_proj_data_';

// Dữ liệu rỗng mặc định cho 1 dự án nghiên cứu
export const EMPTY_PROJECT_DATA = {
  voc: null,
  search: null,
  competitor: null,
  offer: null,
  framing: null,
};

// Đọc JSON an toàn từ localStorage, trả về fallback nếu lỗi/không có
export function readLS(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Ghi JSON an toàn vào localStorage
export function writeLS(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

// Tạo file để tải về (JSON, Markdown, CSV...)
export function downloadFile(filename, content, mime = 'application/json') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Khởi tạo mặc định nếu chưa có
function initDefaultProjectIfEmpty() {
  if (!readLS(STORAGE_KEY_PROJECTS)) {
    const defaultProject = {
      id: 'default',
      name: 'Dự án Nghiên cứu Chính',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeLS(STORAGE_KEY_PROJECTS, [defaultProject]);
    writeLS(STORAGE_KEY_ACTIVE_ID, 'default');
    writeLS(`${PROJECT_DATA_PREFIX}default`, {
      researchContext: readLS('marketing_research_context', EMPTY_PROJECT_DATA),
      strategyData: readLS('marketing_brand_strategy', null),
      calendarData: readLS('marketing_content_calendar', null),
      executiveForm: readLS('marketing_executive_form', null),
    });
  }
}

// Lấy danh sách tất cả dự án
export function getAllProjects() {
  initDefaultProjectIfEmpty();
  return readLS(STORAGE_KEY_PROJECTS, []);
}

// Lấy ID dự án đang hoạt động
export function getActiveProjectId() {
  initDefaultProjectIfEmpty();
  return readLS(STORAGE_KEY_ACTIVE_ID, 'default');
}

// Đổi dự án hoạt động
export function setActiveProjectId(id) {
  writeLS(STORAGE_KEY_ACTIVE_ID, id);
}

// Lấy toàn bộ dữ liệu của 1 dự án
export function getProjectData(projectId) {
  initDefaultProjectIfEmpty();
  const id = projectId || getActiveProjectId();
  return readLS(`${PROJECT_DATA_PREFIX}${id}`, {
    researchContext: EMPTY_PROJECT_DATA,
    strategyData: null,
    calendarData: null,
    executiveForm: null,
  });
}

// Lưu dữ liệu cho 1 dự án
export function saveProjectData(projectId, data) {
  const id = projectId || getActiveProjectId();
  writeLS(`${PROJECT_DATA_PREFIX}${id}`, data);
  const list = getAllProjects();
  const target = list.find((p) => p.id === id);
  if (target) {
    target.updatedAt = new Date().toISOString();
    writeLS(STORAGE_KEY_PROJECTS, list);
  }
}

// Tạo dự án mới
export function createProject(name, initialData = null) {
  const list = getAllProjects();
  const newId = `proj_${Date.now()}`;
  const newProject = {
    id: newId,
    name: name.trim() || `Dự án mới ${list.length + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  list.push(newProject);
  writeLS(STORAGE_KEY_PROJECTS, list);
  writeLS(STORAGE_KEY_ACTIVE_ID, newId);
  writeLS(`${PROJECT_DATA_PREFIX}${newId}`, initialData || {
    researchContext: EMPTY_PROJECT_DATA,
    strategyData: null,
    calendarData: null,
    executiveForm: null,
  });
  return newProject;
}

// Đổi tên dự án
export function renameProject(id, newName) {
  const list = getAllProjects();
  const target = list.find((p) => p.id === id);
  if (target) {
    target.name = newName.trim() || target.name;
    target.updatedAt = new Date().toISOString();
    writeLS(STORAGE_KEY_PROJECTS, list);
    return true;
  }
  return false;
}

// Xóa dự án (không xóa nếu chỉ còn 1 dự án)
export function deleteProject(id) {
  const list = getAllProjects();
  if (list.length <= 1) {
    throw new Error('Không thể xóa dự án duy nhất còn lại.');
  }

  const updatedList = list.filter((p) => p.id !== id);
  writeLS(STORAGE_KEY_PROJECTS, updatedList);
  try {
    localStorage.removeItem(`${PROJECT_DATA_PREFIX}${id}`);
  } catch {}

  const currentActive = getActiveProjectId();
  if (currentActive === id) {
    setActiveProjectId(updatedList[0].id);
    return updatedList[0].id;
  }
  return currentActive;
}

// Gọi API lấy danh sách Trang/Database Notion được cấp quyền
export async function fetchNotionTargets() {
  try {
    const res = await fetch('/api/notion/targets');
    const data = await res.json();
    return data.success && data.targets ? data.targets : [];
  } catch {
    return [];
  }
}

// Xuất dữ liệu dự án ra file JSON tải về
export function exportProjectToFile(id) {
  const list = getAllProjects();
  const target = list.find((p) => p.id === id) || { id, name: 'Marketing_Project' };
  const data = getProjectData(id);

  const payload = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    projectInfo: target,
    data,
  };

  const safeName = target.name.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
  downloadFile(`${safeName}_marketing_backup.json`, JSON.stringify(payload, null, 2));
}

// Nhập dữ liệu dự án từ file JSON
export function importProjectFromFile(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.data) {
      throw new Error('Định dạng file sao lưu không hợp lệ (thiếu trường data).');
    }

    const origName = parsed.projectInfo?.name || 'Dự án Nhập từ File';
    const newProject = createProject(`${origName} (Nhập mới)`, parsed.data);
    return newProject;
  } catch (err) {
    throw new Error(`Không thể nhập dữ liệu: ${err.message}`);
  }
}
