import { soundManager } from '../audio/soundManager';
import {
  BlockDestruction,
  Bomb,
  CellType,
  Direction,
  Enemy,
  ExplosionCell,
  FloatingText,
  GameMode,
  GameSettings,
  GameStats,
  GameState,
  LevelConfig,
  LevelStats,
  Particle,
  Player,
  PowerUp,
  PowerUpType
} from '../types';
import {
  BASE_BOMB_CAPACITY,
  BASE_BOMB_TIMER,
  BASE_FIRE_RANGE,
  BASE_PLAYER_LIVES,
  BASE_PLAYER_SPEED,
  BLOCK_DESTRUCTION_DURATION,
  COMBO_RESET_TIME,
  ENEMY_DEATH_DURATION,
  EXPLOSION_DURATION,
  GRID_COLS,
  GRID_ROWS,
  INVINCIBLE_DURATION,
  INVULNERABILITY_DURATION,
  LEVEL_CONFIGS,
  MAX_BOMB_CAPACITY,
  MAX_FIRE_RANGE,
  MAX_PLAYER_LIVES,
  MAX_SPEED_BOOST,
  PLAYER_DEATH_DURATION,
  SCORE_BLOCK,
  SCORE_INVINCIBLE,
  SCORE_KILL_BASE,
  SCORE_KILL_CHAIN_BONUS,
  SCORE_LEVEL_CLEAR,
  SCORE_POWERUP,
  SCORE_TIME_PER_SECOND,
  SPEED_BOOST_PER_POWERUP,
} from './constants';
import { generateMap } from './mapGenerator';

