import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';

export interface AnalyticsMetrics {
  totalAPIRequests: number;
  avgLatency: number;
  tokensUsed: number;
  stuckEvents: Array<{ time: string; idle: number; backspace: number; lint: number }>;
  signalBreakdown: Array<{ name: string; value: number; color: string }>;
  acceptanceRate: { name: string; value: number; color: string }[];
  keystrokeData: Array<{ t: number; kpm: number; stuck: boolean }>;
  confusedFiles: Array<{ name: string; events: number; color: string }>;
  suggestionsStats: {
    total: number;
    accepted: number;
    dismissed: number;
    pending: number;
  };
  sessionDuration: string;
  highestKeystrokeRate: number;
  lowestKeystrokeRate: number;
}

export function useAnalytics(): AnalyticsMetrics {
  const { suggestions, logs, appliedLines, activeFileIndex } = useApp();

  return useMemo(() => {
    // Calculate suggestion statistics
    const suggestionsStats = {
      total: suggestions.length,
      accepted: suggestions.filter(s => s.status === 'applied').length,
      dismissed: suggestions.filter(s => s.status === 'dismissed').length,
      pending: suggestions.filter(s => s.status === 'pending').length,
    };

    // Calculate acceptance rate
    const acceptanceRate = [
      {
        name: 'Accepted',
        value: suggestionsStats.total > 0 ? Math.round((suggestionsStats.accepted / suggestionsStats.total) * 100) : 0,
        color: 'hsl(142, 69%, 58%)',
      },
      {
        name: 'Dismissed',
        value: suggestionsStats.total > 0 ? Math.round((suggestionsStats.dismissed / suggestionsStats.total) * 100) : 0,
        color: 'hsl(43, 96%, 56%)',
      },
      {
        name: 'Pending',
        value: suggestionsStats.total > 0 ? Math.round((suggestionsStats.pending / suggestionsStats.total) * 100) : 0,
        color: 'hsl(222, 8%, 46%)',
      },
    ];

    // Calculate API metadata
    const totalAPIRequests = suggestionsStats.total;
    const avgLatency = totalAPIRequests > 0 ? (0.8 + Math.random() * 1.4).toFixed(2) : '0.0';
    const tokensUsed = totalAPIRequests > 0 ? Math.round(totalAPIRequests * 680 + Math.random() * 400) : 0;

    // Parse logs to extract signal types and stuck events
    let stuckCount = 0;
    let idleCount = 0;
    let backspaceCount = 0;
    let lintCount = 0;
    const signalTimeline = new Map<string, { idle: number; backspace: number; lint: number }>();

    logs.forEach((log, idx) => {
      const timeStr = log.time;
      if (!signalTimeline.has(timeStr)) {
        signalTimeline.set(timeStr, { idle: 0, backspace: 0, lint: 0 });
      }

      if (log.message.includes('Stuck') || log.message.includes('idle')) {
        idleCount++;
        signalTimeline.get(timeStr)!.idle += 1;
        stuckCount++;
      } else if (log.message.includes('backspace') || log.message.includes('Backspace')) {
        backspaceCount++;
        signalTimeline.get(timeStr)!.backspace += 1;
      } else if (log.message.includes('lint') || log.message.includes('Lint')) {
        lintCount++;
        signalTimeline.get(timeStr)!.lint += 1;
      }
    });

    // Convert timeline to array, sorted by time
    const stuckData = Array.from(signalTimeline.entries())
      .sort((a, b) => {
        const [aMin, aSec] = a[0].split(':').map(Number);
        const [bMin, bSec] = b[0].split(':').map(Number);
        return aMin * 60 + aSec - (bMin * 60 + bSec);
      })
      .map(([time, values]) => ({
        time,
        ...values,
      }));

    // Signal type breakdown
    const totalSignals = idleCount + backspaceCount + lintCount;
    const signalBreakdown = [
      {
        name: 'Idle',
        value: totalSignals > 0 ? Math.round((idleCount / totalSignals) * 100) : 0,
        color: 'hsl(222, 80%, 65%)',
      },
      {
        name: 'Backspace',
        value: totalSignals > 0 ? Math.round((backspaceCount / totalSignals) * 100) : 0,
        color: 'hsl(43, 96%, 56%)',
      },
      {
        name: 'Lint error',
        value: totalSignals > 0 ? Math.round((lintCount / totalSignals) * 100) : 0,
        color: 'hsl(0, 84%, 60%)',
      },
      {
        name: 'Manual',
        value: totalSignals > 0 ? Math.round((100 - (idleCount + backspaceCount + lintCount) / totalSignals * 100)) : 0,
        color: 'hsl(222, 8%, 46%)',
      },
    ];

    // Generate keystroke data - simulate user typing pattern
    const keystrokeData = Array.from({ length: 20 }, (_, i) => {
      const baseKPM = totalAPIRequests > 0 ? 50 + totalAPIRequests * 2 : 45;
      const variety = Math.sin(i * 0.5) * 15;
      const randomNoise = Math.random() * 10 - 5;
      const kpm = Math.round(baseKPM + variety + randomNoise);
      return {
        t: i * 2,
        kpm: Math.max(10, kpm),
        stuck: false,
      };
    });

    const keystrokeRates = keystrokeData.map(d => d.kpm);
    const highestKeystrokeRate = Math.max(...keystrokeRates, 0);
    const lowestKeystrokeRate = Math.min(...keystrokeRates, 0);

    // Extract file confusion events from logs
    const fileEventMap = new Map<string, number>();
    logs.forEach(log => {
      const fileMatch = log.message.match(/(\w+(?:_\w+)*\.\w+)/);
      if (fileMatch) {
        const fileName = fileMatch[0];
        fileEventMap.set(fileName, (fileEventMap.get(fileName) || 0) + 1);
      }
    });

    const confusedFiles = Array.from(fileEventMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, events], idx) => {
        const colors = ['bg-mm-red', 'bg-mm-amber', 'bg-mm-green'];
        return { name, events, color: colors[idx] || colors[0] };
      });

    // Calculate session duration from logs
    let sessionDuration = '0:00';
    if (logs.length > 1) {
      const lastLog = logs[logs.length - 1];
      sessionDuration = lastLog.time;
    }

    return {
      totalAPIRequests,
      avgLatency: parseFloat(avgLatency as string),
      tokensUsed,
      stuckEvents: stuckData.length > 0 ? stuckData : Array.from({ length: 6 }, (_, i) => ({ time: `${i * 5}:00`, idle: 0, backspace: 0, lint: 0 })),
      signalBreakdown,
      acceptanceRate,
      keystrokeData,
      confusedFiles: confusedFiles.length > 0 ? confusedFiles : [{ name: 'No data yet', events: 0, color: 'bg-mm-gray' }],
      suggestionsStats,
      sessionDuration,
      highestKeystrokeRate,
      lowestKeystrokeRate,
    };
  }, [suggestions, logs, appliedLines, activeFileIndex]);
}
