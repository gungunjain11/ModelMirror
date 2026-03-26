import { useApp } from '@/contexts/AppContext';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TimelineView } from './views/TimelineView';
import { HeatmapView } from './views/HeatmapView';

function LogTab() {
  const { logs } = useApp();
  return (
    <div className="font-mono text-[11px] p-2 space-y-0.5 overflow-auto h-full bg-background">
      {logs.map(log => (
        <div key={log.id} className="animate-log-in flex gap-2 leading-5">
          <span className="text-muted-foreground/60 shrink-0">[{log.time}]</span>
          <span className="shrink-0">{log.icon}</span>
          <span className="text-foreground">{log.message}</span>
        </div>
      ))}
    </div>
  );
}

export function BottomDrawer() {
  const { drawerOpen, setDrawerOpen, drawerTab, setDrawerTab } = useApp();
  const tabs = [
    { id: 'log' as const, label: 'Log' },
    { id: 'timeline' as const, label: 'Timeline' },
    { id: 'heatmap' as const, label: 'Heatmap' },
  ];

  return (
    <div className="border-t border-border bg-card shrink-0 select-none" style={{ transition: 'max-height 0.25s ease' }}>
      {/* Toggle bar */}
      <div className="flex items-center justify-between px-3 h-7 cursor-pointer hover:bg-accent/50" onClick={() => setDrawerOpen(!drawerOpen)}>
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={e => { e.stopPropagation(); setDrawerTab(t.id); if (!drawerOpen) setDrawerOpen(true); }}
              className={`text-[10px] transition-colors ${drawerTab === t.id ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {drawerOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </div>

      {drawerOpen && (
        <div className="h-[150px] overflow-hidden">
          {drawerTab === 'log' && <LogTab />}
          {drawerTab === 'timeline' && <TimelineView />}
          {drawerTab === 'heatmap' && <HeatmapView />}
        </div>
      )}
    </div>
  );
}
