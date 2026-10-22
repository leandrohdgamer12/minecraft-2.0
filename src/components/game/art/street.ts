/* Cidade em pixel art. Mantém exatamente a grade do jogo (26×16 tiles, 32 px de arte por tile).
 * Camada "base" = chão (grama, calçada, asfalto, marcas); "objetos" = fachadas, árvores, outdoor
 * (ordenados por profundidade em relação aos personagens); "luz" = sombras e brilhos de fim de tarde. */
import { Gfx, TS, dark, light, mix, rng } from "./gfx";

export interface BldArt { id: string; name: string; x: number; y: number; w: number; h: number; top: boolean; door: number }
export interface StreetArt {
  base: string; light: string;
  objects: { key: string; src: string; x: number; y: number; w: number; h: number; z: number }[];
}

export let STREET_W = 36, STREET_H = 26;

/* paleta da cidade: fim de tarde, cores quentes e um pouco apagadas */
const C = {
  grassA: "#74b655", grassB: "#69ab4c", grassC: "#86c866", grassD: "#4f8f3a",
  walkA: "#e6dfcc", walkLine: "#b8ae96", curb: "#f1ead6", curbD: "#9a907c",
  roadA: "#5d6272", roadB: "#565b6a", roadC: "#6a6f80", roadD: "#3f4350", paint: "#f4e6a8", white: "#f6f3ea",
  ink: "#231826",
};

/* ------------------- chão ------------------- */
function drawGround(o: { isRoad: (x: number, y: number) => boolean; isWalk: (x: number, y: number) => boolean; flowers: Set<string>; hRoads: number[]; vRoads: number[] }) {
  const { isRoad, isWalk, flowers, hRoads, vRoads } = o;
  const g = new Gfx(STREET_W * TS, STREET_H * TS);
  const R = rng(7);
  for (let ty = 0; ty < STREET_H; ty++) for (let tx = 0; tx < STREET_W; tx++) {
    const x = tx * TS, y = ty * TS;
    const road = isRoad(tx, ty), walk = !road && isWalk(tx, ty);
    if (road) {
      g.r(x, y, TS, TS, (tx + ty) % 2 ? C.roadA : C.roadB);
      g.spray(x, y, TS, TS, [C.roadC, C.roadD, C.roadB], 30, R);
    } else if (walk) {
      // calçada portuguesa: pedrinhas 4×4 com faixas diagonais escuras
      g.r(x, y, TS, TS, C.walkA);
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
        const k = (i + j + tx * 3 + ty * 5) % 6 === 0, c = k ? "#6f6862" : R() < 0.5 ? "#efe9d8" : "#e3dcc8";
        g.r(x + i * 4, y + j * 4, 4, 4, c); g.r(x + i * 4 + 3, y + j * 4, 1, 4, dark(c, 0.1)); g.r(x + i * 4, y + j * 4 + 3, 4, 1, dark(c, 0.1));
        if (!k) g.p(x + i * 4, y + j * 4, "#fff8");
      }
    } else {
      g.r(x, y, TS, TS, (tx * 7 + ty * 3) % 5 ? C.grassA : C.grassB);
      g.spray(x, y, TS, TS, [C.grassB, C.grassC, C.grassD, C.grassA], 60, R);
      for (let i = 0; i < 4; i++) { const px = x + 2 + Math.floor(R() * 28), py = y + 4 + Math.floor(R() * 24); g.p(px, py, C.grassD); g.p(px, py - 1, C.grassC); g.p(px + 1, py - 2, "#a3dd82"); }
    }
  }
  // meio-fio
  for (let ty = 0; ty < STREET_H; ty++) for (let tx = 0; tx < STREET_W; tx++) {
    const x = tx * TS, y = ty * TS;
    if (!isRoad(tx, ty)) continue;
    if (!isRoad(tx, ty - 1) && isWalk(tx, ty - 1)) { g.r(x, y, TS, 3, C.curb); g.r(x, y + 3, TS, 2, C.curbD); g.r(x, y + 5, TS, 2, C.roadD); }
    if (!isRoad(tx, ty + 1) && isWalk(tx, ty + 1)) { g.r(x, y + TS - 7, TS, 2, C.roadD); g.r(x, y + TS - 5, TS, 2, C.curbD); g.r(x, y + TS - 3, TS, 3, C.curb); }
    if (!isRoad(tx - 1, ty) && isWalk(tx - 1, ty)) { g.r(x, y, 3, TS, C.curb); g.r(x + 3, y, 2, TS, C.curbD); g.r(x + 5, y, 2, TS, C.roadD); }
    if (!isRoad(tx + 1, ty) && isWalk(tx + 1, ty)) { g.r(x + TS - 7, y, 2, TS, C.roadD); g.r(x + TS - 5, y, 2, TS, C.curbD); g.r(x + TS - 3, y, 3, TS, C.curb); }
  }
  // faixas centrais tracejadas
  const nearH = (ty: number) => hRoads.some((a) => ty >= a - 1 && ty <= a + 2), nearV = (tx: number) => vRoads.some((c) => tx >= c - 1 && tx <= c + 2);
  hRoads.forEach((a) => { for (let tx = 0; tx < STREET_W; tx += 2) if (!nearV(tx)) { g.r(tx * TS + 4, (a + 1) * TS - 2, 24, 4, C.paint); g.r(tx * TS + 4, (a + 1) * TS + 2, 24, 1, dark(C.paint, 0.35)); } });
  vRoads.forEach((c) => { for (let ty = 0; ty < STREET_H; ty += 2) if (!nearH(ty)) { g.r((c + 1) * TS - 2, ty * TS + 4, 4, 24, C.paint); g.r((c + 1) * TS + 2, ty * TS + 4, 1, 24, dark(C.paint, 0.35)); } });
  // faixas de pedestre
  const zebra = (x0: number, y0: number, w: number, h: number, vertical: boolean) => {
    for (let i = 0; i < (vertical ? h : w) / 5; i++) { const off = i * 10; if (vertical) g.r(x0, y0 + off + 2, w, 5, C.white); else g.r(x0 + off + 2, y0, 5, h, C.white); }
    g.spray(x0, y0, w, h, [C.roadA, C.roadB], 50, R);
  };
  hRoads.forEach((a) => vRoads.forEach((c) => {
    zebra((c - 2) * TS + 4, a * TS + 2, 24, 2 * TS - 4, true); zebra((c + 3) * TS + 4, a * TS + 2, 24, 2 * TS - 4, true);
    zebra(c * TS + 2, (a - 2) * TS + 4, 2 * TS - 4, 24, false); zebra(c * TS + 2, (a + 3) * TS + 4, 2 * TS - 4, 24, false);
  }));
  // bueiros, ralos, rachaduras, papéis e folhas
  const manhole = (cx: number, cy: number) => { g.ell(cx, cy, 8, 5.5, "#34373f"); g.ell(cx, cy, 7, 4.5, "#575b68"); for (let k = -3; k <= 3; k += 2) g.r(cx - 5, cy + k, 10, 1, "#3c3f4a"); g.r(cx - 6, cy - 4, 12, 1, "#7a7e8c"); };
  hRoads.forEach((a, k) => [5, 18, 30, 42, 54].forEach((tx, j) => { const ty = a + ((j + k) % 2); if (isRoad(tx + k, ty)) manhole((tx + k) * TS + 14 + ((tx * 5) % 9), ty * TS + 16); }));
  const crack = (x: number, y: number, n: number, c: string) => { let cx = x, cy = y; for (let i = 0; i < n; i++) { g.p(cx, cy, c); cx += R() < 0.5 ? 1 : 0; cy += R() < 0.6 ? 1 : 0; if (R() < 0.3) cx -= 1; } };
  for (let i = 0; i < 160; i++) { const tx = Math.floor(R() * STREET_W), ty = Math.floor(R() * STREET_H); if (isRoad(tx, ty)) crack(tx * TS + 4 + Math.floor(R() * 22), ty * TS + 4 + Math.floor(R() * 20), 10 + Math.floor(R() * 12), "#2f323d"); else if (isWalk(tx, ty)) crack(tx * TS + 4 + Math.floor(R() * 22), ty * TS + 4 + Math.floor(R() * 20), 6 + Math.floor(R() * 8), "#8a8070"); }
  for (let i = 0; i < 90; i++) { const tx = Math.floor(R() * STREET_W), ty = Math.floor(R() * STREET_H); if (isWalk(tx, ty)) { g.r(tx * TS + 6 + Math.floor(R() * 18), ty * TS + 6 + Math.floor(R() * 18), 5, 4, "#f4efe0"); g.r(tx * TS + 7, ty * TS + 7, 3, 1, i % 2 ? "#d6382f" : "#3a8ae8"); } }
  for (let i = 0; i < 120; i++) { const tx = Math.floor(R() * STREET_W), ty = Math.floor(R() * STREET_H); if (isWalk(tx, ty) || isRoad(tx, ty)) g.r(tx * TS + Math.floor(R() * 28), ty * TS + Math.floor(R() * 28), 2, 1, ["#c9852c", "#a8641c", "#e0a23a"][i % 3]!); }
  // flores nos canteiros
  flowers.forEach((k) => {
    const [fx, fy] = k.split(",").map(Number) as [number, number];
    const cols = [["#f4d03f", "#e67e22"], ["#f06292", "#fce4ec"], ["#fff", "#f4d03f"], ["#9575cd", "#ede7f6"]];
    for (let i = 0; i < 7; i++) {
      const px = fx * TS + 3 + Math.floor(R() * 26), py = fy * TS + 5 + Math.floor(R() * 22), cc = cols[(fx + fy + i) % cols.length]!;
      g.p(px, py + 2, "#2d5a28"); g.p(px, py + 1, "#2d5a28"); g.r(px - 1, py - 1, 3, 3, cc[1]!); g.p(px, py, cc[0]!);
    }
  });
  return g;
}

