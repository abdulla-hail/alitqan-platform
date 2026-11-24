/**
 * Interactive Particle Grid with Mouse Repulsion — framework-free canvas engine.
 *
 * - Particles sit on a triangular lattice (offset rows); links only join lattice neighbours,
 *   so per-frame work is O(n) — no all-pairs distance checks.
 * - Each particle springs toward its home point (plus a slow ambient drift); the pointer
 *   pushes particles away inside a radius; a click/tap sends an expanding wave.
 * - Drawing is batched: links and dots are grouped into a few alpha buckets and stroked/filled
 *   once per bucket with a (gradient) style → a handful of draw calls per frame.
 * - Pauses when off-screen or when the tab is hidden; `destroy()` removes every listener,
 *   observer and frame request (no leaks on navigation or re-initialisation).
 */
import { deviceFor, effectRunsOn, type DeviceKey, type HeroEffectSettings, type ParticleShape } from "@/lib/hero-effect";

type P = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; ph: number; zone: number; keep: number };
type Wave = { x: number; y: number; r: number; life: number };

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  /** element that receives pointer events (the hero section) */
  host: HTMLElement;
  /** element whose box is kept readable (the title) */
  protect?: HTMLElement | null;
  settings: HeroEffectSettings;
  /** force a device profile (admin preview) */
  device?: DeviceKey;
  /** render a single still frame (reduced motion / static fallback) */
  still?: boolean;
  /** drive this engine from a shared frame loop (many subtle fields, one requestAnimationFrame) */
  scheduler?: FrameScheduler;
}

/** One requestAnimationFrame loop for any number of engines; idles when none are active. */
export class FrameScheduler {
  private active = new Set<ParticleEngine>();
  private raf = 0;
  private last = 0;
  /** minimum ms between frames (0 = every display frame); e.g. ~33 ms = 30 fps to save battery */
  constructor(private minFrameMs = 0) {}
  add(e: ParticleEngine) {
    this.active.add(e);
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.loop);
    }
  }
  remove(e: ParticleEngine) {
    this.active.delete(e);
    if (!this.active.size && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }
  get size() {
    return this.active.size;
  }
  private loop = (now: number) => {
    if (this.minFrameMs && now - this.last < this.minFrameMs - 2) {
      this.raf = requestAnimationFrame(this.loop);
      return;
    }
    const dt = Math.min(3, (now - this.last) / 16.667);
    this.last = now;
    for (const e of this.active) e.frame(dt);
    this.raf = this.active.size ? requestAnimationFrame(this.loop) : 0;
  };
}

const BUCKETS = 5;

