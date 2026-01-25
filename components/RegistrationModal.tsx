
import React, { useState } from 'react';

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
}

interface RegistrationModalProps {
  onRegister: (profile: UserProfile) => void;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ onRegister }) => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: 25,
    gender: 'Other',
    height: 175,
    weight: 70,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.name.trim()) {
      onRegister(profile);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 p-10 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] animate-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-blue-600/20 rounded-2xl mb-4 border border-blue-500/30">
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2" />
            </svg>
          </div>
          <h2 className="text-3xl font-orbitron font-black text-white tracking-tighter">QUANTUM IDENTITY</h2>
          <p className="text-slate-400 text-sm mt-2 font-medium">시스템 활성화를 위한 기본 신체 프로필을 등록하십시오.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">이름 / 식별자</label>
            <input 
              type="text" 
              required
              value={profile.name}
              onChange={e => setProfile({...profile, name: e.target.value})}
              placeholder="Full Name"
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">나이</label>
              <input 
                type="number" 
                required
                value={profile.age}
                onChange={e => setProfile({...profile, age: Number(e.target.value)})}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">성별</label>
              <select 
                value={profile.gender}
                onChange={e => setProfile({...profile, gender: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-blue-500 outline-none appearance-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">신장 (cm)</label>
              <input 
                type="number" 
                required
                value={profile.height}
                onChange={e => setProfile({...profile, height: Number(e.target.value)})}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">체중 (kg)</label>
              <input 
                type="number" 
                required
                value={profile.weight}
                onChange={e => setProfile({...profile, weight: Number(e.target.value)})}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-3xl shadow-2xl shadow-blue-900/40 transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
          >
            시스템 등록 및 부팅
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationModal;