/* ------------------- árvores e elementos solitários (mesmos tiles sólidos das árvores) ------------------- */
function drawTree(variant: number, seed: number) {
  const g = new Gfx(TS, TS * 2), R = rng(seed);
  if (variant === 0) { // carvalho
    g.ell(16, 58, 12, 4, "#00000044");
    g.r(13, 40, 6, 20, "#6a4326"); g.r(13, 40, 2, 20, "#8a5a34"); g.r(18, 40, 1, 20, "#4a2c18"); g.r(11, 58, 10, 2, "#4a2c18");
    const blobs: [number, number, number, number, string][] = [[16, 22, 15, 16, "#2f6a35"], [8, 28, 9, 9, "#2a5e30"], [24, 28, 9, 9, "#2a5e30"], [16, 14, 11, 9, "#3a7d3e"], [11, 20, 8, 7, "#46913f"], [20, 18, 8, 6, "#4a9a44"]];
    blobs.forEach(([cx, cy, rx, ry, c]) => g.ell(cx, cy, rx, ry, c));
    for (let i = 0; i < 90; i++) g.p(2 + R() * 28, 4 + R() * 38, ["#58aa4c", "#2a5e30", "#3f8a3d", "#215028"][Math.floor(R() * 4)]!);
    g.ell(12, 12, 4, 2.5, "#6bc05a"); g.dither(8, 34, 18, 4, "#1d4a26", 0);
  } else if (variant === 1) { // pinheiro
    g.ell(16, 58, 10, 3.5, "#00000044"); g.r(14, 48, 4, 12, "#5a3a20"); g.r(14, 48, 1, 12, "#7a5230");
    [[0, 14, 28, "#245a36"], [10, 10, 24, "#2c6a3e"], [20, 7, 20, "#357a46"], [30, 5, 14, "#3f8a50"]].forEach(([y, h, w, c], i) => {
      for (let k = 0; k < (h as number); k++) { const ww = Math.round(((k + 3) / (h as number)) * (w as number) / 2); g.r(16 - ww, (y as number) + (i * 0) + 4 + k + (i * 2), ww * 2, 1, c as string); }
    });
    g.spray(4, 6, 24, 44, ["#4e9a60", "#1c4a2c"], 40, R);
  } else { // arbusto grande com flores
    g.ell(16, 58, 13, 4, "#00000044");
    g.ell(10, 50, 10, 9, "#2f6a35"); g.ell(22, 50, 10, 9, "#2a5e30"); g.ell(16, 45, 11, 9, "#3a7d3e");
    g.spray(2, 36, 28, 24, ["#58aa4c", "#215028", "#46913f"], 70, R);
    for (let i = 0; i < 9; i++) { const px = 5 + Math.floor(R() * 22), py = 40 + Math.floor(R() * 16); g.r(px, py, 2, 2, i % 2 ? "#f06292" : "#ffd166"); }
  }
  g.outline("#1a1220");
  return g;
}

