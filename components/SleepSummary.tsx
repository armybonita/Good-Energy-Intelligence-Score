
import React from 'react';
const SleepSummary: React.FC<{ logs: any[] }> = ({ logs }) => (
  <div className="group p-6 bg-slate-900/60 border border-white/5 rounded-3xl hover:bg-slate-900 transition-colors shadow-xl">
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Rest Cycle</p>
    <div className="space-y-3">
      {logs.map((log, i) => (
        <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
          <span className="text-sm font-bold text-slate-300">{log.date}</span>
          <span className="text-xs font-black text-indigo-400">{log.durationHours}h</span>
        </div>
      ))}
    </div>
  </div>
);
export default SleepSummary;
