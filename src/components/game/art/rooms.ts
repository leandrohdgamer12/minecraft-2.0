/* Interiores em pixel art: cada ambiente tem piso, paredes, decoração e móveis próprios.
 * A grade (16×11 tiles) e as letras dos mapas em World.tsx continuam sendo a fonte da verdade
 * para colisão e interação; aqui só desenhamos em cima delas. */
import { Gfx, TS, dark, light, mix, rng } from "./gfx";

export interface RoomArt {
  base: string; light: string;
  objects: { key: string; src: string; x: number; y: number; w: number; h: number; z: number; glow?: boolean }[];
}
type Kind = "plank" | "check" | "tile" | "marble" | "parquet";
interface Theme { kind: Kind; fa: string; fb: string; wall: string; wall2: string; base: string; cap: string; accent: string; amb: string }
const THEMES: Record<string, Theme> = {
  casa: { kind: "plank", fa: "#a36f48", fb: "#94623e", wall: "#d6c3a0", wall2: "#c4ae88", base: "#6a4630", cap: "#3b2b3a", accent: "#7a5cb0", amb: "255,190,110" },
  estrela: { kind: "check", fa: "#f0e2b0", fb: "#e0cc8a", wall: "#8fb8e0", wall2: "#7aa4d0", base: "#2f4f8a", cap: "#2a3560", accent: "#ffd23a", amb: "255,235,150" },
  bairro: { kind: "tile", fa: "#c8754a", fb: "#b86a42", wall: "#e8d9a0", wall2: "#d6c586", base: "#6a4a2a", cap: "#3a3228", accent: "#4f9a56", amb: "255,200,110" },
  mega: { kind: "check", fa: "#34203f", fb: "#1f1428", wall: "#5a2a6a", wall2: "#4a2058", base: "#1a0e24", cap: "#12091c", accent: "#ff3d9a", amb: "255,90,190" },
  livraria: { kind: "parquet", fa: "#6a4528", fb: "#5a3a22", wall: "#3a5a4a", wall2: "#2f4a3c", base: "#2a1a10", cap: "#161e1a", accent: "#d8b45a", amb: "255,185,100" },
  eletro: { kind: "tile", fa: "#3a4350", fb: "#323a46", wall: "#1f2733", wall2: "#18202b", base: "#0f151d", cap: "#0a0e14", accent: "#3bf0f0", amb: "90,230,240" },
  procon: { kind: "marble", fa: "#e0dccd", fb: "#d0cbba", wall: "#a9b6bd", wall2: "#97a6ae", base: "#2a3a5a", cap: "#2a3040", accent: "#33508a", amb: "235,235,255" },
};
const INK = "#150e1c";
const W = 16, H = 11;

function txt(g: Gfx, s: string, cx: number, cy: number, px: number, col: string, shadow?: string) {
  const c = g.x; c.save(); c.imageSmoothingEnabled = false; c.font = `${px}px "Press Start 2P", monospace`; c.textAlign = "center"; c.textBaseline = "middle";
  if (shadow) { c.fillStyle = shadow; c.fillText(s, cx + 1, cy + 1); }
  c.fillStyle = col; c.fillText(s, cx, cy); c.restore();
}
const shadowBox = (g: Gfx, x: number, y: number, w: number, h: number) => { g.r(x + 3, y + h - 1, w, 4, "#0000004d"); g.r(x + w - 1, y + 3, 4, h - 2, "#0000004d"); };

/* ---------------- pisos ---------------- */
function floorTile(g: Gfx, th: Theme, x: number, y: number, tx: number, ty: number, R: () => number) {
  const ox = x, oy = y;
  switch (th.kind) {
    case "plank":
      for (let j = 0; j < 4; j++) {
        const c = (ty * 4 + j) % 2 ? th.fa : th.fb; g.r(ox, oy + j * 8, TS, 8, mix(c, "#000", R() * 0.08));
        const seam = ((tx * 5 + ty * 3 + j * 11) % 4) * 7 + 3; g.r(ox + seam, oy + j * 8, 1, 8, dark(th.fb, 0.35)); g.r(ox, oy + j * 8 + 7, TS, 1, dark(th.fb, 0.3)); g.r(ox, oy + j * 8, TS, 1, light(th.fa, 0.12));
        for (let k = 0; k < 4; k++) g.r(ox + Math.floor(R() * 28), oy + j * 8 + 2 + Math.floor(R() * 4), 3 + Math.floor(R() * 4), 1, dark(th.fa, 0.18));
      } break;
    case "check":
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const c = (i + j + tx + ty) % 2 ? th.fa : th.fb; g.r(ox + i * 16, oy + j * 16, 16, 16, c); g.r(ox + i * 16, oy + j * 16, 16, 1, light(c, 0.18)); g.r(ox + i * 16, oy + j * 16, 1, 16, light(c, 0.1)); g.r(ox + i * 16, oy + j * 16 + 15, 16, 1, dark(c, 0.12)); }
      g.spray(ox, oy, TS, TS, [dark(th.fb, 0.1), light(th.fa, 0.08)], 12, R);
      if (th.accent === "#ff3d9a") { g.r(ox + 5, oy + 5, 3, 1, "#ffffff22"); g.r(ox + 6, oy + 4, 1, 3, "#ffffff22"); }
      break;
    case "tile":
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const c = (tx + ty + i + j) % 3 === 0 ? th.fb : th.fa; g.r(ox + i * 16, oy + j * 16, 16, 16, c); g.r(ox + i * 16, oy + j * 16, 16, 1, light(c, 0.2)); g.r(ox + i * 16 + 15, oy + j * 16, 1, 16, dark(c, 0.3)); g.r(ox + i * 16, oy + j * 16 + 15, 16, 1, dark(c, 0.35)); }
      g.spray(ox, oy, TS, TS, [dark(th.fa, 0.12), light(th.fa, 0.1)], 20, R);
      if (th.accent === "#3bf0f0" && (tx + ty) % 4 === 0) g.r(ox, oy + 15, TS, 1, "#3bf0f066");
      break;
    case "marble":
      g.r(ox, oy, TS, TS, (tx + ty) % 2 ? th.fa : th.fb); g.r(ox, oy, TS, 1, "#fff8"); g.r(ox, oy, 1, TS, "#fff5"); g.r(ox + TS - 1, oy, 1, TS, dark(th.fb, 0.2)); g.r(ox, oy + TS - 1, TS, 1, dark(th.fb, 0.25));
      { let vx = ox + Math.floor(R() * 20) + 4, vy = oy + 2; for (let k = 0; k < 24; k++) { g.p(vx, vy, "#b6b2a4"); vy += 1; vx += R() < 0.5 ? 1 : R() < 0.5 ? 0 : -1; if (vy >= oy + 30) break; } }
      break;
    case "parquet":
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const hz = (i + j + tx + ty) % 2 === 0; const c = (i * 3 + j * 5 + tx + ty) % 3 ? th.fa : th.fb; g.r(ox + i * 8, oy + j * 8, 8, 8, c); if (hz) g.r(ox + i * 8, oy + j * 8 + 3, 8, 1, dark(c, 0.2)); else g.r(ox + i * 8 + 3, oy + j * 8, 1, 8, dark(c, 0.2)); g.r(ox + i * 8, oy + j * 8, 8, 1, dark(c, 0.3)); g.r(ox + i * 8, oy + j * 8, 1, 8, dark(c, 0.3)); }
      break;
  }
}

