import {
  Heart,
  Maximize,
  Minimize,
  Pause,
  Shield,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import React from 'react';
import { GameStats, Player } from '../types';

interface CompactTopHUDProps {
  player: Player;
  player2?: Player | null;
  stats: GameStats;
  timeRemaining: number;
  comboCount: number;
  enemyCount: number;
  levelTitle: string;
  isFullscreen: boolean;
  soundEnabled: boolean;
  onToggleFullscreen: () => void;
  onToggleSound: () => void;
  onPause: () => void;
}

export const CompactTopHUD: React.FC<CompactTopHUDProps> = ({
  player,
  player2,
  stats,
  timeRemaining,
  comboCount,
  enemyCount,
  levelTitle,
  isFullscreen,
  soundEnabled,
  onToggleFullscreen,
  onToggleSound,
  onPause,
}) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isUrgent = timeRemaining <= 20;
  const isDual = stats.gameMode === 'DUAL' && player2;

  return (
    <header className="w-full flex md:hidden items-center justify-between gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 pt-safe bg-[#0a0914]/95 border-b border-white/10 select-none z-30 flex-shrink-0">
      {/* Left side: Player 1 Vitals & Upgrades */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Heart
              key={idx}
              className={`w-3.5 h-3.5 ${
                idx < player.lives
                  ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                  : 'text-neutral-700'
              }`}
            />
          ))}
        </div>

        {player.hasShield && (
          <Shield className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/50" />
        )}
        {player.isInvincible && (
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
        )}

        <div className="text-[10px] font-mono text-cyan-300/90 pl-1 border-l border-white/10 hidden sm:block">
          💣{player.maxBombs} 🔥{player.fireRange}
        </div>

        {isDual && player2 && (
          <div className="flex items-center gap-1 pl-2 border-l border-white/10">
            <span className="text-[9px] font-black text-rose-400">P2:</span>
            {Array.from({ length: 3 }).map((_, idx) => (
              <Heart
                key={idx}
                className={`w-3 h-3 ${
                  idx < player2.lives
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-neutral-800'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Center: Timer & Score */}
      <div className="flex items-center gap-2">
        <div className={`px-2 py-0.5 rounded-lg border font-mono font-bold text-xs ${
          isUrgent ? 'border-red-500/50 bg-red-950/30 text-red-400 animate-pulse' : 'border-white/10 bg-white/5 text-white'
        }`}>
          {timeFormatted}
        </div>

        {!isDual && (
          <div className="text-xs font-mono font-bold text-yellow-400 hidden sm:block">
            {stats.score.toString().padStart(5, '0')}
          </div>
        )}

        {isDual && (
          <div className="text-xs font-mono font-bold flex items-center gap-1">
            <span className="text-cyan-400">{stats.p1Wins || 0}</span>
            <span className="text-white/40">-</span>
            <span className="text-rose-400">{stats.p2Wins || 0}</span>
          </div>
        )}
      </div>

      {/* Right side: Fullscreen & Pause Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-lg bg-[#222] hover:bg-[#333] active:scale-95 text-white border border-white/10 cursor-pointer"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize className="w-3.5 h-3.5 text-cyan-400" />}
        </button>

        <button
          onClick={onPause}
          className="p-1.5 rounded-lg bg-[#222] hover:bg-[#333] active:scale-95 text-white border border-white/10 cursor-pointer"
          title="Pause Game"
        >
          <Pause className="w-3.5 h-3.5 fill-white" />
        </button>
      </div>
    </header>
  );
};
