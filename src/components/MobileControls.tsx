import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bomb } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Direction } from '../types';

interface MobileControlsProps {
  onDirectionChange?: (dir: Direction) => void;
  onJoystickVector?: (vx: number, vy: number) => void;
  onBombPress: () => void;
}

const MAX_RADIUS = 52; // Maximum joystick thumbstick travel distance in pixels

// Calculate default resting position on bottom-left with safe margins
const getDefaultJoystickPos = () => {
  if (typeof window === 'undefined') return { x: 80, y: 500 };
  const safeLeft = Math.max(window.innerWidth * 0.15, 68);
  const safeBottom = Math.max(window.innerHeight * 0.14, 85);
  return {
    x: Math.min(safeLeft, 110),
    y: window.innerHeight - Math.min(safeBottom, 125),
  };
};

export const MobileControls: React.FC<MobileControlsProps> = ({
  onDirectionChange,
  onJoystickVector,
  onBombPress,
}) => {
  // Joystick State (Visible at resting position, dynamic & follows touch anywhere)
  const [isActive, setIsActive] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number }>(getDefaultJoystickPos);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeDir, setActiveDir] = useState<Direction>('NONE');
  const [isBombPressed, setIsBombPressed] = useState(false);

  const joyTouchIdRef = useRef<number | null>(null);
  const bombTouchIdRef = useRef<number | null>(null);
  const originRef = useRef<{ x: number; y: number }>(getDefaultJoystickPos());

  const onJoystickVectorRef = useRef(onJoystickVector);
  onJoystickVectorRef.current = onJoystickVector;

  const onDirectionChangeRef = useRef(onDirectionChange);
  onDirectionChangeRef.current = onDirectionChange;

  // Initialize and update resting position on resize when idle
  useEffect(() => {
    const handleResize = () => {
      if (joyTouchIdRef.current === null) {
        const def = getDefaultJoystickPos();
        originRef.current = def;
        setOrigin(def);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    let dx = clientX - originRef.current.x;
    let dy = clientY - originRef.current.y;
    let dist = Math.hypot(dx, dy);

    // Dynamic following: if dragged beyond 1.5x max radius, pull the origin along smoothly
    if (dist > MAX_RADIUS * 1.5) {
      const angle = Math.atan2(dy, dx);
      originRef.current = {
        x: clientX - Math.cos(angle) * MAX_RADIUS * 1.5,
        y: clientY - Math.sin(angle) * MAX_RADIUS * 1.5,
      };
      setOrigin({ ...originRef.current });
      dx = clientX - originRef.current.x;
      dy = clientY - originRef.current.y;
      dist = Math.hypot(dx, dy);
    }

    if (dist < 3) {
      setKnobOffset({ x: 0, y: 0 });
      setActiveDir('NONE');
      onJoystickVectorRef.current?.(0, 0);
      onDirectionChangeRef.current?.('NONE');
      return;
    }

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, MAX_RADIUS);
    const kx = Math.cos(angle) * clampedDist;
    const ky = Math.sin(angle) * clampedDist;

    setKnobOffset({ x: kx, y: ky });

    // Normalized analog vector [-1, 1]
    const vx = kx / MAX_RADIUS;
    const vy = ky / MAX_RADIUS;
    onJoystickVectorRef.current?.(vx, vy);

    // 8-directional classification
    const deg = (angle * 180) / Math.PI;
    let dir: Direction = 'NONE';
    if (deg >= -22.5 && deg < 22.5) dir = 'RIGHT';
    else if (deg >= 22.5 && deg < 67.5) dir = 'DOWN_RIGHT';
    else if (deg >= 67.5 && deg < 112.5) dir = 'DOWN';
    else if (deg >= 112.5 && deg < 157.5) dir = 'DOWN_LEFT';
    else if (deg >= 157.5 || deg < -157.5) dir = 'LEFT';
    else if (deg >= -157.5 && deg < -112.5) dir = 'UP_LEFT';
    else if (deg >= -112.5 && deg < -67.5) dir = 'UP';
    else if (deg >= -67.5 && deg < -22.5) dir = 'UP_RIGHT';

    setActiveDir(dir);
    onDirectionChangeRef.current?.(dir);
  }, []);

  const stopJoystick = useCallback(() => {
    joyTouchIdRef.current = null;
    setIsActive(false);
    setKnobOffset({ x: 0, y: 0 });
    setActiveDir('NONE');
    onJoystickVectorRef.current?.(0, 0);
    onDirectionChangeRef.current?.('NONE');

    // Return to resting position smoothly
    const def = getDefaultJoystickPos();
    originRef.current = def;
    setOrigin(def);
  }, []);

  // Full-Screen Touch Area for Dynamic Anywhere Joystick (excludes buttons, top HUD, modals)
  const handleTouchZoneStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.closest('button') ||
        target.closest('header') ||
        target.closest('nav') ||
        target.closest('[data-no-joystick]'))
    ) {
      return;
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (joyTouchIdRef.current === null) {
        joyTouchIdRef.current = touch.identifier;
        originRef.current = { x: touch.clientX, y: touch.clientY };
        setOrigin({ x: touch.clientX, y: touch.clientY });
        setKnobOffset({ x: 0, y: 0 });
        setIsActive(true);
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchZoneMove = (e: React.TouchEvent) => {
    if (joyTouchIdRef.current === null) return;
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === joyTouchIdRef.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchZoneEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyTouchIdRef.current) {
        stopJoystick();
        break;
      }
    }
  };

  // Mouse testing fallback for desktop
  const isMouseDownRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.closest('button') ||
        target.closest('header') ||
        target.closest('nav') ||
        target.closest('[data-no-joystick]'))
    ) {
      return;
    }
    isMouseDownRef.current = true;
    originRef.current = { x: e.clientX, y: e.clientY };
    setOrigin({ x: e.clientX, y: e.clientY });
    setKnobOffset({ x: 0, y: 0 });
    setIsActive(true);
    updateJoystick(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMouseDownRef.current) {
      updateJoystick(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      stopJoystick();
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        stopJoystick();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [stopJoystick]);

  // Bomb Button Touch Handlers
  const handleBombTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.changedTouches.length > 0) {
      bombTouchIdRef.current = e.changedTouches[0].identifier;
      setIsBombPressed(true);
      onBombPress();
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(40);
        } catch {
          // ignore
        }
      }
    }
  };

  const handleBombTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === bombTouchIdRef.current) {
        bombTouchIdRef.current = null;
        setIsBombPressed(false);
        break;
      }
    }
  };

  const handleBombMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBombPressed(true);
    onBombPress();
  };

  const handleBombMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBombPressed(false);
  };

  return (
    <>
      {/* Full-Screen Touch Capture Zone for Dynamic Anywhere Joystick (Covers screen except bomb button) */}
      <div
        onTouchStart={handleTouchZoneStart}
        onTouchMove={handleTouchZoneMove}
        onTouchEnd={handleTouchZoneEnd}
        onTouchCancel={handleTouchZoneEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="fixed inset-0 z-20 touch-none select-none pointer-events-auto"
      >
        {/* Always-Visible Joystick (Resting at bottom-left when idle, instantly follows touch anywhere) */}
        <div
          style={{
            position: 'fixed',
            left: `${origin.x}px`,
            top: `${origin.y}px`,
            transform: 'translate(-50%, -50%)',
            transition: isActive
              ? 'none'
              : 'left 0.28s cubic-bezier(0.2, 0, 0, 1), top 0.28s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s ease',
          }}
          className={`pointer-events-none z-40 w-28 h-28 xs:w-32 xs:h-32 rounded-full backdrop-blur-md border-2 flex items-center justify-center transition-all ${
            isActive
              ? 'bg-[#0a0f1d]/90 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.6)] scale-105 opacity-100'
              : 'bg-[#0a0f1d]/70 border-white/25 shadow-[0_0_15px_rgba(0,0,0,0.5)] opacity-85'
          }`}
        >
          {/* Guide Rings */}
          <div
            className={`absolute inset-2 rounded-full border border-dashed transition-colors ${
              isActive ? 'border-cyan-400/40' : 'border-white/15'
            }`}
          />
          <div className="absolute inset-5 rounded-full border border-white/10" />

          {/* 4 Cardinal Notches */}
          <ArrowUp
            className={`absolute top-1.5 w-4 h-4 transition-all duration-150 ${
              activeDir.includes('UP')
                ? 'text-cyan-300 scale-125 drop-shadow-[0_0_6px_#22d3ee]'
                : isActive
                ? 'text-cyan-500/50'
                : 'text-white/40'
            }`}
          />
          <ArrowDown
            className={`absolute bottom-1.5 w-4 h-4 transition-all duration-150 ${
              activeDir.includes('DOWN')
                ? 'text-cyan-300 scale-125 drop-shadow-[0_0_6px_#22d3ee]'
                : isActive
                ? 'text-cyan-500/50'
                : 'text-white/40'
            }`}
          />
          <ArrowLeft
            className={`absolute left-1.5 w-4 h-4 transition-all duration-150 ${
              activeDir.includes('LEFT')
                ? 'text-cyan-300 scale-125 drop-shadow-[0_0_6px_#22d3ee]'
                : isActive
                ? 'text-cyan-500/50'
                : 'text-white/40'
            }`}
          />
          <ArrowRight
            className={`absolute right-1.5 w-4 h-4 transition-all duration-150 ${
              activeDir.includes('RIGHT')
                ? 'text-cyan-300 scale-125 drop-shadow-[0_0_6px_#22d3ee]'
                : isActive
                ? 'text-cyan-500/50'
                : 'text-white/40'
            }`}
          />

          {/* Floating Thumbstick Knob */}
          <div
            style={{
              transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
              transition: isActive ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
            }}
            className={`w-12 h-12 xs:w-14 xs:h-14 rounded-full border-2 flex items-center justify-center shadow-lg transition-all ${
              isActive
                ? 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 border-white shadow-[0_0_20px_rgba(6,182,212,0.9)] scale-105'
                : 'bg-gradient-to-br from-neutral-700 to-neutral-800 border-white/40 shadow-md'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                isActive ? 'bg-white shadow-[0_0_8px_#fff]' : 'bg-white/40'
              }`}
            />
          </div>

          {/* Label under joystick when resting */}
          {!isActive && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
              <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300/80 font-mono-arcade drop-shadow">
                DRAG TO MOVE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Persistent Bottom Controls Layer with Raised Bomb Button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 xs:px-6 sm:px-8 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] pt-2 select-none pointer-events-none z-30 flex items-end justify-end max-w-5xl mx-auto">
        {/* Right Side Glowing Elevated Bomb Button (Always high, clear & multi-touch responsive) */}
        <div className="flex flex-col items-center gap-1.5 pointer-events-auto mb-1">
          <button
            onTouchStart={handleBombTouchStart}
            onTouchEnd={handleBombTouchEnd}
            onTouchCancel={handleBombTouchEnd}
            onMouseDown={handleBombMouseDown}
            onMouseUp={handleBombMouseUp}
            className={`w-20 h-20 xs:w-22 xs:h-22 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700 text-white border-4 border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.75)] flex flex-col items-center justify-center gap-0.5 cursor-pointer touch-none select-none transition-transform ${
              isBombPressed ? 'scale-90 brightness-125 border-red-200 shadow-[0_0_40px_rgba(239,68,68,0.95)]' : 'active:scale-95'
            }`}
            aria-label="Drop Bomb"
          >
            <Bomb className="w-8 h-8 xs:w-9 xs:h-9 drop-shadow-lg animate-pulse" />
            <span className="text-[11px] xs:text-xs font-black italic tracking-wider uppercase font-mono-arcade">
              BOMB
            </span>
          </button>

          <span className="text-[9px] font-black uppercase tracking-widest text-red-300/90 font-mono-arcade drop-shadow">
            TAP BOMB
          </span>
        </div>
      </div>
    </>
  );
};