function drawTreeSmall(variant: number, seed: number) {
  const g = new Gfx(TS, TS), R = rng(seed);
  g.ell(16, 29, 10, 3, "#00000044");
  if (variant === 1) { [[4, 7, "#245a36"], [9, 11, "#2c6a3e"], [14, 15, "#357a46"]].forEach(([y, w, c]) => { for (let k = 0; k < 9; k++) { const ww = Math.round(((k + 2) / 10) * (w as number)); g.r(16 - ww, (y as number) + k, ww * 2, 1, c as string); } }); g.r(14, 22, 4, 7, "#5a3a20"); }
  else { g.r(14, 20, 4, 9, "#6a4326"); g.r(14, 20, 1, 9, "#8a5a34"); g.ell(16, 12, 12, 10, "#2f6a35"); g.ell(11, 14, 7, 6, "#2a5e30"); g.ell(21, 14, 7, 6, "#3a7d3e"); g.ell(14, 8, 6, 4, "#46913f"); g.spray(4, 2, 24, 20, ["#58aa4c", "#215028"], 50, R); }
  g.outline("#1a1220");
  return g;
}

function drawLamp() {
  const g = new Gfx(TS, TS * 2);
  g.ell(16, 58, 9, 3.5, "#00000044");
  g.r(15, 14, 3, 44, "#2c3140"); g.r(15, 14, 1, 44, "#4a5268"); g.r(12, 54, 9, 5, "#2c3140"); g.r(13, 52, 7, 2, "#4a5268");
  g.r(10, 8, 13, 3, "#2c3140"); g.r(11, 11, 11, 7, "#ffe9a8"); g.r(12, 12, 9, 5, "#fff6d0"); g.r(9, 6, 15, 3, "#3a4054"); g.r(14, 3, 5, 3, "#3a4054");
  g.outline("#1a1220");
  return g;
}
function drawBin() {
  const g = new Gfx(TS, TS * 2);
  g.ell(16, 56, 11, 4, "#00000044");
  g.slab(8, 40, 16, 18, "#4a6a52", 0.28); g.r(7, 38, 18, 4, "#3a5a42"); g.r(7, 38, 18, 1, "#7aa285"); for (let k = 0; k < 4; k++) g.r(10 + k * 4, 44, 1, 12, "#34503c");
  g.r(13, 47, 6, 5, "#e8e0cc"); g.p(16, 49, "#4a6a52"); g.p(15, 50, "#4a6a52"); g.p(17, 50, "#4a6a52");
  g.r(9, 36, 14, 2, "#d9d2bd");
  g.outline("#1a1220");
  return g;
}
function drawHydrant() {
  const g = new Gfx(TS, TS * 2);
  g.ell(16, 56, 9, 3, "#00000044");
  g.slab(11, 44, 10, 14, "#c73a3a", 0.3); g.r(9, 48, 14, 4, "#d94a4a"); g.r(12, 40, 8, 5, "#c73a3a"); g.r(14, 37, 4, 3, "#a82c2c"); g.r(10, 56, 12, 3, "#8a2020");
  g.outline("#1a1220");
  return g;
}