export class GameEngine {
  public gameState: GameState = 'MENU';
  public gameMode: GameMode = 'SOLO';
  public grid: CellType[][] = [];
  public blockPowerUps: Map<string, PowerUpType> = new Map();
  public player!: Player;
  public player2: Player | null = null;
  public bombs: Bomb[] = [];
  public explosions: ExplosionCell[] = [];
  public powerUps: PowerUp[] = [];
  public enemies: Enemy[] = [];
  public destructions: BlockDestruction[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  public currentLevel: number = 1;
  public levelTimeRemaining: number = 120;
  public levelConfig!: LevelConfig;
  public stats: GameStats = {
    score: 0,
    level: 1,
    bestScore: 0,
    highestLevel: 1,
    blocksDestroyed: 0,
    enemiesKilled: 0,
    combosMax: 0,
    gameMode: 'SOLO',
    p1Wins: 0,
    p2Wins: 0,
    dualWinner: null,
    round: 1,
  };
  public levelStats: LevelStats = {
    scoreEarned: 0,
    enemiesKilled: 0,
    blocksDestroyed: 0,
    timeRemaining: 0,
    comboBonus: 0,
    timeBonus: 0,
    totalLevelScore: 0,
  };

  public settings: GameSettings = {
    soundEnabled: true,
    musicEnabled: true,
    screenShake: true,
    vibration: true,
    debugMode: false,
  };

  public screenShakeOffset = { x: 0, y: 0 };
  private shakeTimer = 0;
  private shakeMagnitude = 0;

  // Combo tracking
  public comboCount: number = 0;
  public comboTimer: number = 0;

  // Input states
  private keysPressed = new Set<string>();
  private p1KeyOrder: string[] = [];
  private p2KeyOrder: string[] = [];
  private requestedDirectionP1: Direction = 'NONE';
  private requestedDirectionP2: Direction = 'NONE';
  private joystickVectorP1 = { x: 0, y: 0 };
  private joystickVectorP2 = { x: 0, y: 0 };
  private bombRequestedP1: boolean = false;
  private bombRequestedP2: boolean = false;

  // Time & FPS tracking
  private lastTimestamp: number = 0;
  public fps: number = 60;
  private frameCount: number = 0;
  private fpsTimer: number = 0;

  // Callbacks for UI updates
  public onStateChange?: (state: GameState) => void;
  public onHUDUpdate?: () => void;

  constructor() {
    this.loadFromStorage();
    this.initPlayer('p1', false);
    this.loadLevel(1, false);
    this.gameState = 'MENU';
  }

  private loadFromStorage() {
    try {
      const bestScore = localStorage.getItem('bomb_rush_best_score');
      if (bestScore) this.stats.bestScore = parseInt(bestScore, 10) || 0;

      const highestLevel = localStorage.getItem('bomb_rush_highest_level');
      if (highestLevel) this.stats.highestLevel = parseInt(highestLevel, 10) || 1;

      const savedSettings = localStorage.getItem('bomb_rush_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch {
      // ignore storage errors
    }
  }

  public saveToStorage() {
    try {
      localStorage.setItem('bomb_rush_best_score', this.stats.bestScore.toString());
      localStorage.setItem('bomb_rush_highest_level', this.stats.highestLevel.toString());
      localStorage.setItem('bomb_rush_settings', JSON.stringify(this.settings));
    } catch {
      // ignore storage errors
    }
  }

  public initPlayer(playerId: 'p1' | 'p2', preservePowerups: boolean = false): Player {
    const existing = playerId === 'p1' ? this.player : this.player2;
    const existingLives = preservePowerups && existing ? existing.lives : BASE_PLAYER_LIVES;
    const existingBombs = preservePowerups && existing ? existing.maxBombs : BASE_BOMB_CAPACITY;
    const existingRange = preservePowerups && existing ? existing.fireRange : BASE_FIRE_RANGE;
    const existingSpeedLevel = preservePowerups && existing ? existing.speedLevel : 0;
    const existingShield = preservePowerups && existing ? existing.hasShield : false;

    const startX = playerId === 'p1' ? 1 : GRID_COLS - 2;
    const startY = playerId === 'p1' ? 1 : GRID_ROWS - 2;
    const facing: Direction = playerId === 'p1' ? 'DOWN' : 'UP';

    const p: Player = {
      id: playerId,
      name: playerId === 'p1' ? 'CYBER CYAN' : 'NEON CRIMSON',
      color: playerId === 'p1' ? 'cyan' : 'crimson',
      gridX: startX,
      gridY: startY,
      pixelX: startX,
      pixelY: startY,
      targetGridX: startX,
      targetGridY: startY,
      isMoving: false,
      direction: 'NONE',
      facing,
      speed: BASE_PLAYER_SPEED * (1 + existingSpeedLevel * SPEED_BOOST_PER_POWERUP),
      speedLevel: existingSpeedLevel,
      maxBombs: existingBombs,
      fireRange: existingRange,
      lives: Math.min(existingLives, MAX_PLAYER_LIVES),
      hasShield: existingShield,
      isInvulnerable: false,
      invulnerableTimer: 0,
      isInvincible: false,
      invincibleTimer: 0,
      walkFrame: 0,
      isDying: false,
      deathTimer: 0,
    };

    if (playerId === 'p1') {
      this.player = p;
    } else {
      this.player2 = p;
    }
    return p;
  }

  public clearInputState() {
    this.keysPressed.clear();
    this.p1KeyOrder = [];
    this.p2KeyOrder = [];
    this.requestedDirectionP1 = 'NONE';
    this.requestedDirectionP2 = 'NONE';
    this.joystickVectorP1 = { x: 0, y: 0 };
    this.joystickVectorP2 = { x: 0, y: 0 };
    this.bombRequestedP1 = false;
    this.bombRequestedP2 = false;
  }

  public startNewGame(mode: GameMode = 'SOLO') {
    if (mode === 'DUAL') {
      this.startDualGame();
      return;
    }
    this.gameMode = 'SOLO';
    this.stats.gameMode = 'SOLO';
    this.currentLevel = 1;
    this.stats.score = 0;
    this.stats.level = 1;
    this.stats.blocksDestroyed = 0;
    this.stats.enemiesKilled = 0;
    this.stats.combosMax = 0;
    this.player2 = null;
    this.clearInputState();
    this.initPlayer('p1', false);
    this.loadLevel(1);
    this.setGameState('COUNTDOWN');
  }

  public startDualGame() {
    this.gameMode = 'DUAL';
    this.stats.gameMode = 'DUAL';
    this.stats.p1Wins = 0;
    this.stats.p2Wins = 0;
    this.stats.round = 1;
    this.stats.dualWinner = null;
    this.clearInputState();
    this.loadDualRound();
    this.setGameState('COUNTDOWN');
  }

  public loadDualRound(roundNum?: number) {
    this.gameMode = 'DUAL';
    this.stats.gameMode = 'DUAL';
    if (roundNum !== undefined) {
      this.stats.round = roundNum;
    }
    this.levelTimeRemaining = 90; // 90 second intense battle rounds
    this.levelConfig = {
      levelNumber: this.stats.round,
      title: `Dual Battle - Round ${this.stats.round}`,
      enemyCounts: { drifter: 0, hunter: 0, chaser: 0 },
      destructibleDensity: 0.72,
      timeLimit: 90,
    };

    this.clearInputState();
    this.initPlayer('p1', false);
    this.initPlayer('p2', false);

    this.bombs = [];
    this.explosions = [];
    this.powerUps = [];
    this.destructions = [];
    this.particles = [];
    this.floatingTexts = [];
    this.comboCount = 0;
    this.comboTimer = 0;

    const generated = generateMap(this.levelConfig, 'DUAL');
    this.grid = generated.grid;
    this.blockPowerUps = generated.blockPowerUps;
    this.enemies = [];

    soundManager.setSoundEnabled(this.settings.soundEnabled);
    soundManager.setMusicEnabled(this.settings.musicEnabled);
  }

  public nextDualRound() {
    this.stats.round++;
    this.loadDualRound();
    this.setGameState('COUNTDOWN');
  }

  public loadLevel(levelNum: number, preservePowerups: boolean = true) {
    this.gameMode = 'SOLO';
    this.stats.gameMode = 'SOLO';
    this.currentLevel = levelNum;
    this.stats.level = levelNum;
    if (levelNum > this.stats.highestLevel) {
      this.stats.highestLevel = levelNum;
      this.saveToStorage();
    }

    const config = LEVEL_CONFIGS.find(l => l.levelNumber === levelNum) || {
      levelNumber: levelNum,
      title: `Sector ${levelNum}`,
      enemyCounts: {
        drifter: 2,
        hunter: Math.min(6, 1 + Math.floor(levelNum / 2)),
        chaser: Math.min(6, Math.floor(levelNum / 2)),
      },
      destructibleDensity: Math.min(0.88, 0.65 + levelNum * 0.02),
      timeLimit: Math.max(60, 120 - (levelNum - 1) * 5),
    };

    this.levelConfig = config;
    this.levelTimeRemaining = config.timeLimit;
    this.player2 = null;
    this.initPlayer('p1', preservePowerups);

    // Reset entities
    this.bombs = [];
    this.explosions = [];
    this.powerUps = [];
    this.destructions = [];
    this.particles = [];
    this.floatingTexts = [];
    this.comboCount = 0;
    this.comboTimer = 0;

    // Generate arena map
    const generated = generateMap(config, 'SOLO');
    this.grid = generated.grid;
    this.blockPowerUps = generated.blockPowerUps;
    this.enemies = generated.enemies;

    // Sound settings sync
    soundManager.setSoundEnabled(this.settings.soundEnabled);
    soundManager.setMusicEnabled(this.settings.musicEnabled);
  }

  public setGameState(newState: GameState) {
    this.gameState = newState;
    if (newState === 'PLAYING') {
      soundManager.startMusic(this.levelTimeRemaining <= 20);
    } else if (
      newState === 'PAUSED' ||
      newState === 'MENU' ||
      newState === 'GAME_OVER' ||
      newState === 'LEVEL_CLEAR' ||
      newState === 'DUAL_ROUND_OVER'
    ) {
      soundManager.stopMusic();
    }

    if (this.onStateChange) {
      this.onStateChange(newState);
    }
  }

  // === INPUT HANDLING ===

  public handleKeyDown(key: string) {
    const lower = key.toLowerCase();
    this.keysPressed.add(lower);

    if (lower === 'escape' || lower === 'p') {
      if (this.gameState === 'PLAYING') {
        this.setGameState('PAUSED');
        soundManager.playButtonClick();
        return;
      } else if (this.gameState === 'PAUSED') {
        this.setGameState('PLAYING');
        soundManager.playButtonClick();
        return;
      }
    }

    // Debug shortcuts
    if (this.settings.debugMode && this.gameState === 'PLAYING') {
      if (lower === 'n') {
        if (this.gameMode === 'SOLO') this.handleLevelClear();
        return;
      }
      if (lower === 'x') {
        const types: PowerUpType[] = ['FIRE', 'BOMB', 'SPEED', 'SHIELD', 'HEART', 'INVINCIBLE'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        this.spawnPowerUp(this.player.gridX, this.player.gridY, randomType);
        return;
      }
    }

    // Player 1 Movement Keys (WASD)
    if (lower === 'w' || lower === 'a' || lower === 's' || lower === 'd') {
      this.p1KeyOrder = this.p1KeyOrder.filter(k => k !== lower);
      this.p1KeyOrder.push(lower);
    }

    // Player 2 Movement Keys (Arrow keys)
    if (
      lower === 'arrowup' ||
      lower === 'arrowdown' ||
      lower === 'arrowleft' ||
      lower === 'arrowright'
    ) {
      if (this.gameMode === 'SOLO') {
        this.p1KeyOrder = this.p1KeyOrder.filter(k => k !== lower);
        this.p1KeyOrder.push(lower);
      } else {
        this.p2KeyOrder = this.p2KeyOrder.filter(k => k !== lower);
        this.p2KeyOrder.push(lower);
      }
    }

    // Player 1 Bomb Keys: Space, F, E, Q, Shift
    if (
      lower === ' ' ||
      lower === 'space' ||
      lower === 'f' ||
      lower === 'e' ||
      lower === 'q' ||
      lower === 'shift' ||
      lower === 'shiftleft' ||
      lower === 'c' ||
      lower === 'v'
    ) {
      this.bombRequestedP1 = true;
    }

    // Player 2 Bomb Keys: Enter, Numpad0, 0, Slash (/), Period (.), L, K, M, Control, ShiftRight
    if (
      lower === 'enter' ||
      lower === 'numpad0' ||
      lower === '0' ||
      lower === 'l' ||
      lower === 'k' ||
      lower === 'm' ||
      lower === '/' ||
      lower === 'slash' ||
      lower === '.' ||
      lower === 'period' ||
      lower === 'shiftright' ||
      lower === 'control' ||
      lower === ';'
    ) {
      this.bombRequestedP2 = true;
    }
  }

  public handleKeyUp(key: string) {
    const lower = key.toLowerCase();
    this.keysPressed.delete(lower);
    this.p1KeyOrder = this.p1KeyOrder.filter(k => k !== lower);
    this.p2KeyOrder = this.p2KeyOrder.filter(k => k !== lower);
  }

  public setRequestedDirection(dir: Direction, playerId: 'p1' | 'p2' = 'p1') {
    if (playerId === 'p1') {
      this.requestedDirectionP1 = dir;
    } else {
      this.requestedDirectionP2 = dir;
    }
  }

  public setJoystickVector(vx: number, vy: number, playerId: 'p1' | 'p2' = 'p1') {
    if (playerId === 'p1') {
      this.joystickVectorP1.x = vx;
      this.joystickVectorP1.y = vy;
    } else {
      this.joystickVectorP2.x = vx;
      this.joystickVectorP2.y = vy;
    }
  }

  public triggerBombAction(playerId: 'p1' | 'p2' = 'p1') {
    if (playerId === 'p1') {
      this.bombRequestedP1 = true;
    } else {
      this.bombRequestedP2 = true;
    }
  }

  // === MAIN GAME LOOP UPDATE ===

  public update(timestamp: number) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05); // Cap to 50ms for ultra-smooth simulation
    this.lastTimestamp = timestamp;

    // Calculate FPS
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 1.0) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // Update screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.settings.screenShake) {
        this.screenShakeOffset.x = (Math.random() * 2 - 1) * this.shakeMagnitude;
        this.screenShakeOffset.y = (Math.random() * 2 - 1) * this.shakeMagnitude;
      }
    } else {
      this.screenShakeOffset.x = 0;
      this.screenShakeOffset.y = 0;
    }

    if (this.gameState !== 'PLAYING') {
      // Update ambient particles & floating text even during non-playing state
      this.updateParticles(dt);
      this.updateFloatingTexts(dt);
      return;
    }

    // 1. Level timer
    this.levelTimeRemaining -= dt;
    if (this.levelTimeRemaining <= 0) {
      this.levelTimeRemaining = 0;
      if (this.gameMode === 'SOLO') {
        this.handleGameOver("TIME'S UP");
      } else {
        this.handleDualTimeUp();
      }
      return;
    }

    // Urgent music tempo when timer <= 20s
    if (this.levelTimeRemaining <= 20 && this.levelTimeRemaining + dt > 20) {
      soundManager.startMusic(true);
    }

    // 2. Combo timer
    if (this.comboCount > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // 3. Update Player 1
    this.updatePlayerEntity(this.player, dt, 'p1');

    // 3b. Update Player 2 if Dual Mode
    if (this.gameMode === 'DUAL' && this.player2) {
      this.updatePlayerEntity(this.player2, dt, 'p2');
    }

    // 4. Update Bombs
    this.updateBombs(dt);

    // 5. Update Explosions
    this.updateExplosions(dt);

    // 6. Update Destructible Blocks
    this.updateDestructions(dt);

    // 7. Update Enemies (Solo mode)
    if (this.gameMode === 'SOLO') {
      this.updateEnemies(dt);
    }

    // 8. Update Power-ups
    this.updatePowerUps(dt);

    // 9. Update Particles & Texts
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    // 10. Check Win Conditions
    if (this.gameMode === 'SOLO') {
      if (this.enemies.length === 0 && !this.player.isDying) {
        this.handleLevelClear();
      }
    } else {
      // Dual mode check
      this.checkDualRoundStatus();
    }
  }

  // === SMOOTH PLAYER CONTROLS & PHYSICS ===

  private updatePlayerEntity(p: Player, dt: number, playerId: 'p1' | 'p2') {
    if (p.isDying) {
      p.deathTimer -= dt;
      if (p.deathTimer <= 0) {
        if (this.gameMode === 'SOLO') {
          if (p.lives > 0) {
            // Respawn at safe start
            p.gridX = 1;
            p.gridY = 1;
            p.pixelX = 1;
            p.pixelY = 1;
            p.targetGridX = 1;
            p.targetGridY = 1;
            p.isMoving = false;
            p.isDying = false;
            p.isInvulnerable = true;
            p.invulnerableTimer = INVULNERABILITY_DURATION;
          } else {
            this.handleGameOver('OUT OF LIVES');
          }
        }
      }
      return;
    }

    // Invincibility Star timer countdown & sparkle trail
    if (p.isInvincible) {
      p.invincibleTimer -= dt;
      if (p.invincibleTimer <= 0) {
        p.isInvincible = false;
        p.invincibleTimer = 0;
      } else {
        // Spawn rainbow star sparks trail while moving
        if (Math.random() < 0.45) {
          const colors = ['#f59e0b', '#ec4899', '#06b6d4', '#84cc16', '#a855f7'];
          this.spawnParticle(
            (p.pixelX + 0.5) * 48 + (Math.random() * 24 - 12),
            (p.pixelY + 0.5) * 48 + (Math.random() * 24 - 12),
            (Math.random() * 2 - 1) * 30,
            (Math.random() * 2 - 1) * 30,
            colors[Math.floor(Math.random() * colors.length)],
            Math.random() * 5 + 3,
            0.4,
            'spark'
          );
        }
      }
    }

    // Invulnerability timer countdown
    if (p.isInvulnerable) {
      p.invulnerableTimer -= dt;
      if (p.invulnerableTimer <= 0) {
        p.isInvulnerable = false;
      }
    }

    // Handle bomb placement request
    const bombReq = playerId === 'p1' ? this.bombRequestedP1 : this.bombRequestedP2;
    if (bombReq) {
      if (playerId === 'p1') this.bombRequestedP1 = false;
      else this.bombRequestedP2 = false;
      this.tryPlaceBomb(Math.round(p.pixelX), Math.round(p.pixelY), playerId);
    }

    // 1. Continuous Analog Joystick Movement
    const joy = playerId === 'p1' ? this.joystickVectorP1 : this.joystickVectorP2;
    const joyLen = Math.hypot(joy.x, joy.y);

    if (joyLen > 0.08) {
      const normLen = Math.max(joyLen, 1.0);
      const vx = joy.x / normLen;
      const vy = joy.y / normLen;
      const speedMagnitude = Math.min(joyLen, 1.0);

      // Facing
      if (Math.abs(vx) > Math.abs(vy) * 1.25) {
        p.facing = vx > 0 ? 'RIGHT' : 'LEFT';
      } else if (Math.abs(vy) > Math.abs(vx) * 1.25) {
        p.facing = vy > 0 ? 'DOWN' : 'UP';
      } else {
        if (vy < 0) p.facing = vx < 0 ? 'UP_LEFT' : 'UP_RIGHT';
        else p.facing = vx < 0 ? 'DOWN_LEFT' : 'DOWN_RIGHT';
      }
      p.direction = p.facing;
      p.isMoving = true;
      p.walkFrame += dt * speedMagnitude;

      const BODY_RADIUS = 0.36;
      const ALIGN_SPEED = p.speed * dt * 0.95;

      // Move X axis if vx != 0
      if (Math.abs(vx) > 0.05) {
        const moveDistX = Math.abs(vx) * p.speed * dt;
        const dirX = Math.sign(vx);
        let stepX = moveDistX;
        let movedX = false;
        while (stepX > 0.005) {
          const testX = p.pixelX + dirX * stepX;
          if (this.isPositionWalkable(testX, p.pixelY, BODY_RADIUS, p)) {
            p.pixelX = testX;
            movedX = true;
            break;
          }
          stepX -= 0.015;
        }

        // Corner assist if purely pushing horizontal but blocked
        if (!movedX && Math.abs(vy) < 0.3) {
          const floorY = Math.floor(p.pixelY);
          const ceilY = Math.ceil(p.pixelY);
          if (floorY !== ceilY) {
            const tryUp = this.isPositionWalkable(p.pixelX + dirX * 0.1, floorY, BODY_RADIUS, p);
            const tryDown = this.isPositionWalkable(p.pixelX + dirX * 0.1, ceilY, BODY_RADIUS, p);
            if (tryUp && !tryDown) p.pixelY = Math.max(floorY, p.pixelY - ALIGN_SPEED);
            else if (tryDown && !tryUp) p.pixelY = Math.min(ceilY, p.pixelY + ALIGN_SPEED);
          }
        }
      }

      // Move Y axis if vy != 0
      if (Math.abs(vy) > 0.05) {
        const moveDistY = Math.abs(vy) * p.speed * dt;
        const dirY = Math.sign(vy);
        let stepY = moveDistY;
        let movedY = false;
        while (stepY > 0.005) {
          const testY = p.pixelY + dirY * stepY;
          if (this.isPositionWalkable(p.pixelX, testY, BODY_RADIUS, p)) {
            p.pixelY = testY;
            movedY = true;
            break;
          }
          stepY -= 0.015;
        }

        // Corner assist if purely pushing vertical but blocked
        if (!movedY && Math.abs(vx) < 0.3) {
          const floorX = Math.floor(p.pixelX);
          const ceilX = Math.ceil(p.pixelX);
          if (floorX !== ceilX) {
            const tryLeft = this.isPositionWalkable(floorX, p.pixelY + dirY * 0.1, BODY_RADIUS, p);
            const tryRight = this.isPositionWalkable(ceilX, p.pixelY + dirY * 0.1, BODY_RADIUS, p);
            if (tryLeft && !tryRight) p.pixelX = Math.max(floorX, p.pixelX - ALIGN_SPEED);
            else if (tryRight && !tryLeft) p.pixelX = Math.min(ceilX, p.pixelX + ALIGN_SPEED);
          }
        }
      }

      p.gridX = Math.round(p.pixelX);
      p.gridY = Math.round(p.pixelY);
      this.checkPowerUpPickupFor(p);
      return;
    }

    // Determine horizontal and vertical movement requests (supports simultaneous 2-button presses)
    let horizDir: 'LEFT' | 'RIGHT' | 'NONE' = 'NONE';
    let vertDir: 'UP' | 'DOWN' | 'NONE' = 'NONE';

    const reqDir = playerId === 'p1' ? this.requestedDirectionP1 : this.requestedDirectionP2;
    if (reqDir !== 'NONE') {
      if (reqDir === 'LEFT' || reqDir === 'RIGHT') horizDir = reqDir;
      else if (reqDir === 'UP' || reqDir === 'DOWN') vertDir = reqDir;
      else if (reqDir === 'UP_LEFT') { vertDir = 'UP'; horizDir = 'LEFT'; }
      else if (reqDir === 'UP_RIGHT') { vertDir = 'UP'; horizDir = 'RIGHT'; }
      else if (reqDir === 'DOWN_LEFT') { vertDir = 'DOWN'; horizDir = 'LEFT'; }
      else if (reqDir === 'DOWN_RIGHT') { vertDir = 'DOWN'; horizDir = 'RIGHT'; }
    }

    if (playerId === 'p1') {
      const isLeft = this.keysPressed.has('a') || (this.gameMode === 'SOLO' && this.keysPressed.has('arrowleft'));
      const isRight = this.keysPressed.has('d') || (this.gameMode === 'SOLO' && this.keysPressed.has('arrowright'));
      const isUp = this.keysPressed.has('w') || (this.gameMode === 'SOLO' && this.keysPressed.has('arrowup'));
      const isDown = this.keysPressed.has('s') || (this.gameMode === 'SOLO' && this.keysPressed.has('arrowdown'));

      if (isLeft && !isRight) horizDir = 'LEFT';
      else if (isRight && !isLeft) horizDir = 'RIGHT';
      else if (isLeft && isRight) {
        const lastH = [...this.p1KeyOrder].reverse().find(k => k === 'a' || k === 'd' || (this.gameMode === 'SOLO' && (k === 'arrowleft' || k === 'arrowright')));
        horizDir = (lastH === 'a' || lastH === 'arrowleft') ? 'LEFT' : 'RIGHT';
      }

      if (isUp && !isDown) vertDir = 'UP';
      else if (isDown && !isUp) vertDir = 'DOWN';
      else if (isUp && isDown) {
        const lastV = [...this.p1KeyOrder].reverse().find(k => k === 'w' || k === 's' || (this.gameMode === 'SOLO' && (k === 'arrowup' || k === 'arrowdown')));
        vertDir = (lastV === 'w' || lastV === 'arrowup') ? 'UP' : 'DOWN';
      }
    } else {
      const isLeft = this.keysPressed.has('arrowleft');
      const isRight = this.keysPressed.has('arrowright');
      const isUp = this.keysPressed.has('arrowup');
      const isDown = this.keysPressed.has('arrowdown');

      if (isLeft && !isRight) horizDir = 'LEFT';
      else if (isRight && !isLeft) horizDir = 'RIGHT';
      else if (isLeft && isRight) {
        const lastH = [...this.p2KeyOrder].reverse().find(k => k === 'arrowleft' || k === 'arrowright');
        horizDir = lastH === 'arrowleft' ? 'LEFT' : 'RIGHT';
      }

      if (isUp && !isDown) vertDir = 'UP';
      else if (isDown && !isUp) vertDir = 'DOWN';
      else if (isUp && isDown) {
        const lastV = [...this.p2KeyOrder].reverse().find(k => k === 'arrowup' || k === 'arrowdown');
        vertDir = lastV === 'arrowup' ? 'UP' : 'DOWN';
      }
    }

    // INSTANT STOP ANYWHERE: If neither horizontal nor vertical key is held, stop immediately!
    if (horizDir === 'NONE' && vertDir === 'NONE') {
      p.isMoving = false;
      p.gridX = Math.round(p.pixelX);
      p.gridY = Math.round(p.pixelY);
      p.targetGridX = p.gridX;
      p.targetGridY = p.gridY;
      this.checkPowerUpPickupFor(p);
      return;
    }

    p.isMoving = true;
    p.walkFrame += dt;

    // Determine facing direction
    if (horizDir !== 'NONE' && vertDir !== 'NONE') {
      // 2 buttons active simultaneously
      const keyOrder = playerId === 'p1' ? this.p1KeyOrder : this.p2KeyOrder;
      const lastKey = keyOrder[keyOrder.length - 1];
      if (lastKey === 'w' || lastKey === 'arrowup') p.facing = 'UP';
      else if (lastKey === 's' || lastKey === 'arrowdown') p.facing = 'DOWN';
      else if (lastKey === 'a' || lastKey === 'arrowleft') p.facing = 'LEFT';
      else if (lastKey === 'd' || lastKey === 'arrowright') p.facing = 'RIGHT';
      else p.facing = horizDir;
      p.direction = horizDir;
    } else if (horizDir !== 'NONE') {
      p.facing = horizDir;
      p.direction = horizDir;
    } else {
      p.facing = vertDir;
      p.direction = vertDir;
    }

    const moveDist = p.speed * dt;
    const BODY_RADIUS = 0.36;
    const ALIGN_SPEED = p.speed * dt * 0.95;

    // Both buttons active simultaneously (Diagonal movement & independent axis collision)
    if (horizDir !== 'NONE' && vertDir !== 'NONE') {
      const dx = horizDir === 'RIGHT' ? 1 : -1;
      const dy = vertDir === 'DOWN' ? 1 : -1;

      // 1. Move horizontal axis
      let stepX = moveDist;
      while (stepX > 0.005) {
        const testX = p.pixelX + dx * stepX;
        if (this.isPositionWalkable(testX, p.pixelY, BODY_RADIUS, p)) {
          p.pixelX = testX;
          break;
        }
        stepX -= 0.015;
      }

      // 2. Move vertical axis
      let stepY = moveDist;
      while (stepY > 0.005) {
        const testY = p.pixelY + dy * stepY;
        if (this.isPositionWalkable(p.pixelX, testY, BODY_RADIUS, p)) {
          p.pixelY = testY;
          break;
        }
        stepY -= 0.015;
      }
    } else if (horizDir !== 'NONE') {
      // Single Horizontal Axis Movement
      const dx = horizDir === 'RIGHT' ? 1 : -1;
      const targetRow = Math.round(p.pixelY);

      // Auto-align to horizontal corridor center
      if (Math.abs(p.pixelY - targetRow) > 0.001) {
        const yDiff = targetRow - p.pixelY;
        const slideY = Math.sign(yDiff) * Math.min(Math.abs(yDiff), ALIGN_SPEED);
        if (this.isPositionWalkable(p.pixelX, p.pixelY + slideY, BODY_RADIUS, p)) {
          p.pixelY += slideY;
        }
      }

      // Corner assist
      const nextX = p.pixelX + dx * moveDist;
      if (!this.isPositionWalkable(nextX, p.pixelY, BODY_RADIUS, p)) {
        const floorY = Math.floor(p.pixelY);
        const ceilY = Math.ceil(p.pixelY);
        if (floorY !== ceilY) {
          const tryUp = this.isPositionWalkable(p.pixelX + dx * 0.1, floorY, BODY_RADIUS, p);
          const tryDown = this.isPositionWalkable(p.pixelX + dx * 0.1, ceilY, BODY_RADIUS, p);
          if (tryUp && !tryDown) {
            p.pixelY = Math.max(floorY, p.pixelY - ALIGN_SPEED);
          } else if (tryDown && !tryUp) {
            p.pixelY = Math.min(ceilY, p.pixelY + ALIGN_SPEED);
          }
        }
      }

      let step = moveDist;
      while (step > 0.005) {
        const testX = p.pixelX + dx * step;
        if (this.isPositionWalkable(testX, p.pixelY, BODY_RADIUS, p)) {
          p.pixelX = testX;
          break;
        }
        step -= 0.015;
      }
    } else if (vertDir !== 'NONE') {
      // Single Vertical Axis Movement
      const dy = vertDir === 'DOWN' ? 1 : -1;
      const targetCol = Math.round(p.pixelX);

      // Auto-align to vertical corridor center
      if (Math.abs(p.pixelX - targetCol) > 0.001) {
        const xDiff = targetCol - p.pixelX;
        const slideX = Math.sign(xDiff) * Math.min(Math.abs(xDiff), ALIGN_SPEED);
        if (this.isPositionWalkable(p.pixelX + slideX, p.pixelY, BODY_RADIUS, p)) {
          p.pixelX += slideX;
        }
      }

      // Corner assist
      const nextY = p.pixelY + dy * moveDist;
      if (!this.isPositionWalkable(p.pixelX, nextY, BODY_RADIUS, p)) {
        const floorX = Math.floor(p.pixelX);
        const ceilX = Math.ceil(p.pixelX);
        if (floorX !== ceilX) {
          const tryLeft = this.isPositionWalkable(floorX, p.pixelY + dy * 0.1, BODY_RADIUS, p);
          const tryRight = this.isPositionWalkable(ceilX, p.pixelY + dy * 0.1, BODY_RADIUS, p);
          if (tryLeft && !tryRight) {
            p.pixelX = Math.max(floorX, p.pixelX - ALIGN_SPEED);
          } else if (tryRight && !tryLeft) {
            p.pixelX = Math.min(ceilX, p.pixelX + ALIGN_SPEED);
          }
        }
      }

      let step = moveDist;
      while (step > 0.005) {
        const testY = p.pixelY + dy * step;
        if (this.isPositionWalkable(p.pixelX, testY, BODY_RADIUS, p)) {
          p.pixelY = testY;
          break;
        }
        step -= 0.015;
      }
    }

    p.gridX = Math.round(p.pixelX);
    p.gridY = Math.round(p.pixelY);
    p.targetGridX = p.gridX;
    p.targetGridY = p.gridY;

    // Check power-up collection continuously as player moves
    this.checkPowerUpPickupFor(p);
  }

  private isTileBlocked(col: number, row: number, player?: Player): boolean {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return true;
    const cell = this.grid[row][col];
    if (cell === CellType.INDESTRUCTIBLE || cell === CellType.DESTRUCTIBLE) return true;

    // Active bomb check
    for (const b of this.bombs) {
      if (b.gridX === col && b.gridY === row) {
        if (player) {
          // If player is currently overlapping/inside this bomb tile, allow them to step off freely
          const dist = Math.hypot(player.pixelX - col, player.pixelY - row);
          if (dist < 0.72) {
            continue; // Player is inside bomb cell, not blocked yet
          }
        }
        return true;
      }
    }
    return false;
  }

  private isPositionWalkable(px: number, py: number, radius: number, player?: Player): boolean {
    const r = radius;
    const corners = [
      { x: px - r, y: py - r },
      { x: px + r, y: py - r },
      { x: px - r, y: py + r },
      { x: px + r, y: py + r },
    ];

    for (const pt of corners) {
      const col = Math.floor(pt.x + 0.5);
      const row = Math.floor(pt.y + 0.5);
      if (this.isTileBlocked(col, row, player)) {
        return false;
      }
    }
    return true;
  }

  private tryPlaceBomb(gx: number, gy: number, playerId: 'p1' | 'p2') {
    const p = playerId === 'p1' ? this.player : this.player2;
    if (!p || p.isDying) return;

    // Check if player has reached their simultaneous capacity
    const currentOwnedBombs = this.bombs.filter(b => b.ownerId === playerId);
    if (currentOwnedBombs.length >= p.maxBombs) return;

    // Check if bomb already exists at this cell
    if (this.bombs.some(b => b.gridX === gx && b.gridY === gy)) return;

    this.bombs.push({
      id: `bomb_${playerId}_${Date.now()}_${Math.random()}`,
      gridX: gx,
      gridY: gy,
      timer: BASE_BOMB_TIMER,
      maxTimer: BASE_BOMB_TIMER,
      range: p.fireRange,
      ownerId: playerId,
      isTriggered: false,
    });

    soundManager.playBombPlaced();
  }

  // === BOMBS & EXPLOSIONS ===

  private updateBombs(dt: number) {
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.timer -= dt;

      // Warning ticks
      if (b.timer <= 0.6 && b.timer + dt > 0.6) {
        soundManager.playBombTick(true);
      } else if (b.timer <= 1.2 && b.timer + dt > 1.2) {
        soundManager.playBombTick(false);
      }

      if (b.timer <= 0 || b.isTriggered) {
        this.detonateBomb(b);
        this.bombs.splice(i, 1);
      }
    }
  }

  private detonateBomb(bomb: Bomb) {
    const isChain = bomb.isTriggered;
    soundManager.playExplosion(isChain);
    this.triggerShake(isChain ? 7 : 5);

    // Center explosion
    this.addExplosionCell(bomb.gridX, bomb.gridY, 'center', isChain);

    const dirs: { dx: number; dy: number; axis: 'horizontal' | 'vertical'; endPart: 'end_up' | 'end_down' | 'end_left' | 'end_right' }[] = [
      { dx: 0, dy: -1, axis: 'vertical', endPart: 'end_up' },
      { dx: 0, dy: 1, axis: 'vertical', endPart: 'end_down' },
      { dx: -1, dy: 0, axis: 'horizontal', endPart: 'end_left' },
      { dx: 1, dy: 0, axis: 'horizontal', endPart: 'end_right' },
    ];

    for (const d of dirs) {
      for (let dist = 1; dist <= bomb.range; dist++) {
        const cx = bomb.gridX + d.dx * dist;
        const cy = bomb.gridY + d.dy * dist;

        if (cx < 0 || cx >= GRID_COLS || cy < 0 || cy >= GRID_ROWS) break;

        const cell = this.grid[cy][cx];

        // 1. Indestructible wall stops explosion completely
        if (cell === CellType.INDESTRUCTIBLE) {
          break;
        }

        // 2. Destructible block: destroy it, add particle effects, stop explosion in this ray
        if (cell === CellType.DESTRUCTIBLE) {
          this.destroyBlock(cx, cy, bomb.ownerId);
          this.addExplosionCell(cx, cy, 'center', isChain);
          break;
        }

        // 3. Empty cell: propagate explosion ray
        const isEnd = dist === bomb.range;
        this.addExplosionCell(cx, cy, isEnd ? d.endPart : d.axis, isChain);

        // Check chain reaction on other bombs in cell
        const otherBomb = this.bombs.find(b => b.gridX === cx && b.gridY === cy && !b.isTriggered);
        if (otherBomb) {
          otherBomb.isTriggered = true;
          this.addScore(SCORE_KILL_CHAIN_BONUS, cx, cy, '+CHAIN!');
        }
      }
    }
  }

  private addExplosionCell(gx: number, gy: number, part: ExplosionCell['part'], isChain: boolean) {
    this.explosions.push({
      gridX: gx,
      gridY: gy,
      part,
      timer: EXPLOSION_DURATION,
      maxTimer: EXPLOSION_DURATION,
      chainOrigin: isChain,
    });

    // Spawn burst sparks
    for (let i = 0; i < 4; i++) {
      this.spawnParticle(
        (gx + 0.5) * 48 + (Math.random() * 20 - 10),
        (gy + 0.5) * 48 + (Math.random() * 20 - 10),
        (Math.random() * 2 - 1) * 80,
        (Math.random() * 2 - 1) * 80,
        Math.random() > 0.5 ? '#f97316' : '#fef08a',
        Math.random() * 4 + 2,
        0.35,
        'spark'
      );
    }
  }

  private updateExplosions(dt: number) {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.timer -= dt;

      // Check collision with Player 1 (checks both tile and sub-tile distance)
      if (!this.player.isDying) {
        const p1Dist = Math.hypot(this.player.pixelX - exp.gridX, this.player.pixelY - exp.gridY);
        if (p1Dist < 0.72 || (this.player.gridX === exp.gridX && this.player.gridY === exp.gridY)) {
          this.damagePlayerEntity(this.player);
        }
      }

      // Check collision with Player 2 (Dual Mode)
      if (this.gameMode === 'DUAL' && this.player2 && !this.player2.isDying) {
        const p2Dist = Math.hypot(this.player2.pixelX - exp.gridX, this.player2.pixelY - exp.gridY);
        if (p2Dist < 0.72 || (this.player2.gridX === exp.gridX && this.player2.gridY === exp.gridY)) {
          this.damagePlayerEntity(this.player2);
        }
      }

      // Check collision with enemies (Solo Mode)
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (e.gridX === exp.gridX && e.gridY === exp.gridY && !e.isDying) {
          this.killEnemy(e);
        }
      }

      // Check collision with power-ups on the floor (vaporize only pre-existing powerups that are not immune)
      const powerUpIndex = this.powerUps.findIndex(p => p.gridX === exp.gridX && p.gridY === exp.gridY);
      if (powerUpIndex !== -1) {
        const pu = this.powerUps[powerUpIndex];
        if (!pu.immuneTimer || pu.immuneTimer <= 0) {
          this.powerUps.splice(powerUpIndex, 1);
          this.spawnFloatingText('VAPORIZED', (exp.gridX + 0.5) * 48, (exp.gridY + 0.5) * 48, '#ef4444', 12);
        }
      }

      if (exp.timer <= 0) {
        this.explosions.splice(i, 1);
      }
    }
  }

  // === DESTRUCTION & POWERUPS ===

  private destroyBlock(gx: number, gy: number, ownerId: 'p1' | 'p2') {
    this.grid[gy][gx] = CellType.EMPTY;
    this.stats.blocksDestroyed++;
    this.levelStats.blocksDestroyed++;
    this.incrementCombo();
    this.addScore(SCORE_BLOCK, gx, gy, `+${SCORE_BLOCK}`);

    const key = `${gx},${gy}`;
    const powerUpType = this.blockPowerUps.get(key);
    this.blockPowerUps.delete(key);

    this.destructions.push({
      gridX: gx,
      gridY: gy,
      timer: BLOCK_DESTRUCTION_DURATION,
      maxTimer: BLOCK_DESTRUCTION_DURATION,
      powerUpToSpawn: powerUpType,
    });

    soundManager.playBlockDestroy();

    // Spawn debris particles
    for (let i = 0; i < 8; i++) {
      this.spawnParticle(
        (gx + 0.5) * 48,
        (gy + 0.5) * 48,
        (Math.random() * 2 - 1) * 90,
        (Math.random() * 2 - 1) * 90,
        '#d97706',
        Math.random() * 5 + 2,
        0.4,
        'square'
      );
    }
  }

  private updateDestructions(dt: number) {
    for (let i = this.destructions.length - 1; i >= 0; i--) {
      const d = this.destructions[i];
      d.timer -= dt;
      if (d.timer <= 0) {
        if (d.powerUpToSpawn) {
          this.spawnPowerUp(d.gridX, d.gridY, d.powerUpToSpawn);
        }
        this.destructions.splice(i, 1);
      }
    }
  }

  public spawnPowerUp(gx: number, gy: number, type: PowerUpType) {
    this.powerUps.push({
      id: `p_${Date.now()}_${Math.random()}`,
      gridX: gx,
      gridY: gy,
      type,
      floatOffset: 0,
      spawnTime: performance.now() * 0.001,
      immuneTimer: 1.5, // Immune to explosion vaporization so revealing blasts don't destroy it!
    });
  }

  private updatePowerUps(dt: number) {
    // Tick down immunity timers
    for (const pu of this.powerUps) {
      if (pu.immuneTimer && pu.immuneTimer > 0) {
        pu.immuneTimer -= dt;
      }
    }

    this.checkPowerUpPickupFor(this.player);
    if (this.gameMode === 'DUAL' && this.player2) {
      this.checkPowerUpPickupFor(this.player2);
    }
  }

  private checkPowerUpPickupFor(p: Player) {
    if (p.isDying) return;
    const idx = this.powerUps.findIndex(pu => {
      if (pu.gridX === p.gridX && pu.gridY === p.gridY) return true;
      const dist = Math.hypot(p.pixelX - pu.gridX, p.pixelY - pu.gridY);
      return dist < 0.72;
    });
    if (idx !== -1) {
      const pu = this.powerUps[idx];
      this.powerUps.splice(idx, 1);
      this.applyPowerUp(pu.type, p);
    }
  }

  private applyPowerUp(type: PowerUpType, p: Player) {
    const gx = p.gridX;
    const gy = p.gridY;

    if (type === 'INVINCIBLE') {
      p.isInvincible = true;
      p.invincibleTimer = INVINCIBLE_DURATION;
      soundManager.playInvinciblePowerUp();
      this.addScore(SCORE_INVINCIBLE, gx, gy, `+${SCORE_INVINCIBLE}`);
      this.spawnFloatingText('⭐ STAR INVINCIBLE! ⭐', (gx + 0.5) * 48, (gy + 0.5) * 48 - 25, '#facc15', 18);
      this.triggerShake(4);

      // Massive star burst
      for (let i = 0; i < 20; i++) {
        const colors = ['#f59e0b', '#ec4899', '#06b6d4', '#84cc16', '#a855f7'];
        this.spawnParticle(
          (gx + 0.5) * 48,
          (gy + 0.5) * 48,
          (Math.random() * 2 - 1) * 140,
          (Math.random() * 2 - 1) * 140,
          colors[i % colors.length],
          Math.random() * 6 + 3,
          0.6,
          'spark'
        );
      }
      return;
    }

    soundManager.playPowerUp();
    this.addScore(SCORE_POWERUP, gx, gy, `+${SCORE_POWERUP}`);

    let text = '+POWER';
    let color = '#38bdf8';

    switch (type) {
      case 'FIRE':
        if (p.fireRange >= MAX_FIRE_RANGE) {
          text = 'FIRE MAXED (x5)!';
          color = '#f97316';
        } else {
          p.fireRange = Math.min(p.fireRange + 1, MAX_FIRE_RANGE);
          text = `+FIRE RANGE (x${p.fireRange})`;
          color = '#f97316';
        }
        break;
      case 'BOMB':
        if (p.maxBombs >= MAX_BOMB_CAPACITY) {
          text = 'BOMBS MAXED (x5)!';
          color = '#a855f7';
        } else {
          p.maxBombs = Math.min(p.maxBombs + 1, MAX_BOMB_CAPACITY);
          text = `+BOMB CAPACITY (x${p.maxBombs})`;
          color = '#a855f7';
        }
        break;
      case 'SPEED': {
        const maxLevel = Math.round(MAX_SPEED_BOOST / SPEED_BOOST_PER_POWERUP); // 4
        if (p.speedLevel >= maxLevel) {
          text = 'SPEED MAXED (+60%)!';
          color = '#eab308';
        } else {
          p.speedLevel = Math.min(p.speedLevel + 1, maxLevel);
          p.speed = BASE_PLAYER_SPEED * (1 + p.speedLevel * SPEED_BOOST_PER_POWERUP);
          text = `+SPEED (+${p.speedLevel * 15}%)`;
          color = '#eab308';
        }
        break;
      }
      case 'SHIELD':
        if (p.hasShield) {
          text = 'SHIELD RESTORED!';
          color = '#06b6d4';
        } else {
          p.hasShield = true;
          text = 'SHIELD EQUIPPED!';
          color = '#06b6d4';
        }
        break;
      case 'HEART':
        if (p.lives >= MAX_PLAYER_LIVES) {
          text = 'LIVES FULL (3/3)!';
          color = '#f43f5e';
        } else {
          p.lives = Math.min(p.lives + 1, MAX_PLAYER_LIVES);
          text = `+1 LIFE (${p.lives}/${MAX_PLAYER_LIVES})!`;
          color = '#f43f5e';
        }
        break;
    }

    this.spawnFloatingText(text, (gx + 0.5) * 48, (gy + 0.5) * 48 - 15, color, 13);

    // Optimized powerup burst particles (minimal count)
    for (let i = 0; i < 6; i++) {
      this.spawnParticle(
        (gx + 0.5) * 48,
        (gy + 0.5) * 48,
        (Math.random() * 2 - 1) * 70,
        (Math.random() * 2 - 1) * 70,
        color,
        Math.random() * 3 + 2,
        0.35,
        'spark'
      );
    }
  }

  // === ENEMY AI & UPDATES (SOLO MODE) ===

  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      if (e.isDying) {
        e.deathTimer -= dt;
        if (e.deathTimer <= 0) {
          this.enemies.splice(i, 1);
        }
        continue;
      }

      // Check collision with player
      if (!this.player.isDying) {
        const dist = Math.hypot(e.pixelX - this.player.pixelX, e.pixelY - this.player.pixelY);
        if (dist < 0.65) {
          if (this.player.isInvincible) {
            // Invincible player crushes enemies on contact!
            this.killEnemy(e);
            this.addScore(SCORE_KILL_BASE * 2, e.gridX, e.gridY, '+CRUSHED! 200');
          } else {
            this.damagePlayerEntity(this.player);
          }
        }
      }

      // Handle enemy grid movement interpolation
      if (e.isMoving) {
        const moveDist = e.speed * dt;
        const dx = e.targetGridX - e.pixelX;
        const dy = e.targetGridY - e.pixelY;
        const totalDist = Math.hypot(dx, dy);

        if (totalDist <= moveDist) {
          e.pixelX = e.targetGridX;
          e.pixelY = e.targetGridY;
          e.gridX = e.targetGridX;
          e.gridY = e.targetGridY;
          e.isMoving = false;
        } else {
          e.pixelX += (dx / totalDist) * moveDist;
          e.pixelY += (dy / totalDist) * moveDist;
        }
      }

      // AI Decision making when reached cell
      if (!e.isMoving) {
        e.pathTimer += dt;
        this.decideEnemyNextStep(e);
      }
    }
  }

  private decideEnemyNextStep(e: Enemy) {
    const availableDirs = this.getAvailableDirectionsForEnemy(e.gridX, e.gridY);
    if (availableDirs.length === 0) return;

    if (e.type === 'DRIFTER') {
      if (e.direction !== 'NONE' && availableDirs.includes(e.direction) && Math.random() < 0.75) {
        // Keep current direction
      } else {
        e.direction = availableDirs[Math.floor(Math.random() * availableDirs.length)];
      }
    } else if (e.type === 'HUNTER' || e.type === 'CHASER') {
      const nextDir = this.findBfsDirection(e.gridX, e.gridY, this.player.gridX, this.player.gridY);
      if (nextDir !== 'NONE' && availableDirs.includes(nextDir)) {
        e.direction = nextDir;
      } else {
        e.direction = availableDirs.reduce((bestDir, dir) => {
          const next = this.getNextCell(e.gridX, e.gridY, dir);
          const nextDist = Math.abs(next.x - this.player.gridX) + Math.abs(next.y - this.player.gridY);
          const currentBest = this.getNextCell(e.gridX, e.gridY, bestDir);
          const bestDist = Math.abs(currentBest.x - this.player.gridX) + Math.abs(currentBest.y - this.player.gridY);
          return nextDist < bestDist ? dir : bestDir;
        }, availableDirs[0]);
      }
    }

    const next = this.getNextCell(e.gridX, e.gridY, e.direction);
    e.targetGridX = next.x;
    e.targetGridY = next.y;
    e.isMoving = true;
  }

  private getAvailableDirectionsForEnemy(gx: number, gy: number): Direction[] {
    const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    return dirs.filter(dir => {
      const next = this.getNextCell(gx, gy, dir);
      return this.canWalkOn(next.x, next.y, false);
    });
  }

  private findBfsDirection(startX: number, startY: number, targetX: number, targetY: number): Direction {
    if (startX === targetX && startY === targetY) return 'NONE';

    interface QueueNode {
      x: number;
      y: number;
      firstDir: Direction;
    }

    const visited = new Set<string>();
    visited.add(`${startX},${startY}`);
    const queue: QueueNode[] = [];

    const dirs: { dir: Direction; dx: number; dy: number }[] = [
      { dir: 'UP', dx: 0, dy: -1 },
      { dir: 'DOWN', dx: 0, dy: 1 },
      { dir: 'LEFT', dx: -1, dy: 0 },
      { dir: 'RIGHT', dx: 1, dy: 0 },
    ];

    for (const d of dirs) {
      const nx = startX + d.dx;
      const ny = startY + d.dy;
      if (this.canWalkOn(nx, ny, false)) {
        if (nx === targetX && ny === targetY) return d.dir;
        visited.add(`${nx},${ny}`);
        queue.push({ x: nx, y: ny, firstDir: d.dir });
      }
    }

    let steps = 0;
    while (queue.length > 0 && steps < 60) {
      steps++;
      const current = queue.shift()!;

      if (current.x === targetX && current.y === targetY) {
        return current.firstDir;
      }

      for (const d of dirs) {
        const nx = current.x + d.dx;
        const ny = current.y + d.dy;
        const key = `${nx},${ny}`;

        if (!visited.has(key) && this.canWalkOn(nx, ny, false)) {
          visited.add(key);
          queue.push({ x: nx, y: ny, firstDir: current.firstDir });
        }
      }
    }

    return 'NONE';
  }

  private killEnemy(e: Enemy) {
    e.isDying = true;
    e.deathTimer = ENEMY_DEATH_DURATION;
    this.stats.enemiesKilled++;
    this.levelStats.enemiesKilled++;

    this.incrementCombo();
    const killScore = SCORE_KILL_BASE * Math.max(1, this.comboCount);
    this.addScore(killScore, e.gridX, e.gridY, `+${killScore}`);

    soundManager.playEnemyDeath();
    this.triggerShake(5);

    for (let i = 0; i < 15; i++) {
      this.spawnParticle(
        (e.gridX + 0.5) * 48,
        (e.gridY + 0.5) * 48,
        (Math.random() * 2 - 1) * 120,
        (Math.random() * 2 - 1) * 120,
        e.type === 'DRIFTER' ? '#06b6d4' : e.type === 'HUNTER' ? '#f59e0b' : '#ef4444',
        Math.random() * 5 + 2,
        0.5,
        'spark'
      );
    }
  }

  // === PLAYER DAMAGE & DEATH ===

  private damagePlayerEntity(p: Player) {
    if (p.isInvincible || p.isInvulnerable || p.isDying) return;

    if (p.hasShield) {
      p.hasShield = false;
      p.isInvulnerable = true;
      p.invulnerableTimer = INVULNERABILITY_DURATION;
      soundManager.playShieldBreak();
      this.triggerShake(4);
      this.spawnFloatingText('SHIELD BROKE!', (p.gridX + 0.5) * 48, (p.gridY + 0.5) * 48 - 20, '#38bdf8', 16);
      return;
    }

    p.lives--;
    soundManager.playPlayerHurt();
    this.triggerShake(8);

    if (this.settings.vibration && navigator.vibrate) {
      navigator.vibrate([80, 50, 100]);
    }

    if (p.lives > 0) {
      p.isInvulnerable = true;
      p.invulnerableTimer = INVULNERABILITY_DURATION;
      this.spawnFloatingText('-1 LIFE', (p.gridX + 0.5) * 48, (p.gridY + 0.5) * 48 - 20, '#ef4444', 16);
    } else {
      p.isDying = true;
      p.deathTimer = PLAYER_DEATH_DURATION;
      this.spawnFloatingText('CRITICAL FAILURE', (p.gridX + 0.5) * 48, (p.gridY + 0.5) * 48 - 20, '#ef4444', 18);
    }
  }

  // === DUAL PLAYER ROUND EVALUATION ===

  private checkDualRoundStatus() {
    if (!this.player2) return;

    const p1Dead = this.player.lives <= 0 && this.player.isDying;
    const p2Dead = this.player2.lives <= 0 && this.player2.isDying;

    if (p1Dead && p2Dead) {
      this.stats.dualWinner = 'DRAW';
      soundManager.playGameOver();
      this.setGameState('DUAL_ROUND_OVER');
    } else if (p1Dead) {
      this.stats.dualWinner = 'PLAYER_2';
      this.stats.p2Wins++;
      soundManager.playLevelClear();
      this.setGameState('DUAL_ROUND_OVER');
    } else if (p2Dead) {
      this.stats.dualWinner = 'PLAYER_1';
      this.stats.p1Wins++;
      soundManager.playLevelClear();
      this.setGameState('DUAL_ROUND_OVER');
    }
  }

  private handleDualTimeUp() {
    if (!this.player2) return;
    if (this.player.lives > this.player2.lives) {
      this.stats.dualWinner = 'PLAYER_1';
      this.stats.p1Wins++;
    } else if (this.player2.lives > this.player.lives) {
      this.stats.dualWinner = 'PLAYER_2';
      this.stats.p2Wins++;
    } else {
      this.stats.dualWinner = 'DRAW';
    }
    soundManager.playLevelClear();
    this.setGameState('DUAL_ROUND_OVER');
  }

  // === SCORING & COMBOS ===

  private addScore(amount: number, gx: number, gy: number, label: string) {
    this.stats.score += amount;
    this.levelStats.scoreEarned += amount;
    if (this.stats.score > this.stats.bestScore) {
      this.stats.bestScore = this.stats.score;
      this.saveToStorage();
    }

    this.spawnFloatingText(label, (gx + 0.5) * 48, (gy + 0.5) * 48, '#fbbf24', 14);
  }

  private incrementCombo() {
    this.comboCount++;
    this.comboTimer = COMBO_RESET_TIME;
    if (this.comboCount > this.stats.combosMax) {
      this.stats.combosMax = this.comboCount;
    }

    if (this.comboCount >= 2) {
      soundManager.playCombo(this.comboCount);
      const text = this.comboCount >= 4 ? `🔥 MEGA COMBO x${this.comboCount}! 🔥` : `COMBO x${this.comboCount}!`;
      this.spawnFloatingText(
        text,
        (this.player.gridX + 0.5) * 48,
        (this.player.gridY + 0.5) * 48 - 35,
        '#f59e0b',
        this.comboCount >= 4 ? 20 : 16
      );
      this.triggerShake(3);
    }
  }

  // === LEVEL CLEAR & GAME OVER (SOLO MODE) ===

  private handleLevelClear() {
    soundManager.playLevelClear();
    const timeBonus = Math.floor(this.levelTimeRemaining) * SCORE_TIME_PER_SECOND;
    const comboBonus = this.stats.combosMax * 50;
    const totalLevelScore = SCORE_LEVEL_CLEAR + timeBonus + comboBonus;

    this.stats.score += totalLevelScore;
    if (this.stats.score > this.stats.bestScore) {
      this.stats.bestScore = this.stats.score;
    }
    this.saveToStorage();

    this.levelStats = {
      scoreEarned: this.levelStats.scoreEarned,
      enemiesKilled: this.levelStats.enemiesKilled,
      blocksDestroyed: this.levelStats.blocksDestroyed,
      timeRemaining: Math.floor(this.levelTimeRemaining),
      comboBonus,
      timeBonus,
      totalLevelScore,
    };

    this.setGameState('LEVEL_CLEAR');
  }

  private handleGameOver(reason: string) {
    soundManager.playGameOver();
    this.saveToStorage();
    this.setGameState('GAME_OVER');
  }

  // === COLLISION HELPERS ===

  public canWalkOn(gx: number, gy: number, isPlayer: boolean, checkingPlayer?: Player): boolean {
    if (gx < 0 || gx >= GRID_COLS || gy < 0 || gy >= GRID_ROWS) return false;
    const cell = this.grid[gy][gx];
    if (cell === CellType.INDESTRUCTIBLE || cell === CellType.DESTRUCTIBLE) return false;

    // Active bomb check
    const hasBomb = this.bombs.some(b => b.gridX === gx && b.gridY === gy);
    if (hasBomb) {
      if (isPlayer && checkingPlayer && checkingPlayer.gridX === gx && checkingPlayer.gridY === gy) {
        return true; // Step off newly planted bomb
      }
      return false;
    }

    return true;
  }

  private getNextCell(gx: number, gy: number, dir: Direction): { x: number; y: number } {
    switch (dir) {
      case 'UP': return { x: gx, y: gy - 1 };
      case 'DOWN': return { x: gx, y: gy + 1 };
      case 'LEFT': return { x: gx - 1, y: gy };
      case 'RIGHT': return { x: gx + 1, y: gy };
      default: return { x: gx, y: gy };
    }
  }

  // === PARTICLES & FLOATING TEXTS ===

  public spawnParticle(
    x: number, y: number, vx: number, vy: number,
    color: string, size: number, maxLife: number, shape: Particle['shape']
  ) {
    this.particles.push({
      x, y, vx, vy, color, size,
      life: maxLife, maxLife, alpha: 1, shape,
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public spawnFloatingText(text: string, x: number, y: number, color: string, size: number = 14) {
    this.floatingTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      text, x, y, color, size,
      life: 1.0, maxLife: 1.0, vy: -35,
    });
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private triggerShake(magnitude: number) {
    if (!this.settings.screenShake) return;
    this.shakeMagnitude = Math.min(magnitude, 8);
    this.shakeTimer = 0.25;
  }
}
