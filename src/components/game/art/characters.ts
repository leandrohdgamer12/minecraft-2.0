/* Personagens em pixel art (células de 32×48 px) — 4 direções × 3 quadros de caminhada.
 * Cada personagem tem proporções, cabelo, roupa e acessórios próprios (silhueta reconhecível).
 * As folhas de sprite são geradas uma vez e cacheadas; "left" é desenhado de verdade (não só espelhado
 * por CSS), então o boné, o rabo de cavalo e a mochila acompanham a direção do rosto. */
import { Gfx, dark, light, mix, rng } from "./gfx";

export type CharKind = "julia" | "mae" | "vend" | "procon" | "promo";
export type Dir = "down" | "up" | "left" | "right";
type View = "front" | "back" | "side";

const INK = "#1a1220";
const EYE = "#1d1420";

interface Look {
  skin: string; hair: string; top: string; sleeve: string; sleeveLen: number;
  bottom: string; shoe: string; sole: string; bw: number; skirt?: { c: string; len: number };
}
interface Ctx { g: Gfx; L: Look; by: number; step: number; frame: number }

const LOOK: Record<CharKind, Look> = {
  julia: { skin: "#c98f63", hair: "#4b2a1c", top: "#bf3d3d", sleeve: "#bf3d3d", sleeveLen: 5, bottom: "#3d5f93", shoe: "#ece6da", sole: "#8a8274", bw: 7 },
  mae: { skin: "#a8734c", hair: "#241812", top: "#4f8c4c", sleeve: "#4f8c4c", sleeveLen: 9, bottom: "#4a5675", shoe: "#6b4533", sole: "#3b2619", bw: 8, skirt: { c: "#4a5675", len: 41 } },
  vend: { skin: "#ebbf9a", hair: "#5b301f", top: "#a8262d", sleeve: "#e3b92c", sleeveLen: 8, bottom: "#3a3447", shoe: "#2a2130", sole: "#15101a", bw: 8 },
  procon: { skin: "#e2b48e", hair: "#3a2823", top: "#27396a", sleeve: "#27396a", sleeveLen: 99, bottom: "#2d3145", shoe: "#1d1822", sole: "#0d0a10", bw: 7 },
  promo: { skin: "#d6a074", hair: "#2a1b17", top: "#f5a800", sleeve: "#d02c8e", sleeveLen: 6, bottom: "#5a3a9c", shoe: "#9be34a", sole: "#e9ffe0", bw: 7 },
};

/* ---------- peças básicas ---------- */
function shaded(g: Gfx, x: number, y: number, w: number, h: number, c: string) {
  g.r(x, y, w, h, c);
  g.r(x + w - 1, y, 1, h, dark(c, 0.22));
  g.r(x, y + h - 1, w, 1, dark(c, 0.18));
  g.r(x, y, 1, h - 1, light(c, 0.12));
}

function legs(c: Ctx, side: boolean) {
  const { g, L, step } = c;
  if (side) {
    const back = 13 + step * 3, fore = 13 - step * 3;
    const lb = step === 1 ? 0 : 0, lf = step === -1 ? 0 : 0;
    // perna de trás (mais escura) e da frente
    shaded(g, back, 33, 5, 8, dark(L.bottom, 0.18)); g.r(back, 41 - lb, 6, 3, dark(L.shoe, 0.2)); g.r(back, 43 - lb, 6, 1, L.sole);
    shaded(g, fore, 33, 5, 8, L.bottom); g.r(fore, 41 - lf, 6, 3, L.shoe); g.r(fore, 43 - lf, 6, 1, L.sole);
    return;
  }
  const lift = (leg: 0 | 1) => (step === 1 && leg === 0) || (step === -1 && leg === 1) ? 2 : 0;
  [0, 1].forEach((i) => {
    const x = i === 0 ? 11 : 17, l = lift(i as 0 | 1);
    shaded(g, x, 33, 5, 8 - l, L.bottom);
    g.r(x - 1 + (i === 0 ? 0 : 1), 41 - l, 6, 3, L.shoe);
    g.r(x - 1 + (i === 0 ? 0 : 1), 43 - l, 6, 1, L.sole);
    g.r(x + (i === 0 ? 0 : 1), 41 - l, 3, 1, light(L.shoe, 0.25));
  });
}

