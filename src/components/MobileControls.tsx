import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bomb } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Direction } from '../types';

interface MobileControlsProps {
  onDirectionChange?: (dir: Direction) => void;
  onJoystickVector?: (vx: number, vy: number) => void;
  onBombPress: () => void;
}

const MAX_RADIUS = 50; // Maximum joystick drag distance in pixels

export const MobileControls: React.FC<MobileControlsProps> = ({
  onDirectionChange,
  onJoystickVector,
  onBombPress,
}) => {
  // Dynamic Floating Joystick State (PUBG / FreeFire style)
  const [isActive, setIsActive] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeDir, setActiveDir] = useState<Direction>('NONE');
  const [isBombPressed, setIsBombPressed] = useState(false);

  const joyTouchIdRef = useRef<number | null>(null);
  const bombTouchIdRef = useRef<number | null>(null);
  const originRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onJoystickVectorRef = useRef(onJoystickVector);
  onJoystickVectorRef.current = onJoystickVector;

  const onDirectionChangeRef = useRef(onDirectionChange);
  onDirectionChangeRef.current = onDirectionChange;

  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    let dx = clientX - originRef.current.x;
    let dy = clientY - originRef.current.y;
    let dist = Math.hypot(dx, dy);

    // Dynamic following (PUBG style): if dragged further than 1.6x max radius, pull the origin along smoothly
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

    if (dist < 4) {
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
  }, []);

  // Full-Screen Touch Area for Dynamic Anywhere Joystick (excludes buttons, HUD, modals)
  const handleTouchZoneStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.closest('button') || target.closest('header') || target.closest('nav') || target.closest('[data-no-joystick]'))) {
      return;
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // If we don't have an active joystick touch yet
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
    if (target && (target.closest('button') || target.closest('header') || target.closest('nav') || target.closest('[data-no-joystick]'))) {
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
        {/* Floating Dynamic Joystick Visuals (Spawns wherever finger touches down) */}
        {isActive && (
          <div
            style={{
              position: 'fixed',
              left: `${origin.x}px`,
              top: `${origin.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className="pointer-events-none z-40 w-32 h-32 rounded-full bg-[#0a0f1d]/85 backdrop-blur-md border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center justify-center animate-in fade-in zoom-in duration-75"
          >
            {/* Guide Rings */}
            <div className="absolute inset-2 rounded-full border border-dashed border-cyan-400/30" />
            <div className="absolute inset-6 rounded-full border border-white/10" />

            {/* 4 Cardinal Notches */}
            <ArrowUp
              className={`absolute top-1.5 w-4 h-4 transition ${
                activeDir.includes('UP') ? 'text-cyan-300 scale-125' : 'text-white/30'
              }`}
            />
            <ArrowDown
              className={`absolute bottom-1.5 w-4 h-4 transition ${
                activeDir.includes('DOWN') ? 'text-cyan-300 scale-125' : 'text-white/30'
              }`}
            />
            <ArrowLeft
              className={`absolute left-1.5 w-4 h-4 transition ${
                activeDir.includes('LEFT') ? 'text-cyan-300 scale-125' : 'text-white/30'
              }`}
            />
            <ArrowRight
              className={`absolute right-1.5 w-4 h-4 transition ${
                activeDir.includes('RIGHT') ? 'text-cyan-300 scale-125' : 'text-white/30'
              }`}
            />

            {/* Floating Thumbstick Knob */}
            <div
              style={{
                transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
              }}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 border-2 border-white shadow-[0_0_15px_rgba(6,182,212,0.8)] flex items-center justify-center"
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-[0_0_8px_#fff]" />
            </div>
          </div>
        )}
      </div>

      {/* Persistent Bottom Controls Layer with Raised Bomb Button & Idle Guide */}
      <div className="fixed bottom-0 left-0 right-0 px-4 xs:px-6 sm:px-8 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] pt-2 select-none pointer-events-none z-30 flex items-end justify-between max-w-5xl mx-auto">
        {/* Left Side Idle Touch Guide (When not touching) */}
        <div className="flex flex-col items-start gap-1 mb-2">
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0a0f1d]/85 border border-cyan-500/30 backdrop-blur-md transition-opacity duration-300 shadow-lg ${
              isActive ? 'opacity-0' : 'opacity-90 animate-pulse'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-cyan-300 font-mono-arcade">
              DRAG ANYWHERE TO MOVE
            </span>
          </div>
        </div>

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
