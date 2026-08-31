import { Home, RotateCcw, Skull, Trophy } from 'lucide-react';
import React from 'react';
import { GameStats } from '../types';

interface GameOverModalProps {
  stats: GameStats;
  onRetry: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRetry,
  onMainMenu,
}) => {
  const isNewRecord = stats.score >= stats.bestScore && stats.score > 0;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-fade-in">
      <div className="w-full max-w-md flex flex-col items-center gap-6 bg-[#111]/95 border border-red-500/40 p-6 sm:p-8 rounded-3xl shadow-2xl box-glow-red text-center">
        {/* Skull Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-red-950/60 text-red-500 border border-red-500/50 animate-pulse">
            <Skull className="w-9 h-9 drop-shadow-md" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-red-500 arcade-glow">
            GAME OVER
          </h2>
          {isNewRecord ? (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-black uppercase tracking-wider animate-bounce">
              <Trophy className="w-3.5 h-3.5" />
              <span>NEW PERSONAL BEST!</span>
            </div>
          ) : (
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">
              UNIT DESTROYED
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="w-full flex flex-col gap-2.5 bg-[#0a0a0a] p-4 rounded-2xl border border-white/5 text-sm">
          <div className="flex justify-between items-center stat-box-yellow py-0.5">
            <span className="text-xs font-black uppercase tracking-wider text-white/50">FINAL SCORE:</span>
            <span className="font-mono font-black text-2xl text-yellow-400">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center stat-box-pink py-0.5">
            <span className="text-xs font-black uppercase tracking-wider text-white/50">SECTOR REACHED:</span>
            <span className="font-mono font-bold text-pink-400 text-base">
              SECTOR {stats.level.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex justify-between items-center stat-box py-0.5">
            <span className="text-xs font-black uppercase tracking-wider text-white/50">BLOCKS DESTROYED:</span>
            <span className="font-mono font-bold text-white text-base">
              {stats.blocksDestroyed}
            </span>
          </div>

          <div className="flex justify-between items-center stat-box-red py-0.5">
            <span className="text-xs font-black uppercase tracking-wider text-white/50">ENEMIES DEFEATED:</span>
            <span className="font-mono font-bold text-white text-base">
              {stats.enemiesKilled}
            </span>
          </div>

          <div className="h-px bg-white/10 my-1" />

          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black uppercase tracking-widest text-white/40">ALL-TIME BEST:</span>
            <span className="font-mono font-bold text-white/80 text-lg">
              {stats.bestScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black italic text-lg tracking-wider uppercase shadow-lg shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer border border-amber-300/20"
          >
            <RotateCcw className="w-5 h-5" />
            <span>TRY AGAIN</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-3 px-5 rounded-xl bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white font-bold text-sm tracking-wider uppercase border border-white/10 hover:border-white/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-white/60" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
