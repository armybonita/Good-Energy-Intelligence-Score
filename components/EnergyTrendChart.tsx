
import React, { useState, useMemo, useEffect } from 'react';
import { GesScoreData } from '../App';
import { UserProfile } from './RegistrationModal';

interface EnergyTrendChartProps {
  gesHistory: GesScoreData[];
  profile: UserProfile | null;
}

const EnergyTrendChart: React.FC<EnergyTrendChartProps> = ({ gesHistory, profile }) => {
  const [timeRange, setTimeRange] = useState('all'); // '7d', '30d', '6m', 'all'

  const categories = useMemo(() => [
    { key: 'overall', label: 'Overall', color: '#60a5fa', icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { key: 'biomarker', label: 'Biomarkers', color: '#f43f5e', icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
    { key: 'exercise', label: 'Exercise', color: '#14b8a6', icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
    { key: 'mind', label: 'Mind', color: '#a855f7', icon: "M12 3v1m0 16v1m9-9h-1M4 12H3" },
    { key: 'sleep', label: 'Sleep', color: '#6366f1', icon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" },
    { key: 'food', label: 'Nutrition', color: '#f97316', icon: "M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2" },
  ], []);

  const filteredHistory = useMemo(() => {
    if (!gesHistory || gesHistory.length === 0) return [];
    const now = Date.now();
    let cutoff = 0;

    switch (timeRange) {
      case '7d': cutoff = now - 7 * 24 * 60 * 60 * 1000; break;
      case '30d': cutoff = now - 30 * 24 * 60 * 60 * 1000; break;
      case '6m': cutoff = now - 6 * 30 * 24 * 60 * 60 * 1000; break; // Approx 6 months
      case 'all':
      default: return gesHistory;
    }
    return gesHistory.filter(data => data.timestamp >= cutoff);
  }, [gesHistory, timeRange]);

  const chartData = useMemo(() => {
    if (filteredHistory.length < 2) return null;

    const scores = filteredHistory.map(data => data.overall);
    const minScore = 0; // Math.min(...scores);
    const maxScore = 100; // Math.max(...scores);

    const width = 600;
    const height = 200;
    const padding = 20;

    const xFactor = (width - padding * 2) / (filteredHistory.length - 1);
    const yFactor = (height - padding * 2) / (maxScore - minScore);

    const points = filteredHistory.map((data, i) => {
      const x = padding + i * xFactor;
      const y = height - padding - (data.overall - minScore) * yFactor;
      return `${x},${y}`;
    }).join(' ');

    // Calculate category lines
    const categoryLines = categories.slice(1).map(cat => ({
      key: cat.key,
      color: cat.color,
      points: filteredHistory.map((data, i) => {
        const x = padding + i * xFactor;
        const y = height - padding - ((data.breakdown[cat.key] || 0) - minScore) * yFactor;
        return `${x},${y}`;
      }).join(' ')
    }));

    return { points, width, height, padding, categoryLines };
  }, [filteredHistory, categories]);

  const avgOverallScore = useMemo(() => {
    if (filteredHistory.length === 0) return 0;
    const sum = filteredHistory.reduce((acc, curr) => acc + curr.overall, 0);
    return Math.round(sum / filteredHistory.length);
  }, [filteredHistory]);

  const getInsight = useMemo(() => {
    if (filteredHistory.length < 2) return "데이터 부족: 트렌드 분석을 위해 더 많은 데이터가 필요합니다.";
    
    const latest = filteredHistory[filteredHistory.length - 1].overall;
    const earliest = filteredHistory[0].overall;
    const diff = latest - earliest;

    if (diff > 5) return "에너지 레벨이 긍정적인 추세로 상승 중입니다! 이 모멘텀을 유지하세요.";
    if (diff < -5) return "에너지 레벨이 하락 추세입니다. 최근 활동을 검토하고 개선 전략을 세워야 합니다.";
    return "에너지 레벨이 안정적으로 유지되고 있습니다. 현재의 균형을 유지하는 데 집중하세요.";
  }, [filteredHistory]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  if (!profile) return null; // Only show if user is registered

  return (
    <section className="space-y-8 mt-12">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">GEI TREND ANALYSIS</h2>
        <div className="flex gap-2">
          {['7d', '30d', '6m', 'all'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                timeRange === range
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'bg-white/5 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400'
              }`}
            >
              {range === 'all' ? 'All Time' : range}
            </button>
          ))}
        </div>
      </div>

      <div className="p-10 bg-gradient-to-br from-slate-900 to-black border border-white/10 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] hover:shadow-purple-500/5 hover:border-purple-500/20 transition-all duration-700">
        <h3 className="text-xl font-orbitron font-black text-white tracking-tighter mb-6">
          {profile.name}님의 에너지 트렌드
        </h3>

        {chartData ? (
          <div className="relative">
            <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="w-full h-auto text-white">
              {/* Grid Lines */}
              <line x1={chartData.padding} y1={chartData.height - chartData.padding} x2={chartData.width - chartData.padding} y2={chartData.height - chartData.padding} stroke="#1e293b" strokeWidth="1" />
              <line x1={chartData.padding} y1={chartData.padding} x2={chartData.width - chartData.padding} y2={chartData.padding} stroke="#1e293b" strokeWidth="1" />
              <line x1={chartData.padding} y1={chartData.padding} x2={chartData.padding} y2={chartData.height - chartData.padding} stroke="#1e293b" strokeWidth="1" />
              <line x1={chartData.width - chartData.padding} y1={chartData.padding} x2={chartData.width - chartData.padding} y2={chartData.height - chartData.padding} stroke="#1e293b" strokeWidth="1" />

              {/* Data Points and Lines for Overall Score */}
              <polyline
                fill="none"
                stroke={categories[0].color}
                strokeWidth="4"
                points={chartData.points}
                className="drop-shadow-[0_0_8px_rgba(96,165,250,0.6)] transition-all duration-1000 ease-out"
              />
              {filteredHistory.map((data, i) => (
                <circle
                  key={i}
                  cx={chartData.padding + i * ((chartData.width - chartData.padding * 2) / (filteredHistory.length - 1))}
                  cy={chartData.height - chartData.padding - (data.overall - 0) * ((chartData.height - chartData.padding * 2) / 100)}
                  r="6"
                  fill={categories[0].color}
                  stroke="#020617"
                  strokeWidth="2"
                  className="transition-all duration-1000 ease-out hover:scale-125 hover:fill-white"
                >
                  <title>{`Date: ${formatDate(data.timestamp)}, Score: ${data.overall}%`}</title>
                </circle>
              ))}

              {/* Data Points and Lines for Categories */}
              {chartData.categoryLines.map((line, lineIdx) => (
                <polyline
                  key={lineIdx}
                  fill="none"
                  stroke={line.color}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  points={line.points}
                  className="opacity-50 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] transition-all duration-1000 ease-out"
                />
              ))}

              {/* X-axis labels (Start and End Dates) */}
              {filteredHistory.length > 0 && (
                <>
                  <text x={chartData.padding} y={chartData.height} fontSize="10" fill="#a0aec0" textAnchor="start">
                    {formatDate(filteredHistory[0].timestamp)}
                  </text>
                  <text x={chartData.width - chartData.padding} y={chartData.height} fontSize="10" fill="#a0aec0" textAnchor="end">
                    {formatDate(filteredHistory[filteredHistory.length - 1].timestamp)}
                  </text>
                </>
              )}

              {/* Y-axis labels (Min/Max Scores) */}
              <text x={0} y={chartData.height - chartData.padding + 5} fontSize="10" fill="#a0aec0" textAnchor="start">0%</text>
              <text x={0} y={chartData.padding} fontSize="10" fill="#a0aec0" textAnchor="start">100%</text>

            </svg>
            
            <div className="flex justify-around mt-8 text-center text-sm">
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">평균 GEIS</span>
                    <span className="text-xl font-orbitron font-black text-blue-400 mt-1">{avgOverallScore}%</span>
                </div>
                <div className="flex flex-col items-center max-w-xs text-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">주요 인사이트</span>
                    <p className="text-sm text-slate-300 font-semibold mt-1 leading-relaxed">{getInsight}</p>
                </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-slate-500 text-sm">
            데이터가 부족하여 트렌드를 분석할 수 없습니다. 더 많은 건강 데이터를 입력해 주세요.
          </div>
        )}
      </div>
    </section>
  );
};

export default EnergyTrendChart;
