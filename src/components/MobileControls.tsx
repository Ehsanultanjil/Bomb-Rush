import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bomb } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { Direction } from '../types';

interface MobileControlsProps {
  onDirectionChange: (dir: Direction) => void;
  onBombPress: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onDirectionChange,
  onBombPress,
}) => {
  const [activeDir, setActiveDir] = useState<Direction>('NONE');
  const dpadTouchIdRef = useRef<number | null>(null);
  const dpadElementRef = useRef<HTMLDivElement>(null);

  const updateDir = (newDir: Direction) => {
    setActiveDir(newDir);
    onDirectionChange(newDir);
  };

  const getDirectionFromTouch = (clientX: number, clientY: number): Direction => {
    if (!dpadElementRef.current) return 'NONE';
    const rect = dpadElementRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    // Deadzone in the exact center
    if (dist < rect.width * 0.15) return 'NONE';

    const angle = Math.atan2(dy, dx) * (180 / Math.PI); // -180 to 180

    // 8-directional zones
    if (angle >= -22.5 && angle < 22.5) return 'RIGHT';
    if (angle >= 22.5 && angle < 67.5) return 'DOWN_RIGHT';
    if (angle >= 67.5 && angle < 112.5) return 'DOWN';
    if (angle >= 112.5 && angle < 157.5) return 'DOWN_LEFT';
    if (angle >= 157.5 || angle < -157.5) return 'LEFT';
    if (angle >= -157.5 && angle < -112.5) return 'UP_LEFT';
    if (angle >= -112.5 && angle < -67.5) return 'UP';
    if (angle >= -67.5 && angle < -22.5) return 'UP_RIGHT';

    return 'NONE';
  };

  // D-Pad Touch Handlers
  const handleDpadTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      dpadTouchIdRef.current = touch.identifier;
      const dir = getDirectionFromTouch(touch.clientX, touch.clientY);
      updateDir(dir);
    }
  };

  const handleDpadTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (dpadTouchIdRef.current === null) return;
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === dpadTouchIdRef.current) {
        const dir = getDirectionFromTouch(touch.clientX, touch.clientY);
        updateDir(dir);
        break;
      }
    }
  };

  const handleDpadTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === dpadTouchIdRef.current) {
        dpadTouchIdRef.current = null;
        updateDir('NONE');
        break;
      }
    }
  };

  // Mouse fallback for D-Pad
  const handleDpadMouseDown = (e: React.MouseEvent) => {
    const dir = getDirectionFromTouch(e.clientX, e.clientY);
    updateDir(dir);
  };

  const handleDpadMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      const dir = getDirectionFromTouch(e.clientX, e.clientY);
      updateDir(dir);
    }
  };

  const handleDpadMouseUp = () => {
    updateDir('NONE');
  };

  // Dedicated Bomb Touch Handler (Runs completely independently)
  const handleBombTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    onBombPress();
  };

  const handleBombMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onBombPress();
  };

  const isUpActive = activeDir === 'UP' || activeDir === 'UP_LEFT' || activeDir === 'UP_RIGHT';
  const isDownActive = activeDir === 'DOWN' || activeDir === 'DOWN_LEFT' || activeDir === 'DOWN_RIGHT';
  const isLeftActive = activeDir === 'LEFT' || activeDir === 'UP_LEFT' || activeDir === 'DOWN_LEFT';
  const isRightActive = activeDir === 'RIGHT' || activeDir === 'UP_RIGHT' || activeDir === 'DOWN_RIGHT';

  return (
    <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 py-2 select-none touch-none pointer-events-auto">
      {/* Directional D-Pad (Left Side) with 8-Way Touch Area */}
      <div
        ref={dpadElementRef}
        onTouchStart={handleDpadTouchStart}
        onTouchMove={handleDpadTouchMove}
        onTouchEnd={handleDpadTouchEnd}
        onTouchCancel={handleDpadTouchEnd}
        onMouseDown={handleDpadMouseDown}
        onMouseMove={handleDpadMouseMove}
        onMouseUp={handleDpadMouseUp}
        onMouseLeave={handleDpadMouseUp}
        className="relative w-36 h-36 sm:w-40 sm:h-40 grid grid-cols-3 grid-rows-3 gap-1.5 bg-[#111] p-2 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md cursor-pointer touch-none"
      >
        {/* Diagonal Indicator / Touch Corners */}
        <div className={`col-start-1 row-start-1 rounded-xl transition ${activeDir === 'UP_LEFT' ? 'bg-cyan-500/30' : 'bg-transparent'}`} />
        <div className={`col-start-3 row-start-1 rounded-xl transition ${activeDir === 'UP_RIGHT' ? 'bg-cyan-500/30' : 'bg-transparent'}`} />
        <div className={`col-start-1 row-start-3 rounded-xl transition ${activeDir === 'DOWN_LEFT' ? 'bg-cyan-500/30' : 'bg-transparent'}`} />
        <div className={`col-start-3 row-start-3 rounded-xl transition ${activeDir === 'DOWN_RIGHT' ? 'bg-cyan-500/30' : 'bg-transparent'}`} />

        {/* Up */}
        <div className="col-start-2 row-start-1 flex items-center justify-center pointer-events-none">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition border ${
              isUpActive
                ? 'bg-cyan-500 text-black border-cyan-300 scale-95 shadow-cyan-500/50'
                : 'bg-[#222] text-white border-white/10'
            }`}
          >
            <ArrowUp className="w-6 h-6" />
          </div>
        </div>

        {/* Left */}
        <div className="col-start-1 row-start-2 flex items-center justify-center pointer-events-none">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition border ${
              isLeftActive
                ? 'bg-cyan-500 text-black border-cyan-300 scale-95 shadow-cyan-500/50'
                : 'bg-[#222] text-white border-white/10'
            }`}
          >
            <ArrowLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Center Indicator */}
        <div className="col-start-2 row-start-2 flex items-center justify-center pointer-events-none">
          <div className="w-7 h-7 rounded-full bg-[#080808] border border-white/10 flex items-center justify-center">
            <div className={`w-2.5 h-2.5 rounded-full transition ${activeDir !== 'NONE' ? 'bg-cyan-400 scale-125' : 'bg-white/20'}`} />
          </div>
        </div>

        {/* Right */}
        <div className="col-start-3 row-start-2 flex items-center justify-center pointer-events-none">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition border ${
              isRightActive
                ? 'bg-cyan-500 text-black border-cyan-300 scale-95 shadow-cyan-500/50'
                : 'bg-[#222] text-white border-white/10'
            }`}
          >
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>

        {/* Down */}
        <div className="col-start-2 row-start-3 flex items-center justify-center pointer-events-none">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition border ${
              isDownActive
                ? 'bg-cyan-500 text-black border-cyan-300 scale-95 shadow-cyan-500/50'
                : 'bg-[#222] text-white border-white/10'
            }`}
          >
            <ArrowDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Large Circular Bomb Button (Right Side - Independent Multi-Touch) */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onTouchStart={handleBombTouchStart}
          onMouseDown={handleBombMouseDown}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white border-4 border-red-800 shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-90 transition flex flex-col items-center justify-center gap-0.5 cursor-pointer touch-none"
          aria-label="Place Bomb"
        >
          <Bomb className="w-8 h-8 drop-shadow-md" />
          <span className="text-[11px] sm:text-xs font-black italic tracking-widest uppercase">
            BOMB
          </span>
        </button>
        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">ACTION: SPACE / TAP</span>
      </div>
    </div>
  );
};