/* ------------------- prédios ------------------- */
type Style = {
  wall: string; trim: string; roof: string; roofKind: "tile" | "flat" | "slate" | "tin" | "stone" | "neon";
  awning: [string, string]; sign: string; signText: string; neon?: boolean;
};
const STYLE: Record<string, Style> = {
  casa: { wall: "#f2c59a", trim: "#fff4dc", roof: "#c8643c", roofKind: "tile", awning: ["#e8896a", "#fff4dc"], sign: "#6a3a28", signText: "#fff0d0" },
  estrela: { wall: "#f6dc7a", trim: "#fffbe0", roof: "#3f6fb5", roofKind: "tile", awning: ["#2f5aa8", "#fffbe0"], sign: "#1f3a78", signText: "#ffe066" },
  livraria: { wall: "#8fb4e8", trim: "#f4ecd0", roof: "#4a5470", roofKind: "slate", awning: ["#b03a52", "#f4ecd0"], sign: "#3a1a2a", signText: "#f0e0b0" },
  eletro: { wall: "#7fd6cf", trim: "#e0f8f6", roof: "#7a8590", roofKind: "flat", awning: ["#2a3a4a", "#3bd6d6"], sign: "#14283a", signText: "#5df2f2", neon: true },
  bairro: { wall: "#a8dc98", trim: "#fbf3d6", roof: "#b35a2e", roofKind: "tile", awning: ["#2f8a4a", "#fbf3d6"], sign: "#3a2a1a", signText: "#fbf0c8" },
  mega: { wall: "#f08ac0", trim: "#ffe6f4", roof: "#5a3a7a", roofKind: "neon", awning: ["#ffd23a", "#e0382a"], sign: "#3a0e30", signText: "#ffe35a", neon: true },
  procon: { wall: "#e8e2d0", trim: "#fffaf0", roof: "#7a7f8e", roofKind: "stone", awning: ["#33406a", "#fffaf0"], sign: "#2a3050", signText: "#f4efe0" },
  padaria: { wall: "#f7e1b0", trim: "#fff6dc", roof: "#d8803c", roofKind: "tile", awning: ["#d8803c", "#fff6dc"], sign: "#5a3418", signText: "#fff0c0" },
  farmacia: { wall: "#e4f4ec", trim: "#ffffff", roof: "#8a9aa0", roofKind: "flat", awning: ["#2f9d6a", "#ffffff"], sign: "#1f6a48", signText: "#ffffff" },
  cafe: { wall: "#d4a87e", trim: "#f8e8d0", roof: "#8a4a30", roofKind: "tile", awning: ["#6a3a28", "#f8e8d0"], sign: "#3a2018", signText: "#f8e0b8" },
  sorvete: { wall: "#bfe8f4", trim: "#ffffff", roof: "#e86a9a", roofKind: "tile", awning: ["#f06a9a", "#ffffff"], sign: "#7a2a50", signText: "#fff0f8" },
  casaA: { wall: "#f4e0d0", trim: "#ffffff", roof: "#a8503a", roofKind: "tile", awning: ["#c8847a", "#ffffff"], sign: "#5a3a30", signText: "#fff0e0" },
  casaB: { wall: "#d6ecc8", trim: "#ffffff", roof: "#4a6a8a", roofKind: "tile", awning: ["#6a9a6a", "#ffffff"], sign: "#2f4a38", signText: "#f0fae8" },
};
const styleOf = (id: string) => STYLE[id] ?? STYLE.casaA!;

function drawRoof(g: Gfx, st: Style, x: number, y: number, w: number, h: number, id: string, R: () => number) {
  g.r(x, y, w, h, st.roof);
  if (st.roofKind === "tile") {
    for (let j = 0; j < h; j += 6) { g.r(x, y + j, w, 5, j % 12 ? dark(st.roof, 0.08) : st.roof); g.r(x, y + j + 5, w, 1, dark(st.roof, 0.35)); for (let i = (j % 12 ? 3 : 0); i < w; i += 6) g.r(x + i, y + j, 1, 5, dark(st.roof, 0.28)); }
    g.r(x, y + Math.floor(h / 2) - 2, w, 4, light(st.roof, 0.18)); g.r(x, y + Math.floor(h / 2) + 2, w, 1, dark(st.roof, 0.45));
    g.box(x + w - 28, y + 6, 10, 14, "#8a5040", dark(st.roof, 0.6)); g.r(x + w - 27, y + 6, 8, 3, "#3a2a2a"); // chaminé
    g.r(x + w - 30, y + 20, 14, 3, "#00000055");
  } else if (st.roofKind === "slate") {
    for (let j = 0; j < h; j += 5) { g.r(x, y + j, w, 4, j % 10 ? "#434b60" : "#3a4256"); g.r(x, y + j + 4, w, 1, "#252a38"); }
    g.box(x + 22, y + 10, 24, 22, "#d8c9a0", "#252a38"); g.r(x + 24, y + 12, 20, 14, "#ffd97a"); g.r(x + 33, y + 12, 2, 14, "#8a6a30"); g.r(x + 22, y + 8, 24, 3, "#7a2a3a"); // claraboia/dormer
    g.r(x + w - 40, y + h - 16, 18, 12, "#2a3140"); g.r(x + w - 38, y + h - 14, 14, 8, "#5a6a88");
  } else if (st.roofKind === "tin") {
    for (let i = 0; i < w; i += 6) { g.r(x + i, y, 5, h, i % 12 ? "#8a7a56" : "#7a6a4a"); g.r(x + i + 5, y, 1, h, "#4a3e28"); g.r(x + i, y, 1, h, "#a89868"); }
    g.box(x + 12, y + 6, 22, 14, "#a8a090", "#3a3428"); g.r(x + 14, y + 8, 18, 3, "#cfc8b8"); // caixa d'água/ar condicionado
    g.ell(x + w - 22, y + h - 14, 10, 6, "#6a5a3c");
  } else if (st.roofKind === "stone") {
    g.r(x, y, w, h, "#8a8e9c"); for (let j = 0; j < h; j += 8) g.r(x, y + j, w, 1, "#6b6f7c");
    g.r(x + 8, y + 8, w - 16, h - 12, "#7a7e8c"); g.r(x + 8, y + 8, w - 16, 2, "#a8acba");
    g.r(x + w / 2 - 1, y + 4, 2, 18, "#3a3040"); g.r(x + w / 2 + 1, y + 4, 14, 9, "#2f5fb0"); g.r(x + w / 2 + 1, y + 8, 14, 3, "#f2f2f2"); g.r(x + w / 2 + 6, y + 6, 4, 5, "#2f9d4d"); // bandeira
  } else if (st.roofKind === "neon") {
    g.r(x, y, w, h, "#3a2a4a"); g.dither(x, y, w, h, "#2e2040", 0);
    g.box(x + 16, y + 6, w - 32, h - 14, "#ffdc4a", "#2a0e24"); g.r(x + 18, y + 8, w - 36, h - 18, "#ff3d8a"); // letreiro gigante no telhado
    for (let k = 0; k < (w - 40) / 6; k++) g.r(x + 22 + k * 6, y + 9, 3, 2, k % 2 ? "#fff" : "#ffdc4a");
  } else { // flat
    g.r(x, y, w, h, st.roof); g.r(x, y, w, 3, light(st.roof, 0.3)); g.r(x, y + h - 3, w, 3, dark(st.roof, 0.3)); g.r(x, y, 3, h, light(st.roof, 0.15)); g.r(x + w - 3, y, 3, h, dark(st.roof, 0.2));
    g.spray(x + 3, y + 3, w - 6, h - 6, [dark(st.roof, 0.12), light(st.roof, 0.08)], 70, R);
    if (id === "eletro") { g.line(x + 14, y + 22, x + 14, y + 4, "#c8c8d0"); g.line(x + 8, y + 10, x + 20, y + 10, "#c8c8d0"); g.line(x + 10, y + 16, x + 18, y + 16, "#c8c8d0"); g.ell(x + w - 24, y + 18, 11, 8, "#d8dce0"); g.ell(x + w - 24, y + 18, 7, 5, "#a8b0b8"); g.p(x + w - 24, y + 18, "#f55"); }
    if (id === "estrela") { const sx = x + w / 2, sy = y + h / 2; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * 1.2566; g.line(Math.round(sx), Math.round(sy), Math.round(sx + Math.cos(a) * 14), Math.round(sy + Math.sin(a) * 14), "#ffd23a"); } g.ell(sx, sy, 5, 5, "#ffe680"); }
  }
  g.r(x, y, w, 1, dark(st.roof, 0.5)); g.r(x, y, 1, h, dark(st.roof, 0.4));
}


