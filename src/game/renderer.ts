import { BlockDestruction, Bomb, CellType, Enemy, ExplosionCell, FloatingText, Particle, Player, PowerUp } from '../types';
import { GRID_COLS, GRID_ROWS } from './constants';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  public cellSize: number = 48;
  public offsetX: number = 0;
  public offsetY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2d context');
    this.ctx = context;
  }

  public resize(containerWidth: number, containerHeight: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    // Maximize viewport coverage for full screen arcade immersion
    const padding = containerWidth < 640 ? 4 : 8;
    const availWidth = Math.max(containerWidth - padding * 2, 260);
    const availHeight = Math.max(containerHeight - padding * 2, 220);

    const maxCellW = Math.floor(availWidth / GRID_COLS);
    const maxCellH = Math.floor(availHeight / GRID_ROWS);
    this.cellSize = Math.max(Math.min(maxCellW, maxCellH), 22);

    const arenaWidth = this.cellSize * GRID_COLS;
    const arenaHeight = this.cellSize * GRID_ROWS;

    this.canvas.width = Math.floor(arenaWidth * dpr);
    this.canvas.height = Math.floor(arenaHeight * dpr);
    this.canvas.style.width = `${arenaWidth}px`;
    this.canvas.style.height = `${arenaHeight}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public render(
    grid: CellType[][],
    player: Player,
    player2: Player | null,
    bombs: Bomb[],
    explosions: ExplosionCell[],
    powerUps: PowerUp[],
    enemies: Enemy[],
    destructions: BlockDestruction[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    screenShakeOffset: { x: number; y: number },
    debugMode: boolean = false,
    fps: number = 60
  ) {
    if (!grid || !grid.length || !grid[0] || !player) return;

    const ctx = this.ctx;
    const cs = this.cellSize;
    const totalW = GRID_COLS * cs;
    const totalH = GRID_ROWS * cs;

    ctx.save();
    // Apply screen shake offset
    ctx.translate(screenShakeOffset.x, screenShakeOffset.y);

    // 1. Draw Arena Floor
    this.drawFloor(totalW, totalH);

    // 2. Draw Power-Ups (on floor beneath blocks and bombs)
    this.drawPowerUps(powerUps);

    // 3. Draw Grid Walls and Blocks
    this.drawGrid(grid, destructions);

    // 4. Draw Bombs
    this.drawBombs(bombs);

    // 5. Draw Explosions
    this.drawExplosions(explosions);

    // 6. Draw Enemies
    this.drawEnemies(enemies);

    // 7. Draw Player 1
    this.drawPlayer(player, player2 !== null ? 'P1' : undefined);

    // 7b. Draw Player 2 if present
    if (player2) {
      this.drawPlayer(player2, 'P2');
    }

    // 8. Draw Destruction animations & particles
    this.drawParticles(particles);

    // 9. Draw Floating Text Popups
    this.drawFloatingTexts(floatingTexts);

    // 10. Draw Debug overlay if active
    if (debugMode) {
      this.drawDebugOverlay(grid, player, enemies, bombs, fps);
    }

    ctx.restore();
  }

  private drawFloor(width: number, height: number) {
    const ctx = this.ctx;
    const cs = this.cellSize;

    // Dark high-tech arena background
    ctx.fillStyle = '#0a0914';
    ctx.fillRect(0, 0, width, height);

    // Subtle checkered grid tiles
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const isEven = (r + c) % 2 === 0;
        ctx.fillStyle = isEven ? '#121124' : '#0e0d1c';
        ctx.fillRect(c * cs, r * cs, cs, cs);

        // Tech grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * cs, r * cs, cs, cs);
      }
    }
  }

  private drawGrid(grid: CellType[][], destructions: BlockDestruction[]) {
    const ctx = this.ctx;
    const cs = this.cellSize;

    // Map of currently destructing blocks
    const destMap = new Map<string, BlockDestruction>();
    destructions.forEach(d => destMap.set(`${d.gridX},${d.gridY}`, d));

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = grid[r][c];
        const x = c * cs;
        const y = r * cs;

        if (cell === CellType.INDESTRUCTIBLE) {
          this.drawIndestructibleWall(x, y, cs, r, c);
        } else if (cell === CellType.DESTRUCTIBLE) {
          this.drawDestructibleBlock(x, y, cs);
        }

        // Draw active crumbling block animation if present
        const dest = destMap.get(`${c},${r}`);
        if (dest) {
          this.drawCrumblingBlock(x, y, cs, dest);
        }
      }
    }
  }

  private drawIndestructibleWall(x: number, y: number, size: number, r: number, c: number) {
    const ctx = this.ctx;
    const isBorder = r === 0 || r === GRID_ROWS - 1 || c === 0 || c === GRID_COLS - 1;

    // Outer shadow / 3D base
    ctx.fillStyle = '#06050b';
    ctx.fillRect(x, y + size * 0.12, size, size * 0.88);

    // Wall top face
    const rad = Math.max(3, Math.floor(size * 0.08));
    ctx.fillStyle = isBorder ? '#1e1c38' : '#28254c';
    this.roundRect(ctx, x + 1, y + 1, size - 2, size - 2, rad);
    ctx.fill();

    // Metallic beveled border
    ctx.strokeStyle = isBorder ? '#383464' : '#4d478a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // High-tech inner core plate
    ctx.fillStyle = isBorder ? '#17152b' : '#201e3d';
    this.roundRect(ctx, x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.6, 2);
    ctx.fill();

    // High contrast circuit dot
    ctx.fillStyle = isBorder ? '#06b6d4' : '#818cf8';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, Math.max(2, size * 0.08), 0, Math.PI * 2);
    ctx.fill();
  }

  private drawDestructibleBlock(x: number, y: number, size: number) {
    const ctx = this.ctx;

    // Base shadow
    ctx.fillStyle = '#180a04';
    ctx.fillRect(x + 2, y + size * 0.15, size - 4, size * 0.85);

    // Crate main body (Bronze / Amber crate)
    const rad = Math.max(3, Math.floor(size * 0.08));
    ctx.fillStyle = '#b45309';
    this.roundRect(ctx, x + 2, y + 2, size - 4, size - 4, rad);
    ctx.fill();

    // Inner face
    ctx.fillStyle = '#d97706';
    this.roundRect(ctx, x + 4, y + 4, size - 8, size - 8, 2);
    ctx.fill();

    // Crate cross brace lines
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = Math.max(2, Math.floor(size * 0.06));
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 6);
    ctx.lineTo(x + size - 6, y + size - 6);
    ctx.moveTo(x + size - 6, y + 6);
    ctx.lineTo(x + 6, y + size - 6);
    ctx.stroke();

    // Crate center rivet
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, Math.max(2, size * 0.08), 0, Math.PI * 2);
    ctx.fill();
  }

  private drawCrumblingBlock(x: number, y: number, size: number, dest: BlockDestruction) {
    const ctx = this.ctx;
    const progress = 1 - (dest.timer / dest.maxTimer);
    const alpha = 1 - progress;
    const shake = Math.sin(progress * Math.PI * 8) * (3 * (1 - progress));

    ctx.save();
    ctx.translate(shake, 0);
    ctx.globalAlpha = Math.max(0, alpha);

    // Cracked fragments
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 4 + progress * 6, y + 4 - progress * 4, (size - 8) / 2, (size - 8) / 2);
    ctx.fillRect(x + size / 2 - progress * 6, y + size / 2 + progress * 6, (size - 8) / 2, (size - 8) / 2);

    // Center flash of destruction
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.3 * (1 + progress), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawPowerUps(powerUps: PowerUp[]) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const now = performance.now() * 0.005;

    powerUps.forEach(p => {
      const hoverOffset = Math.sin(now * 3 + p.spawnTime * 5) * 3;
      const x = p.gridX * cs + cs / 2;
      const y = p.gridY * cs + cs / 2 + hoverOffset;
      const radius = cs * 0.38;

      ctx.save();

      let badgeColor = '#ef4444';
      let icon = '🔥';
      let label = 'FIRE';

      if (p.type === 'BOMB') {
        badgeColor = '#a855f7';
        icon = '💣';
        label = 'BOMB';
      } else if (p.type === 'SPEED') {
        badgeColor = '#eab308';
        icon = '⚡';
        label = 'SPEED';
      } else if (p.type === 'SHIELD') {
        badgeColor = '#06b6d4';
        icon = '🛡️';
        label = 'SHIELD';
      } else if (p.type === 'HEART') {
        badgeColor = '#f43f5e';
        icon = '❤️';
        label = 'LIFE';
      } else if (p.type === 'INVINCIBLE') {
        const hue = (performance.now() * 0.25) % 360;
        badgeColor = `hsl(${hue}, 100%, 60%)`;
        icon = '⭐';
        label = 'STAR';
      }

      // Outer aura ring
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.15, 0, Math.PI * 2);
      ctx.stroke();

      // Badge disk background
      ctx.fillStyle = p.type === 'INVINCIBLE' ? '#3b0764' : '#090914';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // High-contrast badge border
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Main Icon display
      ctx.font = `${Math.floor(cs * 0.42)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, x, y - 2);

      // Micro banner badge under icon
      ctx.fillStyle = badgeColor;
      const tagW = cs * 0.50;
      const tagH = cs * 0.15;
      this.roundRect(ctx, x - tagW / 2, y + radius * 0.52, tagW, tagH, 3);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = `900 ${Math.floor(cs * 0.13)}px monospace`;
      ctx.fillText(label, x, y + radius * 0.52 + tagH / 2 + 1);

      ctx.restore();
    });
  }

  private drawBombs(bombs: Bomb[]) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const now = performance.now() * 0.005;

    bombs.forEach(b => {
      const x = b.gridX * cs + cs / 2;
      const y = b.gridY * cs + cs / 2;
      const isWarning = b.timer <= 0.5;

      ctx.save();

      // Pulsing bomb size scale
      const pulseSpeed = isWarning ? 25 : 8;
      const pulseScale = 1 + Math.sin(now * pulseSpeed) * (isWarning ? 0.15 : 0.06);
      const radius = cs * 0.34 * pulseScale;

      // Warning ground danger ring
      if (isWarning) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(x, y, cs * 0.48, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Bomb drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(x, y + radius * 0.9, radius * 0.9, radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bomb spherical body
      const grad = ctx.createRadialGradient(
        x - radius * 0.3, y - radius * 0.3, radius * 0.1,
        x, y, radius
      );
      if (isWarning) {
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.3, '#ef4444');
        grad.addColorStop(1, '#450a0a');
      } else if (b.ownerId === 'p2') {
        grad.addColorStop(0, '#fca5a5');
        grad.addColorStop(0.4, '#991b1b');
        grad.addColorStop(1, '#450a0a');
      } else {
        grad.addColorStop(0, '#67e8f9');
        grad.addColorStop(0.4, '#0e7490');
        grad.addColorStop(1, '#083344');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Bomb top cap
      ctx.fillStyle = '#475569';
      ctx.fillRect(x - radius * 0.25, y - radius * 1.15, radius * 0.5, radius * 0.35);

      // Fuse spark
      const sparkX = x;
      const sparkY = y - radius * 1.25;
      ctx.fillStyle = isWarning ? '#ffffff' : '#fbbf24';
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, Math.max(2, radius * 0.2), 0, Math.PI * 2);
      ctx.fill();

      // Digital countdown timer display on bomb body
      ctx.fillStyle = isWarning ? '#ffffff' : '#ffffff';
      ctx.font = `bold ${Math.floor(cs * 0.22)}px 'Orbitron', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.ceil(b.timer * 10) / 10 + 's', x, y);

      ctx.restore();
    });
  }

  private drawExplosions(explosions: ExplosionCell[]) {
    const ctx = this.ctx;
    const cs = this.cellSize;

    explosions.forEach(exp => {
      const x = exp.gridX * cs;
      const y = exp.gridY * cs;
      const progress = exp.timer / exp.maxTimer;
      const alpha = Math.sin(progress * Math.PI);

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 1.1));

      const cx = x + cs / 2;
      const cy = y + cs / 2;

      ctx.fillStyle = '#f97316';

      switch (exp.part) {
        case 'center':
          ctx.beginPath();
          ctx.arc(cx, cy, cs * 0.46 * (0.8 + 0.2 * (1 - progress)), 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'horizontal':
          ctx.fillRect(x, cy - cs * 0.35, cs, cs * 0.7);
          break;
        case 'vertical':
          ctx.fillRect(cx - cs * 0.35, y, cs * 0.7, cs);
          break;
        case 'end_left':
          ctx.beginPath();
          ctx.arc(cx, cy, cs * 0.35, Math.PI * 0.5, Math.PI * 1.5);
          ctx.fillRect(cx, cy - cs * 0.35, cs / 2, cs * 0.7);
          ctx.fill();
          break;
        case 'end_right':
          ctx.beginPath();
          ctx.arc(cx, cy, cs * 0.35, -Math.PI * 0.5, Math.PI * 0.5);
          ctx.fillRect(x, cy - cs * 0.35, cs / 2, cs * 0.7);
          ctx.fill();
          break;
        case 'end_up':
          ctx.beginPath();
          ctx.arc(cx, cy, cs * 0.35, Math.PI, Math.PI * 2);
          ctx.fillRect(cx - cs * 0.35, cy, cs * 0.7, cs / 2);
          ctx.fill();
          break;
        case 'end_down':
          ctx.beginPath();
          ctx.arc(cx, cy, cs * 0.35, 0, Math.PI);
          ctx.fillRect(cx - cs * 0.35, y, cs * 0.7, cs / 2);
          ctx.fill();
          break;
      }

      ctx.fillStyle = '#fffbeb';
      ctx.shadowBlur = 0;
      if (exp.part === 'center') {
        ctx.beginPath();
        ctx.arc(cx, cy, cs * 0.26, 0, Math.PI * 2);
        ctx.fill();
      } else if (exp.part === 'horizontal' || exp.part === 'end_left' || exp.part === 'end_right') {
        ctx.fillRect(x, cy - cs * 0.16, cs, cs * 0.32);
      } else {
        ctx.fillRect(cx - cs * 0.16, y, cs * 0.32, cs);
      }

      ctx.restore();
    });
  }

  private drawEnemies(enemies: Enemy[]) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const now = performance.now() * 0.005;

    enemies.forEach(e => {
      if (e.isDying) {
        this.drawEnemyDeath(e);
        return;
      }

      const x = e.pixelX * cs + cs / 2;
      const y = e.pixelY * cs + cs / 2;
      const radius = cs * 0.36;

      ctx.save();

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(x, y + radius * 0.8, radius * 0.8, radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      if (e.type === 'DRIFTER') {
        const hoverY = y + Math.sin(now * 4 + parseInt(e.id.split('_')[1] || '0')) * 2.5;

        ctx.fillStyle = '#0e7490';
        ctx.beginPath();
        ctx.arc(x, hoverY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(x, hoverY, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();

        let eyeDx = 0;
        let eyeDy = 0;
        if (e.direction === 'UP') eyeDy = -radius * 0.3;
        if (e.direction === 'DOWN') eyeDy = radius * 0.3;
        if (e.direction === 'LEFT') eyeDx = -radius * 0.3;
        if (e.direction === 'RIGHT') eyeDx = radius * 0.3;

        ctx.fillStyle = '#ecfeff';
        ctx.shadowColor = 'rgba(6, 182, 212, 0.9)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(x + eyeDx, hoverY + eyeDy, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#083344';
        ctx.beginPath();
        ctx.arc(x + eyeDx, hoverY + eyeDy, radius * 0.18, 0, Math.PI * 2);
        ctx.fill();

      } else if (e.type === 'HUNTER') {
        const hoverY = y + Math.sin(now * 6) * 2;

        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(x, hoverY - radius);
        ctx.lineTo(x + radius, hoverY);
        ctx.lineTo(x, hoverY + radius);
        ctx.lineTo(x - radius, hoverY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(x, hoverY - radius * 0.75);
        ctx.lineTo(x + radius * 0.75, hoverY);
        ctx.lineTo(x, hoverY + radius * 0.75);
        ctx.lineTo(x - radius * 0.75, hoverY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fffbeb';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(x - radius * 0.25, hoverY, radius * 0.18, 0, Math.PI * 2);
        ctx.arc(x + radius * 0.25, hoverY, radius * 0.18, 0, Math.PI * 2);
        ctx.fill();

      } else if (e.type === 'CHASER') {
        const hoverY = y + Math.sin(now * 8) * 1.5;

        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x, hoverY + radius * 0.8, radius * 0.35 * (0.8 + Math.random() * 0.4), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.arc(x, hoverY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(x, hoverY, radius * 0.75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fee2e2';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.4, hoverY - radius * 0.2);
        ctx.lineTo(x, hoverY + radius * 0.1);
        ctx.lineTo(x + radius * 0.4, hoverY - radius * 0.2);
        ctx.lineTo(x + radius * 0.4, hoverY);
        ctx.lineTo(x, hoverY + radius * 0.3);
        ctx.lineTo(x - radius * 0.4, hoverY);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    });
  }

  private drawEnemyDeath(e: Enemy) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const progress = 1 - (e.deathTimer / 0.4);
    const x = e.pixelX * cs + cs / 2;
    const y = e.pixelY * cs + cs / 2;

    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, cs * 0.4 * (1 + progress * 0.8), 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(x, y, cs * 0.2 * (1 - progress), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawPlayer(player: Player, tag?: 'P1' | 'P2') {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const x = player.pixelX * cs + cs / 2;
    const y = player.pixelY * cs + cs / 2;
    const radius = cs * 0.38;

    ctx.save();

    // Invulnerability flashing effect
    if (player.isInvulnerable) {
      const flash = Math.floor(player.invulnerableTimer * 20) % 2 === 0;
      if (flash) {
        ctx.globalAlpha = 0.35;
      }
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + radius * 0.9, radius * 0.85, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Walking animation bob
    const walkBob = player.isMoving ? Math.sin(player.walkFrame * 14) * 2 : 0;
    const py = y + walkBob;

    // Robot feet / treads
    ctx.fillStyle = '#334155';
    const footOffset = player.isMoving ? Math.cos(player.walkFrame * 14) * 3 : 0;
    ctx.fillRect(x - radius * 0.6, py + radius * 0.5 - footOffset, radius * 0.4, radius * 0.4);
    ctx.fillRect(x + radius * 0.2, py + radius * 0.5 + footOffset, radius * 0.4, radius * 0.4);

    // Armor palette selection: Cyan (P1) vs Crimson (P2) vs Star Rainbow (Invincible)
    let bodyColor = player.color === 'crimson' ? '#881337' : '#312e81';
    let innerBodyColor = player.color === 'crimson' ? '#be123c' : '#4338ca';
    let beaconColor = player.color === 'crimson' ? '#fb7185' : '#38bdf8';
    let visorGlow = player.color === 'crimson' ? '#f43f5e' : '#22d3ee';

    if (player.isInvincible) {
      const hue = (performance.now() * 0.3) % 360;
      bodyColor = `hsl(${hue}, 80%, 30%)`;
      innerBodyColor = `hsl(${hue}, 90%, 50%)`;
      beaconColor = `hsl(${hue}, 100%, 75%)`;
      visorGlow = `hsl(${hue}, 100%, 75%)`;

      // Rotating Star Halo
      const angle = (performance.now() * 0.006) % (Math.PI * 2);
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 12;
      for (let i = 0; i < 4; i++) {
        const starAngle = angle + (i * Math.PI) / 2;
        const starX = x + Math.cos(starAngle) * (radius * 1.35);
        const starY = py + Math.sin(starAngle) * (radius * 1.35);
        ctx.beginPath();
        ctx.arc(starX, starY, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Robot body chassis
    ctx.fillStyle = bodyColor;
    this.roundRect(ctx, x - radius * 0.75, py - radius * 0.65, radius * 1.5, radius * 1.3, 6);
    ctx.fill();

    ctx.fillStyle = innerBodyColor;
    this.roundRect(ctx, x - radius * 0.65, py - radius * 0.55, radius * 1.3, radius * 1.1, 4);
    ctx.fill();

    // Antenna on top
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, py - radius * 0.65);
    ctx.lineTo(x, py - radius * 1.05);
    ctx.stroke();

    ctx.fillStyle = beaconColor;
    ctx.shadowColor = beaconColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x, py - radius * 1.1, Math.max(2, radius * 0.18), 0, Math.PI * 2);
    ctx.fill();

    // Visor / Glowing Eyes based on direction
    let eyeDx = 0;
    let eyeDy = 0;
    if (player.facing === 'UP' || player.facing === 'UP_LEFT' || player.facing === 'UP_RIGHT') eyeDy = -radius * 0.2;
    if (player.facing === 'DOWN' || player.facing === 'DOWN_LEFT' || player.facing === 'DOWN_RIGHT') eyeDy = radius * 0.15;
    if (player.facing === 'LEFT' || player.facing === 'UP_LEFT' || player.facing === 'DOWN_LEFT') eyeDx = -radius * 0.2;
    if (player.facing === 'RIGHT' || player.facing === 'UP_RIGHT' || player.facing === 'DOWN_RIGHT') eyeDx = radius * 0.2;

    ctx.fillStyle = '#0f172a';
    ctx.shadowBlur = 0;
    this.roundRect(ctx, x - radius * 0.5 + eyeDx, py - radius * 0.3 + eyeDy, radius, radius * 0.5, 3);
    ctx.fill();

    ctx.fillStyle = visorGlow;
    ctx.shadowColor = visorGlow;
    ctx.shadowBlur = 8;
    this.roundRect(ctx, x - radius * 0.38 + eyeDx, py - radius * 0.18 + eyeDy, radius * 0.76, radius * 0.26, 2);
    ctx.fill();

    // Shield aura if equipped
    if (player.hasShield) {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, py, radius * 1.3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fill();
    }

    // P1 / P2 Floating Badge
    if (tag) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = tag === 'P1' ? '#06b6d4' : '#ef4444';
      ctx.font = `bold ${Math.floor(cs * 0.19)}px 'Orbitron', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(tag, x, py - radius * 1.25);
    }

    ctx.restore();
  }

  private drawParticles(particles: Particle[]) {
    const ctx = this.ctx;

    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = p.color;

      if (p.shape === 'spark') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }

      ctx.restore();
    });
  }

  private drawFloatingTexts(floatingTexts: FloatingText[]) {
    const ctx = this.ctx;

    floatingTexts.forEach(ft => {
      ctx.save();
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.globalAlpha = alpha;

      ctx.font = `bold ${ft.size}px 'Orbitron', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.strokeText(ft.text, ft.x, ft.y);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);

      ctx.restore();
    });
  }

  private drawDebugOverlay(grid: CellType[][], player: Player, enemies: Enemy[], bombs: Bomb[], fps: number) {
    const ctx = this.ctx;
    const cs = this.cellSize;

    ctx.save();
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        ctx.fillText(`${c},${r}`, c * cs + 2, r * cs + 2);
      }
    }

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(player.gridX * cs, player.gridY * cs, cs, cs);

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`FPS: ${fps} | Player: (${player.gridX}, ${player.gridY}) | Enemies: ${enemies.length} | Bombs: ${bombs.length}`, 8, 8);

    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
