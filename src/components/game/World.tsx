import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import pJulia from "@/assets/p-julia.png";
import pMae from "@/assets/p-mae.png";
import pVend from "@/assets/p-vendedor.png";
import pProcon from "@/assets/p-procon.png";
import { C1, C4, C5, C7, brl } from "./Challenges";
import { Chuva, Devolucao, Pix, Planilha } from "./Minigames";
import { NPC, PigArt, Sprite, type Dir, type Pal } from "./pixel";
import { renderStreet } from "./art/street";
import { renderRoom } from "./art/rooms";
import { useArt, warmArt } from "./art/useArt";
import { BLDS, BOARD, CASA, FLOWERS, H_ROADS, HOUSES, LOJA, PROCON, PROPS, ROOM_SOLID, SH, SW, TREES, V_ROADS, hitsThin, VIEW_RUA, cameraTarget, inRect, isRoad, isWalk } from "./worldMap";
import { Gabarito } from "./Gabarito";

export const TEAM = ["Leandro Silveira", "Enzo Gabriel", "Nycolas Eduardo"];

/* ================= CENÁRIOS ================= */
type Prod = { id: string; n: string; p: number; e: string; want?: boolean };
const SHOPS: Record<string, Prod[]> = {
  estrela: [{ id: "cad", n: "Pacote com 4 cadernos", p: 60, e: "📒" }, { id: "fich", n: "Fichário de personagem", p: 60, e: "🗂️", want: true }, { id: "glit", n: "Canetas glitter 48 cores", p: 75, e: "✨", want: true }, { id: "lapis", n: "Kit lápis, borracha e caneta", p: 40, e: "✏️" }],
  bairro: [{ id: "cad", n: "Caderno avulso — R$ 14 cada (4 = R$ 56)", p: 56, e: "📒" }, { id: "lapis", n: "Kit lápis, borracha e caneta", p: 25, e: "✏️" }, { id: "chav", n: "Chaveiro fofinho", p: 15, e: "🧸", want: true }],
  mega: [{ id: "cad", n: "LEVE 5 PAGUE 4 — R$ 16 cada", p: 64, e: "📒" }, { id: "moch", n: "Mochila de marca", p: 220, e: "🎒", want: true }, { id: "fone", n: "Fone com LED", p: 90, e: "🎧", want: true }, { id: "estojo", n: "Estojo gamer", p: 70, e: "🎮", want: true }],
  livraria: [{ id: "livro", n: "Livro de inglês (da lista)", p: 180, e: "📘" }, { id: "combo", n: "COMBO livro + fichário — ECONOMIZE!", p: 230, e: "🎁" }, { id: "manga", n: "Mangá volume 1", p: 35, e: "📕", want: true }],
  eletro: [{ id: "calc", n: "Calculadora científica", p: 90, e: "🧮" }, { id: "fone", n: "Fone com LED", p: 90, e: "🎧", want: true }, { id: "mouse", n: "Mouse RGB", p: 120, e: "🖱️", want: true }],
};
const SHOP_NAME: Record<string, string> = { estrela: "Papelaria Estrela", bairro: "Loja do Bairro", mega: "MegaShop", livraria: "Livraria Saber", eletro: "EletroTec", procon: "Procon", casa: "Casa da Júlia" };

type SceneId = "rua" | "casa" | "procon" | keyof typeof SHOPS;
const sceneSize = (s: SceneId) => (s === "rua" ? { w: SW, h: SH } : { w: 16, h: 11 });
const viewSize = (s: SceneId) => (s === "rua" ? VIEW_RUA : { w: 16, h: 11 });
const rowsOf = (s: SceneId) => (s === "casa" ? CASA : s === "procon" ? PROCON : LOJA);

function solidAt(s: SceneId, x: number, y: number) {
  const { w, h } = sceneSize(s);
  if (x < 0 || y < 0 || x >= w || y >= h) return true;
  if (s === "rua") return TREES.has(`${x},${y}`) || BLDS.some((b) => inRect(x, y, b)) || HOUSES.some((b) => inRect(x, y, b)) || inRect(x, y, BOARD);
  return ROOM_SOLID.has(rowsOf(s)[y]![x]!);
}

/* ================= MISSÕES ================= */
const MISSIONS = [
  { t: "Vá até o computador do seu quarto e faça a lista", hint: "O PC fica no quarto, à esquerda. Pare de frente e aperte ESPAÇO." },
  { t: "Use a planilha do PC para fazer as contas", hint: "Saldo = 500 − 95. Cadernos = 4 × 14." },
  { t: "Corrida de preços: visite Estrela, Loja do Bairro e MegaShop!", hint: "As três lojas ficam do lado esquerdo da cidade. O tempo só corre na rua." },
  { t: "Compre 4 cadernos na loja mais barata", hint: "Estrela R$ 60 · Bairro 4×14 · MegaShop 4×16. Qual é o menor?" },
  { t: "Leia o outdoor gigante perto do Procon", hint: "Leia a letra miúda depois do asterisco." },
  { t: "Compre o livro de inglês na Livraria Saber", hint: "O fichário do combo é necessidade ou desejo?" },
  { t: "Veja o preço da calculadora na EletroTec", hint: "A prateleira da calculadora é a primeira da loja." },
  { t: "Vá ao Procon tirar a dúvida da devolução", hint: "A atendente fica atrás da mesa. CDC, artigo 49." },
  { t: "Volte ao PC de casa e devolva a calculadora online", hint: "Motivo: arrependimento. Receba em dinheiro, não em vale." },
  { t: "Compre a calculadora na EletroTec pagando no Pix", hint: "10% de 90 = 9." },
  { t: "Compre o kit lápis na loja mais barata", hint: "Estrela cobra R$ 40, Loja do Bairro R$ 25. E cuidado com o cartão!" },
  { t: "Volte para casa e arrume a mochila (fale com a mãe)", hint: "Pegue só materiais. Fuja de ✨🎧🎮🧸." },
  { t: "Abra o cofre do Tuca com a senha da sobra", hint: "500 − 56 − 180 − 81 − 25." },
];
const TARGET: (string | null)[] = ["casa", "casa", null, "bairro", "board", "livraria", "eletro", "procon", "casa", "eletro", "bairro", "casa", "casa"];
const STAMINA_DRAIN_RATE = 100 / 15;
const STAMINA_RECOVERY_RATE = 5;
const SPRINT_RESTART_THRESHOLD = 25;

/* ================= DIÁLOGO ================= */
type Who = "julia" | "mae" | "vend" | "procon" | "tuca" | "sys";
const PORTRAIT: Record<Who, { name: string; img?: string; emoji?: string }> = {
  julia: { name: "Júlia", img: pJulia }, mae: { name: "Mãe", img: pMae }, vend: { name: "Vendedor", img: pVend },
  procon: { name: "Atendente do Procon", img: pProcon }, tuca: { name: "Tuca, o cofrinho", emoji: "🐷" }, sys: { name: "", emoji: "📜" },
};
type Choice = { t: string; go: () => void };
type Line = { who: Who; text: string; choices?: Choice[] };

type Panel = { title: string; node: (submit: (ok: boolean, msg: string) => void) => ReactNode; onOk?: () => void; pc?: boolean };