/* ---------------- paredes ---------------- */
function wallFace(g: Gfx, th: Theme, x: number, y: number, tx: number, id: string, R: () => number) {
  g.r(x, y, TS, TS, th.wall);
  if (id === "casa") { for (let i = 0; i < TS; i += 8) g.r(x + i, y, 4, 24, th.wall2); g.r(x, y, TS, 24, "#00000008"); const f = (tx % 2) * 8; g.p(x + 6 + f, y + 8, "#a05a6a"); g.p(x + 5 + f, y + 9, "#a05a6a"); g.p(x + 7 + f, y + 9, "#a05a6a"); g.p(x + 6 + f, y + 10, "#6a8a5a"); g.p(x + 22 - f, y + 15, "#a05a6a"); g.p(x + 21 - f, y + 16, "#a05a6a"); g.p(x + 23 - f, y + 16, "#a05a6a"); g.p(x + 22 - f, y + 17, "#6a8a5a"); }
  else if (id === "estrela") { g.r(x, y, TS, 24, th.wall); for (let k = 0; k < 3; k++) { const sx = x + 4 + ((tx * 7 + k * 11) % 24), sy = y + 4 + k * 6; g.r(sx, sy, 1, 3, "#fff2a8"); g.r(sx - 1, sy + 1, 3, 1, "#fff2a8"); } g.r(x, y + 20, TS, 4, th.wall2); }
  else if (id === "bairro") { g.r(x, y, TS, 12, th.wall); g.r(x, y + 12, TS, 12, "#f4f0e0"); for (let i = 0; i < TS; i += 8) g.r(x + i, y + 12, 1, 12, "#c8c4b0"); g.r(x, y + 17, TS, 1, "#c8c4b0"); g.r(x, y + 12, TS, 1, "#fff"); g.r(x, y + 11, TS, 1, "#a89a60"); }
  else if (id === "mega") { g.r(x, y, TS, 24, th.wall); g.dither(x, y, TS, 24, th.wall2, tx); g.r(x, y + 3, TS, 1, "#ff3d9a"); g.r(x, y + 20, TS, 1, "#2ee6ff"); }
  else if (id === "livraria") { g.r(x, y, TS, 24, th.wall); for (let i = 0; i < TS; i += 8) g.r(x + i, y, 1, 24, th.wall2); g.r(x, y + 20, TS, 4, dark(th.wall, 0.3)); g.r(x, y + 19, TS, 1, "#d8b45a"); }
  else if (id === "eletro") { g.r(x, y, TS, 24, th.wall); g.r(x, y + 4, TS, 1, "#3bf0f0aa"); g.r(x, y + 21, TS, 1, "#3bf0f066"); for (let i = 0; i < TS; i += 16) g.r(x + i, y, 1, 24, th.wall2); }
  else { g.r(x, y, TS, 12, th.wall); g.r(x, y + 12, TS, 12, "#34436a"); g.r(x, y + 12, TS, 1, "#c9cfdc"); for (let i = 0; i < TS; i += 16) g.r(x + i, y + 13, 1, 11, "#2a3558"); g.r(x, y + 11, TS, 1, "#7d8c95"); }
  g.spray(x, y, TS, 24, [dark(th.wall, 0.06), light(th.wall, 0.05)], 14, R);
  g.r(x, y, TS, 3, th.cap); g.r(x, y + 3, TS, 1, light(th.cap, 0.3)); // sanca/teto
  g.r(x, y + 24, TS, 8, th.base); g.r(x, y + 24, TS, 1, light(th.base, 0.35)); g.r(x, y + 31, TS, 1, dark(th.base, 0.4)); // rodapé
}
function wallCap(g: Gfx, th: Theme, x: number, y: number, nb: { u: boolean; d: boolean; l: boolean; r: boolean }) {
  g.r(x, y, TS, TS, th.cap); g.dither(x, y, TS, TS, light(th.cap, 0.06), 0);
  const e = light(th.cap, 0.28);
  if (nb.u) g.r(x, y, TS, 3, e); if (nb.l) g.r(x, y, 3, TS, e); if (nb.r) g.r(x + TS - 3, y, 3, TS, e); if (nb.d) g.r(x, y + TS - 3, TS, 3, e);
}

