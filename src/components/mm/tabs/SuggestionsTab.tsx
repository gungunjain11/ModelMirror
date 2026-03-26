import { useApp } from '@/contexts/AppContext';
import { Check, X } from 'lucide-react';

export function SuggestionsTab() {
  const { suggestions, dismissSuggestion } = useApp();
  const visible = suggestions.filter(s => s.status !== 'dismissed');
  const history = [
    { time: '2 min ago', title: 'Add null check on response.data', accepted: true },
    { time: '5 min ago', title: 'Use optional chaining for nested access', accepted: true },
    { time: '8 min ago', title: 'Replace var with const', accepted: true },
    { time: '12 min ago', title: 'Add input sanitization', accepted: false },
    { time: '18 min ago', title: 'Use parameterized queries', accepted: true },
    { time: '23 min ago', title: 'Add request timeout', accepted: true },
  ];

  return (
    <div className="p-3 space-y-2">
      {visible.length === 0 && suggestions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-xs">
          Watching for stuck signals...
        </div>
      )}

      {visible.map((sug, i) => (
        <div
          key={sug.id}
          className={`rounded border p-3 space-y-2 animate-slide-in-right ${
            sug.status === 'applied' ? 'opacity-60' : ''
          }`}
          style={{
            animationDelay: `${i * 300}ms`,
            animationFillMode: 'backwards',
            borderLeftWidth: 3,
            borderLeftColor: sug.borderColor === 'amber' ? 'hsl(var(--mm-amber))' : 'hsl(var(--mm-accent))',
          }}
        >
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              sug.type === 'Security' ? 'bg-mm-amber/10 text-mm-amber' : 'bg-primary/10 text-primary'
            }`}>
              {sug.type}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-mm-amber/10 text-mm-amber">
  Hint
</span>
            {/* Confidence bar */}
            
            <div className="flex-1 h-1 bg-accent rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${sug.confidence}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{sug.confidence}%</span>
          </div>

          <div className="text-xs font-semibold text-foreground">{sug.title}</div>
          <div className="text-[11px] text-muted-foreground leading-relaxed"> 💡 {sug.explanation}</div>


          {sug.status === 'applied' ? (
            <div className="flex items-center gap-1 text-mm-green text-xs font-medium">
              <Check size={12} /> Applied
            </div>
          ) : (
            <div className="flex justify-end">
            <button
            onClick={() => dismissSuggestion(sug.id)}
            className="px-2 py-1 text-[11px] rounded border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors active:scale-[0.97]"
            >
              <X size={10} />
            </button>
          </div>
          )}
        </div>
      ))}

      {/* History */}
      <details className="mt-4">
        <summary className="text-[10px] uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground py-1">
          History ({history.length})
        </summary>
        <div className="space-y-1 mt-1">
          {history.map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] py-1 px-1">
              <span className={h.accepted ? 'text-mm-green' : 'text-mm-red'}>{h.accepted ? '✓' : '✗'}</span>
              <span className="flex-1 text-muted-foreground truncate">{h.title}</span>
              <span className="text-muted-foreground/60 text-[10px] shrink-0">{h.time}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