export function World() {
  const [screen, setScreen] = useState<"start" | "play" | "final" | "end">("start");
  const [scene, setScene] = useState<SceneId>("casa");
  const [money, setMoney] = useState(405);
  const [inv, setInv] = useState<{ id: string; n: string; e: string; p: number }[]>([{ id: "calcNet", n: "Calculadora (TecNet, lacrada)", e: "📦", p: 95 }]);
  const [m, setM] = useState(0);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [chars, setChars] = useState(0);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [fb, setFb] = useState<{ ok: boolean; msg: string } | null>(null);
  const [pk, setPk] = useState(0);
  const [fade, setFade] = useState(false);
  const [bag, setBag] = useState(false);
  const [visits, setVisits] = useState<Set<string>>(new Set());
  const [race, setRace] = useState(60);
  const [ending, setEnding] = useState<"A" | "B" | null>(null);
  const [gab, setGab] = useState(false);
  const [, force] = useState(0);

  const P = useRef({ x: 7.5, y: 9.5, dir: "up" as Dir, frame: 0, acc: 0, moving: false });
  const keys = useRef(new Set<string>());
  const stamina = useRef(100);
  const sprinting = useRef(false);
  const promos = useRef<Array<{ x: number; y: number; vx: number; min: number; max: number; axis: "x" | "y" }>>([
    { x: 2, y: 6.5, vx: 2.2, min: 0.6, max: 10.4, axis: "x" }, { x: 18, y: 9.5, vx: -2.4, min: 14.6, max: 46.4, axis: "x" },
    { x: 11.5, y: 2, vx: 2, min: 0.6, max: 42.4, axis: "y" }, { x: 5, y: 18.5, vx: 2, min: 0.6, max: 10.4, axis: "x" },
    { x: 30, y: 15.5, vx: 2.2, min: 26.6, max: 58.4, axis: "x" }, { x: 35.5, y: 12, vx: -2, min: 8.6, max: 40.4, axis: "y" },
    { x: 20, y: 24.5, vx: 2.3, min: 14.6, max: 46.4, axis: "x" }, { x: 5, y: 33.5, vx: -2, min: 0.6, max: 10.4, axis: "x" },
    { x: 47.5, y: 30, vx: 2, min: 2.6, max: 42.4, axis: "y" }, { x: 30, y: 42.5, vx: 2.4, min: 14.6, max: 58.4, axis: "x" },
  ]);
  const promoCd = useRef(0);
  const cam = useRef({ x: 0, y: 0, scene: "casa" as SceneId });
  const onEnd = useRef<(() => void) | null>(null);
  const S = useRef({ scene, lines, panel, screen, m, fade, bag, race, visits });
  S.current = { scene, lines, panel, screen, m, fade, bag, race, visits };

  const busy = lines.length > 0 || !!panel || fade || bag;

  /* --- utilidades --- */
  const talk = useCallback((ls: Line[], end?: () => void) => { onEnd.current = end ?? null; setChars(0); setLines(ls); }, []);
  const advance = useCallback(() => {
    const cur = S.current.lines[0];
    if (!cur) return;
    if (chars < cur.text.length) return setChars(cur.text.length);
    if (cur.choices) return;
    const rest = S.current.lines.slice(1);
    setChars(0); setLines(rest);
    if (!rest.length) { const f = onEnd.current; onEnd.current = null; f?.(); }
  }, [chars]);
  useEffect(() => {
    const cur = lines[0]; if (!cur || chars >= cur.text.length) return;
    const t = setTimeout(() => setChars((c) => c + 2), 18);
    return () => clearTimeout(t);
  }, [lines, chars]);

  const award = useCallback(() => {
    setScore((s) => s + Math.max(30, 100 - errors * 30 - (hintUsed ? 20 : 0)));
    setErrors(0); setHintUsed(false); setM((x) => x + 1);
  }, [errors, hintUsed]);
  const fail = (msg: string) => { setErrors((e) => e + 1); talk([{ who: "tuca", text: `✘ ${msg}` }]); };
  const win = (msg: string, after?: () => void) => { award(); talk([{ who: "tuca", text: `✔ ${msg}` }], after); };

  const openPanel = (p: Panel) => { setFb(null); setPk((k) => k + 1); setPanel(p); };
  const submit = useCallback((ok: boolean, msg: string) => { setFb({ ok, msg }); if (!ok) setErrors((e) => e + 1); }, []);
  const closePanel = () => {
    const ok = fb?.ok; const p = panel;
    setPanel(null); setFb(null);
    if (ok) { award(); p?.onOk?.(); }
  };

  const go = (to: SceneId, x: number, y: number, dir: Dir) => {
    setFade(true);
    setTimeout(() => { setScene(to); P.current = { ...P.current, x, y, dir }; setFade(false); }, 260);
  };
  const enter = (id: SceneId) => go(id, 7.5, 9.5, "up");
  const exitTo = (id: string) => {
    if (id === "board") return;
    const b = BLDS.find((b) => b.id === id)!;
    // anti "guarda-caixão": vendedores voltam à rota e Júlia ganha 3s de folga ao sair
    for (const n of promos.current as Array<{ x: number; y: number; chase?: boolean; hx?: number; hy?: number }>) {
      n.chase = false; if (n.hx !== undefined && n.hy !== undefined) { n.x = n.hx; n.y = n.hy; }
    }
    promoCd.current = Math.max(promoCd.current, 3);
    go("rua", b.door + 0.5, b.top ? b.y + b.h + 0.5 : b.y - 0.5, b.top ? "down" : "up");
  };

  /* --- intro --- */
  const auto = useRef<null | { pts: [number, number][]; face?: Dir | undefined; done: () => void }>(null);
  const [cine, setCine] = useState(false);
  const walk = (pts: [number, number][], face: Dir | undefined, done: () => void) => { auto.current = { pts, face, done }; };
  const start = () => {
    keys.current.clear(); sprinting.current = false; stamina.current = 100;
    warmArt([...ROOM_IDS.map((id) => [`room:${id}`, () => makeRoom(id)] as [string, () => unknown]), ["rua", makeStreet]]);
    setScreen("play"); setScene("casa"); setCine(true); setFade(true);
    P.current = { x: 7.5, y: 10.3, dir: "up", frame: 0, acc: 0, moving: false };
    setTimeout(() => setFade(false), 500);
    setTimeout(() => talk([{ who: "sys", text: "Segunda-feira, 17h. A porta abre. Júlia chega da escola com a lista de materiais na mão." }], () =>
      walk([[7.5, 8.5], [7.5, 6.5], [11.5, 6.5]], "right", () => talk([
        { who: "julia", text: "Cheguei! Mãe, consegui juntar os R$ 500 pro material escolar!" },
        { who: "mae", text: "Que orgulho, filha! Mas cuidado: a cidade tá cheia de “A PROMOÇÃO TERMINA HOJE”..." },
        { who: "julia", text: "Hmm... ontem eu já comprei uma calculadora no site TecNet por R$ 95. Ainda nem abri a caixa." },
        { who: "mae", text: "Então você tem R$ 405 na carteira. Vai no seu computador, faz a lista e as contas antes de sair." },
        { who: "julia", text: "Beleza! Vou pro meu quarto." },
      ], () => walk([[7.5, 6.5], [2.5, 6.5], [2.5, 3.5]], "left", () => talk([
        { who: "julia", text: "Meu PC... hora de organizar tudo antes de gastar um centavo." },
        { who: "tuca", text: "Oinc! Eu sou o Tuca, seu cofrinho. Ande com WASD/setas, SHIFT corre e ESPAÇO interage. Agora é com você!" },
      ], () => setCine(false)))))), 900);
  };

  /* --- compras --- */
  const buyProd = (shop: string, p: Prod) => {
    if (p.want) return talk([
      { who: "vend", text: `${p.e} ${p.n} por ${brl(p.p)}! Leva, vai, tá voando!` },
      { who: "julia", text: "Hmm... isso tá na minha lista?", choices: [
        { t: "Comprar mesmo assim", go: () => fail(`${p.n} é DESEJO! Gastaria ${brl(p.p)} do dinheiro do material. Tuca segurou sua mão.`) },
        { t: "Deixar na prateleira", go: () => talk([{ who: "tuca", text: "Boa! Desejo pode esperar. O dinheiro é do material." }]) },
      ] },
    ]);
    const cur = S.current.m;
    if (p.id === "cad") {
      if (cur === 2) return talk([{ who: "julia", text: `Anotado: aqui ${p.n.toLowerCase()} ${p.id === "cad" && shop === "estrela" ? "por R$ 60" : ""}. Primeiro termino a pesquisa!` }]);
      if (cur !== 3) return talk([{ who: "julia", text: inv.some((i) => i.id === "cad") ? "Já comprei meus cadernos." : "Antes preciso pesquisar." }]);
      if (shop === "estrela") return fail("Pacote nem sempre é mais barato: R$ 60 ÷ 4 = R$ 15 cada. Na Loja do Bairro sai R$ 14. Tente de novo!");
      if (shop === "mega") return fail("“Leve 5 pague 4” = 4 × R$ 16 = R$ 64 e um caderno que nem precisa. Tente de novo!");
      setMoney((x) => x - 56); setInv((i) => [...i, { id: "cad", n: "4 cadernos", e: "📒", p: 56 }]);
      return win("4 × R$ 14 = R$ 56, o menor total! Estrela: R$ 60. MegaShop: R$ 64. Comparar preço por unidade economiza.");
    }
    if (p.id === "combo") return cur === 5 ? fail("O combo custa R$ 230: R$ 50 a mais por um fichário que é DESEJO. “Economize” só vale se você precisasse dos dois!") : talk([{ who: "julia", text: "Combo? Não preciso disso." }]);
    if (p.id === "livro") {
      if (cur !== 5) return talk([{ who: "julia", text: cur < 5 ? "Uma coisa de cada vez. Primeiro a missão atual!" : "Já tenho o livro." }]);
      setMoney((x) => x - 180); setInv((i) => [...i, { id: "livro", n: "Livro de inglês", e: "📘", p: 180 }]);
      return win("R$ 180 só no necessário. O combo parecia vantagem, mas era um desejo embrulhado de oferta.");
    }
    if (p.id === "calc") {
      if (cur === 6) return talk([
        { who: "vend", text: "Calculadora científica: R$ 90. E no Pix tem 10% de desconto!" },
        { who: "julia", text: "QUÊ?! Eu paguei R$ 95 nela no site ontem... e ainda nem abri a caixa." },
        { who: "julia", text: "Será que eu posso devolver? Vou perguntar no Procon!" },
      ], () => { award(); });
      if (cur !== 9) return talk([{ who: "julia", text: cur < 6 ? "Já tenho uma calculadora (a do site)... por enquanto." : cur < 9 ? "Primeiro preciso resolver a devolução da outra." : "Já comprei." }]);
      return openPanel({ title: "Caixa · EletroTec", node: (s) => <Pix submit={s} />, onOk: () => { setMoney((x) => x - 81); setInv((i) => [...i, { id: "calc", n: "Calculadora (Pix)", e: "🧮", p: 81 }]); } });
    }
    if (p.id === "lapis") {
      if (cur !== 10) return talk([{ who: "julia", text: cur < 10 ? "Kit lápis... deixo pra depois, uma missão por vez." : "Já tenho." }]);
      if (shop === "estrela") return fail("Aqui o kit custa R$ 40. Na Loja do Bairro custa R$ 25 — R$ 15 mais barato!");
      return talk([
        { who: "vend", text: "Kit lápis: R$ 25. Faz o cartão da loja? Ganha R$ 15 de desconto HOJE! Só tem anuidade de R$ 12 por mês." },
        { who: "julia", text: "Desconto agora, mas pagar todo mês... deixa eu pensar.", choices: [
          { t: "💳 Aceitar o cartão", go: () => fail("Economizaria R$ 15 hoje, mas pagaria 12 × R$ 12 = R$ 144 no ano. Prejuízo de R$ 129!") },
          { t: "🙅 Recusar e pagar R$ 25", go: () => { setMoney((x) => x - 25); setInv((i) => [...i, { id: "lapis", n: "Kit lápis", e: "✏️", p: 25 }]); win("Recusou! Desconto pequeno não compensa R$ 144/ano de anuidade."); } },
        ] },
      ]);
    }
  };

  /* --- interação (ESPAÇO) --- */
  const interact = () => {
    const p = P.current; const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir];
    const tx = Math.floor(p.x + d[0]! * 0.8), ty = Math.floor(p.y + d[1]! * 0.8);
    const cur = S.current.m;
    if (scene === "rua") {
      if (inRect(tx, ty, BOARD)) {
        if (cur === 4) return openPanel({ title: "📢 Outdoor da MegaShop", node: (s) => <C4 submit={s} /> });
        return talk([{ who: "sys", text: "“ÚLTIMA CHANCE! 70% OFF*” — tem algo escrito bem pequenininho lá embaixo..." }]);
      }
      const hz = HOUSES.find((h) => inRect(tx, ty, h));
      if (hz) return talk([{ who: "julia", text: hz.name.startsWith("CASA") ? "Não é a minha casa. Melhor não incomodar." : `${hz.name} — fechado por hoje. Não está na minha lista.` }]);
      const b = BLDS.find((b) => inRect(tx, ty, b));
      if (!b) return;
      const doorY = b.top ? b.y + b.h - 1 : b.y;
      if (ty !== doorY || p.dir !== (b.top ? "up" : "down")) return talk([{ who: "julia", text: b.top ? "A entrada fica na frente, pela calçada." : "A entrada fica do lado da calçada de cima." }]);
      if (tx !== b.door) return talk([{ who: "julia", text: `${SHOP_NAME[b.id]}... a porta é no meio.` }]);
      if (cur === 2 && ["estrela", "bairro", "mega"].includes(b.id)) {
        const v = new Set(S.current.visits).add(b.id); setVisits(v);
        const price: Record<string, string> = { estrela: "Pacote com 4 cadernos: R$ 60", bairro: "Caderno avulso: R$ 14 cada", mega: "LEVE 5 PAGUE 4: R$ 16 cada" };
        enter(b.id as SceneId);
        setTimeout(() => talk([{ who: "vend", text: `Bem-vinda! ${price[b.id]}!` }, { who: "julia", text: `Anotado! (${v.size}/3)` }], () => {
          if (v.size >= 3) win("Pesquisa completa! Agora dá pra comparar de verdade.", () => setRace(60));
        }), 320);
        return;
      }
      return enter(b.id as SceneId);
    }
    const ch = rowsOf(scene)[ty]?.[tx];
    if (!ch) return;
    if (ch === "E") return exitTo(scene);
    if (scene === "casa") {
      if (ch === "P") {
        if (cur === 0) return openPanel({ pc: true, title: "JúliaOS · Lista.txt", node: (s) => <C1 submit={s} />, onOk: () => openPanel({ pc: true, title: "JúliaOS · Orcamento.xls", node: (s) => <Planilha submit={s} /> }) });
        if (cur === 1) return openPanel({ pc: true, title: "JúliaOS · Orcamento.xls", node: (s) => <Planilha submit={s} /> });
        if (cur === 8) return openPanel({ pc: true, title: "TecNet · Minhas compras", node: (s) => <Devolucao submit={s} />, onOk: () => { setMoney((x) => x + 95); setInv((i) => i.filter((x) => x.id !== "calcNet")); } });
        return talk([{ who: "julia", text: "Meu PC. Nada pra fazer aqui agora." }]);
      }
      if (ch === "m") {
        if (cur === 11) return talk([{ who: "mae", text: "Chegou! Vamos arrumar a mochila? Só entra o que é da lista!" }], () => openPanel({ title: "🎒 Chuva de Ofertas", node: (s) => <Chuva submit={s} /> }));
        if (cur === 1) return talk([{ who: "mae", text: "Faz as contas na planilha do PC antes de sair!" }]);
        if (cur >= 2 && cur <= 10) return talk([{ who: "mae", text: `Missão agora: ${MISSIONS[cur]!.t.toLowerCase()}.` }]);
        return talk([{ who: "mae", text: cur === 0 ? "O computador fica no seu quarto, filha." : "O Tuca tá te esperando!" }]);
      }
      if (ch === "c") {
        if (cur === 12) return openPanel({ title: "🐷 Cofre do Tuca", node: (s) => <C7 submit={s} />, onOk: () => setTimeout(() => setScreen("final"), 200) });
        return talk([{ who: "tuca", text: "Oinc! Eu só abro no final, com a senha da sobra." }]);
      }
      if (ch === "b") return talk([{ who: "julia", text: "Minha cama... sem tempo pra cochilo!" }]);
      if (ch === "v") return talk([{ who: "sys", text: "📺 “SÓ HOJE! LIQUIDAÇÃO! CORRA!” — Júlia desliga a TV." }]);
      return;
    }
    if (scene === "procon") {
      if (ch === "C" || ch === "k") {
        if (cur === 7) return talk([{ who: "procon", text: "Olá! Em que posso ajudar?" }, { who: "julia", text: "Comprei uma calculadora pela internet há 2 dias e achei mais barata. Posso devolver?" }], () => openPanel({ title: "⚖️ Procon", node: (s) => <C5 submit={s} /> }));
        return talk([{ who: "procon", text: "O Procon defende o consumidor. Leia sempre a letra miúda e guarde a nota fiscal!" }]);
      }
      return;
    }
    const prods = SHOPS[scene]!;
    if (ch >= "1" && ch <= "4") {
      const p = prods[Number(ch) - 1];
      if (!p) return talk([{ who: "sys", text: "Prateleira cheia de enfeites que piscam. Nada da lista." }]);
      return talk([{ who: "sys", text: `${p.e} ${p.n} — ${brl(p.p)}`, choices: [{ t: "Pegar e pagar", go: () => buyProd(scene, p) }, { t: "Voltar", go: () => {} }] }]);
    }
    if (ch === "C" || ch === "k") return talk([{ who: "vend", text: scene === "mega" ? "Aproveita! Tudo acaba HOJE! (acaba todo dia...)" : `Bem-vinda à ${SHOP_NAME[scene]}! Os produtos estão nas prateleiras do fundo.` }]);
  };

  const toggleSprint = () => {
    if (sprinting.current) {
      sprinting.current = false;
      return;
    }
    if (stamina.current < SPRINT_RESTART_THRESHOLD) return;
    if (S.current.lines.length || S.current.panel || S.current.fade || S.current.bag) return;
    sprinting.current = true;
  };
  const inputActions = useRef({ advance, interact, toggleSprint });
  inputActions.current = { advance, interact, toggleSprint };

  /* --- teclado --- */
  useEffect(() => {
    if (screen !== "play") return;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "shift") {
        e.preventDefault();
        if (!e.repeat) inputActions.current.toggleSprint();
        return;
      }
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k) && !(e.target instanceof HTMLInputElement)) e.preventDefault();
      if (k === " " || k === "enter" || k === "e") {
        if (e.target instanceof HTMLInputElement) return;
        if (S.current.lines.length) return inputActions.current.advance();
        if (!S.current.panel && !S.current.fade && !S.current.bag) inputActions.current.interact();
        return;
      }
      keys.current.add(k);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const clearKeys = () => { keys.current.clear(); sprinting.current = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    window.addEventListener("blur", clearKeys);
    return () => {
      window.removeEventListener("keydown", down); window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clearKeys); clearKeys();
    };
  }, [screen]);

  /* --- loop do jogo --- */
  useEffect(() => {
    if (screen !== "play") return;
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const elapsed = Math.max(0, (now - last) / 1000);
      const dt = Math.min(0.05, elapsed); last = now;
      const st = S.current; const p = P.current; const k = keys.current;
      const free = !st.lines.length && !st.panel && !st.fade && !st.bag;
      let dx = 0, dy = 0;
      const ap = auto.current;
      if (ap && !st.lines.length && !st.fade) {
        const w = ap.pts[0]!; const ddx = w[0] - p.x, ddy = w[1] - p.y; const dist = Math.hypot(ddx, ddy);
        if (dist < 0.08) { p.x = w[0]; p.y = w[1]; ap.pts.shift(); if (!ap.pts.length) { auto.current = null; if (ap.face) p.dir = ap.face; ap.done(); } }
        else { const sp = Math.min(dist, 2.6 * dt); p.x += (ddx / dist) * sp; p.y += (ddy / dist) * sp; p.dir = Math.abs(ddx) > Math.abs(ddy) ? (ddx < 0 ? "left" : "right") : ddy < 0 ? "up" : "down"; p.acc += dt * 8; p.frame = 1 + (Math.floor(p.acc) % 2); p.moving = true; }
      }
      if (free && !auto.current) {
        if (k.has("arrowleft") || k.has("a")) dx -= 1;
        if (k.has("arrowright") || k.has("d")) dx += 1;
        if (k.has("arrowup") || k.has("w")) dy -= 1;
        if (k.has("arrowdown") || k.has("s")) dy += 1;
      }
      if (!auto.current) p.moving = !!(dx || dy);
      if (!free || auto.current) sprinting.current = false;
      const sprintingNow = sprinting.current && free && !auto.current && p.moving && stamina.current > 0;
      const startX = p.x, startY = p.y;
      if (auto.current) { /* cutscene */ } else if (p.moving) {
        p.dir = dx ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down";
        if (dx && dy) { dx *= 0.707; dy *= 0.707; }
        const sp = (sprintingNow ? 6.5 : 4) * dt;
        const ok = (x: number, y: number) => ![[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]].some(([ox, oy]) => solidAt(st.scene, Math.floor(x + ox!), Math.floor(y + oy!))) && !(st.scene === "rua" && hitsThin(x, y));
        const moveAxis = (axis: "x" | "y", amount: number) => {
          const steps = Math.ceil(Math.abs(amount) / 0.1);
          const step = amount / steps;
          for (let i = 0; i < steps; i++) {
            const x = p.x + (axis === "x" ? step : 0);
            const y = p.y + (axis === "y" ? step : 0);
            if (!ok(x, y)) break;
            p.x = x; p.y = y;
          }
        };
        if (dx) moveAxis("x", dx * sp);
        if (dy) moveAxis("y", dy * sp);
        p.acc += dt * (sprintingNow ? 14 : 9); p.frame = 1 + (Math.floor(p.acc) % 2);
      } else if (!auto.current) p.frame = 0;
      if (sprintingNow && (p.x !== startX || p.y !== startY)) {
        stamina.current = Math.max(0, stamina.current - elapsed * STAMINA_DRAIN_RATE);
        if (stamina.current === 0) sprinting.current = false;
      } else if (!sprintingNow) {
        stamina.current = Math.min(100, stamina.current + dt * STAMINA_RECOVERY_RATE);
      }

      if (st.scene !== "rua") for (const n of promos.current as Array<{ chase?: boolean }>) n.chase = false;
      if (st.scene === "rua" && free) {
        for (const n of promos.current as Array<(typeof promos.current)[number] & { chase?: boolean; hx?: number; hy?: number; fx?: number; fy?: number }>) {
          const d = Math.hypot(p.x - n.x, p.y - n.y);
          if (n.hx === undefined) { n.hx = n.x; n.hy = n.y; }
          if (st.m >= 2 && promoCd.current <= 0 && d < 3.5) n.chase = true;
          if (n.chase && (d > 5 || promoCd.current > 0)) n.chase = false;
          if (n.chase) {
            const sp = 2.8 * dt; const ux = (p.x - n.x) / (d || 1), uy = (p.y - n.y) / (d || 1);
            if (!solidAt("rua", Math.floor(n.x + ux * sp), Math.floor(n.y))) n.x += ux * sp;
            if (!solidAt("rua", Math.floor(n.x), Math.floor(n.y + uy * sp))) n.y += uy * sp;
            n.fx = ux; n.fy = uy;
          } else {
            const back = n.axis === "x" ? n.hy! - n.y : n.hx! - n.x;
            if (Math.abs(back) > 0.05) { const s = Math.sign(back) * Math.min(Math.abs(back), 2 * dt); if (n.axis === "x") n.y += s; else n.x += s; }
            else if (n.axis === "x") { n.x += n.vx * dt; if (n.x < n.min || n.x > n.max) { n.vx *= -1; n.x = Math.max(n.min, Math.min(n.max, n.x)); } }
            else { n.y += n.vx * dt; if (n.y < n.min || n.y > n.max) { n.vx *= -1; n.y = Math.max(n.min, Math.min(n.max, n.y)); } }
            delete n.fx;
          }
        }
        promoCd.current -= dt;
        const hit = promos.current.find((n) => Math.hypot(n.x - p.x, n.y - p.y) < 0.75);
        if (hit && promoCd.current <= 0 && st.m >= 2) {
          promoCd.current = 3;
          for (const n of promos.current as Array<{ chase?: boolean }>) n.chase = false;
          const pitch = ["ÚLTIMAS UNIDADES! SÓ HOJE!", "LEVE 3 PAGUE 2! NÃO PENSA, SÓ LEVA!", "CARTÃO NOVO COM DESCONTO! ASSINA AQUI!", "70% OFF*! *em produtos selecionados..."];
          setScore((s) => Math.max(0, s - 10));
          talk([{ who: "vend", text: pitch[Math.floor(Math.random() * pitch.length)]! }, { who: "tuca", text: "Ufa, escapamos! Panfleteiro pegou: −10 pontos. Fuja deles na rua!" }]);
        }
        if (st.m === 2) {
          const r = st.race - dt;
          if (r <= 0) { setRace(60); setVisits(new Set()); setErrors((e) => e + 1); talk([{ who: "tuca", text: "✘ O tempo acabou! A pesquisa recomeça. Dica: as três lojas ficam do lado esquerdo — corra com SHIFT." }]); }
          else setRace(r);
        }
      }
      { // câmera: segue a Júlia com suavização e fica presa aos limites do mundo (nunca mostra área vazia)
        const vs = viewSize(st.scene), gs = sceneSize(st.scene), tg = cameraTarget(p.x, p.y, vs.w, vs.h, gs.w, gs.h), cm = cam.current;
        if (cm.scene !== st.scene) { cm.x = tg.x; cm.y = tg.y; cm.scene = st.scene; }
        else { const kk = 1 - Math.exp(-dt * 9); cm.x += (tg.x - cm.x) * kk; cm.y += (tg.y - cm.y) * kk; }
      }
      force((f) => (f + 1) % 1000000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [screen, talk]);

  const restart = () => {
    // Reinício completo: não carregar penalidades, diálogos ou controles presos da partida anterior.
    keys.current.clear();
    sprinting.current = false; stamina.current = 100;
    auto.current = null;
    onEnd.current = null;
    setScreen("start"); setScene("casa"); setMoney(405);
    setInv([{ id: "calcNet", n: "Calculadora (TecNet, lacrada)", e: "📦", p: 95 }]);
    setM(0); setScore(0); setErrors(0); setHintUsed(false); setVisits(new Set());
    setRace(60); setEnding(null); setLines([]); setPanel(null); setFb(null);
    setBag(false); setCine(false); setFade(false); setGab(false);
    P.current = { x: 7.5, y: 9.5, dir: "up", frame: 0, acc: 0, moving: false };
    cam.current = { x: 0, y: 0, scene: "casa" };
  };

  const { w: GW, h: GH } = sceneSize(scene);
  const { w: VW, h: VH } = viewSize(scene);
  const tiles = useMemo(() => <Tiles scene={scene} />, [scene]);

  /* ================= TELAS ================= */
  if (screen === "start") return <TitleScreen onStart={start} />;

  if (screen === "final") return (
    <main className="crt grid min-h-screen place-items-center bg-background p-4">
      <section className="pixel-box w-full max-w-2xl p-6">
        <h2 className="font-pixel text-lg text-primary">DECISÃO FINAL</h2>
        <div className="my-4 border-4 border-accent bg-card p-4">
          <div className="text-xs text-muted-foreground">📱 MegaShop · agora</div>
          <b>🔥 MOCHILA DE MARCA de R$ 220 por R$ 150! Só nos próximos 30 minutos!</b>
        </div>
        <p className="leading-7">Júlia comprou tudo e tem <b className="text-primary">{brl(money)}</b> no cofre. A mochila dela ainda está boa. O que ela faz?</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button className="btn h-auto flex-col py-5" onClick={() => { setEnding("A"); setScreen("end"); }}><span className="text-3xl">⚡</span><b>A) Comprar agora</b><span className="text-sm font-normal">antes que acabe</span></button>
          <button className="btn btn-primary h-auto flex-col py-5" onClick={() => { setEnding("B"); setScore((s) => s + 100); setScreen("end"); }}><span className="text-3xl">🐷</span><b>B) Esperar e guardar</b><span className="text-sm font-normal">a mochila ainda serve</span></button>
        </div>
      </section>
    </main>
  );

  if (screen === "end") return (
    <main className="crt grid min-h-screen place-items-center bg-background p-4">
      <section className="pixel-box w-full max-w-2xl p-6">
        <h2 className="font-pixel text-lg text-primary">{ending === "B" ? "FINAL BOM" : "FINAL RUIM"}</h2>
        <div className="my-4 flex items-center gap-4">
          <img src={pJulia} alt="Júlia" width={816} height={816} className="h-28 w-28 border-4 border-primary bg-card pixelated" />
          <p className="leading-7">{ending === "B"
            ? `Júlia guardou ${brl(money)}. Três meses depois, a mesma mochila estava R$ 120 — e ela pagou à vista sem aperto, ainda sobrando dinheiro.`
            : `Júlia gastou R$ 150 e ficou com ${brl(money - 150)}. No mês seguinte, faltou dinheiro para o passeio da escola e ela teve que pedir emprestado.`}</p>
        </div>
        <div className="border-2 border-border bg-card p-4">
          <p className="font-pixel text-[10px] text-accent">APRENDIZADO</p>
          <p className="mt-2 leading-7">“Termina hoje” cria pressa para você não pensar. Lista, contas, comparação de preços, direito de arrependimento e paciência protegem o seu dinheiro.</p>
        </div>
        <p className="font-pixel mt-4 text-xs">PONTOS: {score}</p>
        <p className="mt-2 text-sm">Equipe: {TEAM.join(" · ")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn btn-primary font-pixel text-xs" onClick={restart}>↺ JOGAR DE NOVO</button>
          <button className="btn font-pixel text-xs" onClick={() => setGab(true)}>GABARITO</button>
        </div>
        {gab && <Gabarito onClose={() => setGab(false)} />}
      </section>
    </main>
  );

  /* ================= JOGO ================= */
  const p = P.current;
  const T = "var(--t)";
  const tgt = TARGET[m];
  let arrow: [number, number] | null = null;
  if (scene === "rua") {
    if (tgt === "board") arrow = [BOARD.x + 1.5, BOARD.y - 1];
    else if (tgt) { const b = BLDS.find((b) => b.id === tgt)!; arrow = [b.door, b.top ? b.y + b.h - 1.6 : b.y - 1]; }
    else if (m === 2) arrow = null;
  } else if (scene === tgt || (m === 9 && scene === "eletro")) {
    const r = rowsOf(scene);
    const want = scene === "casa" ? (m <= 1 || m === 8 ? "P" : m === 11 ? "m" : "c") : scene === "procon" ? "k" : scene === "eletro" || scene === "livraria" ? "1" : m === 10 ? "2" : "1";
    r.forEach((row, y) => { const x = row.indexOf(want); if (x >= 0 && !arrow) arrow = [x, y - 1]; });
  } else if (scene !== "rua") { const x = rowsOf(scene)[10]!.indexOf("E"); arrow = [x, 9]; }

  const cur = lines[0];
  const staminaPercent = Math.round(stamina.current);
  return (
    <main className="crt fixed inset-0 overflow-hidden bg-background" style={{ ["--t" as string]: `min(calc((100vw - 8px) / ${VW}), calc((100dvh - 92px) / ${VH}))` }}>
      {/* HUD */}
      <div className="flex h-[84px] flex-col justify-center gap-1 px-2">
        <div className="flex flex-wrap items-center gap-2 font-pixel text-[10px]">
          <span className="hud">💰 {brl(money)}</span>
          <span className="hud">⭐ {score}</span>
          <span className="hud">MISSÃO {Math.min(m + 1, MISSIONS.length)}/{MISSIONS.length}</span>
          <div className="hud h-4 min-w-20 flex-1 p-0"><div className="h-full bg-primary transition-all" style={{ width: `${(m / MISSIONS.length) * 100}%` }} /></div>
          {m === 2 && scene === "rua" && <span className="hud text-destructive">⏱ {Math.ceil(race)}s · {visits.size}/3</span>}
          <button className="hud" onClick={() => setBag(true)}>🎒 {inv.length}</button>
          <div className="hud flex items-center gap-1.5" role="progressbar" aria-label="Stamina para correr" aria-valuemin={0} aria-valuemax={100} aria-valuenow={staminaPercent} title="Stamina para correr">
            <span aria-hidden="true">⚡</span>
            <div className="h-2 w-16 overflow-hidden border border-border bg-muted">
              <div className={`h-full ${staminaPercent > 60 ? "bg-success" : staminaPercent > 30 ? "bg-accent" : "bg-destructive"}`} style={{ width: `${staminaPercent}%` }} />
            </div>
            <span>{staminaPercent}%</span>
          </div>
          <button className="hud" onClick={() => { if (!hintUsed) setHintUsed(true); talk([{ who: "tuca", text: `Dica: ${MISSIONS[m]?.hint ?? ""}${hintUsed ? "" : " (−20 nesta missão)"}` }]); }}>🐷 DICA</button>
        </div>
        <div className="hud w-full truncate !text-[11px] sm:!text-xs">🎯 <b>{MISSIONS[m]?.t}</b> <span className="text-muted-foreground">· {scene === "rua" ? "Cidade" : SHOP_NAME[scene]}</span></div>
      </div>
      {cine && <><div className="pointer-events-none fixed inset-x-0 top-0 z-[964] h-[9vh] bg-black" /><div className="pointer-events-none fixed inset-x-0 bottom-0 z-[964] h-[9vh] bg-black" /></>}

      {/* Mapa */}
      <div className="relative mx-auto overflow-hidden border-4 border-primary" style={{ width: `calc(${T} * ${VW})`, height: `calc(${T} * ${VH})` }}>
        <div className="absolute left-0 top-0" style={{ width: `calc(${T} * ${GW})`, height: `calc(${T} * ${GH})`, transform: `translate3d(calc(${T} * ${-Math.round(cam.current.x * 32) / 32}), calc(${T} * ${-Math.round(cam.current.y * 32) / 32}), 0)`, willChange: "transform" }}>
        {tiles}
        {scene !== "rua" && <RoomNPCs scene={scene} />}
        {scene === "rua" && promos.current.map((n, i) => { const q = n as typeof n & { chase?: boolean; fx?: number; fy?: number };
          const dir = q.chase && q.fx !== undefined ? (Math.abs(q.fx) > Math.abs(q.fy!) ? (q.fx < 0 ? "left" : "right") : q.fy! < 0 ? "up" : "down") : n.axis === "x" ? (n.vx < 0 ? "left" : "right") : n.vx < 0 ? "up" : "down";
          return <div key={i}>
          <Sprite dir={dir} frame={1 + (Math.floor(performance.now() / (q.chase ? 100 : 160)) % 2)} pal={NPC.promo}
            className="absolute" style={{ left: `calc(${T} * ${n.x - 0.5})`, top: `calc(${T} * ${n.y - 1.15})`, width: T, height: `calc(${T} * 1.5)`, zIndex: Math.floor(n.y * 10) }} />
          {q.chase && <div className="bob pointer-events-none absolute grid place-items-center border-2 border-foreground bg-card font-pixel text-destructive" style={{ left: `calc(${T} * ${n.x - 0.25})`, top: `calc(${T} * ${n.y - 1.75})`, width: `calc(${T} * .5)`, height: `calc(${T} * .5)`, fontSize: `calc(${T} * .3)`, zIndex: 945 }}>!</div>}
          </div>; })}
        {arrow && <div className="bob pointer-events-none absolute grid place-items-center text-destructive" style={{ left: `calc(${T} * ${arrow[0]})`, top: `calc(${T} * ${arrow[1]})`, width: T, height: T, fontSize: `calc(${T} * .7)`, zIndex: 940, textShadow: "0 3px 0 #000, 0 0 12px #ff3d5a" }}>⬇</div>}
        <Sprite dir={p.dir} frame={p.frame} className="absolute"
          style={{ left: `calc(${T} * ${p.x - 0.5})`, top: `calc(${T} * ${p.y - 1.15})`, width: T, height: `calc(${T} * 1.5)`, zIndex: Math.floor(p.y * 10) + 1 }} />
        </div>
        <div className={`pointer-events-none absolute inset-0 bg-background transition-opacity duration-200 ${fade ? "opacity-100" : "opacity-0"}`} style={{ zIndex: 950 }} />
      </div>

      {/* Controles de toque */}
      <div className="pointer-events-none fixed bottom-3 left-3 right-3 z-[960] flex items-end justify-between md:hidden">
        <div className="pointer-events-auto grid grid-cols-3 gap-1 opacity-80">
          {([["", ""], ["▲", "arrowup"], ["", ""], ["◀", "arrowleft"], ["▼", "arrowdown"], ["▶", "arrowright"]] as const).map(([l, k], i) => l
            ? <button key={i} className="btn h-12 w-12 p-0" onPointerDown={() => keys.current.add(k)} onPointerUp={() => keys.current.delete(k)} onPointerLeave={() => keys.current.delete(k)} onPointerCancel={() => keys.current.delete(k)} onLostPointerCapture={() => keys.current.delete(k)}>{l}</button>
            : <span key={i} />)}
        </div>
        <div className="pointer-events-auto flex gap-2 opacity-80">
          <button className="btn h-12 px-3 font-pixel text-[10px]" aria-pressed={sprinting.current} onClick={() => inputActions.current.toggleSprint()}>{sprinting.current ? "PARAR" : "CORRER"}</button>
          <button className="btn btn-primary h-14 w-14 rounded-full p-0 font-pixel" onClick={() => (lines.length ? advance() : !busy && interact())}>A</button>
        </div>
      </div>

      {/* Diálogo estilo TCOAAL */}
      {cur && (
        <div className="fixed inset-x-0 bottom-0 z-[980] p-3" onClick={advance}>
          <div className="relative mx-auto flex max-w-4xl items-end">
            {(() => {
              const partner = (lines.find((l) => l.who === "mae" || l.who === "vend" || l.who === "procon")?.who) as "mae" | "vend" | "procon" | undefined;
              const juliaIn = lines.some((l) => l.who === "julia") || !!partner;
              return (["julia", "mae", "vend", "procon"] as const).map((w) => {
                const present = w === "julia" ? juliaIn : w === partner;
                const speaking = cur.who === w;
                return PORTRAIT[w].img && (
                  <img key={w} src={PORTRAIT[w].img} alt={PORTRAIT[w].name} width={816} height={816}
                    className={`portrait pixelated pointer-events-none absolute bottom-full h-56 w-56 transition-all duration-200 sm:h-72 sm:w-72 ${w === "julia" ? "left-0 origin-bottom-left" : "right-0 origin-bottom-right"} ${!present ? "opacity-0" : speaking ? "opacity-100 scale-100" : "opacity-90 scale-95"}`} style={{ filter: present && !speaking ? "brightness(.4) saturate(.6)" : "none" }} />
                );
              });
            })()}
            {cur.who === "tuca" && <PigArt className="bob pointer-events-none absolute bottom-full right-4 mb-2 h-28 w-28 sm:h-36 sm:w-36" />}
            <div className="pixel-box w-full p-4 sm:p-5">
              {PORTRAIT[cur.who].name && <div className={`font-pixel mb-2 inline-block bg-primary px-2 py-1 text-[10px] text-primary-foreground ${cur.who === "julia" ? "" : "float-right"}`}>{PORTRAIT[cur.who].name}</div>}
              <p className="clear-both min-h-16 text-lg leading-7">{cur.text.slice(0, chars)}</p>
              {cur.choices && chars >= cur.text.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {cur.choices.map((c) => <button key={c.t} className="btn" onClick={(e) => { e.stopPropagation(); setLines([]); setChars(0); onEnd.current = null; c.go(); }}>{c.t}</button>)}
                </div>
              ) : <div className="blink text-right font-pixel text-[10px] text-primary">ESPAÇO ▼</div>}
            </div>
          </div>
        </div>
      )}

      {/* Painel em tela cheia (PC / minigames) */}
      {panel && (
        <div className={`fixed inset-0 z-[970] grid place-items-center p-2 ${panel.pc ? "bg-pc" : "bg-background/90"}`}>
          <div className="pixel-box flex max-h-[96dvh] w-full max-w-3xl flex-col">
            <div className="flex items-center justify-between bg-primary px-3 py-2 font-pixel text-[10px] text-primary-foreground">
              <span>{panel.title}</span>
              {!fb && <button onClick={() => setPanel(null)}>✕</button>}
            </div>
            <div className="overflow-y-auto p-4">
              {fb ? (
                <div className={`stamp border-4 p-4 ${fb.ok ? "border-success" : "border-destructive"}`}>
                  <div className={`font-pixel text-sm ${fb.ok ? "text-success" : "text-destructive"}`}>{fb.ok ? "✔ MISSÃO CUMPRIDA!" : "✘ OPS..."}</div>
                  <p className="mt-2 leading-7">{fb.msg}</p>
                  <div className="mt-4 flex gap-3">
                    {fb.ok ? <button className="btn btn-primary" onClick={closePanel}>Continuar ▶</button>
                      : <><button className="btn btn-accent" onClick={() => { setFb(null); setPk((k) => k + 1); }}>Tentar de novo ↺</button><button className="btn" onClick={closePanel}>Sair</button></>}
                  </div>
                </div>
              ) : <div key={pk}>{panel.node(submit)}</div>}
            </div>
          </div>
        </div>
      )}

      {bag && (
        <div className="fixed inset-0 z-[975] grid place-items-center bg-background/90 p-3" onClick={() => setBag(false)}>
          <div className="pixel-box w-full max-w-md p-4">
            <p className="font-pixel mb-3 text-xs text-primary">MOCHILA</p>
            {inv.length ? inv.map((i, k) => <div key={k} className="flex justify-between border-b border-border py-2"><span>{i.e} {i.n}</span><span>{brl(i.p)}</span></div>) : <p>Vazia.</p>}
            <p className="mt-3">Carteira: <b className="text-primary">{brl(money)}</b></p>
            <button className="btn mt-4">Fechar</button>
          </div>
        </div>
      )}
    </main>
  );
}