/* ---------------- ícones de produto (14×14) ---------------- */
function icon(id: string): Gfx {
  const g = new Gfx(16, 16), o = (c = INK) => g.outline(c);
  switch (id) {
    case "cad": g.r(3, 1, 10, 14, "#3f7ad0"); g.r(3, 1, 10, 2, "#6fa0f0"); g.r(2, 3, 2, 10, "#c9c9d0"); for (let k = 0; k < 4; k++) g.p(2, 4 + k * 3, "#555"); g.r(6, 5, 5, 4, "#f4efe0"); g.r(7, 6, 3, 1, "#3f7ad0"); break;
    case "fich": g.r(3, 1, 10, 14, "#e85a9a"); g.r(3, 1, 10, 2, "#ff8fc0"); g.r(5, 4, 6, 6, "#ffd2e6"); g.p(6, 6, "#222"); g.p(9, 6, "#222"); g.r(7, 8, 2, 1, "#c03a70"); g.r(4, 11, 8, 2, "#c03a70"); g.p(8, 13, "#ffd23a"); break;
    case "glit": g.r(3, 8, 10, 7, "#8a5cd0"); g.r(3, 8, 10, 1, "#b08af0"); [["#ff4d9a", 4], ["#4ad0ff", 6], ["#ffe45a", 8], ["#7cf06a", 10], ["#b86aff", 12]].forEach(([c, x], i) => { g.r(x as number - 1, 1 + (i % 2), 2, 8, c as string); g.p(x as number - 1, 1 + (i % 2), "#fff"); }); g.p(5, 11, "#fff"); g.p(10, 12, "#fff"); break;
    case "lapis": g.r(2, 2, 3, 12, "#f2c230"); g.r(2, 2, 3, 2, "#d86a6a"); g.r(6, 1, 3, 13, "#3aa86a"); g.r(6, 1, 3, 2, "#d86a6a"); g.r(10, 3, 3, 11, "#d0443a"); g.r(10, 3, 3, 2, "#d86a6a"); g.r(2, 12, 11, 3, "#f4efe0"); g.r(2, 12, 11, 1, "#fff"); break;
    case "chav": g.ell(8, 9, 5, 5, "#c98a5a"); g.ell(4, 4, 2, 2, "#c98a5a"); g.ell(12, 4, 2, 2, "#c98a5a"); g.ell(8, 10, 3, 3, "#ecc9a0"); g.p(6, 8, "#222"); g.p(10, 8, "#222"); g.r(7, 10, 2, 1, "#6a3a2a"); g.r(7, 0, 2, 2, "#d0d0d8"); break;
    case "moch": g.r(3, 3, 10, 12, "#d6382f"); g.r(3, 3, 10, 3, "#f06050"); g.r(5, 9, 6, 5, "#a82820"); g.r(7, 11, 2, 1, "#ffd23a"); g.r(5, 1, 6, 3, "#a82820"); g.r(2, 6, 1, 7, "#7a1a14"); g.r(13, 6, 1, 7, "#7a1a14"); g.r(6, 5, 4, 1, "#fff"); break;
    case "fone": g.r(3, 1, 10, 2, "#2a2a36"); g.r(2, 2, 2, 8, "#2a2a36"); g.r(12, 2, 2, 8, "#2a2a36"); g.r(1, 8, 4, 6, "#ff3d9a"); g.r(11, 8, 4, 6, "#ff3d9a"); g.r(2, 9, 2, 4, "#4ad0ff"); g.r(12, 9, 2, 4, "#4ad0ff"); g.p(0, 6, "#4ad0ff"); g.p(15, 6, "#4ad0ff"); break;
    case "estojo": g.r(1, 4, 14, 9, "#232a2a"); g.r(1, 4, 14, 2, "#3a4646"); g.r(1, 8, 14, 1, "#59f09a"); g.r(4, 6, 6, 3, "#59f09a"); g.r(5, 7, 1, 1, "#232a2a"); g.p(8, 7, "#232a2a"); g.p(9, 6, "#232a2a"); g.r(12, 6, 2, 2, "#ff3d5a"); g.r(1, 12, 14, 1, "#59f09a"); break;
    case "livro": g.r(2, 1, 12, 14, "#2f5aa8"); g.r(2, 1, 12, 2, "#5a82d0"); g.r(2, 1, 2, 14, "#1f3a78"); g.r(4, 14, 10, 1, "#f4efe0"); g.r(5, 4, 8, 4, "#f4efe0"); g.r(6, 5, 6, 1, "#2f5aa8"); g.r(6, 7, 4, 1, "#2f5aa8"); g.r(5, 10, 8, 2, "#d8b45a"); break;
    case "combo": g.r(2, 5, 12, 10, "#d6382f"); g.r(2, 5, 12, 2, "#f06050"); g.r(7, 5, 2, 10, "#ffd23a"); g.r(2, 9, 12, 2, "#ffd23a"); g.r(4, 2, 4, 3, "#ffd23a"); g.r(8, 2, 4, 3, "#ffd23a"); g.p(8, 4, "#a8281f"); g.r(10, 11, 5, 4, "#fff"); g.p(11, 12, "#d6382f"); g.p(13, 13, "#d6382f"); break;
    case "manga": g.r(3, 1, 10, 14, "#f4efe0"); g.r(3, 1, 10, 9, "#d6382f"); g.r(4, 2, 8, 7, "#1a1a22"); g.ell(8, 5, 2.5, 3, "#ecc9a0"); g.r(6, 3, 5, 2, "#1a1a22"); g.r(4, 11, 8, 1, "#222"); g.r(4, 13, 5, 1, "#222"); break;
    case "calc": g.r(3, 1, 10, 14, "#59626c"); g.r(3, 1, 10, 2, "#7a8590"); g.r(4, 3, 8, 3, "#b8e8a8"); g.r(5, 4, 4, 1, "#3a6a3a"); for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) g.r(4 + i * 3, 7 + j * 2, 2, 1, j === 3 && i === 2 ? "#ff8a3a" : "#d8dde4"); break;
    case "mouse": g.ell(8, 9, 5, 6, "#2a2a36"); g.ell(8, 8, 4, 5, "#3a3a4c"); g.r(7, 3, 2, 4, "#14141c"); g.r(4, 13, 8, 2, "#ff3d9a"); g.r(4, 14, 3, 1, "#4ad0ff"); g.r(9, 14, 3, 1, "#7cf06a"); g.r(8, 1, 1, 3, "#555"); break;
    default: g.r(3, 3, 10, 10, "#d6a8ff"); g.r(3, 3, 10, 2, "#f0d0ff"); g.ell(8, 8, 3, 3, "#ff8fd0"); g.p(7, 7, "#fff"); // enfeite piscante
  }
  return o(INK);
}
const ICONS = new Map<string, Gfx>();
const ic = (id: string) => { let i = ICONS.get(id); if (!i) { i = icon(id); ICONS.set(id, i); } return i; };
function putIcon(g: Gfx, id: string, x: number, y: number, s = 1) { g.x.imageSmoothingEnabled = false; g.x.drawImage(ic(id).c, Math.round(x), Math.round(y), 18 * s, 18 * s); }

/* ---------------- móveis ---------------- */
type Painter = (g: Gfx, w: number, h: number, ctx: { id: string; prods: (string | undefined)[]; n: number; R: () => number }) => void;