const AH = 9;
function layout(b: BldArt) {
  const H = b.h * TS, roofH = b.top ? (b.h >= 5 ? 64 : 48) : 32, facH = H - roofH, fy = b.top ? roofH : 0;
  if (b.top) {
    const sy = fy + 6, ay = sy + 17, wy = ay + AH + 8, wh = Math.min(30, facH - (wy - fy) - 6), dh = Math.min(facH - 6, 46);
    return { H, roofH, facH, fy, sy, ay, wy, wh, dy: H - dh, dh };
  }
  const wy = 9, wh = 28, ay = wy + wh + 4, sy = ay + AH + 7;
  return { H, roofH, facH, fy, sy, ay, wy, wh, dy: 3, dh: 38 };
}

function drawFacade(b: BldArt, st: Style): Gfx {
  const W = b.w * TS, R = rng(b.x * 31 + b.y * 17 + b.w);
  const { H, roofH, facH, fy, sy, ay, wy, wh, dy, dh } = layout(b);
  const g = new Gfx(W, H);
  const ry = b.top ? 0 : facH;
  drawRoof(g, st, 2, ry, W - 4, roofH, b.id, R);
  // parede
  g.r(2, fy, W - 4, facH, st.wall);
  const brick = ["casa", "mega", "eletro", "cafe", "casaA"].includes(b.id);
  for (let j = 0; j < facH; j += 4) { g.r(2, fy + j + 3, W - 4, 1, dark(st.wall, 0.12)); if (brick) for (let i = (j % 8 ? 0 : 4); i < W - 4; i += 8) g.r(2 + i, fy + j, 1, 3, dark(st.wall, 0.1)); }
  g.spray(2, fy, W - 4, facH, [dark(st.wall, 0.12), light(st.wall, 0.1), dark(st.wall, 0.22)], 130, R);
  // reboco descascado/manchas de umidade na base
  g.dither(2, fy + (b.top ? facH - 8 : 0), W - 4, 8, dark(st.wall, 0.16), 0);
  // cunhais e cornija
  g.r(2, fy, 5, facH, st.trim); g.r(W - 7, fy, 5, facH, st.trim); g.r(2, fy, 5, 1, "#fff8"); g.r(6, fy, 1, facH, dark(st.trim, 0.3)); g.r(W - 7, fy, 1, facH, dark(st.trim, 0.3));
  const corY = b.top ? fy : fy + facH - 4; g.r(2, corY, W - 4, 4, st.trim); g.r(2, corY + (b.top ? 4 : 0), W - 4, 1, dark(st.trim, 0.4));
  // letreiro
  const sw = Math.min(W - 24, 86), sx = Math.round((W - sw) / 2);
  g.box(sx, sy, sw, 15, st.sign, "#0e0a14"); g.r(sx + 1, sy + 1, sw - 2, 1, light(st.sign, 0.3));
  if (st.neon) { g.r(sx + 2, sy + 2, sw - 4, 1, st.signText); g.r(sx + 2, sy + 12, sw - 4, 1, st.signText); }
  // toldo listrado com babado
  const ah = AH;
  for (let i = 4; i < W - 4; i += 6) { g.r(i, ay, 3, ah, st.awning[0]); g.r(i + 3, ay, 3, ah, st.awning[1]); }
  for (let i = 4; i < W - 4; i += 6) { g.r(i, ay + ah, 3, 3, st.awning[0]); g.r(i + 3, ay + ah, 3, 2, st.awning[1]); }
  g.r(4, ay, W - 8, 1, light(st.awning[0], 0.3)); g.r(4, ay + ah + 3, W - 8, 1, "#0006");
  // vitrines laterais
  const doorX = (b.door - b.x) * TS;
  const windows: number[] = [];
  for (let wx = 8; wx + 24 <= W - 8; wx += 30) if (wx + 24 <= doorX - 2 || wx >= doorX + TS + 2) windows.push(wx);
  windows.forEach((wx, i) => {
    g.r(wx - 1, wy - 1, 26, wh + 4, "#0e0a14"); g.r(wx, wy, 24, wh, st.trim);
    g.r(wx + 2, wy + 2, 20, wh - 4, "#7fa8c4"); g.r(wx + 2, wy + 2, 20, 5, "#a8cfe6"); g.line(wx + 4, wy + wh - 6, wx + 11, wy + 3, "#d0ecfa"); g.line(wx + 10, wy + wh - 6, wx + 15, wy + 6, "#d0ecfa");
    g.r(wx + 12, wy + 2, 1, wh - 4, st.trim); g.r(wx, wy + wh, 24, 3, dark(st.trim, 0.2)); g.r(wx - 1, wy + wh + 2, 26, 1, "#0006");
    // mercadorias na vitrine, conforme a loja
    const sh = wy + wh - 8, pal = ({ estrela: ["#e8523a", "#3a8ae8", "#ffd23a"], bairro: ["#e8a23a", "#c0392b", "#3aa85a"], mega: ["#ffee55", "#ff4d9a", "#4ad0ff"], livraria: ["#8a2a3a", "#3a5a8a", "#c9a23a"], eletro: ["#2b303a", "#3bd6d6", "#ddd"], procon: ["#ece7da", "#33406a", "#c9a23a"], casa: ["#a05a3a", "#e8d8a0", "#6a8a4a"] } as Record<string, string[]>)[b.id] ?? ["#e8a23a", "#c0392b", "#3aa85a"];
    for (let k = 0; k < 3; k++) { g.r(wx + 4 + k * 6, sh + (k % 2) * 2, 4, 6 - (k % 2) * 2, pal[(k + i) % 3]!); g.r(wx + 4 + k * 6, sh + (k % 2) * 2, 4, 1, light(pal[(k + i) % 3]!, 0.4)); }
    g.r(wx + 2, wy + wh - 2, 20, 1, "#00000055");
    // luz amarela por trás do vidro (loja aberta)
    g.dither(wx + 2, wy + 7, 20, wh - 14, "#ffe9a840", i);
  });
  // flores no peitoril
  if (b.id === "casa" || b.id === "bairro") windows.forEach((wx) => { for (let k = 0; k < 4; k++) { g.r(wx + 2 + k * 5, wy + wh - 2, 3, 3, ["#e96a8a", "#ffd23a", "#fff", "#c25a9a"][k]!); g.p(wx + 3 + k * 5, wy + wh + 1, "#2d5a28"); } });
  // porta
  const dw = 22, dx = doorX + 5;
  const dc = ({ casa: "#8a4a2a", estrela: "#2f5aa8", livraria: "#6a1f2f", eletro: "#2a3340", bairro: "#3a7a46", mega: "#ffd23a", procon: "#33406a", padaria: "#8a4a2a", farmacia: "#2f9d6a", cafe: "#5a3a28", sorvete: "#f06a9a", casaB: "#4a6a8a", casaA: "#a8503a" } as Record<string, string>)[b.id] ?? "#8a4a2a";
  g.r(dx - 3, dy - 3, dw + 6, dh + 3, st.trim); g.r(dx - 3, dy - 3, dw + 6, 1, "#fff8"); g.r(dx - 3, dy - 3, 1, dh + 3, dark(st.trim, 0.3)); g.r(dx + dw + 2, dy - 3, 1, dh + 3, dark(st.trim, 0.4));
  g.r(dx, dy, dw, dh, dark(dc, 0.55)); g.r(dx + 1, dy + 1, dw - 2, dh - 1, dc);
  g.r(dx + 4, dy + 5, dw / 2 - 5, 14, dark(dc, 0.25)); g.r(dx + dw / 2 + 1, dy + 5, dw / 2 - 5, 14, dark(dc, 0.25));
  g.r(dx + 5, dy + 6, dw / 2 - 7, 12, "#ffe9a8"); g.r(dx + dw / 2 + 2, dy + 6, dw / 2 - 7, 12, "#ffd97a"); g.line(dx + 6, dy + 16, dx + 8, dy + 8, "#fff4cc"); // vidros com luz de dentro
  g.r(dx + dw / 2, dy + 1, 1, dh - 1, dark(dc, 0.5));
  g.r(dx + dw - 6, dy + dh / 2 + 2, 3, 3, "#f0c040"); g.r(dx + 2, dy + dh / 2 + 4, 4, dh / 2 - 6, dark(dc, 0.12));
  g.r(dx + 6, dy + 22, 3, 2, st.trim); g.r(dx + 13, dy + 22, 3, 2, st.trim); // placa 'ABERTO'
  g.r(dx + 5, dy + 21, 12, 4, "#d62a2a"); g.r(dx + 6, dy + 22, 10, 2, "#fff0c8");
  // capacho + degrau + lâmpada na parede
  if (b.top) { g.r(dx - 3, H - 4, dw + 6, 4, "#8a8272"); g.r(dx - 3, H - 4, dw + 6, 1, "#c8c0ac"); g.r(dx + 1, H - 3, dw - 2, 3, "#6a2a2a"); g.r(dx + 2, H - 3, dw - 4, 1, "#a04a4a"); }
  else { g.r(dx - 3, dy - 3, dw + 6, 3, "#8a8272"); g.r(dx + 1, dy - 2, dw - 2, 2, "#6a2a2a"); }
  [doorX - 7, doorX + TS + 4].forEach((lx) => { if (lx > 8 && lx < W - 12) { g.r(lx, dy + 2, 4, 6, "#2a2a30"); g.r(lx + 1, dy + 3, 2, 4, "#ffe9a8"); } });
  // detalhes por edifício
  if (b.id === "procon") { // colunas e frontão
    [10, W - 16].forEach((cx) => { g.r(cx, fy + 4, 6, facH - 4, "#e4dfd0"); g.r(cx, fy + 4, 2, facH - 4, "#fff8"); g.r(cx + 5, fy + 4, 1, facH - 4, "#8a8678"); g.r(cx - 1, fy + 4, 8, 3, "#cfc9b8"); g.r(cx - 1, fy + facH - 5, 8, 3, "#cfc9b8"); });
  }
  if (b.id === "mega") { for (let k = 0; k < (W - 12) / 6; k++) g.r(6 + k * 6, corY + (b.top ? 5 : -3), 3, 3, k % 2 ? "#ffee55" : "#fff"); } // lâmpadas de bulbo
  // contorno e sombra
  g.outline(C.ink);
  return g;
}

