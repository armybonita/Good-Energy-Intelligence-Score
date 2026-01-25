
import React, { useMemo } from 'react';

interface GesScoreProps {
  ges: {
    overall: number;
    breakdown: { [key: string]: number };
  };
}

const GesScore: React.FC<GesScoreProps> = ({ ges }) => {
  const categories = useMemo(() => [
    { key: 'biomarker', label: 'Biomarkers', color: '#f43f5e', icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
    { key: 'exercise', label: 'Exercise', color: '#14b8a6', icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
    { key: 'mind', label: 'Mind', color: '#a855f7', icon: "M12 3v1m0 16v1m9-9h-1M4 12H3" },
    { key: 'sleep', label: 'Sleep', color: '#6366f1', icon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" },
    { key: 'food', label: 'Nutrition', color: '#f97316', icon: "M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2" },
  ], []);

  const size = 320;
  const center = size / 2;
  const radius = size * 0.35;
  const angleStep = (Math.PI * 2) / 5;

  const dataPoints = categories.map((cat, i) => {
    const val = ges.breakdown[cat.key] || 0;
    const factor = val / 100;
    const angle = i * angleStep - Math.PI / 2;
    return `${center + radius * factor * Math.cos(angle)},${center + radius * factor * Math.sin(angle)}`;
  }).join(' ');

  const generateGrid = (factor: number) => {
    return Array.from({ length: 5 }).map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      return `${center + radius * factor * Math.cos(angle)},${center + radius * factor * Math.sin(angle)}`;
    }).join(' ');
  };

  return (
    <section className="relative group perspective-1000">
      <div className="flex flex-col lg:flex-row items-center gap-10 p-10 bg-gradient-to-br from-slate-900 to-black border border-white/10 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] hover:shadow-blue-500/5 hover:border-blue-500/20 transition-all duration-700">
        
        {/* Left: Volumetric Score Ring */}
        <div className="flex flex-col items-center gap-6 flex-shrink-0">
          <div className="relative w-64 h-64 flex items-center justify-center animate-float">
            {/* Outer Atmospheric Glow */}
            <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-[60px] animate-pulse"></div>
            
            {/* 3D Score SVG */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#0f172a" strokeWidth="8" />
              <circle 
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke="url(#ringGlow)" 
                strokeWidth="8" 
                strokeDasharray="289" 
                strokeDashoffset={289 - (ges.overall / 100) * 289} 
                strokeLinecap="round" 
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="ringGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
            </svg>

            <div className="text-center z-10">
              <span className="text-8xl font-orbitron font-black text-white tracking-tighter drop-shadow-2xl">
                {ges.overall}
              </span>
              <p className="text-[12px] font-black text-blue-400 uppercase tracking-[0.4em] mt-2">Energy Level</p>
            </div>
          </div>
        </div>

        {/* Right: 3D Radar Chart */}
        <div className="flex-1 w-full flex justify-center perspective-500">
          <div className="relative transform group-hover:rotate-x-6 group-hover:rotate-y-[-6deg] transition-transform duration-700" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="overflow-visible">
              {/* Background Grid */}
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((f, i) => (
                <polygon key={i} points={generateGrid(f)} fill="none" stroke="#1e293b" strokeWidth="1" className="opacity-50" />
              ))}
              
              {/* Data Polygon with Glow */}
              <polygon points={dataPoints} fill="rgba(37, 99, 235, 0.15)" stroke="#3b82f6" strokeWidth="3" className="drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all duration-1000" />
              
              {/* Floating Labels */}
              {categories.map((cat, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const lx = center + (radius + 45) * Math.cos(angle);
                const ly = center + (radius + 45) * Math.sin(angle);
                return (
                  <g key={i}>
                    <circle cx={lx} cy={ly - 15} r="18" fill="#020617" stroke={cat.color} strokeWidth="2" className="shadow-lg" />
                    <path d={cat.icon} transform={`translate(${lx - 8}, ${ly - 23}) scale(0.7)`} stroke={cat.color} strokeWidth="2" fill="none" />
                    <text x={lx} y={ly + 15} textAnchor="middle" className="text-[10px] font-black fill-slate-500 uppercase tracking-widest">{cat.label}</text>
                    <text x={lx} y={ly + 30} textAnchor="middle" className="text-[12px] font-black fill-white">{ges.breakdown[cat.key]}%</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

      </div>
    </section>
  );
};

export default GesScore;
