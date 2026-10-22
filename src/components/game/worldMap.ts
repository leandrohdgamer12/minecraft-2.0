/* Dados do mundo (sem React): cidade 60×44, quarteirões, lojas, objetos sólidos e plantas dos interiores.
 * Fica separado de World.tsx para poder ser validado por testes automáticos (ver src/test/world-map.test.ts). */

export type Rect = { x: number; y: number; w: number; h: number };
export type Bld = Rect & { id: string; name: string; icon: string; top: true; door: number };

export const SW = 60, SH = 44; // mundo da rua, em tiles
export const VIEW_RUA = { w: 20, h: 13 }; // região visível por vez (a câmera acompanha a Júlia)
export const H_ROADS = [7, 16, 25, 34]; // ruas horizontais (2 tiles de largura cada, começando nestas linhas)
export const V_ROADS = [12, 24, 36, 48]; // ruas verticais
const WALK_ROWS = [6, 9, 15, 18, 24, 27, 33, 36, 42]; // calçadas horizontais (frente e fundo dos quarteirões)

export const inRect = (x: number, y: number, r: Rect) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
export const isRoad = (x: number, y: number) => H_ROADS.some((a) => y === a || y === a + 1) || V_ROADS.some((c) => x === c || x === c + 1);
export const isWalk = (x: number, y: number) => WALK_ROWS.includes(y) || V_ROADS.some((c) => x === c - 1 || x === c + 2);

/* ---- quarteirões: 5 colunas × 5 linhas, 2 prédios por quarteirão; toda fachada olha para a calçada de baixo ---- */
const COLX = [1, 15, 27, 39, 51], ROWY = [1, 10, 19, 28, 37];
const slot = (bc: number, br: number, i: number): Rect & { door: number } => {
  const w = bc === 0 ? 5 : 4, x = COLX[bc]! + i * w;
  return { x, y: ROWY[br]!, w, h: 5, door: x + 2 };
};
const REAL: Record<string, { id: string; name: string; icon: string }> = {
  "0,0,0": { id: "casa", name: "CASA", icon: "🏠" },
  "0,0,1": { id: "estrela", name: "ESTRELA", icon: "⭐" },
  "0,1,0": { id: "bairro", name: "LOJA DO BAIRRO", icon: "🏪" },
  "0,2,1": { id: "mega", name: "MEGASHOP", icon: "🛍️" },
  "1,1,0": { id: "livraria", name: "LIVRARIA", icon: "📚" },
  "2,0,0": { id: "eletro", name: "ELETROTEC", icon: "🔌" },
  "1,3,1": { id: "procon", name: "PROCON", icon: "⚖️" },
};
export const BLDS: Bld[] = Object.entries(REAL).map(([k, v]) => {
  const [bc, br, i] = k.split(",").map(Number) as [number, number, number];
  return { ...v, ...slot(bc, br, i), top: true as const };
});
// Terrenos que NÃO recebem prédio (praças, parques, gramados, terreno do outdoor)
const LOTS = new Set(["0,3,0", "0,3,1", "3,2,0", "3,2,1", "2,4,0", "2,4,1", "4,4,0", "4,4,1", "1,3,0"]);
const DECOR_STYLES: [string, string][] = [["casaA", "CASA"], ["padaria", "PADARIA"], ["casaB", "CASA"], ["farmacia", "FARMÁCIA"], ["cafe", "CAFÉ"], ["casaA", "CASA"], ["sorvete", "SORVETES"], ["casaB", "CASA"], ["padaria", "PIZZARIA"], ["cafe", "BARBEARIA"]];
export const HOUSES: (Rect & { id: string; name: string; top: true; door: number })[] = [];
{
  let n = 0;
  for (let br = 0; br < 5; br++) for (let bc = 0; bc < 5; bc++) for (let i = 0; i < 2; i++) {
    const k = `${bc},${br},${i}`;
    if (REAL[k] || LOTS.has(k)) continue;
    const [id, base] = DECOR_STYLES[n % DECOR_STYLES.length]!;
    HOUSES.push({ id, name: base === "CASA" ? `CASA ${10 + n * 2}` : base, ...slot(bc, br, i), top: true as const });
    n++;
  }
}
// Outdoor gigante: terreno ao lado do Procon (frente para quem vem pela calçada de cima)
export const BOARD: Rect = { x: 15, y: 28, w: 4, h: 2 };

const overBuilding = (x: number, y: number) => BLDS.some((b) => inRect(x, y, b)) || HOUSES.some((b) => inRect(x, y, b)) || inRect(x, y, BOARD);

