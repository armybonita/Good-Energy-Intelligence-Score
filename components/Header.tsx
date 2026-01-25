
import React from 'react';
import { UserProfile } from './RegistrationModal';

interface HeaderProps {
  profile: UserProfile | null;
}

const Header: React.FC<HeaderProps> = ({ profile }) => {
  return (
    <header className="bg-black/80 backdrop-blur-xl border-b border-white/10 p-5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500 rounded-lg blur-lg opacity-40 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-700 rounded-lg flex items-center justify-center shadow-xl border border-white/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-orbitron font-black tracking-tighter text-white">
              GOOD ENERGY <span className="text-blue-500">INTELLIGENCE</span>
            </h1>
            <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-[0.3em]">Quantum Health Engine v3.0</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {profile ? (
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-[10px] font-black border border-white/20">
                {profile.name[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white">{profile.name}</span>
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Verified Identity</span>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Status</span>
              <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                AWAITING REGISTRATION
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
