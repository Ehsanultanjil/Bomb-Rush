import {
  Flame,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  Skull,
  Swords,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import React from 'react';
import { GameStats } from '../types';

interface RightHUDProps {
  stats: GameStats;
  timeRemaining: number;
  comboCount: number;
  enemyCount: number;
  isFullscreen: boolean;
  soundEnabled: boolean;
  onToggleFullscreen: () => void;
  onToggleSound: () => void;
  onPause: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
}

export const RightHUD: React.FC<RightHUDProps> = ({
  stats,
  timeRemaining,
  comboCount,
  enemyCount,
  isFullscreen,
  soundEnabled,
  onToggleFullscreen,
  onToggleSound,
  onPause,
  onRestart,
  onOpenSettings,
}) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isUrgent = timeRemaining <= 20;
  const isDual = stats.gameMode === 'DUAL';

  return (
    <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 flex flex-col justify-between gap-3 p-3 sm:p-4 bg-[#0a0914]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl select-none overflow-y-auto max-h-full">
      {/* Top Section: Timer & Score Modules */}
      <div className="flex flex-col gap-2.5">
        {/* Tactical Mission Timer */}
        <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
          isUrgent
            ? 'bg-red-950/30 border-red-500/60 text-red-400 shadow-lg shadow-red-500/20 animate-pulse'
            : 'bg-[#111] border-white/10 text-white'
        }`}>
          <span className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-0.5">
            TIME REMAINING
          </span>
          <span className={`text-3xl sm:text-4xl font-mono font-black tracking-tight ${
            isUrgent ? 'text-red-400' : 'text-white'
          }`}>
            {timeFormatted}
          </span>
          {isUrgent && (
            <span className="text-[10px] font-mono font-bold text-red-400 mt-0.5 tracking-wider">
              ⚠️ CRITICAL COUNTDOWN
            </span>
          )}
        </div>

        {/* Current Score / Battle Match Score */}
        {isDual ? (
          <div className="p-3 rounded-xl bg-[#111] border border-white/10 flex flex-col gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/50 text-center">
              MATCH SCORE (1v1)
            </span>
            <div className="flex items-center justify-around">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-cyan-400">P1 (CYAN)</span>
                <span className="text-2xl font-mono font-black text-cyan-400">
                  {stats.p1Wins || 0}
                </span>
              </div>
              <span className="text-xs font-black text-white/30">VS</span>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-rose-400">P2 (CRIMSON)</span>
                <span className="text-2xl font-mono font-black text-rose-400">
                  {stats.p2Wins || 0}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#111] border border-white/10 flex flex-col gap-1 stat-box-yellow">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
                MISSION SCORE
              </span>
              <div className="flex items-center gap-1 text-[10px] font-mono text-yellow-400/80">
                <Trophy className="w-3 h-3 text-yellow-400" />
                <span>BEST: {stats.bestScore.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-yellow-400 tracking-tight">
              {stats.score.toString().padStart(6, '0')}
            </div>
          </div>
        )}

        {/* Enemy Objective / Active Drone Count */}
        {!isDual && (
          <div className="p-2.5 rounded-xl bg-[#111] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                <Skull className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
                  ACTIVE DRONES
                </span>
                <span className="text-xs font-mono font-bold text-red-300">
                  {enemyCount} Hostiles Left
                </span>
              </div>
            </div>
            <div className="text-lg font-mono font-black text-red-400">
              {enemyCount}
            </div>
          </div>
        )}

        {/* Combo Multiplier Meter */}
        {comboCount >= 2 && (
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Zap className="w-4 h-4 fill-cyan-400" />
              <span className="text-xs font-black uppercase tracking-wider">COMBO STREAK</span>
            </div>
            <span className="text-lg font-mono font-black text-cyan-300">x{comboCount}</span>
          </div>
        )}
      </div>

      {/* Bottom Section: Quick Action Controls & Fullscreen Deck */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
        <div className="text-[9px] font-black uppercase tracking-widest text-white/40 text-left">
          QUICK ACTIONS
        </div>

        {/* Fullscreen & Pause Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            className="py-2 px-3 rounded-xl bg-[#1a1a24] hover:bg-[#252535] active:scale-95 text-white border border-white/10 hover:border-cyan-500/40 transition flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-3.5 h-3.5 text-cyan-400" />
                <span>EXIT FULL</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5 text-cyan-400" />
                <span>FULLSCREEN</span>
              </>
            )}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="py-2 px-3 rounded-xl bg-[#1a1a24] hover:bg-[#252535] active:scale-95 text-white border border-white/10 hover:border-amber-500/40 transition flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold"
            title="Pause Game (ESC)"
          >
            <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>PAUSE</span>
          </button>
        </div>

        {/* Sound, Restart & Settings Row */}
        <div className="grid grid-cols-3 gap-1.5">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition flex items-center justify-center cursor-pointer ${
              soundEnabled
                ? 'bg-[#1a1a24] hover:bg-[#252535] text-cyan-400 border-white/10'
                : 'bg-red-950/30 text-red-400 border-red-500/30'
            }`}
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Restart Level */}
          <button
            onClick={onRestart}
            className="p-2 rounded-xl bg-[#1a1a24] hover:bg-[#252535] active:scale-95 text-white border border-white/10 hover:border-white/20 transition flex items-center justify-center cursor-pointer"
            title="Restart Sector / Round"
          >
            <RotateCcw className="w-4 h-4 text-white/80" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-[#1a1a24] hover:bg-[#252535] active:scale-95 text-white border border-white/10 hover:border-purple-500/40 transition flex items-center justify-center cursor-pointer"
            title="Open Settings"
          >
            <SettingsIcon className="w-4 h-4 text-purple-400" />
          </button>
        </div>
      </div>
    </aside>
  );
};