/* ---- objetos sólidos de cenário (árvores, postes, fonte, bancos…) ---- */
export const PROPS: Record<string, string> = {};
export const FLOWERS = new Set<string>();
{
  const put = (x: number, y: number, kind: string) => { if (x >= 0 && y >= 0 && x < SW && y < SH && !isRoad(x, y) && !isWalk(x, y) && !overBuilding(x, y)) PROPS[`${x},${y}`] = kind; };
  const lampAt = (x: number, y: number, kind: string) => { if (x >= 0 && y >= 0 && x < SW && y < SH) PROPS[`${x},${y}`] = kind; };
  const cyc = ["tree", "pine", "palm", "bush", "tree"];
  // árvores só nas faixas de grama de cima e de baixo; o tronco é fino (a Júlia passa por ele pela faixa)
  for (let x = 0, i = 0; x < SW; x += 3, i++) { put(x, 0, cyc[i % 5]!); put(x + 1, SH - 1, cyc[(i + 2) % 5]!); }
  // postes e lixeiras ficam nas calçadas da frente/fundo dos quarteirões, longe das portas e dos cruzamentos
  COLX.forEach((x0, bc) => ROWY.forEach((y0, br) => {
    lampAt(x0 + 4, y0 + 5, "lamp");
    if (br > 0) lampAt(x0 + (bc === 0 ? 9 : 7), y0 - 1, (bc + br) % 2 ? "bin" : "hydrant");
  }));
  // praça com fonte (quarteirão 0,3)
  PROPS["5,30"] = "fountain"; PROPS["6,30"] = "none"; PROPS["5,31"] = "none"; PROPS["6,31"] = "none";
  [[3, 29], [8, 29], [3, 32], [8, 32]].forEach(([x, y]) => put(x!, y!, "bench"));
  [[2, 28], [9, 28], [1, 32], [10, 32], [1, 29], [10, 29]].forEach(([x, y], i) => put(x!, y!, i % 2 ? "palm" : "tree"));
  // parque (3,2)
  [[40, 20], [45, 20], [42, 22], [44, 22], [39, 22], [46, 19]].forEach(([x, y], i) => put(x!, y!, i % 3 === 0 ? "pine" : "tree"));
  [[41, 21], [43, 21]].forEach(([x, y]) => put(x!, y!, "bench"));
  // gramados e terreno do outdoor
  [[28, 38], [33, 38], [30, 40], [27, 41], [34, 41], [52, 38], [57, 38], [54, 40], [51, 41], [58, 41]].forEach(([x, y], i) => put(x!, y!, i % 3 === 2 ? "bush" : "tree"));
  [[31, 39], [55, 39]].forEach(([x, y]) => put(x!, y!, "bench"));
  [[15, 31], [18, 31], [16, 32], [17, 32]].forEach(([x, y], i) => put(x!, y!, i % 2 ? "bush" : "tree"));
  // flores
  const flw = (x: number, y: number) => { if (!isRoad(x, y) && !isWalk(x, y) && !overBuilding(x, y) && !PROPS[`${x},${y}`]) FLOWERS.add(`${x},${y}`); };
  for (let x = 1; x < 11; x += 2) { flw(x, 29); flw(x, 31); flw(x + 1, 30); }
  for (let x = 39; x < 47; x += 2) { flw(x, 20); flw(x + 1, 23); }
  for (let x = 15; x < 23; x += 2) { flw(x, 30); flw(x + 1, 31); flw(x, 32); }
  for (let x = 1; x < 59; x += 5) { flw(x, 43); flw(x + 2, 0); }
}
// Postes, lixeiras e hidrantes são finos: só o "pé" deles bloqueia (não fecham a calçada de 1 tile).
const THIN_KINDS = new Set(["lamp", "bin", "hydrant"]);
const isThinTree = (k: string) => { const y = Number(k.split(",")[1]); return (y === 0 || y === SH - 1) && ["tree", "pine", "palm", "bush"].includes(PROPS[k]!); };
export const THIN = Object.keys(PROPS).filter((k) => THIN_KINDS.has(PROPS[k]!) || isThinTree(k)).map((k) => k.split(",").map(Number) as [number, number]);
const THIN_SET = new Set(THIN.map(([x, y]) => `${x},${y}`));
export const TREES = new Set(Object.keys(PROPS).filter((k) => !THIN_SET.has(k))); // tiles sólidos inteiros
/** a caixa do jogador (±0.3 × ±0.2) encosta no pé de algum poste/lixeira/hidrante? */
export function hitsThin(px: number, py: number) {
  const tx = Math.floor(px), ty = Math.floor(py);
  for (let x = tx - 1; x <= tx + 1; x++) for (let y = ty - 1; y <= ty + 1; y++) {
    if (!THIN_SET.has(`${x},${y}`)) continue;
    if (px + 0.3 > x + 0.3 && px - 0.3 < x + 0.7 && py + 0.2 > y + 0.8 && py - 0.2 < y + 0.98) return true;
  }
  return false;
}