function torso(c: Ctx, v: View) {
  const { g, L, by } = c;
  const w = v === "side" ? 10 : L.bw * 2, x = 16 - w / 2;
  if (L.skirt && v !== "side") {
    // saia/vestido longo (mãe)
    g.r(x + 1, 31 + by, w - 2, 1, L.skirt.c);
    for (let y = 32; y < L.skirt.len; y++) { const k = Math.floor((y - 32) / 4); shaded(g, x - 1 - k, y, w + 2 + k * 2 > 0 ? w + 2 + k * 2 : w, 1, L.skirt.c); }
    g.r(x - 4, L.skirt.len - 1, w + 8, 1, dark(L.skirt.c, 0.3));
    g.dither(x, 34, w, 7, dark(L.skirt.c, 0.25), 1);
  } else if (L.skirt) { g.r(11, 32, 10, L.skirt.len - 32, L.skirt.c); g.r(11, L.skirt.len - 1, 10, 1, dark(L.skirt.c, 0.3)); }
  shaded(g, x, 22 + by, w, 12, L.top);
  g.r(x, 33 + by, w, 1, dark(L.bottom, 0.2)); // cintura
}

function arms(c: Ctx, v: View) {
  const { g, L, by, step } = c;
  const aw = 3;
  if (v === "side") {
    const sw = step * 3; // braço da frente balança
    const ax = 14 - sw;
    shaded(g, ax, 23 + by, aw + 1, Math.min(L.sleeveLen, 8) + 2, L.sleeve);
    const sl = L.sleeveLen >= 99 ? 11 : 10;
    if (L.sleeveLen < 99) g.r(ax, 23 + by + sl - 1, aw + 1, 5, L.skin), g.r(ax + aw, 23 + by + sl - 1, 1, 5, dark(L.skin, 0.15));
    else { shaded(g, ax, 23 + by, aw + 1, 11, L.sleeve); g.r(ax, 33 + by, aw + 1, 3, L.skin); }
    return;
  }
  const lx = 16 - L.bw - aw, rx = 16 + L.bw;
  [lx, rx].forEach((x, i) => {
    const up = (step === 1 && i === 0) || (step === -1 && i === 1) ? -1 : (step !== 0 ? 1 : 0);
    const y = 23 + by + (v === "front" ? up : up);
    const sl = L.sleeveLen >= 99 ? 11 : Math.min(L.sleeveLen, 10);
    shaded(g, x, y, aw, sl + 1, L.sleeve);
    if (L.sleeveLen < 99) { g.r(x, y + sl + 1, aw, 11 - sl, L.skin); g.r(x + aw - 1, y + sl + 1, 1, 11 - sl, dark(L.skin, 0.15)); }
    else g.r(x, y + 12, aw, 3, L.skin);
    // mão
    if (L.sleeveLen < 99) g.r(x, y + 11, aw, 2, mix(L.skin, "#ffffff", 0.05));
  });
}

function head(c: Ctx, v: View) {
  const { g, L, by } = c;
  if (v === "side") {
    g.r(14, 21 + by, 4, 3, dark(L.skin, 0.12));
    g.ell(17, 14 + by, 6.6, 7.4, L.skin);
    g.ell(17.5, 15 + by, 5.6, 6.2, light(L.skin, 0.06));
    g.r(23, 15 + by, 1, 2, L.skin); // nariz
    g.r(14, 14 + by, 2, 3, dark(L.skin, 0.2)); // orelha
    return;
  }
  g.r(14, 21 + by, 4, 3, dark(L.skin, 0.15)); // pescoço
  g.ell(16, 14 + by, 6.8, 7.6, L.skin);
  g.r(10, 17 + by, 1, 3, dark(L.skin, 0.12)); g.r(21, 17 + by, 1, 3, dark(L.skin, 0.12));
}

