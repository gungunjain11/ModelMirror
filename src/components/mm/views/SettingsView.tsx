import { useApp } from '@/contexts/AppContext';

const shortcuts = [
  { keys: 'Ctrl+M', action: 'Trigger stuck detection demo' },
  { keys: 'Ctrl+E', action: 'Explain current function' },
  { keys: 'Ctrl+/', action: 'Toggle line comment' },
  { keys: 'Ctrl+F', action: 'Find in file' },
  { keys: 'Escape', action: 'Close/dismiss' },
];

export function SettingsView() {
  const { fontSize, setFontSize, idleThreshold, setIdleThreshold, showMinimap, setShowMinimap, showLineHighlight, setShowLineHighlight, isDark, toggleTheme } = useApp();

  return (
    <div className="p-6 space-y-6 overflow-auto h-full max-w-lg">
      <h2 className="text-sm font-semibold text-foreground">Settings</h2>

      {/* Stuck Detection */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium text-foreground">Stuck Detection</h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Idle threshold</span>
            <span className="font-mono text-foreground">{idleThreshold}s</span>
          </label>
          <input type="range" min={10} max={60} value={idleThreshold} onChange={e => setIdleThreshold(+e.target.value)} className="w-full accent-primary h-1" />

          <label className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Backspace threshold</span>
            <span className="font-mono text-foreground">6</span>
          </label>
          <input type="range" min={3} max={15} defaultValue={6} className="w-full accent-primary h-1" />

          <label className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Cooldown</span>
            <span className="font-mono text-foreground">45s</span>
          </label>
          <input type="range" min={15} max={120} defaultValue={45} className="w-full accent-primary h-1" />
        </div>
      </section>

      {/* Editor */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium text-foreground">Editor</h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Font size</span>
            <span className="font-mono text-foreground">{fontSize}px</span>
          </label>
          <input type="range" min={12} max={18} value={fontSize} onChange={e => setFontSize(+e.target.value)} className="w-full accent-primary h-1" />

          <label className="flex items-center justify-between text-[11px] cursor-pointer">
            <span className="text-muted-foreground">Line highlight</span>
            <input type="checkbox" checked={showLineHighlight} onChange={e => setShowLineHighlight(e.target.checked)} className="accent-primary" />
          </label>

          <label className="flex items-center justify-between text-[11px] cursor-pointer">
            <span className="text-muted-foreground">Minimap</span>
            <input type="checkbox" checked={showMinimap} onChange={e => setShowMinimap(e.target.checked)} className="accent-primary" />
          </label>
        </div>
      </section>

      {/* Theme */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium text-foreground">Theme</h3>
        <div className="flex gap-2">
          {['Dark', 'Light'].map(t => (
            <button
              key={t}
              onClick={toggleTheme}
              className={`flex-1 py-1.5 text-[11px] rounded transition-colors ${
                (t === 'Dark' && isDark) || (t === 'Light' && !isDark)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Shortcuts */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium text-foreground">Keyboard Shortcuts</h3>
        <div className="space-y-1">
          {shortcuts.map(s => (
            <div key={s.keys} className="flex items-center justify-between text-[11px] py-1">
              <kbd className="font-mono text-foreground bg-accent px-1.5 py-0.5 rounded text-[10px]">{s.keys}</kbd>
              <span className="text-muted-foreground">{s.action}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
