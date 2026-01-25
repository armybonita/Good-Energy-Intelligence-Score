
import React from 'react';

const CoachingInsights: React.FC<{ insights: string[] }> = ({ insights }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Intelligence Feed</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {insights.map((text, idx) => (
          <div key={idx} className="group relative p-8 bg-gradient-to-br from-slate-900 to-black border-t border-l border-white/10 rounded-3xl shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 group-hover:rotate-12 transition-all">
              <svg className="w-12 h-12 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707z" />
              </svg>
            </div>
            <div className="flex gap-6 items-start relative">
              <div className="w-1 h-12 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
              <p className="text-sm text-slate-300 font-semibold leading-relaxed group-hover:text-white transition-colors">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoachingInsights;