/** Deterministic 0–1 hash so density thinning is stable between frames and resizes. */
const hash = (i: number, j: number) => {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export class ParticleEngine {
  private o: EngineOptions;
  private ctx: CanvasRenderingContext2D;
  private pts: P[] = [];
  private links: Int32Array = new Int32Array(0); // pairs of indices
  private waves: Wave[] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  private raf = 0;
  private t = 0;
  private visible = true;
  private running = false;
  private pointer = { x: -9999, y: -9999, active: false, strength: 0 };
  private zone = { x: 0, y: 0, w: 0, h: 0 };
  private dev: DeviceKey = "desktop";
  private ro?: ResizeObserver;
  private io?: IntersectionObserver;
  private off: (() => void)[] = [];

  constructor(o: EngineOptions) {
    this.o = o;
    const ctx = o.canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("canvas 2d unavailable");
    this.ctx = ctx;
    this.bind();
    this.resize();
  }

  /** Apply new settings (admin live preview). Rebuilds the lattice only when layout changed. */
  update(settings: HeroEffectSettings, device?: DeviceKey, still?: boolean) {
    const prev = this.o.settings;
    const layoutChanged =
      JSON.stringify(prev.area) !== JSON.stringify(settings.area) ||
      JSON.stringify(prev.devices) !== JSON.stringify(settings.devices) ||
      prev.particles.link_density !== settings.particles.link_density ||
      prev.particles.pattern !== settings.particles.pattern ||
      device !== this.o.device;
    this.o = { ...this.o, settings, device, still };
    if (layoutChanged) this.resize();
    else this.kick();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.o.scheduler?.remove(this);
    this.ro?.disconnect();
    this.io?.disconnect();
    this.off.forEach((f) => f());
    this.off = [];
    this.pts = [];
    this.links = new Int32Array(0);
    this.ctx.clearRect(0, 0, this.o.canvas.width, this.o.canvas.height);
  }

  /* ---------------------------------------------------------------- setup */
  private bind() {
    const { host } = this.o;
    const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement | Document, type: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      el.addEventListener(type, fn as EventListener, opts);
      this.off.push(() => el.removeEventListener(type, fn as EventListener, opts));
    };
    const local = (e: PointerEvent) => {
      const r = this.o.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const allowed = (e: PointerEvent) => e.pointerType !== "touch" || this.o.settings.interaction.touch;
    on(host, "pointermove", (e) => {
      if (!allowed(e)) return;
      const p = local(e);
      this.pointer.x = p.x;
      this.pointer.y = p.y;
      this.pointer.active = true;
      this.kick();
    }, { passive: true });
    on(host, "pointerdown", (e) => {
      if (!allowed(e)) return;
      const p = local(e);
      this.pointer = { ...this.pointer, x: p.x, y: p.y, active: true };
      if (this.o.settings.interaction.click_wave && this.o.settings.interaction.wave_strength > 0) {
        this.waves.push({ x: p.x, y: p.y, r: 0, life: 1 });
        if (this.waves.length > 4) this.waves.shift();
      }
      this.kick();
    }, { passive: true });
    const leave = (e: PointerEvent) => {
      if (e.type === "pointerup" && e.pointerType !== "touch") return;
      this.pointer.active = false;
    };
    on(host, "pointerleave", leave, { passive: true });
    on(host, "pointerup", leave, { passive: true });
    // Touch: browsers fire pointercancel as soon as a finger starts scrolling, which would end the
    // interaction instantly. Touch events keep flowing while the page scrolls, so they drive the
    // touch pointer instead (passive: never blocks scrolling).
    on(host, "pointercancel", (e) => { if (e.pointerType !== "touch") this.pointer.active = false; }, { passive: true });
    const touchAt = (t: Touch) => {
      const r = this.o.canvas.getBoundingClientRect();
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    };
    on(host, "touchstart", (e) => {
      if (!this.o.settings.interaction.touch || !e.touches[0]) return;
      const p = touchAt(e.touches[0]);
      this.pointer = { ...this.pointer, x: p.x, y: p.y, active: true };
      this.kick();
    }, { passive: true });
    on(host, "touchmove", (e) => {
      if (!this.o.settings.interaction.touch || !e.touches[0]) return;
      const p = touchAt(e.touches[0]);
      this.pointer.x = p.x;
      this.pointer.y = p.y;
      this.pointer.active = true;
      this.kick();
    }, { passive: true });
    const touchEnd = (e: TouchEvent) => { if (!e.touches.length) this.pointer.active = false; };
    on(host, "touchend", touchEnd, { passive: true });
    on(host, "touchcancel", touchEnd, { passive: true });
    const vis = () => (document.hidden ? this.stop() : this.kick());
    document.addEventListener("visibilitychange", vis);
    this.off.push(() => document.removeEventListener("visibilitychange", vis));

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.o.canvas.parentElement ?? host);
    if (this.o.protect) this.ro.observe(this.o.protect);
    this.io = new IntersectionObserver((entries) => {
      this.visible = entries.some((x) => x.isIntersecting);
      if (this.visible) this.kick();
      else this.stop();
    });
    this.io.observe(host);
  }

  private profile() {
    return this.o.settings.devices[this.dev];
  }

  private resize() {
    const { canvas } = this.o;
    const box = canvas.parentElement?.getBoundingClientRect() ?? canvas.getBoundingClientRect();
    const s = this.o.settings;
    this.dev = this.o.device ?? deviceFor(window.innerWidth);
    const w = Math.max(1, Math.round((box.width * s.area.width) / 100));
    const h = Math.max(1, Math.round((box.height * s.area.height) / 100));
    // place the area inside the host box
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.style.left = `${Math.round((box.width - w) / 2)}px`;
    canvas.style.top = `${s.area.position === "top" ? 0 : s.area.position === "bottom" ? Math.round(box.height - h) : Math.round((box.height - h) / 2)}px`;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.dev === "desktop" ? 2 : 1.5);
    canvas.width = Math.round(w * this.dpr);
    canvas.height = Math.round(h * this.dpr);
    this.w = w;
    this.h = h;
    this.measureZone();
    this.build();
    this.kick(true);
  }

  private measureZone() {
    const el = this.o.protect;
    if (!el) return void (this.zone = { x: 0, y: 0, w: 0, h: 0 });
    const c = this.o.canvas.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const pad = this.o.settings.area.protect_padding;
    this.zone = { x: r.left - c.left - pad, y: r.top - c.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
  }

  /** 0 outside the protected title box, 1 inside, soft 40px edge. */
  private zoneAt(x: number, y: number) {
    const z = this.zone;
    if (!z.w) return 0;
    const dx = Math.max(z.x - x, 0, x - (z.x + z.w));
    const dy = Math.max(z.y - y, 0, y - (z.y + z.h));
    const d = Math.hypot(dx, dy);
    return d >= 40 ? 0 : 1 - d / 40;
  }

  private build() {
    const s = this.o.settings;
    const prof = this.profile();
    const { w, h } = this;
    // Mesh patterns:
    //  triangles     offset rows, links → right, down-left, down-right
    //  squares       straight grid, links → right, down
    //  hexagons      honeycomb: triangular lattice with every third point removed (3 links each)
    //  diamonds      offset rows at half height, diagonal links only → rotated-square (rhombus) mesh
    //  polygons      triangular lattice with jittered points → irregular low-poly facets
    //  mixed         triangular lattice where some horizontal links are dropped → triangles + quads
    //  constellation scattered points, each linked to its nearest neighbours (plexus)
    const pattern = s.particles.pattern;
    if (pattern === "constellation") return this.buildConstellation();
    const square = pattern === "squares";
    const diamonds = pattern === "diamonds";
    // honeycomb keeps 2/3 of the points; tighten its spacing a little so the cells stay compact
    let sp = (pattern === "hexagons" ? prof.spacing * 0.8 : diamonds ? prof.spacing * 1.25 : prof.spacing) * this.quality;
    const rowH = () => (square ? sp : diamonds ? sp / 2 : sp * 0.866);
    const keepShare = pattern === "hexagons" ? 2 / 3 : 1;
    // spacing grows until the device's particle cap is respected
    while ((w / sp + 2) * (h / rowH() + 2) * keepShare > prof.max_particles && sp < 400) sp *= 1.06;
    const cols = Math.ceil(w / sp) + 2;
    const rows = Math.ceil(h / rowH()) + 2;
    const grid: number[] = new Array(cols * rows).fill(-1);
    const pts: P[] = [];
    const cx = w / 2, cy = h / 2, maxD = Math.hypot(cx, cy) || 1;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        if (pattern === "hexagons") {
          // axial coordinates of an odd-row-offset lattice; drop every third point → honeycomb
          const q = i - (j - (j & 1)) / 2;
          if ((((q - j) % 3) + 3) % 3 === 0) continue;
        }
        let hx = (i - 0.5) * sp + (!square && j % 2 ? sp / 2 : 0);
        let hy = (j - 0.5) * rowH();
        if (pattern === "polygons") {
          // deterministic jitter (stable across frames/resizes) → irregular facets, still evenly spread
          hx += (hash(i + 31, j) - 0.5) * sp * 0.55;
          hy += (hash(i, j + 17) - 0.5) * sp * 0.5;
        }
        const t = Math.hypot(hx - cx, hy - cy) / maxD; // 0 centre → 1 corner
        const keep = s.area.center_density + (s.area.edge_density - s.area.center_density) * Math.min(1, t * 1.15);
        if (hash(i, j) > keep) continue;
        grid[j * cols + i] = pts.length;
        pts.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, ph: hash(j, i) * Math.PI * 2, zone: 0, keep: 1 });
      }
    }
    for (const p of pts) p.zone = this.zoneAt(p.hx, p.hy);
    // neighbour links: squares → right + down; triangles/hexagons → right, down-left, down-right
    // (in the honeycomb the removed points break the triangles into hexagons automatically)
    const L: number[] = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const a = grid[j * cols + i];
        if (a < 0) continue;
        const odd = j % 2;
        const cand = square
          ? [[i + 1, j], [i, j + 1]]
          : diamonds
            ? [[i - 1 + odd, j + 1], [i + odd, j + 1]]
            : [[i + 1, j], [i - 1 + odd, j + 1], [i + odd, j + 1]];
        for (const [ni, nj] of cand) {
          if (ni < 0 || ni >= cols || nj >= rows) continue;
          const b = grid[nj * cols + ni];
          if (b < 0) continue;
          if (hash(a + 7, b + 3) > s.particles.link_density) continue;
          // "mixed": drop ~45% of horizontal links → neighbouring triangles merge into quads
          if (pattern === "mixed" && nj === j && hash(a + 3, j + 11) < 0.45) continue;
          L.push(a, b);
        }
      }
    }
    this.pts = pts;
    this.links = Int32Array.from(L);
  }

  /** Scattered points (stable pseudo-random positions) linked to their 3 nearest neighbours. */
  private buildConstellation() {
    const s = this.o.settings;
    const prof = this.profile();
    const { w, h } = this;
    const sp = prof.spacing * this.quality;
    const n = Math.min(prof.max_particles, Math.round(((w * h) / (sp * sp)) * 0.85));
    const pts: P[] = [];
    // jittered grid sampling keeps the scatter even (no clumps / big holes)
    const cols = Math.max(1, Math.round(Math.sqrt((n * w) / Math.max(1, h))));
    const rows = Math.max(1, Math.ceil(n / cols));
    const cw = w / cols, ch = h / rows;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const hx = (i + 0.15 + hash(i, j) * 0.7) * cw;
        const hy = (j + 0.15 + hash(j + 5, i + 9) * 0.7) * ch;
        pts.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, ph: hash(j, i) * Math.PI * 2, zone: this.zoneAt(hx, hy), keep: 1 });
      }
    }
    // spatial bins → nearest neighbours without all-pairs work
    const cell = Math.max(cw, ch) * 1.6;
    const bins = new Map<string, number[]>();
    pts.forEach((p, idx) => {
      const k = `${Math.floor(p.hx / cell)}:${Math.floor(p.hy / cell)}`;
      (bins.get(k) ?? bins.set(k, []).get(k)!).push(idx);
    });
    const seen = new Set<string>();
    const L: number[] = [];
    pts.forEach((p, a) => {
      const bx = Math.floor(p.hx / cell), by = Math.floor(p.hy / cell);
      const near: [number, number][] = [];
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        for (const b of bins.get(`${bx + dx}:${by + dy}`) ?? []) {
          if (b !== a) near.push([b, (pts[b].hx - p.hx) ** 2 + (pts[b].hy - p.hy) ** 2]);
        }
      }
      near.sort((x, y) => x[1] - y[1]);
      for (const [b] of near.slice(0, 3)) {
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (seen.has(key) || hash(a + 7, b + 3) > s.particles.link_density) continue;
        seen.add(key);
        L.push(a, b);
      }
    });
    this.pts = pts;
    this.links = Int32Array.from(L);
  }

  /* ---------------------------------------------------------------- loop */
  private kick(redraw = false) {
    if (this.o.still) {
      if (redraw || !this.running) this.draw();
      return;
    }
    if (this.running || !this.visible || document.hidden) return;
    if (!effectRunsOn(this.o.settings, this.dev) && !this.o.device) return void this.draw();
    this.running = true;
    if (this.o.scheduler) return void this.o.scheduler.add(this);
    let last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(3, (now - last) / 16.667);
      last = now;
      this.step(dt);
      this.draw();
      this.adapt(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.o.scheduler?.remove(this);
  }

  /** one simulation + paint step (called by the shared FrameScheduler) */
  frame(dt: number) {
    if (!this.running) return;
    this.step(dt);
    this.draw();
    this.adapt(dt);
  }

  /**
   * Keep moving on slow devices: if frames stay slow (below ~24 fps for ~2 s), thin the lattice a
   * little (up to 1.7× spacing) instead of freezing the animation. Never stops the motion itself.
   */
  private slow = 0;
  private quality = 1;
  private adapt(dt: number) {
    if (this.o.still) return;
    this.slow = dt > 2.5 ? this.slow + 1 : Math.max(0, this.slow - 2); // dt is in 60 fps units: 2.5 ≈ 42 ms
    if (this.slow > 48 && this.quality < 1.7) {
      this.slow = 0;
      this.quality = Math.min(1.7, this.quality * 1.18);
      this.resize();
    }
  }

  private step(dt: number) {
    const s = this.o.settings, prof = this.profile();
    const it = s.interaction;
    this.t += dt * 0.016 * s.particles.speed * prof.speed_scale;
    // pointer influence eases in (response) and out (release)
    const target = this.pointer.active && it.repulsion ? 1 : 0;
    const k = target > this.pointer.strength ? it.response : it.release;
    this.pointer.strength += (target - this.pointer.strength) * Math.min(1, k * dt * 2);
    const ps = this.pointer.strength;
    const R = it.radius, R2 = R * R;
    const force = it.force * prof.force_scale * 2.2;
    const amp = s.particles.randomness * prof.spacing;
    const spring = s.particles.return_speed;
    const damp = Math.pow(0.84, dt);
    const px = this.pointer.x, py = this.pointer.y;
    // waves
    const waveSpeed = 7 * it.wave_speed;
    for (const wv of this.waves) { wv.r += waveSpeed * dt; wv.life -= 0.006 * dt * it.wave_speed; }
    this.waves = this.waves.filter((wv) => wv.life > 0 && wv.r < Math.hypot(this.w, this.h));
    for (const p of this.pts) {
      const tx = p.hx + Math.sin(this.t * 1.3 + p.ph) * amp;
      const ty = p.hy + Math.cos(this.t + p.ph * 1.7) * amp;
      let ax = (tx - p.x) * spring;
      let ay = (ty - p.y) * spring;
      if (ps > 0.002) {
        const dx = p.x - px, dy = p.y - py, d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2), f = (1 - d / R) ** 2 * force * ps;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
        }
      }
      for (const wv of this.waves) {
        const dx = p.x - wv.x, dy = p.y - wv.y, d = Math.hypot(dx, dy) || 1, band = Math.abs(d - wv.r);
        if (band < 34) {
          const f = (1 - band / 34) * 2.4 * it.wave_strength * wv.life;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
        }
      }
      p.vx = (p.vx + ax * dt) * damp;
      p.vy = (p.vy + ay * dt) * damp;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private style(from: string, to: string) {
    const c = this.o.settings.colors;
    if (!c.gradient) return from;
    const g = this.ctx.createLinearGradient(0, 0, this.w, this.h);
    g.addColorStop(0, from);
    g.addColorStop(1, to);
    return g;
  }

  private draw() {
    const { ctx, w, h, dpr } = this;
    const s = this.o.settings, prof = this.profile();
    const c = s.colors;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const ps = this.pointer.strength, px = this.pointer.x, py = this.pointer.y;
    const R = s.interaction.radius;
    const clarity = s.area.text_clarity;

    // ambient + pointer light
    if (c.intensity > 0) {
      const g = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, Math.max(w, h) * 0.6);
      g.addColorStop(0, hexA(c.glow, 0.10 * c.intensity));
      g.addColorStop(1, hexA(c.glow, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    if (ps > 0.02 && c.hover_glow > 0) {
      const g = ctx.createRadialGradient(px, py, 0, px, py, R * 1.1);
      g.addColorStop(0, hexA(c.glow, 0.22 * c.hover_glow * ps));
      g.addColorStop(1, hexA(c.glow, 0));
      ctx.fillStyle = g;
      ctx.fillRect(px - R * 1.2, py - R * 1.2, R * 2.4, R * 2.4);
    }

    // per-particle light: near pointer → brighter, inside title zone → faded
    const light = new Float32Array(this.pts.length);
    for (let i = 0; i < this.pts.length; i++) {
      const p = this.pts[i];
      let l = 1 - p.zone * clarity;
      if (ps > 0.02) {
        const d = Math.hypot(p.x - px, p.y - py);
        if (d < R) l += (1 - d / R) * c.hover_glow * 1.6 * ps;
      }
      const energy = Math.min(1, Math.hypot(p.x - p.hx, p.y - p.hy) / 30);
      light[i] = Math.max(0, l + energy * 0.4 * c.intensity);
    }

    // links, bucketed by alpha
    const maxL = s.particles.link_distance, maxL2 = maxL * maxL;
    if (c.link_opacity > 0 && this.links.length) {
      const paths = Array.from({ length: BUCKETS }, () => new Path2D());
      const used = new Array(BUCKETS).fill(false);
      const L = this.links;
      for (let k = 0; k < L.length; k += 2) {
        const a = this.pts[L[k]], b = this.pts[L[k + 1]];
        const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 > maxL2) continue;
        const v = (1 - Math.sqrt(d2) / maxL) * Math.min(1.6, (light[L[k]] + light[L[k + 1]]) / 2);
        if (v <= 0.02) continue;
        const bi = Math.min(BUCKETS - 1, Math.floor((v / 1.6) * BUCKETS));
        paths[bi].moveTo(a.x, a.y);
        paths[bi].lineTo(b.x, b.y);
        used[bi] = true;
      }
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = this.style(c.link, c.gradient_to);
      for (let bi = 0; bi < BUCKETS; bi++) {
        if (!used[bi]) continue;
        ctx.globalAlpha = Math.min(1, c.link_opacity * ((bi + 1) / BUCKETS) * 1.6);
        ctx.stroke(paths[bi]);
      }
    }

    // dots, bucketed by alpha
    const size = s.particles.size * prof.size_scale;
    const paths = Array.from({ length: BUCKETS }, () => new Path2D());
    const used = new Array(BUCKETS).fill(false);
    for (let i = 0; i < this.pts.length; i++) {
      const v = light[i];
      if (v <= 0.03) continue;
      const p = this.pts[i];
      const bi = Math.min(BUCKETS - 1, Math.floor((Math.min(v, 1.6) / 1.6) * BUCKETS));
      const rr = size * (1 + Math.max(0, v - 1) * 0.6);
      const mix = s.particles.mix;
      const shape = s.particles.shape === "mixed" ? mix[Math.floor(p.ph * 10) % mix.length] : s.particles.shape;
      addShape(paths[bi], shape, p.x, p.y, rr);
      used[bi] = true;
    }
    ctx.fillStyle = this.style(c.particle, c.gradient_to);
    for (let bi = 0; bi < BUCKETS; bi++) {
      if (!used[bi]) continue;
      ctx.globalAlpha = Math.min(1, s.particles.opacity * ((bi + 1) / BUCKETS) * 1.7);
      ctx.fill(paths[bi]);
    }

    // wave rings
    if (this.waves.length) {
      ctx.lineWidth = 1.2;
      for (const wv of this.waves) {
        ctx.globalAlpha = 0.35 * wv.life * c.intensity + 0.05;
        ctx.strokeStyle = c.glow;
        ctx.beginPath();
        ctx.arc(wv.x, wv.y, wv.r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    // idle: stop the loop when nothing moves (pointer gone, no waves) → no wasted frames when ambient speed is 0
    if (this.running && s.particles.speed === 0 && ps < 0.002 && !this.waves.length) {
      const moving = this.pts.some((p) => Math.abs(p.vx) + Math.abs(p.vy) > 0.01);
      if (!moving) this.stop();
    }
  }

  /** for tests / debugging */
  get stats() {
    return { particles: this.pts.length, links: this.links.length / 2, device: this.dev, running: this.running, width: this.w, height: this.h };
  }
}

/** Adds one particle of the given shape (similar visual weight across shapes) to a batched path. */
function addShape(path: Path2D, shape: ParticleShape, x: number, y: number, r: number) {
  const poly = (n: number, rad: number, rot: number) => {
    for (let k = 0; k < n; k++) {
      const a = rot + (k * Math.PI * 2) / n;
      const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      if (k === 0) path.moveTo(px, py);
      else path.lineTo(px, py);
    }
    path.closePath();
  };
  switch (shape) {
    case "square":
      path.rect(x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8);
      break;
    case "triangle":
      poly(3, r * 1.35, -Math.PI / 2);
      break;
    case "diamond":
      poly(4, r * 1.3, 0);
      break;
    case "hexagon":
      poly(6, r * 1.15, 0);
      break;
    case "pentagon":
      poly(5, r * 1.25, -Math.PI / 2);
      break;
    case "star": {
      // 5-point geometric star: alternating outer / inner radius
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const rad = k % 2 ? r * 0.62 : r * 1.55;
        const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
        if (k === 0) path.moveTo(px, py);
        else path.lineTo(px, py);
      }
      path.closePath();
      break;
    }
    case "plus": {
      // thin geometric cross (one outline → no overlap issues with the fill rule)
      const a = r * 1.4, t = r * 0.42;
      path.moveTo(x - t, y - a); path.lineTo(x + t, y - a); path.lineTo(x + t, y - t); path.lineTo(x + a, y - t);
      path.lineTo(x + a, y + t); path.lineTo(x + t, y + t); path.lineTo(x + t, y + a); path.lineTo(x - t, y + a);
      path.lineTo(x - t, y + t); path.lineTo(x - a, y + t); path.lineTo(x - a, y - t); path.lineTo(x - t, y - t);
      path.closePath();
      break;
    }
    case "ring":
      // outer circle clockwise + inner circle counter-clockwise → hollow ring with the default fill rule
      path.moveTo(x + r * 1.35, y);
      path.arc(x, y, r * 1.35, 0, Math.PI * 2);
      path.moveTo(x + r * 0.75, y);
      path.arc(x, y, r * 0.75, 0, Math.PI * 2, true);
      break;
    default:
      path.moveTo(x + r, y);
      path.arc(x, y, r, 0, Math.PI * 2);
  }
}

function hexA(hex: string, a: number) {
  let x = hex.replace("#", "");
  if (x.length === 3) x = [...x].map((ch) => ch + ch).join("");
  const n = parseInt(x, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}
