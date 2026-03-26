import { useEffect } from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { TopBar } from '@/components/mm/TopBar';
import { LeftSidebar } from '@/components/mm/LeftSidebar';
import { CodeEditor } from '@/components/mm/CodeEditor';
import { RightPanel } from '@/components/mm/RightPanel';
import { BottomDrawer } from '@/components/mm/BottomDrawer';
import { AnalyticsView } from '@/components/mm/views/AnalyticsView';
import { DiffView } from '@/components/mm/views/DiffView';
import { SettingsView } from '@/components/mm/views/SettingsView';

function AppLayout() {
  const { activeView, runDemo, setRightTab } = useApp();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'm') { e.preventDefault(); runDemo(); }
      if (e.ctrlKey && e.key === 'e') { e.preventDefault(); setRightTab('explain'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [runDemo, setRightTab]);

  const renderCenter = () => {
    switch (activeView) {
      case 'analytics': return <AnalyticsView />;
      case 'diff': return <DiffView />;
      case 'settings': return <SettingsView />;
      case 'chat':
        // Switch to editor view but open chat tab in right panel
        return <CodeEditor />;
      default: return <CodeEditor />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {renderCenter()}
            {(activeView === 'editor' || activeView === 'chat') && <RightPanel />}
          </div>
          <BottomDrawer />
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}
