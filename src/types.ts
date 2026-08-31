export type GameMode = 'SOLO' | 'DUAL';

export type GameState = 
  | 'MENU' 
  | 'COUNTDOWN' 
  | 'PLAYING' 
  | 'PAUSED' 
  | 'LEVEL_CLEAR' 
  | 'GAME_OVER' 
  | 'DUAL_ROUND_OVER'
  | 'SETTINGS' 
  | 'HOW_TO_PLAY';

export enum CellType {
  EMPTY = 0,
  INDESTRUCTIBLE = 1,
  DESTRUCTIBLE = 2,
}

export type PowerUpType = 'FIRE' | 'BOMB' | 'SPEED' | 'SHIELD' | 'HEART' | 'INVINCIBLE';

export type EnemyType = 'DRIFTER' | 'HUNTER' | 'CHASER';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'UP_LEFT' | 'UP_RIGHT' | 'DOWN_LEFT' | 'DOWN_RIGHT' | 'NONE';

export interface Player {
  id: 'p1' | 'p2';
  name: string;
  color: 'cyan' | 'crimson';
  gridX: number;
  gridY: number;
  pixelX: number;
  pixelY: number;
  targetGridX: number;
  targetGridY: number;
  isMoving: boolean;
  direction: Direction;
  facing: Direction;
  speed: number; // cells per second
  speedLevel: number;
  maxBombs: number;
  fireRange: number;
  lives: number;
  hasShield: boolean;
  isInvulnerable: boolean;
  invulnerableTimer: number;
  isInvincible: boolean;
  invincibleTimer: number;
  walkFrame: number;
  isDying: boolean;
  deathTimer: number;
}

export interface Bomb {
  id: string;
  gridX: number;
  gridY: number;
  timer: number;
  maxTimer: number;
  range: number;
  ownerId: 'p1' | 'p2';
  isTriggered: boolean;
  overlappingPlayers?: ('p1' | 'p2')[];
}

export type ExplosionPart = 
  | 'center' 
  | 'horizontal' 
  | 'vertical' 
  | 'end_up' 
  | 'end_down' 
  | 'end_left' 
  | 'end_right';

export interface ExplosionCell {
  gridX: number;
  gridY: number;
  part: ExplosionPart;
  timer: number;
  maxTimer: number;
  chainOrigin?: boolean;
}

export interface PowerUp {
  id: string;
  gridX: number;
  gridY: number;
  type: PowerUpType;
  floatOffset: number;
  spawnTime: number;
  immuneTimer?: number; // Protection timer against explosion vaporization
}

export interface Enemy {
  id: string;
  type: EnemyType;
  gridX: number;
  gridY: number;
  pixelX: number;
  pixelY: number;
  targetGridX: number;
  targetGridY: number;
  direction: Direction;
  speed: number;
  isMoving: boolean;
  isDying: boolean;
  deathTimer: number;
  pathTimer: number;
  animFrame: number;
}

export interface BlockDestruction {
  gridX: number;
  gridY: number;
  timer: number;
  maxTimer: number;
  powerUpToSpawn?: PowerUpType;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  shape: 'circle' | 'square' | 'spark' | 'smoke';
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  screenShake: boolean;
  vibration: boolean;
  debugMode: boolean;
}

export interface LevelStats {
  scoreEarned: number;
  enemiesKilled: number;
  blocksDestroyed: number;
  timeRemaining: number;
  comboBonus: number;
  timeBonus: number;
  totalLevelScore: number;
}

export interface GameStats {
  score: number;
  level: number;
  bestScore: number;
  highestLevel: number;
  blocksDestroyed: number;
  enemiesKilled: number;
  combosMax: number;
  gameMode: GameMode;
  p1Wins: number;
  p2Wins: number;
  dualWinner: 'PLAYER_1' | 'PLAYER_2' | 'DRAW' | null;
  round: number;
}

export interface LevelConfig {
  levelNumber: number;
  title: string;
  enemyCounts: {
    drifter: number;
    hunter: number;
    chaser: number;
  };
  destructibleDensity: number;
  timeLimit: number;
}
