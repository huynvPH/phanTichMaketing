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
  try {
    const listRaw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!listRaw) {
      // Đọc dữ liệu cũ nếu có để không bị mất dữ liệu hiện tại
      let legacyResearch = null;
      let legacyStrategy = null;
      let legacyCalendar = null;
      let legacyExecForm = null;

      try {
        const r = localStorage.getItem('marketing_research_context');
        if (r) legacyResearch = JSON.parse(r);
        const s = localStorage.getItem('marketing_brand_strategy');
        if (s) legacyStrategy = JSON.parse(s);
        const c = localStorage.getItem('marketing_content_calendar');
        if (c) legacyCalendar = JSON.parse(c);
        const ef = localStorage.getItem('marketing_executive_form');
        if (ef) legacyExecForm = JSON.parse(ef);
      } catch {}

      const defaultProject = {
        id: 'default',
        name: 'Dự án Nghiên cứu Chính',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify([defaultProject]));
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, 'default');

      const initialData = {
        researchContext: legacyResearch || EMPTY_PROJECT_DATA,
        strategyData: legacyStrategy || null,
        calendarData: legacyCalendar || null,
        executiveForm: legacyExecForm || null,
      };

      localStorage.setItem(`${PROJECT_DATA_PREFIX}default`, JSON.stringify(initialData));
    }
  } catch (e) {
    console.error('Lỗi khởi tạo danh sách dự án:', e);
  }
}

// Lấy danh sách tất cả dự án
export function getAllProjects() {
  initDefaultProjectIfEmpty();
  try {
    const list = localStorage.getItem(STORAGE_KEY_PROJECTS);
    return list ? JSON.parse(list) : [];
  } catch {
    return [];
  }
}

// Lấy ID dự án đang hoạt động
export function getActiveProjectId() {
  initDefaultProjectIfEmpty();
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID) || 'default';
  } catch {
    return 'default';
  }
}

// Đổi dự án hoạt động
export function setActiveProjectId(id) {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch {}
}

// Lấy toàn bộ dữ liệu của 1 dự án
export function getProjectData(projectId) {
  initDefaultProjectIfEmpty();
  const id = projectId || getActiveProjectId();
  try {
    const raw = localStorage.getItem(`${PROJECT_DATA_PREFIX}${id}`);
    if (raw) return JSON.parse(raw);
  } catch {}

  return {
    researchContext: EMPTY_PROJECT_DATA,
    strategyData: null,
    calendarData: null,
    executiveForm: null,
  };
}

// Lưu dữ liệu cho 1 dự án
export function saveProjectData(projectId, data) {
  const id = projectId || getActiveProjectId();
  try {
    localStorage.setItem(`${PROJECT_DATA_PREFIX}${id}`, JSON.stringify(data));
    
    // Cập nhật updatedAt trong danh sách
    const list = getAllProjects();
    const idx = list.findIndex((p) => p.id === id);
    if (idx !== -1) {
      list[idx].updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Lỗi khi lưu dữ liệu dự án:', e);
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
  localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(list));
  localStorage.setItem(STORAGE_KEY_ACTIVE_ID, newId);

  const emptyData = initialData || {
    researchContext: EMPTY_PROJECT_DATA,
    strategyData: null,
    calendarData: null,
    executiveForm: null,
  };

  localStorage.setItem(`${PROJECT_DATA_PREFIX}${newId}`, JSON.stringify(emptyData));
  return newProject;
}

// Đổi tên dự án
export function renameProject(id, newName) {
  const list = getAllProjects();
  const target = list.find((p) => p.id === id);
  if (target) {
    target.name = newName.trim() || target.name;
    target.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(list));
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
  localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updatedList));
  localStorage.removeItem(`${PROJECT_DATA_PREFIX}${id}`);

  // Nếu xóa đúng dự án đang active thì chuyển sang dự án đầu tiên
  const currentActive = getActiveProjectId();
  if (currentActive === id) {
    setActiveProjectId(updatedList[0].id);
    return updatedList[0].id;
  }
  return currentActive;
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