/** rótulos de texto do letreiro (desenhados com fonte do navegador, com pixel mais legível) */
function signText(g: Gfx, b: BldArt, st: Style) {
  const W = b.w * TS, { sy } = layout(b);
  const sw = Math.min(W - 24, 86), sx = Math.round((W - sw) / 2);
  const t = b.name.replace("LOJA DO BAIRRO", "LOJA BAIRRO");
  const ctx = g.x; ctx.save(); ctx.imageSmoothingEnabled = false;
  let fs = 8; ctx.font = `${fs}px "Press Start 2P", monospace`;
  while (ctx.measureText(t).width > sw - 6 && fs > 5) { fs--; ctx.font = `${fs}px "Press Start 2P", monospace`; }
  ctx.fillStyle = st.signText; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t, sx + sw / 2, sy + 8); ctx.restore();
}

/* outdoor gigante */
function drawBoard(wT: number, hT: number) {
  const W = wT * TS, H = hT * TS, g = new Gfx(W, H);
  g.r(10, 14, 4, H - 14, "#3a3a46"); g.r(W - 14, 14, 4, H - 14, "#3a3a46"); g.r(10, H - 6, 8, 4, "#2a2a34"); g.r(W - 18, H - 6, 8, 4, "#2a2a34");
  g.ell(W / 2, H - 4, W / 2 - 6, 4, "#00000044");
  g.box(2, 2, W - 4, H - 22, "#d62a2a", "#1a1220"); g.r(4, 4, W - 8, 2, "#ff6a5a"); g.r(4, H - 22, W - 8, 1, "#8a1a1a");
  g.r(6, 6, W - 12, H - 30, "#e63b34"); g.dither(6, 6, W - 12, H - 30, "#c42a2a", 0);
  for (let i = 0; i < 14; i++) { g.r(8 + i * 8, 5, 3, 3, i % 2 ? "#ffee55" : "#fff"); g.r(8 + i * 8, H - 24, 3, 3, i % 2 ? "#fff" : "#ffee55"); }
  g.r(0, H - 22, W, 3, "#2a2a34"); // passarela de manutenção
  g.r(W - 30, 2, 28, 6, "#2a2a34"); g.r(W - 28, 0, 3, 3, "#ffe9a8"); g.r(W - 18, 0, 3, 3, "#ffe9a8");
  g.outline("#1a1220");
  const c = g.x; c.save(); c.textAlign = "center"; c.textBaseline = "middle";
  c.font = `8px "Press Start 2P", monospace`; c.fillStyle = "#1a1220"; c.fillText("ÚLTIMA CHANCE!", W / 2 + 1, 13 + 1); c.fillStyle = "#fff6c8"; c.fillText("ÚLTIMA CHANCE!", W / 2, 13);
  c.font = `16px "Press Start 2P", monospace`; c.fillStyle = "#1a1220"; c.fillText("70% OFF*", W / 2 + 2, 28 + 2); c.fillStyle = "#ffe35a"; c.fillText("70% OFF*", W / 2, 28);
  c.font = `5px "Press Start 2P", monospace`; c.fillStyle = "#ffd6c8"; c.fillText("*em produtos selecionados", W / 2, 38); c.restore();
  return g;
}

