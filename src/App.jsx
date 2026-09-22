import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import NotionSyncModal from './components/NotionSyncModal';
import FramingView from './views/FramingView';
import SearchDemandView from './views/SearchDemandView';
import VocView from './views/VocView';
import CompetitorView from './views/CompetitorView';
import OfferView from './views/OfferView';
import ContentStrategyView from './views/ContentStrategyView';
import ContentCalendarView from './views/ContentCalendarView';
import NotionView from './views/NotionView';

export default function App() {
  const [activeTab, setActiveTab] = useState('voc'); // Default to Voice of Customer
  const [currentModel, setCurrentModel] = useState('gemini-2.5-flash');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotionSyncOpen, setIsNotionSyncOpen] = useState(false);
  const [exportData, setExportData] = useState(null);

  const [toastMessage, setToastMessage] = useState('');

  // Shared research context & strategy across all views (Mặc định để trống sạch sẽ)
  const [researchContext, setResearchContext] = useState(() => {
    try {
      const saved = localStorage.getItem('marketing_research_context');
      return saved ? JSON.parse(saved) : {
        voc: null,
        search: null,
        competitor: null,
        offer: null,
        framing: null,
      };
    } catch {
      return {
        voc: null,
        search: null,
        competitor: null,
        offer: null,
        framing: null,
      };
    }
  });

  const [strategyData, setStrategyData] = useState(() => {
    try {
      const saved = localStorage.getItem('marketing_brand_strategy');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [calendarData, setCalendarData] = useState(() => {
    try {
      const saved = localStorage.getItem('marketing_content_calendar');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const handleUpdateResearch = (moduleName, data) => {
    setResearchContext((prev) => {
      const updated = { ...prev, [moduleName]: data };
      try {
        localStorage.setItem('marketing_research_context', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSaveStrategy = (newStrategy) => {
    setStrategyData(newStrategy);
    try {
      localStorage.setItem('marketing_brand_strategy', JSON.stringify(newStrategy));
    } catch {}
    showToast('Đã cập nhật và lưu Chiến lược Nội dung thành công!');
  };

  const handleSaveCalendar = (newCalendar) => {
    setCalendarData(newCalendar);
    try {
      localStorage.setItem('marketing_content_calendar', JSON.stringify(newCalendar));
    } catch {}
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
    defaultModel: 'gemini-2.5-flash',
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Header */}
      <Header
        config={config}
        currentModel={currentModel}
        onModelChange={setCurrentModel}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === 'framing' && (
            <FramingView 
              currentModel={currentModel} 
              onSyncToNotion={handleSyncToNotion} 
              onSaveResult={(res) => handleUpdateResearch('framing', { ...(researchContext?.framing || {}), parsedResult: res })}
              onSaveFormData={(form) => handleUpdateResearch('framing', { ...(researchContext?.framing || {}), formData: form })}
              initialData={researchContext?.framing?.formData || null}
              initialResult={researchContext?.framing?.parsedResult || null}
            />
          )}
          {activeTab === 'search' && (
            <SearchDemandView 
              currentModel={currentModel} 
              onSyncToNotion={handleSyncToNotion}
              onSaveResult={(res) => handleUpdateResearch('search', { ...(researchContext?.search || {}), parsedResult: res })}
              onSaveRawText={(txt) => handleUpdateResearch('search', { ...(researchContext?.search || {}), rawText: txt })}
              initialData={researchContext?.search?.rawText || ''}
              initialResult={researchContext?.search?.parsedResult || null}
            />
          )}
          {activeTab === 'voc' && (
            <VocView 
              currentModel={currentModel} 
              onSyncToNotion={handleSyncToNotion} 
              onSaveResult={(res) => handleUpdateResearch('voc', { ...(researchContext?.voc || {}), parsedResult: res })}
              initialData={researchContext?.voc?.rawText || ''}
              initialResult={researchContext?.voc?.parsedResult || null}
            />
          )}
          {activeTab === 'competitor' && (
            <CompetitorView 
              currentModel={currentModel} 
              onSyncToNotion={handleSyncToNotion} 
              onSaveResult={(res) => handleUpdateResearch('competitor', { ...(researchContext?.competitor || {}), parsedResult: res })}
              onSaveRawText={(txt) => handleUpdateResearch('competitor', { ...(researchContext?.competitor || {}), rawText: txt })}
              initialData={researchContext?.competitor?.rawText || ''}
              initialResult={researchContext?.competitor?.parsedResult || null}
            />
          )}
          {activeTab === 'offer' && (
            <OfferView 
              currentModel={currentModel} 
              onSyncToNotion={handleSyncToNotion} 
              onSaveResult={(res) => handleUpdateResearch('offer', { ...(researchContext?.offer || {}), parsedResult: res })}
              onSaveRawText={(txt) => handleUpdateResearch('offer', { ...(researchContext?.offer || {}), rawText: txt })}
              initialData={researchContext?.offer?.rawText || ''}
              initialResult={researchContext?.offer?.parsedResult || null}
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
    </div>
  );
}