const bed: Painter = (g, w, h) => {
  const X = 2, Y = 2, bw = w - 6, bh = h - 5;
  g.r(X, Y, bw, 13, "#6a4630"); g.r(X, Y, bw, 2, "#8a5a3a"); g.r(X + 2, Y + 3, bw - 4, 8, "#5a3a28"); // cabeceira
  g.r(X, Y + 10, bw, bh - 10, "#e8e0f0"); // lençol
  g.ell(X + 17, Y + 17, 11, 6, "#f8f4ff"); g.ell(X + 17, Y + 18, 11, 5, "#dcd4ea"); g.ell(X + 17, Y + 16, 10, 5, "#fff"); g.r(X + 6, Y + 14, 1, 2, "#fff"); // travesseiro
  g.r(X, Y + 26, bw, bh - 26, "#7a58b0"); g.r(X, Y + 24, bw, 4, "#9a7ad0"); g.r(X, Y + 24, bw, 1, "#c8b0f0"); // edredom
  for (let j = 0; j < bh - 28; j += 8) for (let i = 0; i < bw; i += 8) { g.r(X + i + (j % 16 ? 4 : 0), Y + 30 + j, 3, 3, "#9a7ad0"); g.p(X + i + (j % 16 ? 4 : 0) + 1, Y + 31 + j, "#e8dcff"); }
  g.r(X, Y + bh - 4, bw, 4, "#5a3a8a"); g.r(X, Y + bh - 1, bw, 1, "#3a2460");
  g.ell(X + bw - 12, Y + 18, 5, 5, "#c98a5a"); g.ell(X + bw - 16, Y + 14, 2, 2, "#c98a5a"); g.ell(X + bw - 8, Y + 14, 2, 2, "#c98a5a"); g.p(X + bw - 14, Y + 17, "#222"); g.p(X + bw - 10, Y + 17, "#222"); // ursinho de pelúcia
  g.r(X - 1, Y + 2, 3, bh, "#4a3020"); g.r(X + bw - 2, Y + 2, 3, bh, "#4a3020");
  g.outline(INK); shadowBox(g, 0, 0, w - 4, h - 4);
};
const pc: Painter = (g, w, h) => {
  g.r(2, 5, 28, 15, "#8a5a33"); g.r(2, 5, 28, 2, "#b0784a"); g.r(2, 18, 28, 2, "#5a3a20"); g.r(4, 20, 24, 4, "#6b4423"); g.r(13, 21, 6, 2, "#d0b070"); // mesa e gaveta
  g.slab(7, 0, 18, 13, "#2a2f3a", 0.3); g.r(9, 2, 14, 9, "#0e2a3a"); g.r(10, 3, 12, 7, "#2a8aa8"); g.r(10, 3, 12, 1, "#7ae0f0"); g.r(11, 5, 4, 2, "#f4efe0"); g.r(16, 5, 5, 1, "#f4efe0"); g.r(16, 7, 4, 1, "#f4efe0"); g.r(13, 13, 6, 2, "#1a1e28"); // monitor aceso
  g.r(8, 14, 16, 3, "#c8c4b8"); g.r(8, 14, 16, 1, "#f0ece0"); for (let i = 0; i < 7; i++) g.r(9 + i * 2, 15, 1, 1, "#7a766a"); g.ell(27, 16, 2, 1.5, "#d8d4c8"); // teclado, mouse
  g.r(3, 8, 3, 4, "#d0d0d8"); g.r(3, 8, 3, 1, "#f0f0f8"); g.r(4, 12, 1, 5, "#7a7a88"); // caneca/luminária
  g.r(8, 24, 16, 6, "#6a4aa0"); g.r(9, 24, 14, 2, "#8a6ac0"); g.r(11, 29, 10, 2, "#2a2030"); // cadeira
  g.outline(INK); shadowBox(g, 0, 0, w - 4, h - 4);
};
const tv: Painter = (g, w, h) => {
  g.slab(2, 0, w - 6, 22, "#1a1e28", 0.3); g.r(5, 2, w - 12, 17, "#0e1a30");
  g.r(6, 3, w - 14, 15, "#c8302a"); g.r(6, 3, w - 14, 2, "#ff6a5a"); txt(g, "SÓ HOJE!", w / 2 - 2, 10, 5, "#ffe35a"); txt(g, "70%", w / 2 - 2, 15, 5, "#fff");
  g.r(6, 3, 6, 4, "#ffffff22"); g.r(w - 12, 20, 6, 1, "#3af06a");
  g.r(4, 22, w - 10, 8, "#6b4423"); g.r(4, 22, w - 10, 2, "#8a5a33"); g.r(7, 25, 12, 4, "#2a2a36"); g.r(w - 20, 25, 10, 4, "#2a2a36"); g.p(9, 27, "#3af06a"); g.r(w - 18, 26, 6, 2, "#ff8a3a");
  g.outline(INK); shadowBox(g, 0, 0, w - 4, h - 4);
};
const sofa: Painter = (g, w, h) => {
  const c = "#2f6f88", cd = dark(c, 0.3), cl = light(c, 0.2);
  g.r(2, 1, w - 6, 13, cd); g.r(2, 1, w - 6, 2, cl); for (let i = 0; i < 3; i++) { g.r(8 + i * 36, 3, 34, 9, c); g.r(8 + i * 36, 3, 34, 1, cl); g.r(8 + i * 36, 11, 34, 1, cd); }
  g.r(2, 10, w - 6, 16, c); g.r(2, 10, w - 6, 1, cl);
  for (let i = 0; i < 3; i++) { g.r(10 + i * 36, 13, 32, 11, light(c, 0.08)); g.r(10 + i * 36, 13, 32, 1, cl); g.r(10 + i * 36, 24, 32, 1, cd); g.r(9 + i * 36, 13, 1, 12, cd); g.p(26 + i * 36, 18, cd); }
  g.r(0, 6, 9, 21, cd); g.r(1, 6, 7, 3, c); g.r(w - 11, 6, 9, 21, cd); g.r(w - 10, 6, 7, 3, c); // braços
  g.r(14, 8, 12, 10, "#e8b83a"); g.r(14, 8, 12, 2, "#ffe07a"); g.r(w - 38, 9, 12, 9, "#d8587a"); g.r(w - 38, 9, 12, 2, "#f088a8"); g.p(18, 12, "#fff3"); // almofadas
  g.r(4, 27, 4, 3, "#2a1a10"); g.r(w - 10, 27, 4, 3, "#2a1a10");
  g.outline(INK); shadowBox(g, 0, 0, w - 4, h - 4);
};
const pig: Painter = (g) => {
  g.r(4, 17, 24, 3, "#8a5a33"); g.r(4, 17, 24, 1, "#b0784a"); g.r(6, 20, 3, 10, "#6b4423"); g.r(23, 20, 3, 10, "#6b4423"); g.r(6, 20, 20, 2, "#5a3a20"); // mesinha
  g.ell(15, 11, 11, 7.5, "#f5a8c4"); g.ell(14, 9, 8, 4, "#fcc8dc"); g.ell(24, 12, 4, 3.5, "#ee82aa"); g.r(23, 11, 1, 2, "#a8386a"); g.r(25, 11, 1, 2, "#a8386a"); // corpo e focinho
  g.r(7, 15, 3, 3, "#e87aa4"); g.r(19, 15, 3, 3, "#e87aa4"); // patas
  g.ell(18, 5, 2.5, 2.5, "#ee82aa"); g.r(10, 4, 8, 1, "#7a2a4a"); g.p(21, 9, "#241020"); g.p(22, 9, "#241020"); // olho, moedeira
  g.r(3, 8, 1, 1, "#ee82aa"); g.r(2, 7, 2, 1, "#ee82aa"); g.r(2, 9, 2, 1, "#ee82aa"); // rabinho
  g.r(14, 1, 4, 3, "#ffd23a"); g.r(15, 1, 2, 1, "#fff2a0"); // moeda entrando
  g.outline(INK); g.r(3, 29, 24, 2, "#0000004d");
};
const plant: Painter = (g, w, h, { n }) => {
  const pots = Math.max(1, Math.round(w)), pw = (w * TS) / pots;
  for (let k = 0; k < pots; k++) {
    const cx = k * pw + pw / 2, by = h - 14, top = Math.max(1, by - (h > 40 ? 40 : 18));
    g.r(cx - 8, by + 2, 16, 12, "#b8603a"); g.r(cx - 9, by, 18, 4, "#d07848"); g.r(cx - 9, by, 18, 1, "#e89868"); g.r(cx - 6, by + 12, 12, 2, "#8a4428"); g.r(cx + 4, by + 3, 3, 10, "#8a4428");
    const leaf = (lx: number, ly: number, rx: number, ry: number, c: string) => { g.ell(lx, ly, rx, ry, c); g.line(lx - rx + 2, ly, lx + rx - 2, ly, dark(c, 0.3)); };
    [[0, 0, "#2f7a3a"], [-8, 4, "#3a8a44"], [8, 4, "#2a6a34"], [-4, -7, "#46a050"], [5, -6, "#3a8a44"]].forEach(([dx, dy, c], i) => leaf(cx + (dx as number), Math.max(top, by - 8 + (dy as number) - (i % 2) * (h > 40 ? 14 : 3)), 7, 4.5, c as string));
    g.ell(cx, top + 2, 5, 4, "#58b862"); void n;
  }
  g.outline(INK); g.ell(w * TS / 2, h - 2, w * TS / 2 - 3, 2.5, "#0000004d");
};
const gondola: Painter = (g, w, h, { id, R }) => {
  const th = THEMES[id] ?? THEMES.casa!;
  g.r(1, 12, w - 2, 17, mix(th.accent, "#5a3a20", 0.55)); g.r(1, 12, w - 2, 2, light(mix(th.accent, "#5a3a20", 0.55), 0.3)); g.r(1, 27, w - 2, 2, "#2a1a10");
  g.r(1, 2, w - 2, 10, "#3a2a20"); g.r(1, 2, w - 2, 1, "#6a5040"); // topo com mercadorias
  const cols = ["#e85a4a", "#4a8ae8", "#ffd23a", "#4acf7a", "#c06aff", "#ff9a3a"];
  for (let i = 0; i < w - 6; i += 7) { const c = cols[Math.floor(R() * cols.length)]!; const hh = 6 + Math.floor(R() * 4); g.r(3 + i, 11 - hh, 6, hh, c); g.r(3 + i, 11 - hh, 6, 1, light(c, 0.4)); g.r(8 + i, 11 - hh, 1, hh, dark(c, 0.25)); }
  for (let i = 0; i < w - 6; i += 8) { const c = cols[Math.floor(R() * cols.length)]!; g.r(3 + i, 16, 6, 8, c); g.r(3 + i, 16, 6, 1, light(c, 0.4)); g.r(3 + i, 26, 6, 1, "#fff6"); }
  g.r(2, 25, w - 4, 1, "#f4efe0"); for (let i = 4; i < w - 4; i += 9) g.r(i, 26, 5, 1, "#ffd23a");
  g.outline(INK); shadowBox(g, 0, 0, w - 4, h - 4);
};
const counter: Painter = (g, w, h, { id }) => {
  const th = THEMES[id] ?? THEMES.casa!, top = id === "procon" ? "#d8d2c2" : id === "eletro" ? "#4a5560" : id === "mega" ? "#ffd23a" : "#d8b070", front = id === "procon" ? "#33406a" : id === "eletro" ? "#232b36" : id === "mega" ? "#b0387e" : mix(th.accent, "#6a4a2a", 0.5);
  g.r(0, 6, w - 2, 10, top); g.r(0, 6, w - 2, 1, light(top, 0.4)); g.r(0, 15, w - 2, 1, dark(top, 0.3)); g.r(0, 16, w - 2, 13, front); g.r(0, 16, w - 2, 1, light(front, 0.25));
  for (let i = 3; i < w - 6; i += 14) { g.r(i, 19, 11, 8, dark(front, 0.18)); g.r(i, 19, 11, 1, light(front, 0.2)); g.r(i + 4, 22, 3, 2, "#e8c868"); }
  g.r(0, 28, w - 2, 2, dark(front, 0.4));
  if (id === "procon") { g.r(w / 2 - 14, 7, 28, 6, "#1d2744"); txt(g, "ATENDIMENTO", w / 2, 10, 4, "#e8e0c0"); g.r(8, 3, 10, 6, "#f4efe0"); g.r(8, 3, 10, 1, "#fff"); g.r(10, 5, 6, 1, "#8a8a98"); g.r(w - 18, 4, 4, 6, "#c9a23a"); g.r(w - 26, 6, 5, 3, "#d8d8e0"); }
  else { g.slab(w - 26, 0, 16, 10, "#3a4250", 0.3); g.r(w - 24, 2, 12, 4, "#7af09a"); g.r(w - 24, 7, 12, 2, "#cfd6dd"); g.r(8, 3, 8, 7, "#f4efe0"); g.r(8, 3, 8, 1, "#fff"); g.r(10, 6, 4, 1, "#d6382f"); g.ell(32, 8, 3, 2, "#ffd23a"); g.r(28, 4, 8, 2, "#d6382f"); g.r(38, 5, 8, 4, "#e8c868"); g.r(38, 5, 8, 1, "#fff4c8"); }
  g.outline(INK); shadowBox(g, 0, 0, w - 4, h - 4);
};
const bench: Painter = (g, w, h) => {
  g.r(2, 6, w - 6, 8, "#33508a"); g.r(2, 6, w - 6, 2, "#5a78b8"); g.r(2, 13, w - 6, 3, "#223a68"); g.r(1, 17, w - 4, 3, "#8a5a33"); g.r(1, 17, w - 4, 1, "#b0784a");
  g.r(3, 20, 3, 9, "#4a4a58"); g.r(w - 10, 20, 3, 9, "#4a4a58"); g.r(3, 26, w - 12, 2, "#3a3a46");
  g.r(2, 1, w - 6, 5, "#6b4423"); g.r(2, 1, w - 6, 1, "#8a5a33");
  g.outline(INK); shadowBox(g, 0, 0, w - 4, h - 4);
};
const shelf: Painter = (g, w, h, { id, prods, n }) => {
  const th = THEMES[id] ?? THEMES.casa!, wood = id === "eletro" ? "#2a3340" : id === "mega" ? "#7a2a6a" : id === "procon" ? "#33406a" : "#8a5a33";
  g.r(1, 0, w - 2, h - 3, dark(wood, 0.4)); g.r(1, 0, w - 2, 3, light(wood, 0.25)); g.r(1, 0, 3, h - 3, wood); g.r(w - 4, 0, 3, h - 3, wood);
  const tiers = [4, 24, 44];
  tiers.forEach((ty, i) => { g.r(1, ty + 17, w - 2, 3, wood); g.r(1, ty + 17, w - 2, 1, light(wood, 0.3)); g.r(3, ty + 20, w - 6, 1, "#00000055");
    if (i < 2) for (let k = 0; k < 3; k++) { const gid = ["cad", "lapis", "livro", "glit", "chav", "fone"][(n * 2 + i * 3 + k) % 6]!; if (!prods[n - 1] || i !== 1 || k !== 1) putIcon(g, gid, 5 + k * 19, ty - 1, 1); } });
  const pid = prods[n - 1];
  // produto da missão, grande e em destaque, na prateleira do meio
  g.r(w / 2 - 15, 20, 30, 2, "#00000033");
  if (pid !== undefined) { g.x.fillStyle = "#ffffff18"; g.r(w / 2 - 14, 22, 28, 20, "#ffffff1c"); putIcon(g, pid, w / 2 - 14, 22, 1.5); }
  else putIcon(g, "enfeite", w / 2 - 14, 22, 1.5);
  g.r(w / 2 - 11, 51, 22, 7, "#f4efe0"); g.r(w / 2 - 11, 51, 22, 1, "#fff"); g.r(w / 2 - 10, 58, 20, 1, "#8a8478"); txt(g, "R$", w / 2 - 5, 55, 4, "#d6382f"); g.r(w / 2 - 1, 54, 8, 2, "#2a2a30");
  void th;
  g.outline(INK); shadowBox(g, 0, 0, w - 4, h - 4);
};