function face(c: Ctx, v: View, o: { lash?: boolean; blush?: boolean; smile?: boolean; brow?: string; mustache?: string } = {}) {
  const { g, by } = c;
  if (v === "side") {
    g.r(20, 13 + by, 2, 3, EYE); g.p(20, 13 + by, "#fff"); if (o.lash) g.p(21, 12 + by, EYE);
    g.r(19, 11 + by, 4, 1, o.brow ?? dark(LOOK.julia.hair, 0.1));
    g.r(20, 18 + by, 2, 1, "#8a3a3a");
    if (o.mustache) g.r(20, 17 + by, 3, 1, o.mustache);
    if (o.blush) g.r(18, 17 + by, 2, 1, "#e08a7a");
    return;
  }
  g.r(11, 14 + by, 3, 4, EYE); g.r(18, 14 + by, 3, 4, EYE);
  g.p(11, 14 + by, "#fff"); g.p(18, 14 + by, "#fff");
  g.r(12, 17 + by, 1, 1, "#4a3a3a"); g.r(19, 17 + by, 1, 1, "#4a3a3a");
  if (o.lash) { g.p(10, 14 + by, EYE); g.p(21, 14 + by, EYE); }
  const bc = o.brow ?? "#2a1a14";
  g.r(11, 12 + by, 3, 1, bc); g.r(18, 12 + by, 3, 1, bc);
  g.p(16, 17 + by, dark(c.L.skin, 0.2)); // nariz
  if (o.mustache) g.r(13, 19 + by, 6, 1, o.mustache);
  g.r(14, 20 + by, 4, 1, o.smile ? "#7a2a30" : "#a05050");
  if (o.smile) { g.p(13, 19 + by, dark(c.L.skin, 0.2)); g.p(18, 19 + by, dark(c.L.skin, 0.2)); g.r(15, 20 + by, 2, 1, "#f4ece0"); }
  if (o.blush) { g.r(10, 18 + by, 2, 1, "#e08a7a"); g.r(20, 18 + by, 2, 1, "#e08a7a"); }
}

