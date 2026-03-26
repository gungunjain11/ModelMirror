import { useEffect, useState } from 'react';
import { ActivityTracker } from '@/lib/activityTracker';

interface MinimapProps {
  totalLines: number;
  currentScroll?: number;
  onLineClick?: (line: number) => void;
}

export function Minimap({ totalLines, currentScroll = 0, onLineClick }: MinimapProps) {
  const [heatmapData, setHeatmapData] = useState<Array<{ line: number; intensity: number; edits: number }>>([]);

  useEffect(() => {
    // Update heatmap data
    const data = ActivityTracker.getHeatmapData(totalLines);
    setHeatmapData(data);
  }, [totalLines]);

  const cellHeight = Math.max(2, Math.min(8, 300 / totalLines));

  return (
    <div className="w-8 bg-accent/30 border-l border-border relative group">
      {/* Tooltip on hover */}
      <div className="absolute left-10 bg-card border border-border rounded p-2 text-[10px] text-muted-foreground whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
        Activity Heatmap
      </div>

      {/* Minimap cells */}
      <div className="w-full">
        {heatmapData.map((data) => {
          const color = ActivityTracker.getHeatmapColor(data.intensity);
          const title = data.edits > 0 ? `Line ${data.line}: ${data.edits} edits` : `Line ${data.line}`;
          
          return (
            <div
              key={data.line}
              className="w-full cursor-pointer transition-all hover:brightness-110 group/cell"
              style={{
                height: `${cellHeight}px`,
                backgroundColor: color,
                border: data.intensity > 0.5 ? '0.5px solid rgba(255,255,255,0.1)' : 'none',
              }}
              onClick={() => onLineClick?.(data.line)}
              title={title}
            >
              {/* Tooltip on cell hover */}
              <div className="absolute left-10 bg-card border border-border rounded px-2 py-1 text-[9px] text-muted-foreground pointer-events-none opacity-0 group-hover/cell:opacity-100 transition-opacity z-20">
                Line {data.line}
                {data.edits > 0 && <div>{data.edits} edits</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current viewport indicator */}
      <div
        className="absolute left-0 right-0 border-t-2 border-b-2 border-primary/50 pointer-events-none transition-all"
        style={{
          top: `${(currentScroll / totalLines) * 100}%`,
          height: `${Math.max(20, (window.innerHeight / (totalLines * 20)) * 100)}%`,
        }}
      />
    </div>
  );
}