const PAINT: Record<string, Painter> = { b: bed, P: pc, v: tv, o: (g, w, h, c) => (c.id === "procon" ? bench(g, w, h, c) : sofa(g, w, h, c)), c: pig, t: plant, p: plant, S: gondola, C: counter, 1: shelf, 2: shelf, 3: shelf, 4: shelf };

/* ---------------- cena completa ---------------- */
interface Decor { x: number; k: string; t?: string }
const WALL_DECOR: Record<string, Decor[]> = {
  casa: [{ x: 2, k: "window" }, { x: 3, k: "window" }, { x: 7, k: "frame" }, { x: 9, k: "window" }, { x: 10, k: "window" }, { x: 13, k: "clock" }],
  estrela: [{ x: 2, k: "poster", t: "#ff6a8a" }, { x: 5, k: "poster", t: "#4ad0ff" }, { x: 8, k: "star" }, { x: 11, k: "poster", t: "#ffd23a" }, { x: 14, k: "clock" }],
  bairro: [{ x: 2, k: "sign", t: "FRIOS" }, { x: 5, k: "poster", t: "#ffd23a" }, { x: 8, k: "window" }, { x: 9, k: "window" }, { x: 12, k: "sign", t: "PÃES" }],
  mega: [{ x: 2, k: "banner", t: "LEVE 5" }, { x: 4, k: "banner", t: "PAGUE 4" }, { x: 7, k: "neon", t: "MEGA!" }, { x: 10, k: "banner", t: "-70%*" }, { x: 12, k: "banner", t: "SÓ HOJE" }],
  livraria: [{ x: 1, k: "books" }, { x: 2, k: "books" }, { x: 3, k: "books" }, { x: 4, k: "books" }, { x: 5, k: "books" }, { x: 6, k: "books" }, { x: 7, k: "books" }, { x: 8, k: "books" }, { x: 9, k: "books" }, { x: 10, k: "books" }, { x: 11, k: "books" }, { x: 12, k: "books" }, { x: 13, k: "books" }, { x: 14, k: "books" }],
  eletro: [{ x: 1, k: "screen" }, { x: 3, k: "screen" }, { x: 5, k: "screen" }, { x: 8, k: "neon", t: "TECH" }, { x: 11, k: "screen" }, { x: 13, k: "screen" }],
  procon: [{ x: 2, k: "frame" }, { x: 4, k: "flag" }, { x: 7, k: "scale" }, { x: 10, k: "flag" }, { x: 12, k: "frame" }],
};
function decorate(g: Gfx, id: string, d: Decor, R: () => number) {
  const x = d.x * TS, y = 0;
  switch (d.k) {
    case "window": g.r(x + 1, y + 4, 30, 21, "#4a3020"); g.r(x + 3, y + 6, 26, 17, "#ff9a5a"); g.r(x + 3, y + 6, 26, 8, "#ffc27a"); g.r(x + 3, y + 14, 26, 9, "#d6704a"); g.ell(x + 22, y + 12, 4, 4, "#fff0b0"); g.r(x + 15, y + 6, 2, 17, "#4a3020"); g.r(x + 3, y + 14, 26, 1, "#4a3020"); g.r(x - 1, y + 22, 34, 3, "#6a4630"); g.r(x + 1, y + 4, 4, 18, "#c25a6a"); g.r(x + 27, y + 4, 4, 18, "#c25a6a"); g.r(x + 1, y + 4, 30, 2, "#8a3a4a"); break;
    case "frame": g.r(x + 6, y + 6, 20, 16, "#5a3a20"); g.r(x + 8, y + 8, 16, 12, "#7aa8c8"); g.r(x + 8, y + 15, 16, 5, "#5a8a4a"); g.ell(x + 20, y + 11, 2, 2, "#ffe07a"); g.r(x + 6, y + 6, 20, 1, "#8a5a3a"); break;
    case "clock": g.ell(x + 16, y + 12, 8, 8, "#3a2a20"); g.ell(x + 16, y + 12, 6.5, 6.5, "#f4efe0"); g.r(x + 16, y + 8, 1, 5, "#222"); g.r(x + 16, y + 12, 4, 1, "#222"); g.p(x + 16, y + 12, "#d6382f"); break;
    case "poster": g.r(x + 5, y + 5, 22, 18, "#f4efe0"); g.r(x + 7, y + 7, 18, 10, d.t ?? "#f66"); g.line(x + 9, y + 15, x + 15, y + 9, "#fff"); g.line(x + 15, y + 9, x + 19, y + 13, "#fff"); g.r(x + 8, y + 19, 12, 1, "#8a8478"); g.r(x + 8, y + 21, 8, 1, "#8a8478"); g.p(x + 5, y + 5, "#d6382f"); g.p(x + 26, y + 5, "#d6382f"); break;
    case "star": g.ell(x + 16, y + 13, 9, 9, "#ffd23a"); g.ell(x + 16, y + 13, 6, 6, "#fff2a0"); [0, 1, 2, 3, 4].forEach((k) => { const a = -Math.PI / 2 + k * 1.2566; g.line(x + 16, y + 13, Math.round(x + 16 + Math.cos(a) * 12), Math.round(y + 13 + Math.sin(a) * 12), "#ffd23a"); }); break;
    case "sign": g.r(x + 3, y + 7, 26, 13, "#3a2a1a"); g.r(x + 4, y + 8, 24, 11, "#4f9a56"); txt(g, d.t ?? "", x + 16, y + 14, 5, "#fff6d0"); g.r(x + 8, y + 3, 1, 5, "#222"); g.r(x + 23, y + 3, 1, 5, "#222"); break;
    case "banner": g.r(x + 1, y + 5, 30, 17, "#d6382f"); g.r(x + 1, y + 5, 30, 2, "#ff6a5a"); for (let i = 0; i < 6; i++) g.r(x + 3 + i * 5, y + 20, 3, 2, "#ffee55"); txt(g, d.t ?? "", x + 16, y + 13, d.t && d.t.length > 6 ? 4 : 5, "#fff6c8", "#7a1010"); break;
    case "neon": g.r(x + 1, y + 5, 30, 16, "#14081e"); g.r(x + 1, y + 5, 30, 1, "#ff3d9a"); g.r(x + 1, y + 20, 30, 1, "#ff3d9a"); txt(g, d.t ?? "", x + 16, y + 13, 6, id === "eletro" ? "#5df2f2" : "#ffe35a", id === "eletro" ? "#1aa0a8" : "#ff3d9a"); break;
    case "books": { const cols = ["#8a2a3a", "#2f5aa8", "#d8b45a", "#3a8a5a", "#6a3a8a", "#c0623a", "#e8e0c8", "#2a3a5a"]; g.r(x, y + 3, TS, 22, "#2a1a10"); for (let r = 0; r < 2; r++) { let bx = x + 1; while (bx < x + 30) { const bw = 2 + Math.floor(R() * 3), bh = 7 + Math.floor(R() * 3); g.r(bx, y + 4 + r * 11 + (9 - bh), bw, bh, cols[Math.floor(R() * cols.length)]!); g.p(bx, y + 4 + r * 11 + (9 - bh), "#fff5"); bx += bw + (R() < 0.15 ? 2 : 0); } g.r(x, y + 13 + r * 11, TS, 2, "#6a4630"); } break; }
    case "screen": g.slab(x + 2, y + 5, 28, 17, "#10151d", 0.2); g.r(x + 4, y + 7, 24, 13, "#0a2a44"); g.r(x + 5, y + 8, 22, 5, "#3bd6e8"); g.r(x + 5, y + 14, 10, 5, "#ff3d9a"); g.r(x + 17, y + 14, 10, 5, "#ffd23a"); g.r(x + 6, y + 9, 8, 1, "#d8fcff"); break;
    case "flag": g.r(x + 15, y + 4, 2, 20, "#c9a23a"); g.r(x + 3, y + 6, 26, 15, "#2f9d4d"); g.line(x + 16, y + 7, x + 6, y + 13, "#ffd23a"); g.line(x + 16, y + 7, x + 26, y + 13, "#ffd23a"); g.line(x + 6, y + 13, x + 16, y + 20, "#ffd23a"); g.line(x + 26, y + 13, x + 16, y + 20, "#ffd23a"); g.r(x + 16, y + 8, 1, 11, "#ffd23a"); g.ell(x + 16, y + 13, 5, 5, "#2f5fb0"); g.r(x + 12, y + 12, 8, 1, "#fff"); break;
    case "scale": g.ell(x + 16, y + 13, 12, 10, "#2a3560"); g.ell(x + 16, y + 13, 10, 8, "#e8e0c0"); g.r(x + 15, y + 6, 2, 14, "#3a3a50"); g.r(x + 6, y + 8, 20, 2, "#3a3a50"); g.r(x + 6, y + 10, 1, 4, "#3a3a50"); g.r(x + 25, y + 10, 1, 4, "#3a3a50"); g.r(x + 3, y + 14, 7, 2, "#c9a23a"); g.r(x + 22, y + 14, 7, 2, "#c9a23a"); g.r(x + 11, y + 20, 10, 2, "#3a3a50"); break;
  }
}