/* ---------- por personagem ---------- */
function julia(c: Ctx, v: View) {
  const { g, L, by, step } = c;
  const hair = L.hair, hi = "#7a4630", red = "#d94a4a", blue = "#2f64b0", blueD = "#22497e";
  if (v === "front") {
    // rabo de cavalo atrás da cabeça (aparece do lado direito)
    g.ell(24, 17 + by, 2.6, 6.5, hair); g.p(24, 13 + by, hi); g.r(22, 8 + by, 3, 2, red);
    legs(c, false); torso(c, v); arms(c, v);
    // alças da mochila
    g.r(11, 23 + by, 2, 9, blue); g.r(19, 23 + by, 2, 9, blue); g.r(11, 31 + by, 2, 1, blueD); g.r(19, 31 + by, 2, 1, blueD);
    // gola branca + bandeirinha no peito
    g.r(13, 22 + by, 6, 2, "#ece4d6"); g.p(15, 24 + by, L.top);
    g.r(14, 27 + by, 4, 3, "#2f9d4d"); g.p(15, 28 + by, "#f5d94c"); g.p(16, 28 + by, "#f5d94c"); g.p(16, 29 + by, "#2a4fb0");
    head(c, v); face(c, v, { lash: true, blush: true, smile: true, brow: "#3a2016" });
    g.ell(16, 10 + by, 7.6, 5.4, hair);
    g.r(9, 11 + by, 3, 8, hair); g.r(20, 11 + by, 3, 7, hair);
    g.r(12, 11 + by, 9, 2, hair); g.p(13, 13 + by, hair); g.p(14, 13 + by, hair); g.p(17, 13 + by, hair); g.p(19, 13 + by, hair); g.p(20, 13 + by, hair);
    g.r(11, 8 + by, 3, 1, hi); g.r(15, 7 + by, 4, 1, hi); g.p(10, 13 + by, hi);
    return;
  }
  if (v === "back") {
    legs(c, false); torso(c, v);
    // mochila grande azul nas costas
    shaded(g, 9, 22 + by, 14, 13, blue); g.r(11, 28 + by, 10, 5, blueD); g.r(11, 28 + by, 10, 1, light(blue, 0.2)); g.r(15, 29 + by, 2, 2, "#d9c26a");
    g.r(9, 22 + by, 14, 1, light(blue, 0.3));
    arms(c, v);
    head(c, v);
    g.ell(16, 14 + by, 7.5, 8, hair); g.r(10, 17 + by, 12, 5, hair);
    g.p(12, 9 + by, hi); g.p(13, 8 + by, hi); g.r(14, 7 + by, 3, 1, hi);
    // rabo de cavalo preso no alto, caindo pelas costas
    g.r(14, 6 + by, 4, 3, red); g.r(13, 9 + by, 6, 4, hair); g.r(14, 13 + by, 4, 9, hair); g.r(15, 22 + by, 2, 3, hair);
    g.r(15, 10 + by, 1, 8, hi);
    return;
  }
  // lado direito
  g.r(7, 8 + by, 4, 3, red); g.r(5, 11 + by, 5, 9, hair); g.r(6, 20 + by, 3, 4, hair); g.p(7, 13 + by, hi); g.p(6, 16 + by, hi);
  // mochila (atrás do corpo)
  shaded(g, 7, 23 + by, 6, 12, blue); g.r(8, 29 + by, 4, 4, blueD);
  legs(c, true); torso(c, v);
  g.r(12, 23 + by, 2, 8, blue); // alça
  arms(c, v);
  head(c, v); face(c, v, { lash: true, blush: true, brow: "#3a2016" });
  g.ell(15, 12 + by, 7.2, 6.4, hair); g.r(9, 12 + by, 6, 8, hair); g.r(16, 8 + by, 6, 4, hair); g.r(19, 11 + by, 3, 1, hair); g.p(22, 12 + by, hair);
  g.r(12, 8 + by, 5, 1, hi);
  g.r(14, 22 + by, 5, 2, "#ece4d6");
  g.p(0, 0, "#0000"); void step;
}

