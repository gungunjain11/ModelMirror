import { useApp, type View } from '@/contexts/AppContext';
import { FileText, MessageSquare, BarChart3, GitCompare, Settings, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems: { icon: typeof FileText; label: string; view: View }[] = [
  { icon: FileText, label: 'Editor', view: 'editor' },
  { icon: MessageSquare, label: 'AI Chat', view: 'chat' },
  { icon: BarChart3, label: 'Analytics', view: 'analytics' },
  { icon: GitCompare, label: 'Diff Viewer', view: 'diff' },
  { icon: Settings, label: 'Settings', view: 'settings' },
];

function AnimatedCounter({ target, suffix = '' }: { target: number | string; suffix?: string }) {
  const [value, setValue] = useState(0);
  const numTarget = typeof target === 'string' ? parseInt(target) || 0 : target;

  useEffect(() => {
    let frame: number;
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * numTarget));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [numTarget]);

  return <span className="animate-count-up">{typeof target === 'string' && target.startsWith('~') ? '~' : ''}{value}{suffix}</span>;
}

export function LeftSidebar() {
  const { sidebarOpen, files, activeFileIndex, setActiveFileIndex, activeView, setActiveView, addNewFile, deleteFile } = useApp();
  const [newFileName, setNewFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      addNewFile(newFileName);
      setNewFileName('');
      setIsCreating(false);
    }
  };

  if (!sidebarOpen) return null;

  return (
    <div className="w-[220px] shrink-0 border-r border-border bg-card flex flex-col h-full select-none overflow-hidden transition-all duration-200">
      {/* File tree */}
      <div className="p-2 flex-1 overflow-auto">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Explorer</div>
          <button
            onClick={() => setIsCreating(true)}
            title="New file"
            className="p-1 rounded hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <Plus size={12} />
          </button>
        </div>

        {isCreating && (
          <div className="px-2 py-1.5 rounded-sm bg-accent/50 border border-primary mb-1">
            <input
              autoFocus
              type="text"
              placeholder="filename.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') {
                  setNewFileName('');
                  setIsCreating(false);
                }
              }}
              className="w-full text-xs font-mono bg-transparent outline-none border-none text-foreground placeholder-muted-foreground"
            />
          </div>
        )}

        {files.map((f, i) => (
          <div
            key={`${f.name}-${i}`}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs font-mono rounded-sm transition-colors group ${
              i === activeFileIndex && activeView === 'editor'
                ? 'bg-accent border-l-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 border-l-2 border-transparent'
            }`}
          >
            <button
              onClick={() => {
                setActiveFileIndex(i);
                setActiveView('editor');
              }}
              className="flex-1 flex items-center gap-2 text-left hover:text-foreground transition-colors"
            >
              <FileText size={12} className="shrink-0 opacity-50" />
              <span className="truncate">{f.name}</span>
            </button>
            <button
              onClick={() => deleteFile(i)}
              title="Delete file"
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-mm-red/20 text-mm-red transition-all"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* Nav icons */}
      <div className="border-t border-border p-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1.5">Navigation</div>
        {navItems.map(item => (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            title={item.label}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm transition-colors ${
              activeView === item.view
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            <item.icon size={14} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Session stats */}
      <div className="border-t border-border p-2 space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1">Stats</div>
        {[
          { label: 'Stuck events', value: 7 },
          { label: 'Suggestions accepted', value: 5 },
          { label: 'Time saved', value: 20, prefix: '~', suffix: ' mins' },
          { label: 'Session', value: 42, suffix: ' mins' },
        ].map(stat => (
          <div key={stat.label} className="flex items-center justify-between px-2 py-1 rounded bg-accent/50 text-[11px]">
            <span className="text-muted-foreground">{stat.label}</span>
            <span className="font-mono font-semibold text-foreground">
              {stat.prefix || ''}<AnimatedCounter target={stat.value} suffix={stat.suffix || ''} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
