import { LevelConfig } from '../types';

export const GRID_COLS = 13;
export const GRID_ROWS = 11;

export const BASE_PLAYER_SPEED = 4.0; // 4 cells per second
export const SPEED_BOOST_PER_POWERUP = 0.15; // 15% increase per speed power-up
export const MAX_SPEED_BOOST = 0.70; // 70% above base speed

export const BASE_BOMB_TIMER = 2.0; // 2 seconds
export const BASE_BOMB_CAPACITY = 1;
export const MAX_BOMB_CAPACITY = 5;

export const BASE_FIRE_RANGE = 1;
export const MAX_FIRE_RANGE = 5;

export const BASE_PLAYER_LIVES = 3;
export const MAX_PLAYER_LIVES = 3;

export const INVULNERABILITY_DURATION = 1.5; // seconds
export const INVINCIBLE_DURATION = 10.0; // 10 seconds of super star invincibility
export const EXPLOSION_DURATION = 0.45; // seconds
export const BLOCK_DESTRUCTION_DURATION = 0.35; // seconds
export const ENEMY_DEATH_DURATION = 0.4; // seconds
export const PLAYER_DEATH_DURATION = 1.2; // seconds

export const COMBO_RESET_TIME = 3.0; // seconds

// Scores
export const SCORE_BLOCK = 10;
export const SCORE_POWERUP = 50;
export const SCORE_INVINCIBLE = 200;
export const SCORE_KILL_BASE = 100;
export const SCORE_KILL_CHAIN_BONUS = 150;
export const SCORE_LEVEL_CLEAR = 500;
export const SCORE_TIME_PER_SECOND = 10;

// Speeds
export const SPEED_DRIFTER = 2.0;
export const SPEED_HUNTER = 2.5;
export const SPEED_CHASER = 3.0;

// Power-up spawn probabilities (Balanced classic drop rate: ~35% of crates contain a power-up)
export const POWERUP_CHANCES = {
  FIRE: 0.10,       // 10% Fire upgrade
  BOMB: 0.09,       // 9% Bomb capacity upgrade
  SPEED: 0.08,      // 8% Speed boost upgrade
  SHIELD: 0.04,     // 4% Force Shield
  HEART: 0.03,      // 3% Extra Life
  INVINCIBLE: 0.015,// 1.5% Rare Star Invincibility
  // Remaining ~64.5% are normal destructible wooden crates
};

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    levelNumber: 1,
    title: 'Training Grounds',
    enemyCounts: { drifter: 2, hunter: 0, chaser: 0 },
    destructibleDensity: 0.65,
    timeLimit: 120,
  },
  {
    levelNumber: 2,
    title: 'Drone Infiltration',
    enemyCounts: { drifter: 2, hunter: 1, chaser: 0 },
    destructibleDensity: 0.70,
    timeLimit: 120,
  },
  {
    levelNumber: 3,
    title: 'Hunter Patrol',
    enemyCounts: { drifter: 1, hunter: 2, chaser: 1 },
    destructibleDensity: 0.72,
    timeLimit: 115,
  },
  {
    levelNumber: 4,
    title: 'Crimson Chasers',
    enemyCounts: { drifter: 2, hunter: 1, chaser: 2 },
    destructibleDensity: 0.75,
    timeLimit: 110,
  },
  {
    levelNumber: 5,
    title: 'Cyber Core Outbreak',
    enemyCounts: { drifter: 1, hunter: 3, chaser: 2 },
    destructibleDensity: 0.78,
    timeLimit: 105,
  },
  {
    levelNumber: 6,
    title: 'Aggressor Swarm',
    enemyCounts: { drifter: 2, hunter: 2, chaser: 3 },
    destructibleDensity: 0.80,
    timeLimit: 100,
  },
  {
    levelNumber: 7,
    title: 'Neon Labyrinth',
    enemyCounts: { drifter: 1, hunter: 4, chaser: 3 },
    destructibleDensity: 0.82,
    timeLimit: 95,
  },
  {
    levelNumber: 8,
    title: 'Reactor Overdrive',
    enemyCounts: { drifter: 2, hunter: 3, chaser: 4 },
    destructibleDensity: 0.84,
    timeLimit: 90,
  },
  {
    levelNumber: 9,
    title: 'Apex Vanguard',
    enemyCounts: { drifter: 1, hunter: 4, chaser: 5 },
    destructibleDensity: 0.85,
    timeLimit: 85,
  },
  {
    levelNumber: 10,
    title: 'Final Reckoning',
    enemyCounts: { drifter: 2, hunter: 5, chaser: 5 },
    destructibleDensity: 0.86,
    timeLimit: 80,
  },
];
