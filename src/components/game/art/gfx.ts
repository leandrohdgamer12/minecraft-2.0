/* Mini-engine de pixel art procedural (apenas no navegador).
 * Tudo é desenhado em canvas com pixels inteiros e depois convertido em PNG (data URL),
 * então o jogo não depende de nenhum arquivo de imagem novo. */

export const TS = 32; // pixels de arte por tile do mapa

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] as const;
const h2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
/** mistura duas cores #rrggbb (t = 0 → a, t = 1 → b) */
export function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = hex(a), [r2, g2, b2] = hex(b);
  return `#${h2(r1 + (r2 - r1) * t)}${h2(g1 + (g2 - g1) * t)}${h2(b1 + (b2 - b1) * t)}`;
}
export const dark = (c: string, t = 0.3) => mix(c, "#0d0a14", t);
export const light = (c: string, t = 0.25) => mix(c, "#fff3d6", t);

export class Gfx {
  c: HTMLCanvasElement;
  x: CanvasRenderingContext2D;
  constructor(public w: number, public h: number) {
    this.c = document.createElement("canvas");
    this.c.width = w; this.c.height = h;
    this.x = this.c.getContext("2d", { willReadFrequently: true })!;
    this.x.imageSmoothingEnabled = false;
  }
  r(x: number, y: number, w: number, h: number, c: string) { this.x.fillStyle = c; this.x.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); return this; }
  p(x: number, y: number, c: string) { this.x.fillStyle = c; this.x.fillRect(Math.round(x), Math.round(y), 1, 1); return this; }
  /** retângulo com 1px de contorno */
  box(x: number, y: number, w: number, h: number, fill: string, line: string) { this.r(x, y, w, h, line); this.r(x + 1, y + 1, w - 2, h - 2, fill); return this; }
  /** bloco com luz (topo/esquerda) e sombra (baixo/direita) */
  slab(x: number, y: number, w: number, h: number, c: string, k = 0.25) {
    this.r(x, y, w, h, c);
    this.r(x, y, w, 1, light(c, k)); this.r(x, y, 1, h, light(c, k * 0.5));
    this.r(x, y + h - 1, w, 1, dark(c, k)); this.r(x + w - 1, y, 1, h, dark(c, k * 0.6));
    return this;
  }
  ell(cx: number, cy: number, rx: number, ry: number, c: string) {
    this.x.fillStyle = c;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.x.fillRect(x, y, 1, 1);
      }
    return this;
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string) {
    this.x.fillStyle = c;
    let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
    for (;;) {
      this.x.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
    return this;
  }
  /** preenchimento xadrez (efeito de dithering) */
  dither(x: number, y: number, w: number, h: number, c: string, phase = 0) {
    this.x.fillStyle = c;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + j + phase) % 2 === 0) this.x.fillRect(x + i, y + j, 1, 1);
    return this;
  }
  /** salpica pixels aleatórios (textura) */
  spray(x: number, y: number, w: number, h: number, cols: string[], n: number, rand: () => number) {
    for (let i = 0; i < n; i++) this.p(x + Math.floor(rand() * w), y + Math.floor(rand() * h), cols[Math.floor(rand() * cols.length)]!);
    return this;
  }
  /** contorno de 1px ao redor de tudo que não é transparente */
  outline(c: string) {
    const d = this.x.getImageData(0, 0, this.w, this.h), a = d.data, o = new Uint8ClampedArray(a);
    const [R, G, B] = hex(c);
    const al = (x: number, y: number) => (x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : a[(y * this.w + x) * 4 + 3]!);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (al(x, y) > 0) continue;
      if (al(x - 1, y) || al(x + 1, y) || al(x, y - 1) || al(x, y + 1)) { const i = (y * this.w + x) * 4; o[i] = R; o[i + 1] = G; o[i + 2] = B; o[i + 3] = 255; }
    }
    this.x.putImageData(new ImageData(o, this.w, this.h), 0, 0);
    return this;
  }
  blit(g: Gfx, x: number, y: number) { this.x.drawImage(g.c, Math.round(x), Math.round(y)); return this; }
  flipX() { const g = new Gfx(this.w, this.h); g.x.save(); g.x.translate(this.w, 0); g.x.scale(-1, 1); g.x.drawImage(this.c, 0, 0); g.x.restore(); return g; }
  alpha(a: number) { const g = new Gfx(this.w, this.h); g.x.globalAlpha = a; g.x.drawImage(this.c, 0, 0); return g; }
  url() { return this.c.toDataURL("image/png"); }
}

export const canDraw = () => typeof document !== "undefined";
