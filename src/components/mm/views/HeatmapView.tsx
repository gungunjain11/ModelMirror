import { useApp } from '@/contexts/AppContext';
import { ActivityTracker } from '@/lib/activityTracker';

export function HeatmapView() {
  const { codeLines } = useApp();
  const totalLines = codeLines.length;
  const heatmapData = ActivityTracker.getHeatmapData(totalLines);
  const metrics = ActivityTracker.getProductivityMetrics();

  // Divide into chunks for visualization
  const chunkSize = Math.ceil(totalLines / 20);
  const chunks = [];
  for (let i = 0; i < totalLines; i += chunkSize) {
    chunks.push(heatmapData.slice(i, i + chunkSize));
  }

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      <h3 className="text-xs font-semibold text-foreground">Edit Heatmap</h3>

      {/* Productivity metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-card border border-border rounded p-2">
          <div className="text-[9px] text-muted-foreground">Edits/min</div>
          <div className="text-sm font-mono font-bold text-foreground">{metrics.editsPerMinute}</div>
        </div>
        <div className="bg-card border border-border rounded p-2">
          <div className="text-[9px] text-muted-foreground">Focused Lines</div>
          <div className="text-sm font-mono font-bold text-foreground">{metrics.focusedLines}</div>
        </div>
        <div className="bg-card border border-border rounded p-2">
          <div className="text-[9px] text-muted-foreground">Avg Chars/Edit</div>
          <div className="text-sm font-mono font-bold text-foreground">{metrics.avgCharsPerEdit}</div>
        </div>
        <div className="bg-card border border-border rounded p-2">
          <div className="text-[9px] text-muted-foreground">Duration</div>
          <div className="text-sm font-mono font-bold text-foreground">{metrics.sessionDurationMinutes}m</div>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="space-y-2">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Activity by Line Range</div>
        <div className="space-y-1">
          {chunks.map((chunk, chunkIdx) => {
            const startLine = chunkIdx * chunkSize + 1;
            const endLine = Math.min((chunkIdx + 1) * chunkSize, totalLines);
            const maxIntensity = Math.max(...chunk.map(d => ActivityTracker.getHeatmapIntensity(d.line)), 0);
            
            return (
              <div key={chunkIdx} className="space-y-1">
                <div className="text-[8px] text-muted-foreground/60">
                  Lines {startLine}-{endLine}
                </div>
                <div className="flex gap-0.5 flex-wrap">
                  {chunk.map(data => (
                    <div
                      key={data.line}
                      className="flex-1 min-w-2 h-6 rounded border border-border/50 transition-all hover:scale-110 cursor-pointer"
                      style={{
                        backgroundColor: ActivityTracker.getHeatmapColor(
                          ActivityTracker.getHeatmapIntensity(data.line)
                        ),
                      }}
                      title={`Line ${data.line}: ${data.edits} edits`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-border pt-2 text-[8px]">
        <div className="text-muted-foreground uppercase tracking-wider mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'transparent' }} />
            <span className="text-muted-foreground/60">No edits</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(72, 187, 120, 0.2)' }} />
            <span className="text-muted-foreground/60">Low activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(237, 137, 54, 0.5)' }} />
            <span className="text-muted-foreground/60">Medium activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(245, 101, 101, 0.6)' }} />
            <span className="text-muted-foreground/60">High activity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
