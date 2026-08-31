import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundManager } from './audio/soundManager';
import { CompactTopHUD } from './components/CompactTopHUD';
import { CountdownOverlay } from './components/CountdownOverlay';
import { DualRoundOverModal } from './components/DualRoundOverModal';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { LeftHUD } from './components/LeftHUD';
import { LevelClearModal } from './components/LevelClearModal';
import { MainMenu } from './components/MainMenu';
import { MobileControls } from './components/MobileControls';
import { PauseModal } from './components/PauseModal';
import { RightHUD } from './components/RightHUD';
import { SettingsModal } from './components/SettingsModal';
import { GameEngine } from './game/gameEngine';
import { GameRenderer } from './game/renderer';
import { Direction, GameSettings, GameState } from './types';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);

  const [engine] = useState<GameEngine>(() => new GameEngine());
  const engineRef = useRef<GameEngine>(engine);
  engineRef.current = engine;

  const [gameState, setGameState] = useState<GameState>(() => engine.gameState);
  const [, setHudTick] = useState<number>(0);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Fullscreen state listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    soundManager.ensureAudio();
    soundManager.playButtonClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  // Initialize Game Engine callbacks and Keyboard listeners
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();

    engine.onStateChange = (state: GameState) => {
      setGameState(state);
    };

    // Keyboard event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling on game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }
      soundManager.ensureAudio();
      engine.handleKeyDown(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }
      engine.handleKeyUp(e.key);
    };

    const handleBlur = () => {
      engine.clearInputState();
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [engine]);

  // Robust canvas ref attachment
  const handleCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
    if (canvas) {
      const renderer = new GameRenderer(canvas);
      rendererRef.current = renderer;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          renderer.resize(rect.width, rect.height);
        }
      }
    }
  }, []);

  // Handle Resize with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (rendererRef.current && width > 0 && height > 0) {
          rendererRef.current.resize(width, height);
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [gameState]);

  // Main Animation / Game Loop
  useEffect(() => {
    let animId: number;
    let lastHudUpdate = 0;

    const loop = (timestamp: number) => {
      const engine = engineRef.current;
      const renderer = rendererRef.current;

      if (engine && renderer) {
        engine.update(timestamp);

        // Render Canvas
        renderer.render(
          engine.grid,
          engine.player,
          engine.player2,
          engine.bombs,
          engine.explosions,
          engine.powerUps,
          engine.enemies,
          engine.destructions,
          engine.particles,
          engine.floatingTexts,
          engine.screenShakeOffset,
          engine.settings.debugMode,
          engine.fps
        );

        // Update HUD state every 80ms
        if (timestamp - lastHudUpdate > 80) {
          lastHudUpdate = timestamp;
          setHudTick(t => t + 1);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // User Actions
  const handleStartSolo = useCallback(() => {
    soundManager.ensureAudio();
    soundManager.playButtonClick();
    if (engineRef.current) {
      engineRef.current.startNewGame('SOLO');
    }
  }, []);

  const handleStartDual = useCallback(() => {
    soundManager.ensureAudio();
    soundManager.playButtonClick();
    if (engineRef.current) {
      engineRef.current.startNewGame('DUAL');
    }
  }, []);

  const handleCountdownComplete = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.setGameState('PLAYING');
    }
  }, []);

  const handlePause = useCallback(() => {
    soundManager.playButtonClick();
    if (engineRef.current) {
      engineRef.current.setGameState('PAUSED');
    }
  }, []);

  const handleResume = useCallback(() => {
    soundManager.playButtonClick();
    if (engineRef.current) {
      engineRef.current.setGameState('PLAYING');
    }
  }, []);

  const handleRestartLevel = useCallback(() => {
    soundManager.playButtonClick();
    if (engineRef.current) {
      if (engineRef.current.gameMode === 'DUAL') {
        engineRef.current.loadDualRound(engineRef.current.stats.round);
      } else {
        engineRef.current.loadLevel(engineRef.current.currentLevel, false);
      }
      engineRef.current.setGameState('COUNTDOWN');
    }
  }, []);

  const handleNextLevel = useCallback(() => {
    soundManager.playButtonClick();
    if (engineRef.current) {
      const nextLvl = engineRef.current.currentLevel + 1;
      engineRef.current.loadLevel(nextLvl, true);
      engineRef.current.setGameState('COUNTDOWN');
    }
  }, []);

  const handleNextDualRound = useCallback(() => {
    soundManager.playButtonClick();
    if (engineRef.current) {
      const nextRound = engineRef.current.stats.round + 1;
      engineRef.current.stats.round = nextRound;
      engineRef.current.loadDualRound(nextRound);
      engineRef.current.setGameState('COUNTDOWN');
    }
  }, []);

  const handleRematchDual = useCallback(() => {
    soundManager.playButtonClick();
    if (engineRef.current) {
      engineRef.current.stats.p1Wins = 0;
      engineRef.current.stats.p2Wins = 0;
      engineRef.current.stats.round = 1;
      engineRef.current.loadDualRound(1);
      engineRef.current.setGameState('COUNTDOWN');
    }
  }, []);

  const handleRetryAfterGameOver = useCallback(() => {
    soundManager.playButtonClick();
    if (engineRef.current) {
      engineRef.current.startNewGame(engineRef.current.gameMode);
    }
  }, []);

  const handleReturnToMenu = useCallback(() => {
    soundManager.playButtonClick();
    if (engineRef.current) {
      engineRef.current.setGameState('MENU');
    }
  }, []);

  const handleUpdateSettings = useCallback((newSettings: GameSettings) => {
    soundManager.playButtonClick();
    if (engineRef.current) {
      engineRef.current.settings = newSettings;
      engineRef.current.saveToStorage();
      soundManager.setSoundEnabled(newSettings.soundEnabled);
      soundManager.setMusicEnabled(newSettings.musicEnabled);
      setHudTick(t => t + 1);
    }
  }, []);

  const handleToggleSound = useCallback(() => {
    soundManager.playButtonClick();
    if (engineRef.current) {
      const nextSound = !engineRef.current.settings.soundEnabled;
      const nextSettings: GameSettings = {
        ...engineRef.current.settings,
        soundEnabled: nextSound,
        musicEnabled: nextSound,
      };
      engineRef.current.settings = nextSettings;
      engineRef.current.saveToStorage();
      soundManager.setSoundEnabled(nextSound);
      soundManager.setMusicEnabled(nextSound);
      setHudTick(t => t + 1);
    }
  }, []);

  const handleResetScores = useCallback(() => {
    soundManager.playButtonClick();
    if (engineRef.current) {
      engineRef.current.stats.bestScore = 0;
      engineRef.current.stats.highestLevel = 1;
      engineRef.current.stats.p1Wins = 0;
      engineRef.current.stats.p2Wins = 0;
      engineRef.current.saveToStorage();
      setHudTick(t => t + 1);
    }
  }, []);

  const handleMobileDirection = useCallback((dir: Direction) => {
    soundManager.ensureAudio();
    if (engineRef.current) {
      engineRef.current.setRequestedDirection(dir);
    }
  }, []);

  const handleMobileBomb = useCallback(() => {
    soundManager.ensureAudio();
    if (engineRef.current) {
      engineRef.current.triggerBombAction();
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 flex flex-col md:flex-row items-stretch justify-between p-0 select-none scanlines">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Primary UI Views based on Game State */}
      {gameState === 'MENU' && engine && (
        <MainMenu
          stats={engine.stats}
          isFullscreen={isFullscreen}
          onPlaySolo={handleStartSolo}
          onPlayDual={handleStartDual}
          onHowToPlay={() => engine.setGameState('HOW_TO_PLAY')}
          onSettings={() => engine.setGameState('SETTINGS')}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}

      {gameState === 'HOW_TO_PLAY' && (
        <HowToPlayModal onBack={() => engine?.setGameState('MENU')} />
      )}

      {gameState === 'SETTINGS' && engine && (
        <SettingsModal
          settings={engine.settings}
          onUpdateSettings={handleUpdateSettings}
          onResetScores={handleResetScores}
          onBack={() => engine.setGameState('MENU')}
        />
      )}

      {/* In-Game HUD and Fullscreen Canvas Area */}
      {gameState !== 'MENU' && gameState !== 'HOW_TO_PLAY' && gameState !== 'SETTINGS' && engine && (
        <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-stretch justify-between gap-1 sm:gap-2 md:gap-3 p-1 sm:p-2 md:p-3 overflow-hidden">
          {/* Top Compact Bar for mobile screens (< md) */}
          <CompactTopHUD
            player={engine.player}
            player2={engine.player2}
            stats={engine.stats}
            timeRemaining={engine.levelTimeRemaining}
            comboCount={engine.comboCount}
            enemyCount={engine.enemies.length}
            levelTitle={
              engine.gameMode === 'DUAL'
                ? `ROUND ${engine.stats.round}`
                : engine.levelConfig?.title || `Sector ${engine.currentLevel}`
            }
            isFullscreen={isFullscreen}
            soundEnabled={engine.settings.soundEnabled}
            onToggleFullscreen={handleToggleFullscreen}
            onToggleSound={handleToggleSound}
            onPause={handlePause}
          />

          {/* Left Flank HUD (Visible on Desktop / Tablet >= md) */}
          <div className="hidden md:flex flex-col justify-between h-full">
            <LeftHUD
              player={engine.player}
              player2={engine.player2}
              stats={engine.stats}
              levelTitle={
                engine.gameMode === 'DUAL'
                  ? `ROUND ${engine.stats.round} • 1v1 BATTLE`
                  : engine.levelConfig?.title || `Sector ${engine.currentLevel}`
              }
            />
          </div>

          {/* Center: Full-Screen Game Arena Canvas Container */}
          <div
            ref={containerRef}
            className="relative flex-1 w-full h-full flex items-center justify-center min-h-0 overflow-hidden"
          >
            <canvas
              ref={handleCanvasRef}
              className="rounded-2xl border border-white/10 shadow-2xl shadow-cyan-500/10 bg-[#0c0d14]"
            />

            {/* Countdown Overlay before round starts */}
            {gameState === 'COUNTDOWN' && (
              <CountdownOverlay onComplete={handleCountdownComplete} />
            )}

            {/* Pause Modal */}
            {gameState === 'PAUSED' && (
              <PauseModal
                onResume={handleResume}
                onRestart={handleRestartLevel}
                onSettings={() => engine.setGameState('SETTINGS')}
                onMainMenu={handleReturnToMenu}
              />
            )}

            {/* Level Clear Modal (Solo) */}
            {gameState === 'LEVEL_CLEAR' && (
              <LevelClearModal
                level={engine.currentLevel}
                levelStats={engine.levelStats}
                onNextLevel={handleNextLevel}
              />
            )}

            {/* Dual Round Over Modal (Dual) */}
            {gameState === 'DUAL_ROUND_OVER' && (
              <DualRoundOverModal
                stats={engine.stats}
                onNextRound={handleNextDualRound}
                onRematch={handleRematchDual}
                onMainMenu={handleReturnToMenu}
              />
            )}

            {/* Game Over Modal (Solo) */}
            {gameState === 'GAME_OVER' && (
              <GameOverModal
                stats={engine.stats}
                onRetry={handleRetryAfterGameOver}
                onMainMenu={handleReturnToMenu}
              />
            )}
          </div>

          {/* Right Flank HUD (Visible on Desktop / Tablet >= md) */}
          <div className="hidden md:flex flex-col justify-between h-full">
            <RightHUD
              stats={engine.stats}
              timeRemaining={engine.levelTimeRemaining}
              comboCount={engine.comboCount}
              enemyCount={engine.enemies.length}
              isFullscreen={isFullscreen}
              soundEnabled={engine.settings.soundEnabled}
              onToggleFullscreen={handleToggleFullscreen}
              onToggleSound={handleToggleSound}
              onPause={handlePause}
              onRestart={handleRestartLevel}
              onOpenSettings={() => engine.setGameState('SETTINGS')}
            />
          </div>

          {/* Virtual Mobile Controls (shown on touch devices or small screens) */}
          {(isTouchDevice || window.innerWidth < 768) && gameState === 'PLAYING' && (
            <MobileControls
              onDirectionChange={handleMobileDirection}
              onBombPress={handleMobileBomb}
            />
          )}
        </div>
      )}
    </div>
  );
}
