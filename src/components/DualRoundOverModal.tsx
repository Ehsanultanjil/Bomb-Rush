import { RotateCcw, Swords, Trophy, Users } from 'lucide-react';
import React from 'react';
import { GameStats } from '../types';

interface DualRoundOverModalProps {
  stats: GameStats;
  onNextRound: () => void;
  onRematch: () => void;
  onMainMenu: () => void;
}

export const DualRoundOverModal: React.FC<DualRoundOverModalProps> = ({
  stats,
  onNextRound,
  onRematch,
  onMainMenu,
}) => {
  const winner = stats.dualWinner;
  const isP1 = winner === 'PLAYER_1';
  const isP2 = winner === 'PLAYER_2';
  const isDraw = winner === 'DRAW';

  const titleText = isP1
    ? 'PLAYER 1 WINS ROUND!'
    : isP2
    ? 'PLAYER 2 WINS ROUND!'
    : 'ROUND DRAW!';

  const titleGradient = isP1
    ? 'from-cyan-400 via-blue-400 to-indigo-500'
    : isP2
    ? 'from-rose-400 via-red-400 to-amber-500'
    : 'from-yellow-400 via-amber-400 to-orange-500';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center gap-6 shadow-2xl box-glow-cyan">
        {/* Animated Trophy / Swords Icon */}
        <div className={`p-4 rounded-2xl ${
          isP1 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' :
          isP2 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
          'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
        } animate-bounce`}>
          <Swords className="w-10 h-10" />
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h2 className={`text-3xl sm:text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${titleGradient}`}>
            {titleText}
          </h2>
          <p className="text-xs font-black tracking-widest text-white/50 uppercase">
            ROUND {stats.round} COMPLETED
          </p>
        </div>

        {/* Match Tally Card */}
        <div className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex items-center justify-around">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">PLAYER 1 (CYAN)</span>
            <span className="text-3xl font-mono font-black text-cyan-400">{stats.p1Wins || 0}</span>
            <span className="text-[10px] text-white/40 font-bold">WINS</span>
          </div>

          <div className="text-lg font-black text-white/30">VS</div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">PLAYER 2 (CRIMSON)</span>
            <span className="text-3xl font-mono font-black text-rose-400">{stats.p2Wins || 0}</span>
            <span className="text-[10px] text-white/40 font-bold">WINS</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onNextRound}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black italic text-base tracking-wider uppercase shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            NEXT ROUND ({stats.round + 1})
          </button>

          <button
            onClick={onRematch}
            className="w-full py-2.5 px-4 rounded-xl bg-[#222] hover:bg-[#333] text-white font-bold text-xs sm:text-sm tracking-wider uppercase border border-white/10 hover:border-white/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>RESET MATCH (0 - 0)</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-white/5 text-white/60 hover:text-white font-bold text-xs tracking-wider uppercase transition cursor-pointer"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
