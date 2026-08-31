import { Flame, Heart, Pause, Shield, Sparkles, Swords, Trophy, Zap } from 'lucide-react';
import React from 'react';
import { GameStats, Player } from '../types';

interface HUDProps {
  player: Player;
  player2?: Player | null;
  stats: GameStats;
  timeRemaining: number;
  comboCount: number;
  levelTitle: string;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  player2,
  stats,
  timeRemaining,
  comboCount,
  levelTitle,
  onPause,
}) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isUrgent = timeRemaining <= 20;
  const isDual = stats.gameMode === 'DUAL' && player2;

  if (isDual && player2) {
    return (
      <header className="w-full max-w-5xl mx-auto flex flex-col gap-2 px-3 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-b from-[#111] to-[#050505] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md select-none">
        {/* Dual Mode Header Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Player 1 Quick Card */}
          <div className="flex items-center gap-3 bg-cyan-950/40 px-3 py-1.5 rounded-xl border border-cyan-500/30">
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-widest text-cyan-400">P1 (CYAN)</span>
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
            </div>
            {player.isInvincible && (
              <div className="flex items-center gap-1 bg-yellow-500/20 px-1.5 py-0.5 rounded text-yellow-300 text-[10px] font-black animate-pulse">
                <Sparkles className="w-3 h-3" />
                <span>STAR</span>
              </div>
            )}
            <div className="text-xs font-mono text-cyan-300/80 pl-2 border-l border-cyan-500/20 hidden sm:block">
              💣{player.maxBombs} 🔥{player.fireRange} ⚡+{player.speedLevel * 15}%
            </div>
          </div>

          {/* Center Match Score & Timer */}
          <div className="flex items-center gap-3 mx-auto">
            <div className="flex items-center gap-2 bg-[#000]/60 px-4 py-1.5 rounded-xl border border-white/10">
              <span className="text-xl sm:text-2xl font-black font-mono text-cyan-400">{stats.p1Wins || 0}</span>
              <span className="text-xs font-black tracking-widest text-white/40 uppercase">VS</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-rose-500">{stats.p2Wins || 0}</span>
            </div>

            <div className={`px-3 py-1 rounded-xl border font-mono font-bold text-sm sm:text-base ${
              isUrgent ? 'border-red-500/50 bg-red-950/30 text-red-400 animate-pulse' : 'border-white/10 bg-white/5 text-white'
            }`}>
              {timeFormatted}
            </div>

            <button
              onClick={onPause}
              className="p-2 rounded-xl bg-[#222] hover:bg-[#333] active:scale-95 text-white border border-white/10 transition cursor-pointer"
              title="Pause Game (ESC)"
            >
              <Pause className="w-4 h-4 fill-white" />
            </button>
          </div>

          {/* Player 2 Quick Card */}
          <div className="flex items-center gap-3 bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-500/30">
            <div className="text-xs font-mono text-rose-300/80 pr-2 border-r border-rose-500/20 hidden sm:block">
              💣{player2.maxBombs} 🔥{player2.fireRange} ⚡+{player2.speedLevel * 15}%
            </div>
            {player2.isInvincible && (
              <div className="flex items-center gap-1 bg-yellow-500/20 px-1.5 py-0.5 rounded text-yellow-300 text-[10px] font-black animate-pulse">
                <Sparkles className="w-3 h-3" />
                <span>STAR</span>
              </div>
            )}
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black tracking-widest text-rose-400">P2 (CRIMSON)</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Heart
                    key={idx}
                    className={`w-3.5 h-3.5 ${
                      idx < player2.lives
                        ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                        : 'text-neutral-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full max-w-5xl mx-auto flex flex-col gap-2.5 px-4 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-b from-[#111] to-[#050505] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md select-none">
      {/* Top Main Row: Bold Title + Stat Boxes */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 arcade-glow">
              BOMB RUSH
            </h1>
            <p className="text-[10px] sm:text-xs font-black tracking-[0.3em] text-cyan-400 mt-0.5 uppercase">
              PLANT. RUN. SURVIVE.
            </p>
          </div>
        </div>

        {/* Stat Boxes */}
        <div className="flex items-center gap-4 sm:gap-6 md:gap-8 flex-wrap">
          {/* Time Box */}
          <div className={isUrgent ? 'stat-box-red' : 'stat-box'}>
            <div className="text-[10px] font-black uppercase tracking-widest text-white/50">
              TIME REMAINING
            </div>
            <div
              className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight transition-colors ${
                isUrgent ? 'text-red-400 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]' : 'text-white'
              }`}
            >
              {timeFormatted}
            </div>
          </div>

          {/* Score Box */}
          <div className="stat-box-yellow">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/50">
              CURRENT SCORE
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-yellow-400 tracking-tight">
              {stats.score.toString().padStart(6, '0')}
            </div>
          </div>

          {/* Level / Sector Box */}
          <div className="stat-box-pink">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/50">
              SECTOR
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-pink-500 tracking-tight">
              {stats.level.toString().padStart(2, '0')}
            </div>
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="p-2.5 rounded-xl bg-[#222] hover:bg-[#333] active:scale-95 text-white border border-white/10 transition shadow-md cursor-pointer ml-auto sm:ml-0"
            title="Pause Game (ESC)"
            aria-label="Pause Game"
          >
            <Pause className="w-5 h-5 fill-white" />
          </button>
        </div>
      </div>

      {/* Bottom Sub-Bar: Vitals, Upgrades & Combos */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5 flex-wrap text-xs">
        {/* Vitals (Hearts & Shield & Star) */}
        <div className="flex items-center gap-3 bg-[#111] px-3 py-1.5 rounded-lg border border-white/5">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/50">VITALS:</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Heart
                key={idx}
                className={`w-4 h-4 transition-all duration-300 ${
                  idx < player.lives
                    ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                    : 'text-neutral-700'
                }`}
              />
            ))}
          </div>
          {player.hasShield && (
            <div className="flex items-center gap-1 pl-2 border-l border-white/10 text-cyan-400">
              <Shield className="w-3.5 h-3.5 fill-cyan-400/40 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              <span className="text-[10px] font-black tracking-wider text-cyan-400">SHIELD</span>
            </div>
          )}
          {player.isInvincible && (
            <div className="flex items-center gap-1 pl-2 border-l border-white/10 text-yellow-400 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 fill-yellow-400/40" />
              <span className="text-[10px] font-black tracking-wider text-yellow-300">STAR POWER</span>
            </div>
          )}
        </div>

        {/* Upgrades */}
        <div className="flex items-center gap-3 sm:gap-4 bg-[#111] px-3 py-1.5 rounded-lg border border-white/5 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/50 hidden sm:inline">UPGRADES:</span>
          
          <div className="flex items-center gap-1">
            <span className="text-white/60 text-xs">💣 BOMB</span>
            <span className="font-mono font-bold text-cyan-400">x{player.maxBombs}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-white/60 text-xs">🔥 FIRE</span>
            <span className="font-mono font-bold text-orange-400">x{player.fireRange}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-white/60 text-xs">⚡ SPD</span>
            <span className="font-mono font-bold text-yellow-400">+{player.speedLevel * 15}%</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-white/60 text-xs">🛡️ SHLD</span>
            <span className={`font-mono font-bold ${player.hasShield ? 'text-green-400' : 'text-neutral-500'}`}>
              {player.hasShield ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Level Subtitle & Combo */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="text-[11px] font-bold text-neutral-400 truncate max-w-[140px] sm:max-w-none">
            {levelTitle}
          </div>

          {comboCount >= 2 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 animate-bounce">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">COMBO</span>
              <span className="font-black italic text-sm text-cyan-400">x{comboCount}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