/* ------------------- novos adereços ------------------- */
function drawFountain() {
  const g = new Gfx(TS * 2, TS * 2);
  g.ell(32, 54, 28, 9, "#00000040");
  g.ell(32, 44, 28, 14, "#a8a496"); g.ell(32, 44, 26, 12, "#d8d4c4"); g.ell(32, 45, 22, 9, "#4ab0d8"); g.ell(30, 43, 14, 5, "#8ad8f0");
  g.r(28, 18, 8, 26, "#c4c0b0"); g.r(28, 18, 3, 26, "#e8e4d4"); g.ell(32, 18, 12, 4, "#d8d4c4"); g.ell(32, 17, 9, 3, "#6ac8e8");
  for (let k = 0; k < 5; k++) { g.p(32 + (k - 2) * 3, 8 + Math.abs(k - 2) * 2, "#d8f4ff"); g.p(32 + (k - 2) * 3, 9 + Math.abs(k - 2) * 2, "#9ae0f8"); }
  g.r(31, 4, 2, 12, "#c8f0ff"); g.ell(32, 4, 3, 2, "#e8fcff");
  g.outline("#231826");
  return g;
}
function drawBench() {
  const g = new Gfx(TS, TS);
  g.ell(16, 27, 13, 3, "#00000040");
  g.r(3, 9, 26, 5, "#8a5a33"); g.r(3, 9, 26, 1, "#b0784a"); g.r(3, 15, 26, 5, "#a06a3a"); g.r(3, 15, 26, 1, "#c88a50"); g.r(4, 20, 3, 6, "#3a3a46"); g.r(25, 20, 3, 6, "#3a3a46"); g.r(3, 8, 3, 3, "#3a3a46"); g.r(26, 8, 3, 3, "#3a3a46");
  g.outline("#231826");
  return g;
}
function drawPalm() {
  const g = new Gfx(TS, TS * 2);
  g.ell(16, 58, 9, 3, "#00000040");
  for (let k = 0; k < 28; k++) { const x = 15 + Math.round(Math.sin(k / 9) * 2); g.r(x, 58 - k, 4, 1, k % 3 ? "#8a6a42" : "#6a4c2c"); }
  const cx = 17 + Math.round(Math.sin(28 / 9) * 2), cy = 30;
  [[-12, 2], [-9, -5], [-3, -9], [4, -9], [10, -5], [13, 2], [-7, 6], [8, 6]].forEach(([dx, dy], i) => { const c = i % 2 ? "#3f9a48" : "#2f8038"; g.line(cx, cy, cx + dx!, cy + dy!, c); g.line(cx, cy + 1, cx + dx!, cy + dy! + 1, c); g.line(cx + 1, cy, cx + dx! + (dx! > 0 ? 1 : -1), cy + dy!, light(c, 0.2)); });
  g.ell(cx, cy + 1, 3, 3, "#6a4c2c"); g.p(cx - 1, cy + 3, "#8a6a42");
  g.outline("#231826");
  return g;
}

