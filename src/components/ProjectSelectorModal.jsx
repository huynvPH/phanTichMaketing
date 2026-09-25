import React, { useState, useRef } from 'react';
import { 
  FolderGit2, 
  Plus, 
  Check, 
  Trash2, 
  Download, 
  Upload, 
  Edit3, 
  X, 
  FolderCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { 
  getAllProjects, 
  getActiveProjectId, 
  setActiveProjectId, 
  createProject, 
  renameProject, 
  deleteProject, 
  exportProjectToFile, 
  importProjectFromFile 
} from '../utils/projectManager';

export default function ProjectSelectorModal({ onClose, onProjectSwitched }) {
  const [projects, setProjects] = useState(() => getAllProjects());
  const [activeId, setActiveId] = useState(() => getActiveProjectId());
  const [newProjectName, setNewProjectName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const refreshList = () => {
    setProjects(getAllProjects());
    setActiveId(getActiveProjectId());
  };

  const handleSelect = (id) => {
    setActiveProjectId(id);
    setActiveId(id);
    onProjectSwitched?.(id);
    onClose();
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      const created = createProject(newProjectName.trim());
      setNewProjectName('');
      refreshList();
      onProjectSwitched?.(created.id);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleStartRename = (proj, e) => {
    e.stopPropagation();
    setEditingId(proj.id);
    setEditingName(proj.name);
  };

  const handleSaveRename = (id, e) => {
    e.stopPropagation();
    if (editingName.trim()) {
      renameProject(id, editingName.trim());
      setEditingId(null);
      refreshList();
      if (id === activeId) {
        onProjectSwitched?.(id);
      }
    }
  };

  const handleDelete = (id, name, e) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc chắn muốn xóa dự án "${name}"? Thao tác này sẽ xóa toàn bộ nghiên cứu của dự án này!`)) {
      try {
        const nextActive = deleteProject(id);
        refreshList();
        onProjectSwitched?.(nextActive);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleExport = (id, e) => {
    e.stopPropagation();
    exportProjectToFile(id);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content === 'string') {
          const imported = importProjectFromFile(content);
          refreshList();
          onProjectSwitched?.(imported.id);
          alert(`Đã nhập thành công dự án: "${imported.name}"!`);
          onClose();
        }
      } catch (err) {
        alert(`Lỗi khi nhập file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Quản Lý Dự Án & Thương Hiệu</h2>
              <p className="text-xs text-slate-500">Chuyển đổi, tạo mới hoặc sao lưu toàn bộ dữ liệu nghiên cứu từng nhãn hàng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create New Project Bar */}
        <div className="p-6 border-b border-slate-100 bg-white">
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập tên dự án hoặc thương hiệu mới (VD: Mỹ phẩm Trị Mụn X, Khóa học Anh ngữ Y)..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
            />
            <button
              type="submit"
              disabled={!newProjectName.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer shadow-sm shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              Tạo Dự Án Mới
            </button>
          </form>
          {errorMsg && <p className="text-xs text-red-500 mt-2">{errorMsg}</p>}
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            <span>Danh sách dự án ({projects.length})</span>
            <span>Hành động</span>
          </div>

          {projects.map((proj) => {
            const isActive = proj.id === activeId;
            const isEditing = proj.id === editingId;

            return (
              <div
                key={proj.id}
                onClick={() => !isEditing && handleSelect(proj.id)}
                className={`group p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500/30'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isActive ? <FolderCheck className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="px-2.5 py-1 text-sm border border-indigo-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          autoFocus
                        />
                        <button
                          onClick={(e) => handleSaveRename(proj.id, e)}
                          className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                          title="Lưu tên"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(null);
                          }}
                          className="p-1 rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300 text-xs"
                          title="Hủy"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-800 text-sm truncate">{proj.name}</h4>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-indigo-100 text-indigo-700">
                              Đang chọn
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 inline" />
                          Cập nhật: {new Date(proj.updatedAt || proj.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 shrink-0">
                  <button
                    onClick={(e) => handleStartRename(proj, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                    title="Đổi tên dự án"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleExport(proj.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                    title="Xuất file sao lưu (.json)"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {projects.length > 1 && (
                    <button
                      onClick={(e) => handleDelete(proj.id, proj.name, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                      title="Xóa dự án này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Backup Import */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              Nhập dự án từ file (.json)
            </button>
            <span className="text-slate-400 hidden sm:inline">Phục hồi hoặc chia sẻ nghiên cứu với đồng nghiệp</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