function mae(c: Ctx, v: View) {
  const { g, L, by } = c;
  const hair = L.hair, hi = "#4a3326", gold = "#f0c24a", apron = "#eadfc9";
  const curls = (cx: number, cy: number, rx: number, ry: number, n: number) => {
    const r = rng(cx * 31 + cy * 17 + n);
    for (let i = 0; i < n; i++) { const a = r() * 6.283, d = Math.sqrt(r()); g.p(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, i % 3 ? hi : "#0f0a07"); }
  };
  if (v === "front") {
    g.ell(16, 12 + by, 10.5, 9, hair); g.r(6, 12 + by, 4, 9, hair); g.r(22, 12 + by, 4, 9, hair); curls(16, 12 + by, 9, 7, 26);
    legs(c, false); torso(c, v); arms(c, v);
    // decote em V + avental
    g.r(13, 22 + by, 6, 1, dark(L.skin, 0.1)); g.r(14, 23 + by, 4, 1, L.skin); g.r(15, 24 + by, 2, 1, L.skin);
    g.r(11, 29 + by, 10, 12, apron); g.r(11, 29 + by, 10, 1, "#fff6e2"); g.r(11, 40, 10, 1, dark(apron, 0.25)); g.r(14, 32 + by, 4, 3, dark(apron, 0.12));
    g.p(12, 24 + by, dark(L.top, 0.2)); g.p(19, 24 + by, dark(L.top, 0.2));
    head(c, v); face(c, v, { lash: true, blush: true, smile: true, brow: "#1a100c" });
    g.ell(16, 9.5 + by, 8, 4.6, hair); g.r(9, 10 + by, 3, 6, hair); g.r(20, 10 + by, 3, 6, hair); g.r(12, 10 + by, 8, 2, hair);
    g.p(14, 12 + by, hair); g.p(17, 12 + by, hair); curls(16, 9.5 + by, 7, 3, 12);
    g.r(9, 17 + by, 1, 3, gold); g.r(22, 17 + by, 1, 3, gold); // argolas
    return;
  }
  if (v === "back") {
    legs(c, false); torso(c, v);
    g.r(10, 30 + by, 12, 11, apron); g.r(15, 26 + by, 2, 6, "#fff6e2"); // laço do avental
    arms(c, v); head(c, v);
    g.ell(16, 13 + by, 10.5, 9.5, hair); g.r(7, 14 + by, 18, 8, hair); curls(16, 14 + by, 9, 8, 34);
    return;
  }
  g.ell(11, 13 + by, 8, 9, hair); curls(11, 13 + by, 7, 8, 22);
  legs(c, true); torso(c, v);
  g.r(10, 30 + by, 5, 11, apron);
  arms(c, v); head(c, v); face(c, v, { lash: true, blush: true, brow: "#1a100c" });
  g.ell(14.5, 10 + by, 7.6, 5.4, hair); g.r(8, 10 + by, 7, 9, hair); g.r(17, 8 + by, 5, 3, hair); g.p(21, 11 + by, hair); curls(13, 10 + by, 6, 4, 10);
  g.r(14, 17 + by, 1, 3, gold);
}

function vend(c: Ctx, v: View) {
  const { g, L, by } = c;
  const hair = L.hair, hi = "#8a4a2c", shirt = "#e3b92c", vest = "#a8262d";
  if (v === "front") {
    legs(c, false); torso(c, v);
    g.r(16 - L.bw, 22 + by, 3, 12, vest); g.r(13 + L.bw, 22 + by, 3, 12, vest); // colete cobre os lados
    g.r(12, 22 + by, 8, 12, shirt); g.r(12, 22 + by, 8, 1, light(shirt, 0.3));
    g.r(11, 22 + by, 2, 12, vest); g.r(19, 22 + by, 2, 12, vest);
    g.p(13, 23 + by, light(shirt, 0.4)); g.p(18, 23 + by, light(shirt, 0.4));
    g.r(15, 22 + by, 2, 2, "#e8e0d0"); g.r(15, 24 + by, 2, 7, "#c4272e"); g.r(15, 24 + by, 2, 1, "#8a1a20"); g.r(15, 31 + by, 2, 1, "#8a1a20"); // gravata
    g.r(18, 27 + by, 3, 2, "#f4efe4"); g.p(19, 28 + by, "#b03030"); // crachá
    g.r(11, 33 + by, 10, 1, "#6a5a40"); g.r(15, 33 + by, 2, 1, "#d8c070");
    arms(c, v);
    head(c, v); face(c, v, { smile: true, mustache: "#3a1d12", brow: "#3a1d12" });
    g.ell(16, 10 + by, 7.2, 4.4, hair); g.r(9, 10 + by, 2, 5, hair); g.r(21, 10 + by, 2, 5, hair);
    g.r(11, 4 + by, 11, 5, hair); g.r(13, 3 + by, 8, 1, hair); g.r(12, 10 + by, 8, 2, hair); g.r(12, 4 + by, 7, 1, hi); g.r(14, 6 + by, 5, 1, hi); g.p(12, 12 + by, hair); g.p(19, 12 + by, hair);
    return;
  }
  if (v === "back") {
    legs(c, false); torso(c, v); g.r(16 - L.bw, 22 + by, L.bw * 2, 12, vest); g.r(15, 22 + by, 2, 12, dark(vest, 0.25)); g.r(11, 33 + by, 10, 1, "#6a5a40");
    arms(c, v); head(c, v);
    g.ell(16, 14 + by, 7.4, 8, hair); g.r(11, 4 + by, 11, 4, hair); g.r(13, 3 + by, 8, 1, hair); g.r(10, 18 + by, 12, 3, hair); g.r(13, 6 + by, 6, 1, hi);
    return;
  }
  legs(c, true); torso(c, v);
  g.r(11, 22 + by, 10, 12, vest); g.r(15, 22 + by, 5, 12, shirt); g.r(11, 33 + by, 10, 1, "#6a5a40");
  g.r(17, 24 + by, 2, 6, "#c4272e");
  arms(c, v); head(c, v); face(c, v, { mustache: "#3a1d12", brow: "#3a1d12" });
  g.ell(15, 11 + by, 7, 5.4, hair); g.r(10, 11 + by, 5, 8, hair); g.r(15, 3 + by, 9, 5, hair); g.r(18, 2 + by, 5, 1, hair); g.r(16, 8 + by, 6, 3, hair); g.r(16, 4 + by, 6, 1, hi);
}

