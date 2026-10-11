import React, { useState } from 'react';

export default function GanttChart({ gantt = [], totalTime = 20, algorithmName = 'Scheduling Timeline' }) {
  const [hoveredBlock, setHoveredBlock] = useState(null);

  if (!gantt || gantt.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        No processes scheduled in current queue timeline.
      </div>
    );
  }

  const effectiveTotal = Math.max(1, totalTime || gantt[gantt.length - 1]?.end || 20);

  return (
    <div className="w-full bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
            CPU Execution Timeline ({algorithmName})
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Patients processed sequentially or time-sliced based on scheduling algorithm. Total simulation duration: <strong>{effectiveTotal} units</strong>.
          </p>
        </div>

        {/* Priority Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500"></span>
            <span className="text-slate-600 dark:text-slate-300">Critical (1)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-500"></span>
            <span className="text-slate-600 dark:text-slate-300">High (2)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500"></span>
            <span className="text-slate-600 dark:text-slate-300">Medium (3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span className="text-slate-600 dark:text-slate-300">Low (4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-400"></span>
            <span className="text-slate-600 dark:text-slate-300">Idle</span>
          </div>
        </div>
      </div>

      {/* Gantt Bar Container */}
      <div className="relative mt-6 pt-2 pb-8 overflow-x-auto">
        <div className="flex w-full min-w-[650px] h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-inner">
          {gantt.map((block, idx) => {
            const widthPct = Math.max(3, (block.duration / effectiveTotal) * 100);
            const isIdle = block.id === 'IDLE';

            return (
              <div
                key={`${block.id}-${block.start}-${idx}`}
                onMouseEnter={() => setHoveredBlock(block)}
                onMouseLeave={() => setHoveredBlock(null)}
                style={{ width: `${widthPct}%`, backgroundColor: block.color || '#0d9488' }}
                className={`relative h-full flex flex-col items-center justify-center text-white px-2 border-r border-white/20 last:border-r-0 transition-transform duration-100 cursor-pointer ${
                  hoveredBlock === block ? 'scale-[1.02] z-10 brightness-110 shadow-lg' : ''
                }`}
              >
                <span className="text-xs font-bold truncate max-w-full drop-shadow-sm">
                  {block.pid || block.id}
                </span>
                <span className="text-[10px] font-medium opacity-90 truncate max-w-full drop-shadow-sm">
                  {isIdle ? 'IDLE' : block.name ? block.name.split(' ')[0] : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Time Scale Marks along bottom */}
        <div className="relative w-full min-w-[650px] h-6 mt-1 flex text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <div className="absolute left-0">0</div>
          {gantt.map((block, idx) => {
            const rightPct = (block.end / effectiveTotal) * 100;
            return (
              <div
                key={`mark-${idx}`}
                style={{ left: `${rightPct}%`, transform: 'translateX(-50%)' }}
                className="absolute flex flex-col items-center"
              >
                <span className="w-px h-2 bg-slate-300 dark:bg-slate-600 mb-0.5"></span>
                <span>{block.end}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip / Block Inspector */}
      {hoveredBlock && (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: hoveredBlock.color }}
            ></span>
            <strong className="text-slate-900 dark:text-white font-semibold">
              {hoveredBlock.id}: {hoveredBlock.name}
            </strong>
            <span className="text-slate-500">({hoveredBlock.priority || 'N/A'})</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-slate-700 dark:text-slate-300">
            <span>Start: <strong>{hoveredBlock.start}</strong></span>
            <span>End: <strong>{hoveredBlock.end}</strong></span>
            <span>Execution Slice: <strong>{hoveredBlock.duration} units</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
