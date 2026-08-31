import { Bomb, Flame, Heart, Keyboard, Shield, Sparkles, Swords, Zap } from 'lucide-react';
import React from 'react';
import { GameStats, Player } from '../types';

interface LeftHUDProps {
  player: Player;
  player2?: Player | null;
  stats: GameStats;
  levelTitle: string;
}

export const LeftHUD: React.FC<LeftHUDProps> = ({
  player,
  player2,
  stats,
  levelTitle,
}) => {
  const isDual = stats.gameMode === 'DUAL' && player2;

  return (
    <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 flex flex-col justify-between gap-3 p-3 sm:p-4 bg-[#0a0914]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl select-none overflow-y-auto max-h-full">
      {/* Top Section: Arcade Branding & Sector Title */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/30 animate-pulse">
              <Bomb className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-mono-arcade">
                BOMB RUSH
              </span>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-cyan-300">
            {isDual ? '1v1 BATTLE' : 'SOLO'}
          </span>
        </div>

        {/* Sector / Round Status Badge */}
        <div className="p-2.5 rounded-xl bg-[#111] border border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
              {isDual ? 'CURRENT ROUND' : 'MISSION SECTOR'}
            </span>
            <span className="text-xs font-bold text-cyan-400 truncate max-w-[170px]">
              {levelTitle}
            </span>
          </div>
          <div className="text-xl font-mono font-black text-pink-500">
            {isDual ? `R${stats.round}` : `#${stats.level.toString().padStart(2, '0')}`}
          </div>
        </div>
      </div>

      {/* Middle Section: Player 1 (and Player 2 if Dual) Telemetry */}
      <div className="flex flex-col gap-3">
        {/* Player 1 Card (Cyan) */}
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-cyan-950/25 border border-cyan-500/30">
          {/* Header & Lives */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
              <span className="text-xs font-black tracking-wider text-cyan-400">
                {isDual ? 'PLAYER 1 (CYAN)' : 'CYAN ROBOT'}
              </span>
            </div>

            {/* Hearts */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Heart
                  key={idx}
                  className={`w-4 h-4 transition-all duration-300 ${
                    idx < player.lives
                      ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                      : 'text-neutral-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Active Buffs (Shield / Star) */}
          <div className="flex items-center gap-2 text-[10px] font-bold">
            {player.hasShield ? (
              <div className="flex items-center gap-1 bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-400/40">
                <Shield className="w-3 h-3 fill-cyan-400/40" />
                <span>SHIELD ACTIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-neutral-900 text-neutral-500 px-2 py-0.5 rounded-md">
                <Shield className="w-3 h-3 text-neutral-600" />
                <span>NO SHIELD</span>
              </div>
            )}

            {player.isInvincible && (
              <div className="flex items-center gap-1 bg-yellow-500/25 text-yellow-300 px-2 py-0.5 rounded-md border border-yellow-400/50 animate-pulse">
                <Sparkles className="w-3 h-3" />
                <span>STAR POWER</span>
              </div>
            )}
          </div>

          {/* Player 1 Upgrades Grid */}
          <div className="grid grid-cols-3 gap-1.5 text-center mt-1">
            {/* Bombs */}
            <div className="p-1.5 rounded-lg bg-[#0e0e18] border border-white/5">
              <div className="text-[9px] font-black text-white/50">BOMBS</div>
              <div className={`text-sm font-mono font-bold ${player.maxBombs >= 5 ? 'text-purple-300' : 'text-cyan-400'}`}>
                {player.maxBombs >= 5 ? '5 MAX' : `x${player.maxBombs}`}
              </div>
            </div>

            {/* Fire */}
            <div className="p-1.5 rounded-lg bg-[#0e0e18] border border-white/5">
              <div className="text-[9px] font-black text-white/50">FIRE</div>
              <div className={`text-sm font-mono font-bold ${player.fireRange >= 5 ? 'text-orange-300' : 'text-orange-400'}`}>
                {player.fireRange >= 5 ? '5 MAX' : `x${player.fireRange}`}
              </div>
            </div>

            {/* Speed */}
            <div className="p-1.5 rounded-lg bg-[#0e0e18] border border-white/5">
              <div className="text-[9px] font-black text-white/50">SPEED</div>
              <div className={`text-sm font-mono font-bold ${player.speedLevel >= 4 ? 'text-yellow-300' : 'text-yellow-400'}`}>
                {player.speedLevel >= 4 ? '+60% MAX' : `+${player.speedLevel * 15}%`}
              </div>
            </div>
          </div>
        </div>

        {/* Player 2 Card if in Dual Mode */}
        {isDual && player2 && (
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-rose-950/25 border border-rose-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
                <span className="text-xs font-black tracking-wider text-rose-400">
                  PLAYER 2 (CRIMSON)
                </span>
              </div>

              {/* Hearts */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Heart
                    key={idx}
                    className={`w-4 h-4 transition-all duration-300 ${
                      idx < player2.lives
                        ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                        : 'text-neutral-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Active Buffs */}
            <div className="flex items-center gap-2 text-[10px] font-bold">
              {player2.hasShield ? (
                <div className="flex items-center gap-1 bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md border border-rose-400/40">
                  <Shield className="w-3 h-3 fill-rose-400/40" />
                  <span>SHIELD ACTIVE</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-neutral-900 text-neutral-500 px-2 py-0.5 rounded-md">
                  <Shield className="w-3 h-3 text-neutral-600" />
                  <span>NO SHIELD</span>
                </div>
              )}

              {player2.isInvincible && (
                <div className="flex items-center gap-1 bg-yellow-500/25 text-yellow-300 px-2 py-0.5 rounded-md border border-yellow-400/50 animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  <span>STAR POWER</span>
                </div>
              )}
            </div>

            {/* Player 2 Upgrades */}
            <div className="grid grid-cols-3 gap-1.5 text-center mt-1">
              <div className="p-1.5 rounded-lg bg-[#0e0e18] border border-white/5">
                <div className="text-[9px] font-black text-white/50">BOMBS</div>
                <div className={`text-sm font-mono font-bold ${player2.maxBombs >= 5 ? 'text-purple-300' : 'text-rose-400'}`}>
                  {player2.maxBombs >= 5 ? '5 MAX' : `x${player2.maxBombs}`}
                </div>
              </div>

              <div className="p-1.5 rounded-lg bg-[#0e0e18] border border-white/5">
                <div className="text-[9px] font-black text-white/50">FIRE</div>
                <div className={`text-sm font-mono font-bold ${player2.fireRange >= 5 ? 'text-orange-300' : 'text-orange-400'}`}>
                  {player2.fireRange >= 5 ? '5 MAX' : `x${player2.fireRange}`}
                </div>
              </div>

              <div className="p-1.5 rounded-lg bg-[#0e0e18] border border-white/5">
                <div className="text-[9px] font-black text-white/50">SPEED</div>
                <div className={`text-sm font-mono font-bold ${player2.speedLevel >= 4 ? 'text-yellow-300' : 'text-yellow-400'}`}>
                  {player2.speedLevel >= 4 ? '+60% MAX' : `+${player2.speedLevel * 15}%`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Tactical Controls Guide */}
      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1.5 text-[11px] font-mono text-white/60">
        <div className="flex items-center gap-1 text-white/40 text-[9px] font-black uppercase tracking-wider">
          <Keyboard className="w-3 h-3" />
          <span>TACTICAL CONTROLS</span>
        </div>
        <div className="flex justify-between items-center text-cyan-300">
          <span>{isDual ? 'P1 MOVE:' : 'MOVE:'}</span>
          <span className="font-bold text-white">W A S D</span>
        </div>
        <div className="flex justify-between items-center text-cyan-300">
          <span>{isDual ? 'P1 BOMB:' : 'BOMB:'}</span>
          <span className="font-bold text-cyan-400">SPACE / F</span>
        </div>
        {isDual && (
          <>
            <div className="flex justify-between items-center text-rose-300 pt-1 border-t border-white/5">
              <span>P2 MOVE:</span>
              <span className="font-bold text-white">ARROWS</span>
            </div>
            <div className="flex justify-between items-center text-rose-300">
              <span>P2 BOMB:</span>
              <span className="font-bold text-rose-400">ENTER / NUM0</span>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
