import { ArrowLeft, Bomb, Flame, Heart, Shield, Sparkles, Swords, Zap } from 'lucide-react';
import React from 'react';

interface HowToPlayModalProps {
  onBack: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onBack }) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg my-auto flex flex-col gap-4 bg-[#111]/95 border border-white/10 p-5 sm:p-7 rounded-3xl shadow-2xl box-glow-cyan max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-[#111] py-1 z-10">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#222] hover:bg-[#333] text-white border border-white/10 transition cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white">
              HOW TO PLAY
            </h2>
          </div>
          <div className="w-9" />
        </div>

        {/* Tactical Controls for Solo and Dual Mode */}
        <div className="flex flex-col gap-2 bg-[#0a0a0a] p-4 rounded-2xl border border-white/5 stat-box">
          <h3 className="text-xs font-black uppercase text-cyan-400 tracking-widest">TACTICAL CONTROLS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col p-2.5 rounded-xl bg-[#1a1a1a] border border-cyan-500/30">
              <span className="text-[10px] font-black uppercase text-cyan-400 mb-1">PLAYER 1 (CYAN):</span>
              <span className="font-mono font-bold text-white">MOVE: W / A / S / D</span>
              <span className="font-mono font-bold text-cyan-400">BOMB: SPACE / F / J</span>
            </div>

            <div className="flex flex-col p-2.5 rounded-xl bg-[#1a1a1a] border border-rose-500/30">
              <span className="text-[10px] font-black uppercase text-rose-400 mb-1">PLAYER 2 (CRIMSON):</span>
              <span className="font-mono font-bold text-white">MOVE: ARROW KEYS</span>
              <span className="font-mono font-bold text-rose-400">BOMB: ENTER / NUM 0 / L</span>
            </div>
          </div>
        </div>

        {/* Game Modes */}
        <div className="flex flex-col gap-2 bg-[#0a0a0a] p-4 rounded-2xl border border-white/5 text-xs stat-box-yellow">
          <h3 className="text-xs font-black uppercase text-yellow-400 tracking-widest">GAME MODES</h3>
          <ul className="space-y-1.5 text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Solo Mission:</strong> Progress through increasingly intense sectors, blast drones, trigger combos, and climb the high scores.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span><strong>Dual Player Battle:</strong> Intense 1v1 local multiplayer arena! Trap your opponent, steal powerups, and win rounds.</span>
            </li>
          </ul>
        </div>

        {/* Power-ups Guide */}
        <div className="flex flex-col gap-2 bg-[#0a0a0a] p-4 rounded-2xl border border-white/5 stat-box-pink">
          <h3 className="text-xs font-black uppercase text-pink-500 tracking-widest">POWER-UPS FROM BLOCKS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#1a1a1a] border border-white/5">
              <span className="text-lg">🔥</span>
              <div>
                <div className="font-black italic text-orange-400">FIRE UP</div>
                <div className="text-white/50 text-[10px]">+1 Blast Range (Max 5)</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#1a1a1a] border border-white/5">
              <span className="text-lg">💣</span>
              <div>
                <div className="font-black italic text-purple-400">BOMB UP</div>
                <div className="text-white/50 text-[10px]">+1 Active Bomb (Max 5)</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#1a1a1a] border border-white/5">
              <span className="text-lg">⚡</span>
              <div>
                <div className="font-black italic text-yellow-400">SPEED UP</div>
                <div className="text-white/50 text-[10px]">+15% Speed (Max +70%)</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#1a1a1a] border border-white/5">
              <span className="text-lg">🛡️</span>
              <div>
                <div className="font-black italic text-cyan-400">FORCE SHIELD</div>
                <div className="text-white/50 text-[10px]">Absorbs 1 hit / blast</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#1a1a1a] border border-white/5">
              <span className="text-lg">❤️</span>
              <div>
                <div className="font-black italic text-rose-400">EXTRA LIFE</div>
                <div className="text-white/50 text-[10px]">+1 Robot Chassis Life (Max 3)</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-gradient-to-r from-amber-950/60 to-yellow-950/40 border border-yellow-500/40">
              <span className="text-lg animate-pulse">⭐</span>
              <div>
                <div className="font-black italic text-yellow-300">STAR INVINCIBLE</div>
                <div className="text-yellow-200/60 text-[10px]">Rare! 8s immunity & crushes enemies</div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black italic text-sm tracking-wider uppercase border border-cyan-300/30 transition cursor-pointer shadow-lg shadow-cyan-500/20"
        >
          READY FOR DEPLOYMENT
        </button>
      </div>
    </div>
  );
};
