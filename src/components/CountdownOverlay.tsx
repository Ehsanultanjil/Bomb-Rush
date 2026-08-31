import React, { useEffect, useState } from 'react';
import { soundManager } from '../audio/soundManager';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [displayText, setDisplayText] = useState<string>('3');

  useEffect(() => {
    soundManager.playCountdownBeep(false);

    const timer1 = setTimeout(() => {
      setDisplayText('2');
      soundManager.playCountdownBeep(false);
    }, 800);

    const timer2 = setTimeout(() => {
      setDisplayText('1');
      soundManager.playCountdownBeep(false);
    }, 1600);

    const timer3 = setTimeout(() => {
      setDisplayText('GO!');
      soundManager.playCountdownBeep(true);
    }, 2400);

    const timer4 = setTimeout(() => {
      onComplete();
    }, 3100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div
        key={displayText}
        className={`font-black italic tracking-tighter text-center transition-all transform scale-110 duration-300 ${
          displayText === 'GO!'
            ? 'text-8xl sm:text-[10rem] text-yellow-400 arcade-glow'
            : 'text-8xl sm:text-[10rem] text-cyan-400 cyan-glow'
        }`}
      >
        {displayText}
      </div>
    </div>
  );
};