function procon(c: Ctx, v: View) {
  const { g, L, by } = c;
  const hair = L.hair, hi = "#5e4238", white = "#ebe7de", lan = "#3a78c8";
  if (v === "front") {
    legs(c, false); torso(c, v);
    g.r(13, 22 + by, 6, 8, white); g.r(14, 22 + by, 4, 1, "#fff"); // camisa
    g.r(11, 22 + by, 3, 12, "#1e2d54"); g.r(18, 22 + by, 3, 12, "#1e2d54"); g.r(13, 23 + by, 1, 8, dark(L.top, 0.2)); g.r(18, 23 + by, 1, 8, dark(L.top, 0.2)); // lapelas
    g.r(15, 30 + by, 2, 2, "#d6c070"); // botão
    g.r(14, 22 + by, 1, 8, lan); g.r(17, 22 + by, 1, 8, lan); g.r(14, 29 + by, 4, 4, "#f2f0ea"); g.r(15, 30 + by, 2, 2, "#2f5f9a"); g.p(15, 31 + by, "#fff"); // crachá com balança
    g.r(19, 25 + by, 2, 1, "#e0b84a"); // pin
    arms(c, v);
    // pasta/prancheta
    g.box(23, 29 + by, 6, 8, "#d6cdb4", INK); g.r(24, 31 + by, 4, 1, "#7a7568"); g.r(24, 33 + by, 4, 1, "#7a7568"); g.r(25, 28 + by, 2, 2, "#8a8a92");
    head(c, v); face(c, v, { lash: true, brow: "#2a1a16" });
    g.ell(16, 10 + by, 7.8, 5.6, hair); g.r(8, 11 + by, 4, 9, hair); g.r(20, 11 + by, 4, 9, hair); g.r(12, 10 + by, 8, 3, hair); g.r(9, 19 + by, 3, 1, hi); g.r(13, 13 + by, 6, 1, "#00000000");
    g.r(12, 12 + by, 4, 1, hair); g.p(13, 13 + by, hair); g.p(12, 13 + by, hair); g.r(11, 6 + by, 6, 1, hi); g.r(16, 8 + by, 5, 1, hi);
    // óculos
    g.r(10, 14 + by, 5, 1, "#c9c2b2"); g.r(17, 14 + by, 5, 1, "#c9c2b2"); g.r(10, 18 + by, 5, 1, "#c9c2b2"); g.r(17, 18 + by, 5, 1, "#c9c2b2"); g.r(10, 14 + by, 1, 5, "#c9c2b2"); g.r(14, 14 + by, 1, 5, "#c9c2b2"); g.r(17, 14 + by, 1, 5, "#c9c2b2"); g.r(21, 14 + by, 1, 5, "#c9c2b2"); g.r(15, 15 + by, 2, 1, "#c9c2b2");
    return;
  }
  if (v === "back") {
    legs(c, false); torso(c, v); g.r(15, 22 + by, 2, 12, dark(L.top, 0.3)); g.r(14, 22 + by, 4, 1, lan);
    arms(c, v); head(c, v);
    g.ell(16, 13 + by, 7.8, 8, hair); g.r(8, 14 + by, 16, 6, hair); g.r(12, 8 + by, 6, 1, hi);
    return;
  }
  legs(c, true); torso(c, v);
  g.r(15, 22 + by, 5, 12, white); g.r(15, 22 + by, 2, 12, "#1e2d54"); g.r(17, 23 + by, 1, 9, lan);
  arms(c, v);
  head(c, v); face(c, v, { lash: true, brow: "#2a1a16" });
  g.ell(15, 11 + by, 7.2, 6, hair); g.r(8, 11 + by, 8, 10, hair); g.r(16, 8 + by, 6, 4, hair); g.r(18, 12 + by, 4, 1, hair); g.r(12, 6 + by, 6, 1, hi);
  g.r(19, 13 + by, 5, 1, "#c9c2b2"); g.r(19, 17 + by, 5, 1, "#c9c2b2"); g.r(19, 13 + by, 1, 5, "#c9c2b2"); g.r(23, 13 + by, 1, 5, "#c9c2b2"); g.r(15, 14 + by, 4, 1, "#c9c2b2");
}

