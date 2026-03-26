import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';

export function AnalyticsView() {
  const [visible, setVisible] = useState(false);
  const analytics = useAnalytics();
  
  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div className={`p-6 space-y-6 overflow-auto h-full transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <h2 className="text-sm font-semibold text-foreground">Session Analytics</h2>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'API Calls', value: analytics.totalAPIRequests.toString() },
          { label: 'Avg Latency', value: `${analytics.avgLatency.toFixed(1)}s` },
          { label: 'Tokens Used', value: `~${(analytics.tokensUsed / 1000).toFixed(1)}k` }
        ].map(m => (
          <div key={m.label} className="bg-card border border-border rounded p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
            <div className="text-lg font-mono font-bold text-foreground mt-1">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Stuck events bar chart */}
        <div className="bg-card border border-border rounded p-3">
          <div className="text-[11px] font-medium text-foreground mb-3">Stuck Events Over Session</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={analytics.stuckEvents}>
              <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="hsl(var(--mm-muted))" />
              <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--mm-muted))" />
              <Tooltip contentStyle={{ fontSize: 10, background: 'hsl(var(--mm-surface))', border: '1px solid hsl(var(--mm-border))' }} />
              <Bar dataKey="idle" stackId="a" fill="hsl(var(--mm-accent))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="backspace" stackId="a" fill="hsl(var(--mm-amber))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="lint" stackId="a" fill="hsl(var(--mm-red))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Signal breakdown donut */}
        <div className="bg-card border border-border rounded p-3">
          <div className="text-[11px] font-medium text-foreground mb-3">Signal Type Breakdown</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={analytics.signalBreakdown} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={2}>
                {analytics.signalBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 10, background: 'hsl(var(--mm-surface))', border: '1px solid hsl(var(--mm-border))' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 mt-1">
            {analytics.signalBreakdown.map(d => (
              <div key={d.name} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: d.color }} />{d.name} {d.value}%
              </div>
            ))}
          </div>
        </div>

        {/* Acceptance horizontal bars */}
        <div className="bg-card border border-border rounded p-3">
          <div className="text-[11px] font-medium text-foreground mb-3">Suggestion Acceptance</div>
          <div className="space-y-2">
            {analytics.acceptanceRate.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-16 shrink-0">{d.name}</span>
                <div className="flex-1 h-4 bg-accent rounded-sm overflow-hidden">
                  <div className="h-full rounded-sm transition-all duration-700" style={{ width: `${d.value}%`, backgroundColor: d.color }} />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Keystrokes line chart */}
        <div className="bg-card border border-border rounded p-3">
          <div className="text-[11px] font-medium text-foreground mb-3">Keystrokes Per Minute</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={analytics.keystrokeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--mm-border))" />
              <XAxis dataKey="t" tick={{ fontSize: 9 }} stroke="hsl(var(--mm-muted))" />
              <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--mm-muted))" />
              <Tooltip contentStyle={{ fontSize: 10, background: 'hsl(var(--mm-surface))', border: '1px solid hsl(var(--mm-border))' }} />
              <Line type="monotone" dataKey="kpm" stroke="hsl(var(--mm-accent))" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Session Duration</div>
          <div className="text-lg font-mono font-bold text-foreground mt-1">{analytics.sessionDuration}</div>
        </div>
        <div className="bg-card border border-border rounded p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Peak KPM</div>
          <div className="text-lg font-mono font-bold text-foreground mt-1">{analytics.highestKeystrokeRate}</div>
        </div>
        <div className="bg-card border border-border rounded p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Suggestions</div>
          <div className="text-lg font-mono font-bold text-foreground mt-1">{analytics.suggestionsStats.total}</div>
        </div>
      </div>

      {/* Top confused files */}
      <div className="bg-card border border-border rounded p-3">
        <div className="text-[11px] font-medium text-foreground mb-2">Top Files with Issues</div>
        <div className="space-y-1.5">
          {analytics.confusedFiles.map(f => (
            <div key={f.name} className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${f.color}`} />
              <span className="font-mono text-foreground flex-1">{f.name}</span>
              <span className="text-muted-foreground">{f.events} events</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
