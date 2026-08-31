import { ArrowRight, Flame, ShieldAlert, Sparkles, Trophy } from 'lucide-react';
import React, { useEffect } from 'react';
import { LevelStats } from '../types';

interface LevelClearModalProps {
  level: number;
  levelStats: LevelStats;
  onNextLevel: () => void;
}

export const LevelClearModal: React.FC<LevelClearModalProps> = ({
  level,
  levelStats,
  onNextLevel,
}) => {
  // Allow Enter key to proceed
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onNextLevel();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onNextLevel]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none animate-fade-in">
      <div className="w-full max-w-md flex flex-col items-center gap-6 bg-[#111]/95 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl box-glow-cyan text-center">
        {/* Celebration Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-lg shadow-yellow-500/25 animate-bounce">
            <Trophy className="w-8 h-8 drop-shadow-md" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 amber-glow">
            LEVEL CLEAR!
          </h2>
          <p className="text-[10px] sm:text-xs font-black text-cyan-400 uppercase tracking-[0.25em] font-mono-arcade">
            SECTOR {level.toString().padStart(2, '0')} SECURED
          </p>
        </div>

        {/* Stats Breakdown */}
        <div className="w-full flex flex-col gap-2.5 bg-[#0a0a0a] p-4 rounded-2xl border border-white/5 text-sm">
          <div className="flex justify-between items-center stat-box-red py-0.5">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/50">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              ENEMIES DEFEATED:
            </span>
            <span className="font-mono font-bold text-white text-base">{levelStats.enemiesKilled}</span>
          </div>

          <div className="flex justify-between items-center stat-box-yellow py-0.5">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/50">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              BLOCKS DESTROYED:
            </span>
            <span className="font-mono font-bold text-white text-base">{levelStats.blocksDestroyed}</span>
          </div>

          <div className="flex justify-between items-center stat-box py-0.5">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/50">
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
              TIME BONUS:
            </span>
            <span className="font-mono font-bold text-cyan-400 text-base">
              +{levelStats.timeBonus} ({levelStats.timeRemaining}s)
            </span>
          </div>

          {levelStats.comboBonus > 0 && (
            <div className="flex justify-between items-center stat-box-pink py-0.5">
              <span className="text-xs font-black uppercase tracking-wider text-white/50">COMBO BONUS:</span>
              <span className="font-mono font-bold text-pink-400 text-base">+{levelStats.comboBonus}</span>
            </div>
          )}

          <div className="h-px bg-white/10 my-1" />

          <div className="flex justify-between items-center text-base font-bold px-1">
            <span className="text-xs font-black uppercase tracking-widest text-white/60">SECTOR SCORE:</span>
            <span className="font-mono font-black text-2xl text-yellow-400">+{levelStats.totalLevelScore}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onNextLevel}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black italic text-lg tracking-wider uppercase shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer border border-emerald-300/30"
        >
          <span>NEXT SECTOR</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