function promo(c: Ctx, v: View) {
  const { g, L, by } = c;
  const cap = "#e53a2c", capD = "#a8281f", bill = "#ffd24a", vest = "#f5a800", refl = "#f2f4f6", pink = "#d02c8e";
  if (v === "front") {
    legs(c, false); torso(c, v);
    g.r(11, 22 + by, 10, 12, pink); g.r(11, 22 + by, 4, 12, vest); g.r(17, 22 + by, 4, 12, vest); // colete refletivo aberto
    g.r(11, 27 + by, 4, 1, refl); g.r(17, 27 + by, 4, 1, refl); g.r(11, 31 + by, 4, 1, refl); g.r(17, 31 + by, 4, 1, refl);
    g.r(16 - L.bw, 22 + by, 2, 12, vest); g.r(14 + L.bw, 22 + by, 2, 12, vest);
    g.r(15, 22 + by, 2, 12, dark(pink, 0.2));
    arms(c, v);
    // panfleto na mão direita
    g.r(24, 25 + by, 6, 8, "#f4efe4"); g.r(24, 25 + by, 6, 1, INK); g.r(24, 32 + by, 6, 1, INK); g.r(24, 25 + by, 1, 8, INK); g.r(29, 25 + by, 1, 8, INK);
    g.r(25, 27 + by, 4, 2, "#d62a2a"); g.r(25, 30 + by, 4, 1, "#7a7568"); g.p(26, 28 + by, "#fff");
    head(c, v); face(c, v, { smile: true, brow: "#1a100c" });
    // boné: copa + aba voltada para a frente
    g.ell(16, 9 + by, 8, 5, cap); g.r(8, 9 + by, 16, 2, cap); g.r(8, 10 + by, 16, 1, capD);
    g.r(14, 6 + by, 4, 3, "#fff"); g.r(15, 7 + by, 2, 1, cap); g.p(16, 5 + by, "#fff"); // logo %
    g.r(8, 11 + by, 16, 3, bill); g.r(7, 12 + by, 18, 2, bill); g.r(7, 14 + by, 18, 1, dark(bill, 0.35)); g.r(9, 11 + by, 14, 1, light(bill, 0.3));
    g.r(9, 14 + by, 3, 6, L.hair); g.r(20, 14 + by, 3, 6, L.hair);
    return;
  }
  if (v === "back") {
    legs(c, false); torso(c, v);
    g.r(11, 22 + by, 10, 12, pink); g.r(11, 22 + by, 10, 12, vest); g.r(11, 26 + by, 10, 1, refl); g.r(11, 30 + by, 10, 1, refl); g.r(15, 22 + by, 2, 12, refl);
    g.r(14, 27 + by, 4, 3, "#d62a2a"); g.p(15, 28 + by, "#fff"); g.p(16, 29 + by, "#fff");
    arms(c, v); head(c, v);
    g.ell(16, 14 + by, 7.2, 7.6, L.hair); g.r(9, 17 + by, 14, 4, L.hair);
    g.ell(16, 9 + by, 8, 5.4, cap); g.r(8, 9 + by, 16, 4, cap); g.r(8, 13 + by, 16, 1, capD); g.r(13, 11 + by, 6, 3, "#6a2018"); g.r(14, 12 + by, 4, 1, "#d8c8a8"); // regulador do boné
    g.p(16, 4 + by, "#fff");
    return;
  }
  legs(c, true); torso(c, v);
  g.r(11, 22 + by, 10, 12, pink); g.r(11, 22 + by, 5, 12, vest); g.r(16, 22 + by, 3, 12, vest); g.r(11, 27 + by, 8, 1, refl); g.r(11, 31 + by, 8, 1, refl);
  arms(c, v);
  g.r(24, 28 + by, 5, 7, "#f4efe4"); g.r(25, 30 + by, 3, 2, "#d62a2a");
  head(c, v); face(c, v, { smile: false, brow: "#1a100c" });
  g.r(12, 12 + by, 4, 8, L.hair);
  g.ell(15, 9 + by, 7.4, 5, cap); g.r(9, 9 + by, 12, 3, cap); g.r(9, 11 + by, 12, 1, capD); g.r(13, 6 + by, 4, 3, "#fff"); g.r(14, 7 + by, 2, 1, cap);
  g.r(20, 10 + by, 9, 2, bill); g.r(21, 12 + by, 8, 1, dark(bill, 0.35)); g.r(20, 10 + by, 8, 1, light(bill, 0.3)); // aba do boné aponta para onde o rosto olha
}