/* ================= DESENHO DOS CENÁRIOS ================= */
const tileStyle = (x: number, y: number, w = 1, h = 1) => ({ left: `calc(var(--t) * ${x})`, top: `calc(var(--t) * ${y})`, width: `calc(var(--t) * ${w})`, height: `calc(var(--t) * ${h})` });

const makeStreet = () => renderStreet({ w: SW, h: SH, blds: BLDS, houses: HOUSES, board: BOARD, props: PROPS, flowers: FLOWERS, hRoads: H_ROADS, vRoads: V_ROADS, isRoad, isWalk });
const ROOM_IDS: SceneId[] = ["casa", "estrela", "bairro", "mega", "livraria", "eletro", "procon"];
const makeRoom = (id: SceneId) => renderRoom(id, rowsOf(id), (SHOPS[id] ?? []).map((p) => p.id));

type Layers = { base: string; light: string; objects: { key: string; src: string; x: number; y: number; w: number; h: number; z: number }[] };
function SceneLayers({ art, scene }: { art: Layers | null; scene: SceneId }) {
  const { w, h } = sceneSize(scene);
  if (!art) return null;
  const img = (key: string, src: string, x: number, y: number, ww: number, hh: number, z: number, cls = "") => (
    <img key={key} src={src} alt="" draggable={false} className={`pointer-events-none absolute select-none ${cls}`} style={{ ...tileStyle(x, y, ww, hh), zIndex: z, imageRendering: "pixelated", maxWidth: "none" }} />
  );
  return <>
    {img("base", art.base, 0, 0, w, h, 0)}
    {art.objects.map((o) => img(o.key, o.src, o.x, o.y, o.w, o.h, o.z))}
    {img("light", art.light, 0, 0, w, h, 920, scene === "mega" || scene === "eletro" ? "light-neon" : "light-breathe")}
  </>;
}
function Tiles({ scene }: { scene: SceneId }) {
  const art = useArt(scene === "rua" ? "rua" : `room:${scene}`, () => (scene === "rua" ? makeStreet() : makeRoom(scene)));
  return <SceneLayers art={art} scene={scene} />;
}