/* ------------------- luz (tarde ensolarada) ------------------- */
function drawLight(blds: BldArt[], lamps: [number, number][]) {
  const g = new Gfx(STREET_W * TS, STREET_H * TS), c = g.x;
  // sombras suaves projetadas para a direita (sol a oeste)
  blds.forEach((b) => {
    const x = (b.x + b.w) * TS, y = b.y * TS, h = b.h * TS;
    c.fillStyle = "rgba(40,20,70,.20)";
    c.beginPath(); c.moveTo(x, y + 24); c.lineTo(x + 16, y + 44); c.lineTo(x + 16, y + h + 10); c.lineTo(x, y + h); c.closePath(); c.fill();
    c.fillStyle = "rgba(40,20,70,.18)"; c.fillRect(b.x * TS, (b.y + b.h) * TS, b.w * TS, 6);
  });
  const grad = c.createLinearGradient(0, 0, STREET_W * TS, STREET_H * TS);
  grad.addColorStop(0, "rgba(255,200,120,.07)"); grad.addColorStop(1, "rgba(120,100,200,.08)"); c.fillStyle = grad; c.fillRect(0, 0, STREET_W * TS, STREET_H * TS);
  const pool = (cx: number, cy: number, r: number, a: number, col = "255,224,150") => { const rg = c.createRadialGradient(cx, cy, 2, cx, cy, r); rg.addColorStop(0, `rgba(${col},${a})`); rg.addColorStop(1, `rgba(${col},0)`); c.fillStyle = rg; c.fillRect(cx - r, cy - r, r * 2, r * 2); };
  lamps.forEach(([lx, ly]) => pool(lx * TS + 16, ly * TS + 14, 54, 0.16));
  blds.forEach((b) => { if (b.id === "mega") pool((b.door + 0.5) * TS, (b.y + b.h) * TS + 8, 50, 0.2, "255,100,200"); if (b.id === "eletro") pool((b.door + 0.5) * TS, (b.y + b.h) * TS + 8, 50, 0.18, "90,240,240"); });
  const vg = c.createRadialGradient(STREET_W * TS / 2, STREET_H * TS / 2, STREET_H * TS * 0.45, STREET_W * TS / 2, STREET_H * TS / 2, STREET_W * TS * 0.7);
  vg.addColorStop(0, "rgba(10,6,24,0)"); vg.addColorStop(1, "rgba(10,6,24,.16)"); c.fillStyle = vg; c.fillRect(0, 0, STREET_W * TS, STREET_H * TS);
  return g;
}

/* ------------------- montagem ------------------- */
export function renderStreet(opts: {
  w: number; h: number; blds: BldArt[]; houses: BldArt[]; board: { x: number; y: number; w: number; h: number };
  props: Record<string, string>; flowers: Set<string>; hRoads: number[]; vRoads: number[];
  isRoad: (x: number, y: number) => boolean; isWalk: (x: number, y: number) => boolean;
}): StreetArt {
  const { blds, houses, board, props, flowers, isRoad, isWalk, hRoads, vRoads } = opts;
  STREET_W = opts.w; STREET_H = opts.h;
  const ground = drawGround({ isRoad, isWalk, flowers, hRoads, vRoads });
  const objects: StreetArt["objects"] = [];
  const lamps: [number, number][] = [];
  Object.keys(props).sort().forEach((k) => {
    const [tx, ty] = k.split(",").map(Number) as [number, number];
    const kind = props[k]!;
    if (kind === "none") return;
    if (kind === "fountain") { objects.push({ key: `t${k}`, src: drawFountain().url(), x: tx, y: ty, w: 2, h: 2, z: (ty + 2) * 10 }); return; }
    if (kind === "bench") { objects.push({ key: `t${k}`, src: drawBench().url(), x: tx, y: ty, w: 1, h: 1, z: (ty + 1) * 10 }); return; }
    if ((ty === 0 || ty === STREET_H - 1) && (kind === "tree" || kind === "pine" || kind === "palm" || kind === "bush")) { objects.push({ key: `t${k}`, src: drawTreeSmall(kind === "pine" ? 1 : 0, tx * 13 + ty * 7).url(), x: tx, y: ty, w: 1, h: 1, z: (ty + 1) * 10 }); return; }
    let art: Gfx;
    if (kind === "lamp") { art = drawLamp(); lamps.push([tx, ty - 1]); }
    else if (kind === "bin") art = drawBin();
    else if (kind === "hydrant") art = drawHydrant();
    else if (kind === "palm") art = drawPalm();
    else art = drawTree(kind === "pine" ? 1 : kind === "bush" ? 2 : 0, tx * 13 + ty * 7);
    objects.push({ key: `t${k}`, src: art.url(), x: tx, y: ty - 1, w: 1, h: 2, z: (ty + 1) * 10 });
  });
  [...blds, ...houses].forEach((b) => {
    const st = styleOf(b.id);
    const g = drawFacade(b, st); signText(g, b, st);
    objects.push({ key: `b${b.id}`, src: g.url(), x: b.x, y: b.y, w: b.w, h: b.h, z: (b.y + b.h) * 10 });
  });
  objects.push({ key: "board", src: drawBoard(board.w, board.h).url(), x: board.x, y: board.y, w: board.w, h: board.h, z: (board.y + board.h) * 10 });
  return { base: ground.url(), light: drawLight([...blds, ...houses], lamps).url(), objects };
}
void mix;