const DRAW: Record<CharKind, (c: Ctx, v: View) => void> = { julia, mae, vend, procon, promo };

export function drawFrame(kind: CharKind, dir: Dir, frame: number): Gfx {
  const L = LOOK[kind];
  const step = frame === 0 ? 0 : frame === 1 ? 1 : -1;
  const by = frame === 0 ? 0 : -1;
  const g = new Gfx(32, 48);
  const side = dir === "left" || dir === "right";
  DRAW[kind]({ g, L, by, step, frame }, side ? "side" : dir === "up" ? "back" : "front");
  g.outline(INK);
  const out = new Gfx(32, 48);
  out.ell(16, 44.2, 9.5, 2.6, "#00000055");
  out.blit(dir === "left" ? g.flipX() : g, 0, 0);
  return out;
}

const SHEETS = new Map<CharKind, string>();
export const ROW: Record<Dir, number> = { down: 0, up: 1, left: 2, right: 3 };

/** folha 96×192: 3 colunas (quadros) × 4 linhas (down, up, left, right) */
export function spriteSheet(kind: CharKind): string {
  if (typeof document === "undefined") return "";
  let s = SHEETS.get(kind);
  if (!s) {
    const sheet = new Gfx(96, 192);
    (["down", "up", "left", "right"] as Dir[]).forEach((d, r) => [0, 1, 2].forEach((f) => sheet.blit(drawFrame(kind, d, f), f * 32, r * 48)));
    s = sheet.url(); SHEETS.set(kind, s);
  }
  return s;
}
