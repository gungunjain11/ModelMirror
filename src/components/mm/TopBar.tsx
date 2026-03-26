import { useApp } from '@/contexts/AppContext';
import { Play, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';

export function TopBar() {
  const { demoStatus, runDemo, isDark, toggleTheme, files, activeFileIndex, setActiveFileIndex, sidebarOpen, setSidebarOpen } = useApp();

  const statusConfig = {
    idle: { label: '● Watching', className: 'text-mm-green animate-pulse-slow' },
    watching: { label: '● Watching', className: 'text-mm-green animate-pulse-slow' },
    'stuck-detected': { label: '◉ Stuck detected — idle signal', className: 'text-mm-amber' },
    fetching: { label: '↻ Fetching suggestion...', className: 'text-mm-accent animate-spin-slow' },
  };

  const status = statusConfig[demoStatus];

  return (
    <div className="h-11 flex items-center justify-between border-b border-border bg-card px-3 shrink-0 select-none">
      <div className="flex items-center gap-3">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded hover:bg-accent transition-colors">
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
        <span className="font-mono font-bold text-sm tracking-tight">
          <span className="text-primary">Model</span>
          <span className="text-foreground">Mirror</span>
        </span>
        <div className="h-4 w-px bg-border mx-1" />
        {/* File tabs */}
        <div className="flex items-center gap-0.5">
          {files.map((f, i) => (
            <button
              key={f.name}
              onClick={() => setActiveFileIndex(i)}
              className={`px-2.5 py-1 text-xs font-mono rounded-sm transition-colors ${
                i === activeFileIndex
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language badge */}
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent text-muted-foreground">
          {files[activeFileIndex].language}
        </span>

        {/* API Connected pill */}
        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-mm-green/10 text-mm-green border border-mm-green/20">
          <span className="w-1.5 h-1.5 rounded-full bg-mm-green" />
          API Connected
        </span>

        {/* Status pill */}
        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border border-border ${status.className}`}>
          {status.label}
        </span>

        {/* Trigger button */}
        <button
          onClick={runDemo}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.97]"
        >
          <Play size={10} /> Replay Demo
        </button>

        {/* Theme toggle */}
        <button onClick={toggleTheme} className="p-1.5 rounded hover:bg-accent transition-colors">
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </div>
  );
}
