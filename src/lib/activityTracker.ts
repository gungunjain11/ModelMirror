// Activity tracking and heatmap visualization

export interface LineActivity {
  lineNumber: number;
  editCount: number;
  lastEditTime: number;
  editorCount: number;
  changeHistory: string[];
}

export interface SessionMetrics {
  startTime: number;
  totalEdits: number;
  totalChars: number;
  avgCharPerEdit: number;
  peakActivityLine: number;
  linesChanged: Set<number>;
  filesChanged: Set<string>;
  activityHeatmap: Map<number, LineActivity>;
}

export class ActivityTracker {
  private static lineActivity = new Map<number, LineActivity>();
  private static sessionStart = Date.now();
  private static totalEdits = 0;
  private static totalChars = 0;

  static trackEdit(
    lineNumber: number,
    newContent: string,
    oldContent: string = '',
    filename: string = 'current'
  ): void {
    const charDiff = Math.abs(newContent.length - oldContent.length);
    
    this.totalEdits++;
    this.totalChars += charDiff;

    if (!this.lineActivity.has(lineNumber)) {
      this.lineActivity.set(lineNumber, {
        lineNumber,
        editCount: 0,
        lastEditTime: Date.now(),
        editorCount: 0,
        changeHistory: [],
      });
    }

    const activity = this.lineActivity.get(lineNumber)!;
    activity.editCount++;
    activity.lastEditTime = Date.now();
    activity.changeHistory.push(newContent.substring(0, 50));
  }

  static getLineActivity(lineNumber: number): LineActivity | undefined {
    return this.lineActivity.get(lineNumber);
  }

  static getHeatmapIntensity(lineNumber: number): number {
    const activity = this.lineActivity.get(lineNumber);
    if (!activity) return 0;

    // Normalize to 0-1 scale based on edit frequency
    const maxEdits = Math.max(...Array.from(this.lineActivity.values()).map(a => a.editCount), 1);
    return Math.min(1, activity.editCount / maxEdits);
  }

  static getSessionMetrics(): SessionMetrics {
    const linesChanged = new Set(this.lineActivity.keys());
    
    // Find peak activity line
    let peakActivityLine = 0;
    let maxEdits = 0;
    for (const [lineNum, activity] of this.lineActivity.entries()) {
      if (activity.editCount > maxEdits) {
        maxEdits = activity.editCount;
        peakActivityLine = lineNum;
      }
    }
    
    return {
      startTime: this.sessionStart,
      totalEdits: this.totalEdits,
      totalChars: this.totalChars,
      avgCharPerEdit: this.totalEdits > 0 ? this.totalChars / this.totalEdits : 0,
      peakActivityLine,
      linesChanged,
      filesChanged: new Set(),
      activityHeatmap: this.lineActivity,
    };
  }

  static getActivityTimeline(maxEvents = 20): Array<{
    time: string;
    line: number;
    editCount: number;
  }> {
    const timeline = Array.from(this.lineActivity.values())
      .sort((a, b) => b.lastEditTime - a.lastEditTime)
      .slice(0, maxEvents)
      .map(activity => ({
        time: new Date(activity.lastEditTime).toLocaleTimeString(),
        line: activity.lineNumber,
        editCount: activity.editCount,
      }));

    return timeline;
  }

  static reset(): void {
    this.lineActivity.clear();
    this.sessionStart = Date.now();
    this.totalEdits = 0;
    this.totalChars = 0;
  }

  /**
   * Get heatmap data configured for visualization
   */
  static getHeatmapData(totalLines: number) {
    const data = Array.from({ length: totalLines }, (_, i) => {
      const intensity = this.getHeatmapIntensity(i + 1);
      const activity = this.lineActivity.get(i + 1);
      
      return {
        line: i + 1,
        intensity,
        edits: activity?.editCount || 0,
        recent: activity ? Date.now() - activity.lastEditTime < 10000 : false,
      };
    });

    return data;
  }

  /**
   * Get color for heatmap cell
   */
  static getHeatmapColor(intensity: number): string {
    if (intensity === 0) return 'transparent';
    if (intensity < 0.3) return 'rgba(72, 187, 120, 0.2)'; // light green
    if (intensity < 0.6) return 'rgba(72, 187, 120, 0.4)'; // medium green
    if (intensity < 0.8) return 'rgba(237, 137, 54, 0.5)'; // orange
    return 'rgba(245, 101, 101, 0.6)'; // red (most edited)
  }

  /**
   * Analyze productivity metrics
   */
  static getProductivityMetrics() {
    const metrics = this.getSessionMetrics();
    const sessionDuration = (Date.now() - metrics.startTime) / 1000 / 60; // minutes

    return {
      editsPerMinute: sessionDuration > 0 ? (metrics.totalEdits / sessionDuration).toFixed(1) : '0',
      charsPerMinute: sessionDuration > 0 ? (metrics.totalChars / sessionDuration).toFixed(0) : '0',
      avgCharsPerEdit: metrics.avgCharPerEdit.toFixed(1),
      focusedLines: metrics.linesChanged.size,
      sessionDurationMinutes: sessionDuration.toFixed(1),
    };
  }
}