/** pinta uma cena inteira. rows = mapa de caracteres; prods = id do produto de cada prateleira 1–4. */
export function renderRoom(id: string, rows: string[], prods: (string | undefined)[]): RoomArt {
  const th = THEMES[id] ?? THEMES.casa!;
  const R = rng(id.length * 977 + id.charCodeAt(0));
  const g = new Gfx(W * TS, H * TS), lt = new Gfx(W * TS, H * TS);
  const solid = (x: number, y: number) => rows[y]?.[x] === "#";
  const objects: RoomArt["objects"] = [];

  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const c = rows[ty]![tx]!, x = tx * TS, y = ty * TS;
    if (c === "#" || c === "E") continue;
    // quarto da Júlia tem piso diferente (tapete roxo), o restante segue o tema
    floorTile(g, th, x, y, tx, ty, R);
  }
  // tapetes e faixas de piso (não bloqueiam a passagem; só decoram)
  const rug = (x0: number, y0: number, w: number, h: number, a: string, b: string, kind: "persian" | "runner" | "round") => {
    const x = x0 * TS, y = y0 * TS, ww = w * TS, hh = h * TS;
    if (kind === "round") { g.ell(x + ww / 2, y + hh / 2, ww / 2 - 2, hh / 2 - 2, dark(a, 0.3)); g.ell(x + ww / 2, y + hh / 2, ww / 2 - 4, hh / 2 - 4, a); g.ell(x + ww / 2, y + hh / 2, ww / 2 - 10, hh / 2 - 8, b); g.ell(x + ww / 2, y + hh / 2, ww / 2 - 16, hh / 2 - 12, a); return; }
    g.r(x + 2, y + 2, ww - 4, hh - 4, dark(a, 0.35)); g.r(x + 4, y + 4, ww - 8, hh - 8, a); g.r(x + 8, y + 8, ww - 16, hh - 16, b); g.r(x + 10, y + 10, ww - 20, hh - 20, a);
    for (let i = 14; i < ww - 14; i += 8) for (let j = 14; j < hh - 14; j += 8) { g.r(x + i, y + j, 3, 3, b); g.p(x + i + 1, y + j + 1, light(b, 0.4)); }
    for (let i = 2; i < ww - 2; i += 4) { g.p(x + i, y + 1, "#e8dcc0"); g.p(x + i, y + hh - 2, "#e8dcc0"); }
    if (kind === "runner") g.r(x + 4, y + 4, 2, hh - 8, "#ffd23a88"), g.r(x + ww - 6, y + 4, 2, hh - 8, "#ffd23a88");
  };
  if (id === "casa") { rug(8, 2, 6, 4, "#8a3a4a", "#d8b45a", "persian"); rug(1, 4, 4, 3, "#6a4aa0", "#c8b0f0", "round"); }
  if (id === "livraria") rug(5, 6, 6, 3, "#7a2a3a", "#d8b45a", "persian");
  if (id === "mega") rug(7, 3, 2, 7, "#b0182e", "#ffd23a", "runner");
  if (id === "procon") rug(7, 3, 2, 7, "#33508a", "#c9cfdc", "runner");
  if (id === "estrela") rug(5, 7, 6, 2, "#3a6ac0", "#ffd23a", "persian");
  if (id === "bairro") rug(6, 8, 4, 2, "#4f9a56", "#efe6c8", "persian");
  if (id === "eletro") { for (let ty = 3; ty < 10; ty += 3) g.r(TS, ty * TS + 15, 14 * TS, 2, "#3bf0f044"); g.r(7 * TS + 8, 3 * TS, 2, 7 * TS, "#3bf0f044"); g.r(9 * TS - 10, 3 * TS, 2, 7 * TS, "#3bf0f044"); }
  // desgaste/sujeira no piso
  for (let i = 0; i < 24; i++) { const tx = 1 + Math.floor(R() * 14), ty = 1 + Math.floor(R() * 9); if (rows[ty]![tx] === ".") g.r(tx * TS + Math.floor(R() * 26), ty * TS + Math.floor(R() * 26), 2 + Math.floor(R() * 3), 1, dark(th.fa, 0.16)); }
  // capacho junto à porta de saída
  const ex = rows[H - 1]!.indexOf("E");
  g.r(ex * TS + 3, (H - 1) * TS - 20, 26, 18, "#5a2a2a"); g.r(ex * TS + 5, (H - 1) * TS - 18, 22, 14, "#7a3a3a"); g.r(ex * TS + 5, (H - 1) * TS - 18, 22, 1, "#a05a5a"); txt(g, "SAÍDA", ex * TS + 16, (H - 1) * TS - 11, 4, "#f4efe0");

  // paredes
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const c = rows[ty]![tx]!, x = tx * TS, y = ty * TS;
    if (c === "#") {
      const below = solid(tx, ty + 1) || ty + 1 >= H;
      if (!below) wallFace(g, th, x, y, tx, id, R);
      else wallCap(g, th, x, y, { u: !solid(tx, ty - 1) && ty > 0, d: !solid(tx, ty + 1) && ty + 1 < H, l: !solid(tx - 1, ty) && tx > 0, r: !solid(tx + 1, ty) && tx + 1 < W });
    } else if (c === "E") {
      wallCap(g, th, x, y, { u: true, d: false, l: false, r: false });
      g.r(x + 3, y + 3, 26, 29, "#2a1a10"); g.r(x + 5, y + 5, 22, 27, "#f2e0a0"); g.r(x + 5, y + 5, 22, 6, "#fff6d0"); g.r(x + 7, y + 8, 18, 24, "#ffe9a8"); // luz da rua entrando
      g.r(x + 3, y + 3, 26, 2, "#6a4630"); g.r(x + 3, y + 3, 3, 29, "#6a4630"); g.r(x + 26, y + 3, 3, 29, "#6a4630");
      g.r(x + 8, y + 18, 3, 3, "#d8b45a");
    }
  }
  // decoração de parede (apenas na parede do fundo; não interativa)
  (WALL_DECOR[id] ?? []).forEach((d) => { if (rows[0]![d.x] === "#") decorate(g, id, d, R); });
  if (id === "casa") { // porta do quarto: batente na divisória
    g.r(5 * TS + 6, 4 * TS + 4, 20, 22, "#6a4630"); g.r(5 * TS + 8, 4 * TS + 6, 16, 18, th.wall); g.r(5 * TS + 10, 4 * TS + 8, 12, 14, "#8a5a33"); g.r(5 * TS + 10, 4 * TS + 8, 12, 1, "#b0784a");
    g.r(0, 7 * TS + 24, 5 * TS, 8, th.base);
  }
  // luminárias penduradas / janelas de luz
  lt.x.save();
  const grad = lt.x.createRadialGradient(W * TS / 2, H * TS / 2, 60, W * TS / 2, H * TS / 2, W * TS * 0.62);
  grad.addColorStop(0, `rgba(${th.amb},.10)`); grad.addColorStop(1, "rgba(8,4,20,.42)");
  lt.x.fillStyle = grad; lt.x.fillRect(0, 0, W * TS, H * TS);
  // sombra de contato das paredes sobre o piso
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    if (rows[ty]![tx] === "#" || rows[ty]![tx] === "E") continue;
    const x = tx * TS, y = ty * TS;
    lt.x.fillStyle = "rgba(10,4,20,.30)";
    if (solid(tx, ty - 1)) lt.x.fillRect(x, y, TS, 7);
    if (solid(tx - 1, ty)) lt.x.fillRect(x, y, 5, TS);
    if (solid(tx + 1, ty)) lt.x.fillRect(x + TS - 3, y, 3, TS);
    if (solid(tx, ty + 1)) lt.x.fillRect(x, y + TS - 3, TS, 3);
  }
  const pool = (cx: number, cy: number, r: number, a: number, col: string) => { const rg = lt.x.createRadialGradient(cx, cy, 2, cx, cy, r); rg.addColorStop(0, `rgba(${col},${a})`); rg.addColorStop(1, `rgba(${col},0)`); lt.x.fillStyle = rg; lt.x.fillRect(cx - r, cy - r, r * 2, r * 2); };
  if (id === "casa") { (WALL_DECOR.casa ?? []).filter((d) => d.k === "window").forEach((d) => { lt.x.fillStyle = "rgba(255,170,90,.13)"; lt.x.beginPath(); lt.x.moveTo(d.x * TS + 4, 32); lt.x.lineTo(d.x * TS + 28, 32); lt.x.lineTo(d.x * TS + 78, 150); lt.x.lineTo(d.x * TS + 30, 150); lt.x.closePath(); lt.x.fill(); }); pool(3 * TS + 16, 3 * TS + 8, 60, 0.18, "255,140,80"); }
  else pool(W * TS / 2, 3 * TS, 190, 0.12, th.amb);
  pool(ex * TS + 16, (H - 1) * TS, 70, 0.28, "255,230,150");
  lt.x.restore();

  // móveis agrupados (blocos adjacentes da mesma letra viram um único móvel)
  const seen = new Set<string>(), FURN = "PbvoctpSC1234";
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const c = rows[ty]![tx]!;
    if (!FURN.includes(c) || seen.has(`${tx},${ty}`)) continue;
    let x0 = tx, x1 = tx, y0 = ty, y1 = ty; const st = [[tx, ty]]; seen.add(`${tx},${ty}`);
    while (st.length) {
      const [cx, cy] = st.pop()!;
      x0 = Math.min(x0, cx!); x1 = Math.max(x1, cx!); y0 = Math.min(y0, cy!); y1 = Math.max(y1, cy!);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx! + dx!, ny = cy! + dy!, k = `${nx},${ny}`; if (!seen.has(k) && rows[ny]?.[nx] === c) { seen.add(k); st.push([nx, ny]); } }
    }
    const w = x1 - x0 + 1, h = y1 - y0 + 1, fg = new Gfx(w * TS, h * TS);
    const painter = PAINT[c]!; const n = c >= "1" && c <= "4" ? Number(c) : 0;
    painter(fg, w * TS, h * TS, { id, prods, n, R: rng(x0 * 31 + y0 * 7 + c.charCodeAt(0)) });
    objects.push({ key: `f${tx},${ty}`, src: fg.url(), x: x0, y: y0, w, h, z: y1 * 10 + 2 });
  }
  return { base: g.url(), light: lt.url(), objects };
}

/** porquinho Tuca para a tela de título */
export function pigArt(): string { const g = new Gfx(32, 32); pig(g, 32, 32, { id: "casa", prods: [], n: 0, R: rng(1) }); return g.url(); }