/* ---- plantas dos interiores (letras = colisão/interação; ver World.tsx) ---- */
export const CASA = [
  "################",
  "#bb..#...vv....#",
  "#bb..#.........#",
  "#P...#..oooo...#",
  "#....#.........#",
  "#..c...........#",
  "#............m.#",
  "#####..........#",
  "#t.............#",
  "#t.............#",
  "#######E########",
];
export const LOJA = [
  "################",
  "#11.22.33.44.k.#",
  "#11.22.33.44CCC#",
  "#..............#",
  "#..............#",
  "#.SS.SS.SS.....#",
  "#..............#",
  "#..............#",
  "#pp..........pp#",
  "#..............#",
  "#######E########",
];
export const PROCON = [
  "################",
  "#p.....k......p#",
  "#.....CCC......#",
  "#..............#",
  "#..............#",
  "#.oo........oo.#",
  "#..............#",
  "#..............#",
  "#..............#",
  "#p............p#",
  "#######E########",
];
export const ROOM_SOLID = new Set(["#", "b", "P", "v", "o", "c", "m", "t", "S", "C", "k", "p", "E", "1", "2", "3", "4"]);

/* ---- câmera: posição ideal (centralizada na Júlia, presa aos limites do mundo) ---- */
export function cameraTarget(px: number, py: number, vw: number, vh: number, gw: number, gh: number) {
  return { x: Math.max(0, Math.min(gw - vw, px - vw / 2)), y: Math.max(0, Math.min(gh - vh, py - vh / 2)) };
}

/* ---- validação do mundo (usada pelo teste automático) ---- */
export function validateWorld() {
  const problems: string[] = [];
  const solid = (x: number, y: number) => x < 0 || y < 0 || x >= SW || y >= SH || TREES.has(`${x},${y}`) || overBuilding(x, y);
  const flood = (sx: number, sy: number) => {
    const seen = new Set<string>([`${sx},${sy}`]); const q: [number, number][] = [[sx, sy]];
    while (q.length) { const [x, y] = q.pop()!; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) { const nx = x + dx, ny = y + dy, k = `${nx},${ny}`; if (!solid(nx, ny) && !seen.has(k)) { seen.add(k); q.push([nx, ny]); } } }
    return seen;
  };
  const exit = BLDS.find((b) => b.id === "casa")!;
  const seen = flood(exit.door, exit.y + exit.h);
  [...BLDS, ...HOUSES].forEach((b) => { const k = `${b.door},${b.y + b.h}`; if (solid(b.door, b.y + b.h) || !seen.has(k)) problems.push(`porta de ${b.name} inacessível em ${k}`); });
  for (let x = BOARD.x; x < BOARD.x + BOARD.w; x++) if (solid(x, BOARD.y - 1) || !seen.has(`${x},${BOARD.y - 1}`)) problems.push(`frente do outdoor inacessível em ${x},${BOARD.y - 1}`);
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if (!solid(x, y) && !seen.has(`${x},${y}`) && (isRoad(x, y) || isWalk(x, y))) problems.push(`rua/calçada isolada em ${x},${y}`);
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if (!solid(x, y) && !seen.has(`${x},${y}`) && !(isRoad(x, y) || isWalk(x, y))) problems.push(`gramado isolado em ${x},${y}`);
  // todas as ruas se conectam: cada cruzamento é alcançável
  H_ROADS.forEach((a) => V_ROADS.forEach((c) => { if (!seen.has(`${c},${a}`)) problems.push(`cruzamento ${c},${a} isolado`); }));
  // portas nunca bloqueadas por objetos na frente
  [...BLDS, ...HOUSES].forEach((b) => { if (PROPS[`${b.door},${b.y + b.h}`]) problems.push(`objeto bloqueia a porta de ${b.name}`); });
  // interiores: cada item interativo precisa ter um tile livre ao lado, alcançável a partir da porta
  const rooms: Record<string, string[]> = { casa: CASA, loja: LOJA, procon: PROCON };
  for (const [name, rows] of Object.entries(rooms)) {
    const w = rows[0]!.length, h = rows.length, free = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && !ROOM_SOLID.has(rows[y]![x]!);
    const sx = rows[h - 1]!.indexOf("E"), start: [number, number] = [sx, h - 2];
    const s2 = new Set<string>([`${start[0]},${start[1]}`]); const q = [start];
    while (q.length) { const [x, y] = q.pop()!; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) { const nx = x + dx, ny = y + dy; if (free(nx, ny) && !s2.has(`${nx},${ny}`)) { s2.add(`${nx},${ny}`); q.push([nx, ny]); } } }
    // cada tipo de objeto/NPC precisa ter pelo menos uma face alcançável (ex.: a cama é um bloco 2×2)
    const chars = new Set(rows.join("").replace(/[.#k]/g, "")); // o vendedor (k) é atendido pelo balcão (C)
    chars.forEach((c) => {
      let ok = false;
      rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === c && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => s2.has(`${x + dx!},${y + dy!}`))) ok = true; }));
      if (!ok) problems.push(`${name}: '${c}' sem acesso`);
    });
    // pisos soltos só são aceitos atrás do balcão (onde fica o vendedor)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (free(x, y) && !s2.has(`${x},${y}`) && !(y <= 1 && rows[y]!.includes("k"))) problems.push(`${name}: piso isolado em ${x},${y}`);
  }
  return problems;
}
