import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import NotionSyncModal from './components/NotionSyncModal';
import ProjectSelectorModal from './components/ProjectSelectorModal';
import ExecutiveResearchView from './views/ExecutiveResearchView';
import CompetitorVideoView from './views/CompetitorVideoView';
import ContentStrategyView from './views/ContentStrategyView';
import ContentCalendarView from './views/ContentCalendarView';
import NotionView from './views/NotionView';
import { 
  getAllProjects, 
  getActiveProjectId, 
  getProjectData, 
  saveProjectData 
} from './utils/projectManager';

export default function App() {
  const [activeTab, setActiveTab] = useState('all_in_one'); // Mặc định mở Form Tổng Hợp Tầng 1 cho Sếp
  const [currentModel, setCurrentModel] = useState(() => {
    try {
      return localStorage.getItem('marketing_selected_model') || 'gemini-3.6-flash';
    } catch {
      return 'gemini-3.6-flash';
    }
  });

  const handleModelChange = (modelId) => {
    setCurrentModel(modelId);
    try {
      localStorage.setItem('marketing_selected_model', modelId);
    } catch {}
  };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotionSyncOpen, setIsNotionSyncOpen] = useState(false);
  const [exportData, setExportData] = useState(null);

  const [activeProjectId, setActiveProjectId] = useState(() => getActiveProjectId());
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);

  const activeProjectName = (() => {
    const list = getAllProjects();
    const found = list.find((p) => p.id === activeProjectId);
    return found?.name || 'Dự án Nghiên cứu';
  })();

  const [toastMessage, setToastMessage] = useState('');

  // Shared research context & strategy across all views (nạp theo từng dự án)
  const [researchContext, setResearchContext] = useState(() => {
    const projData = getProjectData(getActiveProjectId());
    return projData.researchContext || {
      voc: null,
      search: null,
      competitor: null,
      offer: null,
      framing: null,
    };
  });

  const [strategyData, setStrategyData] = useState(() => {
    const projData = getProjectData(getActiveProjectId());
    return projData.strategyData || null;
  });

  const [calendarData, setCalendarData] = useState(() => {
    const projData = getProjectData(getActiveProjectId());
    return projData.calendarData || null;
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Chuyển đổi dự án
  const handleProjectSwitched = (newProjId) => {
    setActiveProjectId(newProjId);
    const pData = getProjectData(newProjId);
    const updatedCtx = pData.researchContext || {
      voc: null,
      search: null,
      competitor: null,
      offer: null,
      framing: null,
    };
    setResearchContext(updatedCtx);
    setStrategyData(pData.strategyData || null);
    setCalendarData(pData.calendarData || null);

    // Đồng bộ legacy keys
    try {
      localStorage.setItem('marketing_research_context', JSON.stringify(updatedCtx));
      localStorage.setItem('marketing_brand_strategy', JSON.stringify(pData.strategyData || null));
      localStorage.setItem('marketing_content_calendar', JSON.stringify(pData.calendarData || null));
    } catch {}

    const list = getAllProjects();
    const found = list.find((p) => p.id === newProjId);
    showToast(`Đã chuyển sang dự án: "${found?.name || 'Mới'}"`);
  };

  const handleSaveAllResearch = (analyzed, formData) => {
    setResearchContext((prev) => {
      const updated = {
        ...prev,
        executive: analyzed,
        framing: {
          formData: {
            goal: analyzed.framing?.clarifiedGoal || formData?.businessGoal || '',
            facts: (analyzed.framing?.solidFacts || []).join('\n'),
            hypotheses: (analyzed.framing?.hypotheses || []).join('\n'),
            questions: (analyzed.framing?.criticalQuestions || []).join('\n'),
          },
          parsedResult: analyzed.framing,
        },
        search: {
          rawText: (analyzed.search?.intentClusters || []).map(c => `${c.theme}: ${(c.questions || []).join(', ')}`).join('\n'),
          parsedResult: analyzed.search,
          intentClusters: analyzed.search?.intentClusters,
        },
        voc: {
          rawText: formData?.customerPainRaw || '',
          parsedResult: analyzed.voc,
          painPoints: analyzed.voc?.painPoints,
          objections: analyzed.voc?.objections,
          desires: analyzed.voc?.desires,
          buyingTriggers: analyzed.voc?.buyingTriggers,
        },
        competitor: {
          rawText: formData?.competitorAndOffer || '',
          parsedResult: analyzed.competitor,
          winningFormats: analyzed.competitor?.winningFormats,
          blueOceanAngles: analyzed.competitor?.blueOceanAngles,
        },
        offer: {
          rawText: formData?.competitorAndOffer || '',
          parsedResult: analyzed.offer,
          improvedOfferIdea: analyzed.offer?.improvedOfferIdea,
        },
      };
      try {
        localStorage.setItem('marketing_research_context', JSON.stringify(updated));
      } catch {}
      saveProjectData(activeProjectId, {
        researchContext: updated,
        strategyData,
        calendarData,
      });
      return updated;
    });
    showToast('Đã phân tích và đồng bộ thành công toàn bộ 5 nhánh Tầng 1!');
  };

  const handleSaveCompetitorVideos = (analyzed, payload) => {
    setResearchContext((prev) => {
      const updated = {
        ...prev,
        competitorVideo: analyzed,
        competitor: {
          rawText: payload?.targetIndustry ? `Ngành: ${payload.targetIndustry}\nSố lượng link: ${payload.detectedCount || 0}` : '',
          parsedResult: analyzed,
          winningFormats: (analyzed?.clusters || []).map(c => `${c.clusterName} (${c.percentage}): ${c.characteristics}`),
          blueOceanAngles: analyzed?.strategicReport?.blueOceanScriptGaps || [],
        },
      };
      try {
        localStorage.setItem('marketing_research_context', JSON.stringify(updated));
      } catch {}
      saveProjectData(activeProjectId, {
        researchContext: updated,
        strategyData,
        calendarData,
      });
      return updated;
    });
    showToast('Đã lưu dữ liệu Tình báo Video Đối thủ vào Tầng 1 và đồng bộ sang Chiến lược!');
  };

  const handleSaveStrategy = (newStrategy) => {
    setStrategyData(newStrategy);
    try {
      localStorage.setItem('marketing_brand_strategy', JSON.stringify(newStrategy));
    } catch {}
    saveProjectData(activeProjectId, {
      researchContext,
      strategyData: newStrategy,
      calendarData,
    });
    showToast('Đã cập nhật và lưu Chiến lược Nội dung thành công!');
  };

  const handleSaveCalendar = (newCalendar) => {
    setCalendarData(newCalendar);
    try {
      localStorage.setItem('marketing_content_calendar', JSON.stringify(newCalendar));
    } catch {}
    saveProjectData(activeProjectId, {
      researchContext,
      strategyData,
      calendarData: newCalendar,
    });
    showToast('Đã cập nhật Lịch Nội dung Đa kênh thành công!');
  };

  const [config, setConfig] = useState({
    hasOpenAI: false,
    hasClaude: false,
    hasGemini: false,
    hasNineRouter: false,
    hasNotion: false,
    notionParentId: '',
    defaultProvider: 'gemini',
    defaultModel: 'gemini-3.6-flash',
  });

  const fetchConfig = () => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        if (data.defaultModel) {
          setCurrentModel(data.defaultModel);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSyncToNotion = (moduleName, rawData, analysisJson) => {
    setExportData({
      moduleName,
      title: `${moduleName} - ${new Date().toLocaleDateString('vi-VN')}`,
      rawData,
      analysisJson,
    });
    setIsNotionSyncOpen(true);
  };

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col antialiased overflow-hidden">
      {/* Top Header */}
      <Header
        config={config}
        currentModel={currentModel}
        onModelChange={handleModelChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          onSelectTab={setActiveTab} 
          activeProjectName={activeProjectName}
          onOpenProjectSelector={() => setIsProjectSelectorOpen(true)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 min-h-0">
          {activeTab === 'all_in_one' && (
            <ExecutiveResearchView
              currentModel={currentModel}
              researchContext={researchContext}
              onSaveAllResearch={handleSaveAllResearch}
              onNavigateToStrategy={() => setActiveTab('strategy')}
              onNavigateToCompetitor={() => setActiveTab('competitor_videos')}
              onSyncToNotion={handleSyncToNotion}
            />
          )}
          {activeTab === 'competitor_videos' && (
            <CompetitorVideoView
              currentModel={currentModel}
              researchContext={researchContext}
              onSaveCompetitorData={handleSaveCompetitorVideos}
              onNavigateToStrategy={() => setActiveTab('strategy')}
              onSyncToNotion={handleSyncToNotion}
            />
          )}
          {activeTab === 'strategy' && (
            <ContentStrategyView 
              currentModel={currentModel}
              researchContext={researchContext}
              strategyData={strategyData || null}
              onSaveStrategy={handleSaveStrategy}
              onSyncToNotion={handleSyncToNotion}
              onNavigateToCalendar={() => setActiveTab('calendar')}
            />
          )}
          {activeTab === 'calendar' && (
            <ContentCalendarView 
              currentModel={currentModel}
              researchContext={researchContext}
              strategyData={strategyData || null}
              calendarData={calendarData || null}
              onSaveCalendar={handleSaveCalendar}
              onSyncToNotion={handleSyncToNotion}
            />
          )}
          {activeTab === 'notion' && (
            <NotionView config={config} onOpenSettings={() => setIsSettingsOpen(true)} />
          )}
        </main>
      </div>

      {/* In-app Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-slate-400 hover:text-white text-sm leading-none cursor-pointer">✕</button>
        </div>
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigUpdated={fetchConfig}
      />

      <NotionSyncModal
        isOpen={isNotionSyncOpen}
        onClose={() => setIsNotionSyncOpen(false)}
        exportData={exportData}
        config={config}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <ProjectSelectorModal
        isOpen={isProjectSelectorOpen}
        onClose={() => setIsProjectSelectorOpen(false)}
        onProjectSwitched={handleProjectSwitched}
      />
    </div>
  );
}

