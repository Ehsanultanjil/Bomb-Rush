import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bomb } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Direction } from '../types';

interface MobileControlsProps {
  onDirectionChange?: (dir: Direction) => void;
  onJoystickVector?: (vx: number, vy: number) => void;
  onBombPress: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onDirectionChange,
  onJoystickVector,
  onBombPress,
}) => {
  const [stickPos, setStickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isStickActive, setIsStickActive] = useState<boolean>(false);
  const [activeDir, setActiveDir] = useState<Direction>('NONE');
  const [isBombPressed, setIsBombPressed] = useState<boolean>(false);

  const joyBaseRef = useRef<HTMLDivElement>(null);
  const joyTouchIdRef = useRef<number | null>(null);
  const bombTouchIdRef = useRef<number | null>(null);

  const onJoystickVectorRef = useRef(onJoystickVector);
  onJoystickVectorRef.current = onJoystickVector;

  const onDirectionChangeRef = useRef(onDirectionChange);
  onDirectionChangeRef.current = onDirectionChange;

  // Process joystick touch coordinate
  const processTouchPos = useCallback((clientX: number, clientY: number) => {
    if (!joyBaseRef.current) return;
    const rect = joyBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    // Max visual thumb displacement radius
    const maxRadius = Math.min(rect.width, rect.height) * 0.42;

    if (dist < 4) {
      setStickPos({ x: 0, y: 0 });
      setIsStickActive(true);
      setActiveDir('NONE');
      onJoystickVectorRef.current?.(0, 0);
      onDirectionChangeRef.current?.('NONE');
      return;
    }

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, maxRadius);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setStickPos({ x: knobX, y: knobY });
    setIsStickActive(true);

    // Analog normalized vector [-1, 1]
    const vx = knobX / maxRadius;
    const vy = knobY / maxRadius;
    onJoystickVectorRef.current?.(vx, vy);

    // 8-directional mapping
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

  const resetStick = useCallback(() => {
    joyTouchIdRef.current = null;
    setStickPos({ x: 0, y: 0 });
    setIsStickActive(false);
    setActiveDir('NONE');
    onJoystickVectorRef.current?.(0, 0);
    onDirectionChangeRef.current?.('NONE');
  }, []);

  // Joystick Touch Handlers
  const handleJoyTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      joyTouchIdRef.current = touch.identifier;
      processTouchPos(touch.clientX, touch.clientY);
    }
  };

  const handleJoyTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (joyTouchIdRef.current === null) return;
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === joyTouchIdRef.current) {
        processTouchPos(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoyTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyTouchIdRef.current) {
        resetStick();
        break;
      }
    }
  };

  // Mouse fallback for Joystick (Desktop Testing)
  const isMouseDownRef = useRef(false);

  const handleJoyMouseDown = (e: React.MouseEvent) => {
    isMouseDownRef.current = true;
    processTouchPos(e.clientX, e.clientY);
  };

  const handleJoyMouseMove = (e: React.MouseEvent) => {
    if (isMouseDownRef.current) {
      processTouchPos(e.clientX, e.clientY);
    }
  };

  const handleJoyMouseUp = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      resetStick();
    }
  };

  // Window mouse up listener for joystick release
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        resetStick();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [resetStick]);

  // Bomb Touch Handlers
  const handleBombTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.changedTouches.length > 0) {
      bombTouchIdRef.current = e.changedTouches[0].identifier;
      setIsBombPressed(true);
      onBombPress();
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(35);
        } catch {
          // ignore vibration errors
        }
      }
    }
  };

  const handleBombTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === bombTouchIdRef.current) {
        bombTouchIdRef.current = null;
        setIsBombPressed(false);
        break;
      }
    }
  };

  const handleBombMouseDown = () => {
    setIsBombPressed(true);
    onBombPress();
  };

  const handleBombMouseUp = () => {
    setIsBombPressed(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-3 sm:px-6 py-2 select-none touch-none pointer-events-auto flex-shrink-0 z-30">
      {/* Dynamic 360° Analog Roller Joystick (Left Side) */}
      <div className="flex flex-col items-center gap-1">
        <div
          ref={joyBaseRef}
          onTouchStart={handleJoyTouchStart}
          onTouchMove={handleJoyTouchMove}
          onTouchEnd={handleJoyTouchEnd}
          onTouchCancel={handleJoyTouchEnd}
          onMouseDown={handleJoyMouseDown}
          onMouseMove={handleJoyMouseMove}
          onMouseUp={handleJoyMouseUp}
          className={`relative w-28 h-28 xs:w-32 xs:h-32 sm:w-36 sm:h-36 rounded-full bg-[#0d1117]/90 backdrop-blur-md border-2 transition-colors cursor-pointer touch-none shadow-2xl flex items-center justify-center ${
            isStickActive
              ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'border-white/20'
          }`}
        >
          {/* Outer Guideline Rings */}
          <div className="absolute inset-2 rounded-full border border-dashed border-white/10 pointer-events-none" />
          <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none" />

          {/* Directional Notch Indicators */}
          <ArrowUp
            className={`absolute top-1.5 w-3.5 h-3.5 transition ${
              activeDir.includes('UP') ? 'text-cyan-400 scale-125' : 'text-white/20'
            }`}
          />
          <ArrowDown
            className={`absolute bottom-1.5 w-3.5 h-3.5 transition ${
              activeDir.includes('DOWN') ? 'text-cyan-400 scale-125' : 'text-white/20'
            }`}
          />
          <ArrowLeft
            className={`absolute left-1.5 w-3.5 h-3.5 transition ${
              activeDir.includes('LEFT') ? 'text-cyan-400 scale-125' : 'text-white/20'
            }`}
          />
          <ArrowRight
            className={`absolute right-1.5 w-3.5 h-3.5 transition ${
              activeDir.includes('RIGHT') ? 'text-cyan-400 scale-125' : 'text-white/20'
            }`}
          />

          {/* Smooth Floating Roller Knob / Thumbstick */}
          <div
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
              transition: isStickActive ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
            }}
            className={`relative w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg border-2 pointer-events-none ${
              isStickActive
                ? 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-200 shadow-cyan-500/60 scale-105'
                : 'bg-gradient-to-br from-neutral-800 to-neutral-900 border-white/20'
            }`}
          >
            {/* Center Core Dot */}
            <div
              className={`w-4 h-4 rounded-full transition ${
                isStickActive ? 'bg-white shadow-[0_0_8px_#fff]' : 'bg-white/30'
              }`}
            />
          </div>
        </div>

        <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400/70 font-mono-arcade">
          ROLL TO MOVE
        </span>
      </div>

      {/* Large Glowing Circular Bomb Button (Right Side - Multi-Touch) */}
      <div className="flex flex-col items-center gap-1">
        <button
          onTouchStart={handleBombTouchStart}
          onTouchEnd={handleBombTouchEnd}
          onTouchCancel={handleBombTouchEnd}
          onMouseDown={handleBombMouseDown}
          onMouseUp={handleBombMouseUp}
          className={`w-20 h-20 xs:w-22 xs:h-22 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700 text-white border-4 border-red-400/80 shadow-[0_0_30px_rgba(239,68,68,0.6)] flex flex-col items-center justify-center gap-0.5 cursor-pointer touch-none select-none transition-transform ${
            isBombPressed ? 'scale-90 brightness-125 border-red-200' : 'active:scale-95'
          }`}
          aria-label="Drop Bomb"
        >
          <Bomb className="w-8 h-8 xs:w-9 xs:h-9 drop-shadow-lg animate-pulse" />
          <span className="text-[11px] xs:text-xs font-black italic tracking-wider uppercase font-mono-arcade">
            BOMB
          </span>
        </button>

        <span className="text-[9px] font-black uppercase tracking-widest text-red-400/70 font-mono-arcade">
          TAP BOMB
        </span>
      </div>
    </div>
  );
};
