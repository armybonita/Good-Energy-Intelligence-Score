
import React, { useState } from 'react';

export interface Goal { 
  id: string; 
  title: string; 
  category: string; 
  currentValue: number; 
  targetValue: number; 
  unit: string; 
}

interface PersonalGoalsProps {
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
}

const PersonalGoals: React.FC<PersonalGoalsProps> = ({ goals, onAddGoal }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    category: 'biomarker',
    targetValue: 100,
    unit: 'pts'
  });

  const categories = [
    { value: 'biomarker', label: 'Biomarkers' },
    { value: 'exercise', label: 'Exercise' },
    { value: 'mind', label: 'Mind' },
    { value: 'sleep', label: 'Sleep' },
    { value: 'food', label: 'Nutrition' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;
    
    onAddGoal({
      ...newGoal,
      currentValue: 0
    });
    
    setNewGoal({
      title: '',
      category: 'biomarker',
      targetValue: 100,
      unit: 'pts'
    });
    setIsAdding(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Active Targets</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
            isAdding 
              ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' 
              : 'bg-blue-500/10 border-blue-500/50 text-blue-500 hover:bg-blue-500 hover:text-white'
          }`}
        >
          {isAdding ? 'Cancel' : '+ New Target'}
        </button>
      </div>

      {isAdding && (
        <form 
          onSubmit={handleSubmit}
          className="p-8 bg-gradient-to-br from-slate-900 to-black border border-blue-500/30 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-4 duration-500"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Goal Title</label>
              <input 
                type="text"
                required
                value={newGoal.title}
                onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                placeholder="e.g. Deep Sleep Master"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
              <select 
                value={newGoal.category}
                onChange={e => setNewGoal({...newGoal, category: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none appearance-none"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Value</label>
              <input 
                type="number"
                required
                value={newGoal.targetValue}
                onChange={e => setNewGoal({...newGoal, targetValue: Number(e.target.value)})}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Unit</label>
              <input 
                type="text"
                required
                value={newGoal.unit}
                onChange={e => setNewGoal({...newGoal, unit: e.target.value})}
                placeholder="e.g. hrs, steps, pts"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-900/40 transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
          >
            Deploy Target
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
          return (
            <div key={goal.id} className="group relative p-8 bg-black/40 border border-white/5 rounded-[3rem] shadow-2xl hover:border-blue-500/30 transition-all duration-500">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{goal.category}</span>
                  <h3 className="text-lg font-bold text-white mt-1">{goal.title}</h3>
                </div>
                <div className="text-2xl font-orbitron font-black text-blue-400">{progress}%</div>
              </div>
              
              <div className="relative h-4 bg-slate-900 rounded-full overflow-hidden shadow-inner border border-white/5">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-700 to-blue-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 blur-[2px] shadow-[0_0_10px_white]"></div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 text-[11px] font-bold text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="text-white">{goal.currentValue}</span>
                  <span>/ {goal.targetValue} {goal.unit}</span>
                </div>
                <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-[9px] uppercase tracking-tighter">
                  {progress >= 100 ? 'Status: Optimized' : 'Status: Processing'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PersonalGoals;
