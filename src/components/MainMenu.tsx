import { Bomb, HelpCircle, Maximize, Minimize, Play, Settings as SettingsIcon, Swords, Trophy, Users, Zap } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { GameStats } from '../types';

interface MainMenuProps {
  stats: GameStats;
  isFullscreen?: boolean;
  onPlaySolo: () => void;
  onPlayDual: () => void;
  onHowToPlay: () => void;
  onSettings: () => void;
  onToggleFullscreen?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  stats,
  isFullscreen,
  onPlaySolo,
  onPlayDual,
  onHowToPlay,
  onSettings,
  onToggleFullscreen,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background subtle particle animation for menu screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string; alpha: number }[] = [];
    const colors = ['#ef4444', '#f97316', '#06b6d4', '#818cf8', '#eab308'];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 20,
        vy: -Math.random() * 30 - 10,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    const render = () => {
      ctx.fillStyle = '#07060f';
      ctx.fillRect(0, 0, width, height);

      // Subtle cyber grid
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Floating particles
      particles.forEach(p => {
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <main className="relative w-full h-full min-h-[520px] flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center gap-5 bg-[#111]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl box-glow-cyan">
        {/* Animated Brand Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 animate-pulse">
            <Bomb className="w-10 h-10 text-white drop-shadow-md" />
          </div>

          <h1 className="text-5xl sm:text-6xl font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 arcade-glow">
            BOMB RUSH
          </h1>

          <p className="text-xs sm:text-sm font-black tracking-[0.3em] uppercase text-cyan-400 font-mono-arcade mt-1">
            PLANT. RUN. SURVIVE.
          </p>
        </div>

        {/* High Score / Stats Badges */}
        <div className="w-full grid grid-cols-2 gap-3">
          <div className="flex flex-col items-start p-3 rounded-xl bg-[#0a0a0a] border border-white/5 stat-box-yellow">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>SOLO BEST</span>
            </div>
            <div className="text-xl font-mono font-bold text-yellow-400">
              {stats.bestScore.toLocaleString()}
            </div>
          </div>

          <div className="flex flex-col items-start p-3 rounded-xl bg-[#0a0a0a] border border-white/5 stat-box-pink">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">
              <Zap className="w-3.5 h-3.5 text-pink-500" />
              <span>TOP SECTOR</span>
            </div>
            <div className="text-xl font-mono font-bold text-pink-500">
              SECTOR {stats.highestLevel}
            </div>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Solo Mode Button */}
          <button
            onClick={onPlaySolo}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black italic text-lg tracking-wider uppercase shadow-lg shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-cyan-300/30"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>SOLO MISSION</span>
          </button>

          {/* Dual Player Mode Button */}
          <button
            onClick={onPlayDual}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black italic text-lg tracking-wider uppercase shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-red-300/30"
          >
            <Swords className="w-5 h-5 text-white" />
            <span>DUAL PLAYER BATTLE</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5 mt-1">
            <button
              onClick={onHowToPlay}
              className="py-2.5 px-4 rounded-xl bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white font-bold text-xs sm:text-sm tracking-wider uppercase border border-white/10 hover:border-white/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>HOW TO PLAY</span>
            </button>

            <button
              onClick={onSettings}
              className="py-2.5 px-4 rounded-xl bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white font-bold text-xs sm:text-sm tracking-wider uppercase border border-white/10 hover:border-white/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <SettingsIcon className="w-4 h-4 text-purple-400" />
              <span>SETTINGS</span>
            </button>
          </div>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="w-full py-2 px-4 rounded-xl bg-[#14141d] hover:bg-[#1f1f2e] text-white/80 hover:text-cyan-400 font-bold text-xs tracking-wider uppercase border border-white/5 hover:border-cyan-500/30 transition flex items-center justify-center gap-2 cursor-pointer mt-0.5"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isFullscreen ? 'EXIT FULLSCREEN' : 'ENTER FULLSCREEN MODE'}</span>
            </button>
          )}
        </div>

        {/* Dual Mode Quick Hint */}
        <div className="p-2.5 w-full rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-white/50 flex flex-col gap-1 text-left font-mono">
          <div className="flex items-center gap-1 text-cyan-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
            <span>P1 (CYAN): WASD + SPACE / F</span>
          </div>
          <div className="flex items-center gap-1 text-rose-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
            <span>P2 (CRIMSON): ARROWS + ENTER / NUM0</span>
          </div>
        </div>
      </div>
    </main>
  );
};