function RoomNPCs({ scene }: { scene: SceneId }) {
  const rows = rowsOf(scene);
  const out: ReactNode[] = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== "m" && c !== "k") return;
    const pal: Pal = c === "m" ? NPC.mae : scene === "procon" ? NPC.procon : NPC.vend;
    out.push(<Sprite key={`${x}${y}`} dir="down" pal={pal} className="absolute" style={{ left: `calc(var(--t) * ${x})`, top: `calc(var(--t) * ${y - 0.4})`, width: "var(--t)", height: "calc(var(--t) * 1.5)", zIndex: y * 10 + 5 }} />);
  }));
  return <>{out}</>;
}

function TitleScreen({ onStart }: { onStart: () => void }) {
  const [pop, setPop] = useState<null | "how" | "team" | "gab">(null);
  const [sel, setSel] = useState(0);
  const MENU = ["NOVO JOGO", "COMO JOGAR", "GABARITO & FONTES", "CRÉDITOS"] as const;
  const activate = (i: number) => { if (i === 0) onStart(); else setPop(i === 1 ? "how" : i === 2 ? "gab" : "team"); };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "escape") return setPop(null);
      if (pop) return;
      if (["arrowup", "w"].includes(key)) { e.preventDefault(); setSel((s) => (s + MENU.length - 1) % MENU.length); }
      if (["arrowdown", "s"].includes(key)) { e.preventDefault(); setSel((s) => (s + 1) % MENU.length); }
      if (key === " " || key === "enter") { e.preventDefault(); activate(sel); }
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });
  const stars = useMemo(() => Array.from({ length: 40 }, (_, i) => ({ l: (i * 37) % 100, t: (i * 53) % 45, d: (i % 7) * 0.3 })), []);
  return (
    <main className="crt title-sky relative grid min-h-screen place-items-center overflow-hidden p-4">
      {stars.map((s, i) => <span key={i} className="star" style={{ left: `${s.l}%`, top: `${s.t}%`, animationDelay: `${s.d}s` }} />)}
      {[0, 1, 2].map((i) => <span key={i} className="cloud" style={{ top: `${10 + i * 12}%`, animationDuration: `${40 + i * 15}s`, animationDelay: `${-i * 12}s` }} />)}
      {["🏷️", "📄", "💸", "🏷️", "📄"].map((f, i) => <span key={i} className="flyer" style={{ left: `${20 + i * 18}%`, animationDuration: `${7 + i * 2}s`, animationDelay: `${-i * 1.7}s` }}>{f}</span>)}
      <div className="absolute inset-x-0 bottom-0 flex h-[32%] items-end gap-1 px-2" aria-hidden>
        {[55, 80, 40, 95, 65, 75, 50, 88, 60, 70].map((h, i) => (
          <div key={i} className="relative flex-1 border-4 border-b-0 border-foreground" style={{ height: `${h}%`, background: `var(--b${(i % 6) + 1})`, filter: "brightness(.55)" }}>
            <div className="grid grid-cols-2 gap-1 p-1">{Array.from({ length: 6 }, (_, j) => <span key={j} className="h-2 bg-accent" style={{ opacity: (i + j) % 3 ? 0.9 : 0.15 }} />)}</div>
            {i === 3 && <div className="neon absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap border-2 border-foreground bg-destructive px-1 font-pixel text-[8px] text-destructive-foreground">SÓ HOJE! 70%*</div>}
          </div>
        ))}
      </div>
      <section className="relative z-10 grid w-full max-w-4xl items-center gap-8 md:grid-cols-[1.2fr_1fr]">
        <div className="text-center md:text-left">
          <p className="font-pixel text-[10px] text-accent">UM RPG DE EDUCAÇÃO FINANCEIRA</p>
          <h1 className="title-logo font-pixel mt-4 text-3xl leading-[1.4] text-accent sm:text-5xl">A PROMOÇÃO<br />TERMINA<br />HOJE</h1>
          <div className="mt-6 flex items-end justify-center gap-4 md:justify-start">
            <Sprite dir="down" className="bob h-36 w-24" />
            <PigArt className="bob h-20 w-20" />
          </div>
        </div>
        <nav className="pixel-box space-y-3 p-5">
          {MENU.map((label, i) => (
            <button key={label} className={`menu-btn ${i === sel ? "menu-sel" : ""}`}
              onMouseEnter={() => setSel(i)} onClick={() => activate(i)}>{label}</button>
          ))}
          <p className="neon pt-2 text-center font-pixel text-[9px] text-primary">↑↓ OU W/S PARA ESCOLHER · ENTER CONFIRMA</p>
        </nav>
      </section>
      {pop === "gab" && <Gabarito onClose={() => setPop(null)} />}
      {pop && pop !== "gab" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/60 p-4" onClick={() => setPop(null)}>
          <div className="pixel-box w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            {pop === "how" ? <>
              <h2 className="font-pixel text-sm text-primary">MANUAL DO JOGADOR</h2>
              <p className="mt-3 leading-7">Júlia tem <b>R$ 500</b> para o material escolar. Explore a cidade, compare preços, faça as contas e não caia nas promoções!</p>
              <ul className="mt-3 space-y-2 leading-7">
                <li><span className="hud">WASD</span> / <span className="hud">↑↓←→</span> andar</li>
                <li><span className="hud">SHIFT</span> correr</li>
                <li><span className="hud">ESPAÇO</span> falar, entrar e interagir</li>
                <li>Siga a missão no topo; a seta mostra o destino. Errou? O Tuca explica e você tenta de novo.</li>
              </ul>
            </> : <>
              <h2 className="font-pixel text-sm text-primary">CRÉDITOS</h2>
              <p className="mt-4 font-pixel text-[10px] text-muted-foreground">EQUIPE</p>
              <ul className="mt-2 space-y-2 font-pixel text-xs leading-6">{TEAM.map((n) => <li key={n}>★ {n}</li>)}</ul>
            </>}
            <button className="btn btn-primary mt-6 font-pixel text-xs" onClick={() => setPop(null)}>FECHAR</button>
          </div>
        </div>
      )}
    </main>
  );
}
