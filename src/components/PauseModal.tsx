import { Home, Play, RotateCcw, Settings as SettingsIcon } from 'lucide-react';
import React from 'react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onSettings,
  onMainMenu,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 bg-[#111]/95 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl box-glow-cyan text-center">
        <div>
          <h2 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 arcade-glow">
            PAUSED
          </h2>
          <p className="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase mt-1">
            MISSION SUSPENDED
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black italic text-base tracking-wider uppercase shadow-lg shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer border border-cyan-300/30"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>RESUME MISSION</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-5 rounded-xl bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white font-bold text-sm tracking-wider uppercase border border-white/10 hover:border-white/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-yellow-400" />
            <span>RESTART SECTOR</span>
          </button>

          <button
            onClick={onSettings}
            className="w-full py-3 px-5 rounded-xl bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white font-bold text-sm tracking-wider uppercase border border-white/10 hover:border-white/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4 text-purple-400" />
            <span>SETTINGS</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-3 px-5 rounded-xl bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white font-bold text-sm tracking-wider uppercase border border-white/10 hover:border-white/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-rose-400" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
