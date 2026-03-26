import { useApp } from '@/contexts/AppContext';
import { ActivityTracker } from '@/lib/activityTracker';

export function TimelineView() {
  const { logs } = useApp();
  const timeline = ActivityTracker.getActivityTimeline(30);
  const metrics = ActivityTracker.getSessionMetrics();

  return (
    <div className="p-3 space-y-3 overflow-auto h-full">
      <h3 className="text-xs font-semibold text-foreground">Session Timeline</h3>

      {/* Timeline stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-card border border-border rounded p-2">
          <div className="text-[9px] text-muted-foreground">Total Events</div>
          <div className="text-sm font-mono font-bold text-foreground">{logs.length}</div>
        </div>
        <div className="bg-card border border-border rounded p-2">
          <div className="text-[9px] text-muted-foreground">Modified Lines</div>
          <div className="text-sm font-mono font-bold text-foreground">{metrics.linesChanged.size}</div>
        </div>
      </div>

      {/* Activity log */}
      <div className="space-y-2">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Recent Activity</div>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {logs.slice().reverse().map((log, idx) => (
            <div
              key={log.id}
              className="flex items-start gap-2 p-2 rounded border border-border/50 bg-card/50 hover:border-border transition-colors text-[10px]"
            >
              <span className="text-muted-foreground mt-0.5 flex-shrink-0">{log.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-foreground break-words">{log.message}</div>
                <div className="text-muted-foreground/60 text-[9px] mt-0.5">{log.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit timeline */}
      {timeline.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Line Edit Frequency</div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {timeline.map((edit, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Line {edit.line}</span>
                  <span className="font-mono text-foreground font-bold">{edit.editCount}</span>
                </div>
                <div className="w-full h-2 bg-accent rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-mm-orange transition-all duration-500"
                    style={{
                      width: `${(edit.editCount / timeline[0].editCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
