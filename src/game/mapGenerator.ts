import { CellType, Enemy, EnemyType, GameMode, LevelConfig, PowerUpType } from '../types';
import { GRID_COLS, GRID_ROWS, POWERUP_CHANCES, SPEED_CHASER, SPEED_DRIFTER, SPEED_HUNTER } from './constants';

export interface GeneratedMap {
  grid: CellType[][];
  blockPowerUps: Map<string, PowerUpType>; // key: "x,y"
  enemies: Enemy[];
  seed: number;
}

export function generateMap(levelConfig: LevelConfig, gameMode: GameMode = 'SOLO', customSeed?: number): GeneratedMap {
  const seed = customSeed !== undefined ? customSeed : Math.floor(Math.random() * 1000000);
  let currentSeed = seed;

  // Simple deterministic PRNG for reproducible seeds
  function random(): number {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  }

  // 1. Initialize grid with empty cells
  const grid: CellType[][] = Array.from({ length: GRID_ROWS }, () => 
    Array.from({ length: GRID_COLS }, () => CellType.EMPTY)
  );

  // 2. Outer border indestructible walls
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (r === 0 || r === GRID_ROWS - 1 || c === 0 || c === GRID_COLS - 1) {
        grid[r][c] = CellType.INDESTRUCTIBLE;
      }
    }
  }

  // 3. Regular internal pillar walls (even column & even row)
  for (let r = 2; r < GRID_ROWS - 1; r += 2) {
    for (let c = 2; c < GRID_COLS - 1; c += 2) {
      grid[r][c] = CellType.INDESTRUCTIBLE;
    }
  }

  // 4. Guaranteed safe zones
  // Player 1 (top-left) safe zone
  const safeCells = new Set(['1,1', '2,1', '1,2']);

  // Player 2 (bottom-right) safe zone if DUAL mode
  if (gameMode === 'DUAL') {
    const p2x = GRID_COLS - 2;
    const p2y = GRID_ROWS - 2;
    safeCells.add(`${p2x},${p2y}`);
    safeCells.add(`${p2x - 1},${p2y}`);
    safeCells.add(`${p2x},${p2y - 1}`);
  }

  // Pre-designate some enemy spawn pockets in distant corners/areas for SOLO mode
  const candidateEnemyCells = [
    { c: GRID_COLS - 2, r: GRID_ROWS - 2 },
    { c: GRID_COLS - 3, r: GRID_ROWS - 2 },
    { c: GRID_COLS - 2, r: 1 },
    { c: GRID_COLS - 3, r: 1 },
    { c: 1, r: GRID_ROWS - 2 },
    { c: 2, r: GRID_ROWS - 2 },
    { c: GRID_COLS - 2, r: Math.floor(GRID_ROWS / 2) },
    { c: Math.floor(GRID_COLS / 2), r: GRID_ROWS - 2 },
    { c: Math.floor(GRID_COLS / 2), r: 1 },
    { c: Math.floor(GRID_COLS / 2), r: Math.floor(GRID_ROWS / 2) },
  ].filter(p => grid[p.r][p.c] === CellType.EMPTY);

  const enemySpawnSet = new Set<string>();
  const totalEnemiesToSpawn = gameMode === 'SOLO'
    ? levelConfig.enemyCounts.drifter + levelConfig.enemyCounts.hunter + levelConfig.enemyCounts.chaser
    : 0;

  if (gameMode === 'SOLO') {
    const shuffledCandidates = [...candidateEnemyCells].sort(() => random() - 0.5);
    for (let i = 0; i < Math.min(totalEnemiesToSpawn, shuffledCandidates.length); i++) {
      const pt = shuffledCandidates[i];
      enemySpawnSet.add(`${pt.c},${pt.r}`);
    }
  }

  // 5. Fill remaining available cells with destructible blocks based on density
  const blockPowerUps = new Map<string, PowerUpType>();
  const density = gameMode === 'DUAL' ? 0.72 : levelConfig.destructibleDensity;

  for (let r = 1; r < GRID_ROWS - 1; r++) {
    for (let c = 1; c < GRID_COLS - 1; c++) {
      const key = `${c},${r}`;
      if (grid[r][c] === CellType.EMPTY && !safeCells.has(key) && !enemySpawnSet.has(key)) {
        if (random() < density) {
          grid[r][c] = CellType.DESTRUCTIBLE;

          // Determine if block contains a power-up (~35% drop rate)
          const roll = random();
          let acc = 0;
          if (roll < (acc += POWERUP_CHANCES.FIRE)) {
            blockPowerUps.set(key, 'FIRE');
          } else if (roll < (acc += POWERUP_CHANCES.BOMB)) {
            blockPowerUps.set(key, 'BOMB');
          } else if (roll < (acc += POWERUP_CHANCES.SPEED)) {
            blockPowerUps.set(key, 'SPEED');
          } else if (roll < (acc += POWERUP_CHANCES.SHIELD)) {
            blockPowerUps.set(key, 'SHIELD');
          } else if (roll < (acc += POWERUP_CHANCES.HEART)) {
            blockPowerUps.set(key, 'HEART');
          } else if (roll < (acc += POWERUP_CHANCES.INVINCIBLE)) {
            blockPowerUps.set(key, 'INVINCIBLE');
          }
          // Otherwise plain destructible wooden block
        }
      }
    }
  }

  // 6. Spawn enemies (SOLO mode only)
  const enemies: Enemy[] = [];
  if (gameMode === 'SOLO') {
    let enemyIdCounter = 1;
    const enemyTypesToCreate: EnemyType[] = [];
    for (let i = 0; i < levelConfig.enemyCounts.drifter; i++) enemyTypesToCreate.push('DRIFTER');
    for (let i = 0; i < levelConfig.enemyCounts.hunter; i++) enemyTypesToCreate.push('HUNTER');
    for (let i = 0; i < levelConfig.enemyCounts.chaser; i++) enemyTypesToCreate.push('CHASER');

    // Find all valid empty cells for enemy placement with distance >= 4 from player (1,1)
    const openCells: { c: number; r: number }[] = [];
    for (let r = 1; r < GRID_ROWS - 1; r++) {
      for (let c = 1; c < GRID_COLS - 1; c++) {
        if (grid[r][c] === CellType.EMPTY) {
          const dist = Math.abs(c - 1) + Math.abs(r - 1);
          if (dist >= 4) {
            openCells.push({ c, r });
          }
        }
      }
    }

    const shuffledOpenCells = [...openCells].sort(() => random() - 0.5);

    enemyTypesToCreate.forEach((type, idx) => {
      let spawnPt = shuffledOpenCells[idx % shuffledOpenCells.length];
      if (!spawnPt) {
        spawnPt = { c: GRID_COLS - 2, r: GRID_ROWS - 2 };
        grid[spawnPt.r][spawnPt.c] = CellType.EMPTY;
      }

      let speed = SPEED_DRIFTER;
      if (type === 'HUNTER') speed = SPEED_HUNTER;
      if (type === 'CHASER') speed = SPEED_CHASER;

      enemies.push({
        id: `enemy_${enemyIdCounter++}`,
        type,
        gridX: spawnPt.c,
        gridY: spawnPt.r,
        pixelX: spawnPt.c,
        pixelY: spawnPt.r,
        targetGridX: spawnPt.c,
        targetGridY: spawnPt.r,
        direction: 'NONE',
        speed,
        isMoving: false,
        isDying: false,
        deathTimer: 0,
        pathTimer: 0,
        animFrame: 0,
      });
    });
  }

  return {
    grid,
    blockPowerUps,
    enemies,
    seed,
  };
}
