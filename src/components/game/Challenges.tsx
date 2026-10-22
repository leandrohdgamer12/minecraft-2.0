import { useMemo, useState, type ReactNode } from "react";

export type Submit = (ok: boolean, msg: string) => void;
export const brl = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

export function Panel({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

/* 1 — Necessidade x desejo */
const ITEMS = [
  { n: "Livro de inglês (pedido pela escola)", need: true },
  { n: "Calculadora científica (lista da escola)", need: true },
  { n: "4 cadernos de 10 matérias", need: true },
 { n: "Kit lápis, borracha e caneta", need: true },
  { n: "Mochila nova de marca (a dela ainda está boa)", need: false },
  { n: "Canetas glitter 48 cores", need: false },
  { n: "Fichário de personagem famoso", need: false },
];
export function C1({ submit }: { submit: Submit }) {
  const items = useMemo(() => [...ITEMS].sort(() => Math.random() - 0.5), []);
  const [v, setV] = useState<Record<number, boolean | undefined>>({});
  const done = items.every((_, i) => v[i] !== undefined);
  return (
    <Panel>
      {items.map((it, i) => (
        <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border-2 bg-card p-3">
          <span className="font-medium">{it.n}</span>
          <div className="flex gap-2">
            <button className={`chip ${v[i] === true ? "chip-on" : ""}`} onClick={() => setV({ ...v, [i]: true })}>Necessidade</button>
            <button className={`chip ${v[i] === false ? "chip-on" : ""}`} onClick={() => setV({ ...v, [i]: false })}>Desejo</button>
          </div>
        </div>
      ))}
      <button className="btn btn-primary" disabled={!done} onClick={() => {
        const wrong = items.filter((it, i) => v[i] !== it.need).map((it) => it.n);
        wrong.length === 0
          ? submit(true, "Perfeito! Necessidade é o que a escola exige ou o que Júlia não tem. Desejo é vontade — pode esperar.")
          : submit(false, `Revise: ${wrong.join("; ")}. Pergunte: "a escola pede?" e "Júlia já tem algo que funciona?"`);
      }}>Conferir</button>
    </Panel>
  );
}

/* 2 — Comparar opções */
const OFFERS = [
  { id: "A", t: "Papelaria Estrela", d: "Pacote com 4 cadernos por R$ 60,00" },
  { id: "B", t: "Loja do Bairro", d: "Caderno avulso R$ 14,00 cada" },
  { id: "C", t: "MegaShop", d: "LEVE 5 PAGUE 4! R$ 16,00 cada" },
];
export function C2({ submit }: { submit: Submit }) {
  const [s, setS] = useState<string>();
  return (
    <Panel>
      <p>Júlia precisa de <b>exatamente 4 cadernos</b>. Qual é a compra mais barata?</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {OFFERS.map((o) => (
          <button key={o.id} onClick={() => setS(o.id)}
            className={`rounded-lg border-2 bg-card p-4 text-left transition ${s === o.id ? "border-primary ring-4 ring-accent" : ""}`}>
            <div className="font-hand text-2xl">{o.t}</div>
            <div className="text-sm">{o.d}</div>
          </button>
        ))}
      </div>
      <button className="btn btn-primary" disabled={!s} onClick={() =>
        s === "B" ? submit(true, "Isso! 4 × R$ 14 = R$ 56. A Estrela custa R$ 60 e a MegaShop cobra 4 × R$ 16 = R$ 64 por um caderno que ela nem precisa.")
        : s === "A" ? submit(false, "Pacote nem sempre é mais barato: R$ 60 ÷ 4 = R$ 15 por caderno. Compare o preço por unidade.")
        : submit(false, "\"Leve 5 pague 4\" parece vantagem, mas Júlia pagaria 4 × R$ 16 = R$ 64 e levaria um caderno a mais que não precisa.")
      }>Escolher</button>
    </Panel>
  );
}

/* 3 — Montar orçamento arrastando */
const SHOP = [
  { n: "Livro de inglês", p: 180, need: true },
  { n: "Calculadora", p: 90, need: true },
  { n: "4 cadernos", p: 56, need: true },
  { n: "Kit lápis", p: 25, need: true },
  { n: "Mochila de marca", p: 220, need: false },
  { n: "Canetas glitter", p: 75, need: false },
  { n: "Fichário", p: 60, need: false },
];
export function C3({ submit }: { submit: Submit }) {
  const [cart, setCart] = useState<number[]>([]);
  const total = cart.reduce((a, i) => a + SHOP[i]!.p, 0);
  const toggle = (i: number) => setCart((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));
  const Item = ({ i }: { i: number }) => (
    <button draggable onDragStart={(e) => e.dataTransfer.setData("i", String(i))} onClick={() => toggle(i)}
      className="flex w-full cursor-grab justify-between rounded-md border-2 bg-card px-3 py-2 text-sm font-medium">
      <span>{SHOP[i]!.n}</span><span>{brl(SHOP[i]!.p)}</span>
    </button>
  );
  return (
    <Panel>
      <p>Arraste (ou toque) os itens para o carrinho. Limite: <b>R$ 500</b>.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 rounded-lg border-2 border-dashed p-3">
          <div className="font-hand text-xl">Prateleira</div>
          {SHOP.map((_, i) => !cart.includes(i) && <Item key={i} i={i} />)}
        </div>
        <div onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { const i = Number(e.dataTransfer.getData("i")); if (!cart.includes(i)) setCart([...cart, i]); }}
          className="space-y-2 rounded-lg border-2 border-primary bg-secondary p-3">
          <div className="font-hand text-xl">🛒 Carrinho</div>
          {cart.map((i) => <Item key={i} i={i} />)}
          <div className={`pt-2 text-right text-lg font-bold ${total > 500 ? "text-destructive" : ""}`}>Total: {brl(total)}</div>
          <div className="h-2 overflow-hidden rounded bg-muted">
            <div className={`h-full ${total > 500 ? "bg-destructive" : "bg-success"}`} style={{ width: `${Math.min(100, total / 5)}%` }} />
          </div>
        </div>
      </div>
      <button className="btn btn-primary" disabled={!cart.length} onClick={() => {
        const missing = SHOP.filter((s, i) => s.need && !cart.includes(i)).map((s) => s.n);
        if (total > 500) return submit(false, `O total (${brl(total)}) passou de R$ 500. Tire algum desejo do carrinho.`);
        if (missing.length) return submit(false, `Faltou o que é necessário: ${missing.join(", ")}. Primeiro o essencial!`);
        submit(true, `Orçamento fechado em ${brl(total)} com tudo o que é necessário. Sobram ${brl(500 - total)}.`);
      }}>Fechar orçamento</button>
    </Panel>
  );
}

/* 4 — Analisar propaganda */
export function C4({ submit }: { submit: Submit }) {
  const [s, setS] = useState<number>();
  const opts = [
    "Desconto real: 70% em tudo, vale a pena comprar logo.",
    "Urgência (\"só hoje\") + desconto condicionado escondido no asterisco.",
    "Propaganda informativa, sem nenhuma estratégia de venda.",
  ];
  return (
    <Panel>
      <div className="mx-auto max-w-sm -rotate-1 rounded-xl border-4 border-destructive bg-accent p-5 text-center shadow-lg">
        <div className="font-hand text-4xl text-destructive">ÚLTIMA CHANCE!</div>
        <div className="text-5xl font-black">70% OFF*</div>
        <div className="font-bold">SÓ HOJE ⏰ até 23h59</div>
        <div className="mt-3 text-[10px] leading-tight">*Válido para compras acima de R$ 400 em produtos selecionados da linha Premium. Não cumulativo.</div>
      </div>
      <p>Que estratégia o anúncio usa?</p>
      {opts.map((o, i) => (
        <button key={i} onClick={() => setS(i)} className={`block w-full rounded-lg border-2 bg-card p-3 text-left ${s === i ? "border-primary ring-4 ring-accent" : ""}`}>{o}</button>
      ))}
      <button className="btn btn-primary" disabled={s === undefined} onClick={() =>
        s === 1 ? submit(true, "Exato! O \"só hoje\" cria pressa para você não pensar, e o asterisco esconde que o desconto só vale em produtos selecionados acima de R$ 400.")
        : s === 0 ? submit(false, "Leia o asterisco! O desconto não vale em tudo — só em produtos Premium acima de R$ 400.")
        : submit(false, "Toda propaganda quer vender. Repare no relógio e na letra miúda.")
      }>Responder</button>
    </Panel>
  );
}

/* 5 — Direitos do consumidor */
export function C5({ submit }: { submit: Submit }) {
  const [s, setS] = useState<number>();
  const opts = [
    "Não pode fazer nada: comprou, é dela.",
    "Pode desistir em até 7 dias e receber o dinheiro de volta (direito de arrependimento).",
    "Só pode trocar se a loja quiser, pagando o frete.",
  ];
  return (
    <Panel>
      <p>Júlia comprou a calculadora <b>pela internet</b>. Dois dias depois, achou a mesma calculadora mais barata e ainda nem abriu a caixa. O que diz o Código de Defesa do Consumidor?</p>
      {opts.map((o, i) => (
        <button key={i} onClick={() => setS(i)} className={`block w-full rounded-lg border-2 bg-card p-3 text-left ${s === i ? "border-primary ring-4 ring-accent" : ""}`}>{o}</button>
      ))}
      <button className="btn btn-primary" disabled={s === undefined} onClick={() =>
        s === 1 ? submit(true, "Correto! Art. 49 do CDC: em compras fora da loja física (internet, telefone), o consumidor pode desistir em até 7 dias e receber tudo de volta, inclusive o frete.")
        : submit(false, "Compras fora da loja física têm uma proteção especial no CDC (art. 49). Pense em um prazo de dias...")
      }>Responder</button>
    </Panel>
  );
}

/* 6 — Organizar etapas */
const STEPS = ["Fazer a lista de materiais", "Separar necessidade e desejo", "Definir o orçamento (R$ 500)", "Pesquisar e comparar preços", "Comprar", "Guardar a nota fiscal"];
export function C6({ submit }: { submit: Submit }) {
  const [order, setOrder] = useState(() => [3, 0, 5, 2, 4, 1]);
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= order.length) return;
    const o = [...order]; [o[i], o[j]] = [o[j]!, o[i]!]; setOrder(o);
  };
  return (
    <Panel>
      <p>Coloque as etapas de uma compra inteligente na ordem certa.</p>
      {order.map((s, i) => (
        <div key={s} className="flex items-center gap-3 rounded-lg border-2 bg-card p-2">
          <span className="font-hand w-8 text-center text-2xl">{i + 1}</span>
          <span className="flex-1 font-medium">{STEPS[s]}</span>
          <button className="chip" aria-label="subir" onClick={() => move(i, -1)}>▲</button>
          <button className="chip" aria-label="descer" onClick={() => move(i, 1)}>▼</button>
        </div>
      ))}
      <button className="btn btn-primary" onClick={() => {
        const ok = order.every((s, i) => s === i);
        const first = order.findIndex((s, i) => s !== i);
        ok ? submit(true, "Ordem perfeita! Planejar antes de comprar evita gastos por impulso, e a nota fiscal garante troca e garantia.")
           : submit(false, `A posição ${first + 1} não está certa. Lembre: primeiro planeja (lista → prioridade → limite), depois pesquisa, compra e guarda o comprovante.`);
      }}>Conferir ordem</button>
    </Panel>
  );
}

/* 7 — Cofre com senha (cálculo) */
export function C7({ submit }: { submit: Submit }) {
  const [code, setCode] = useState("");
  return (
    <Panel>
      <p>O cofrinho só abre com a senha = <b>quanto sobra dos R$ 500</b> se Júlia comprar só o necessário, pagando a calculadora no Pix com <b>10% de desconto</b>.</p>
      <div className="rounded-lg border-2 bg-card p-3 text-sm">
        Livro R$ 180 · Calculadora R$ 90 (−10% no Pix) · Cadernos R$ 56 · Kit lápis R$ 25
      </div>
      <Calc />
      <div className="mx-auto w-64 rounded-2xl border-4 border-primary bg-secondary p-4">
        <div className="mb-3 rounded bg-primary p-3 text-center font-mono text-3xl tracking-[0.4em] text-primary-foreground">{code.padEnd(3, "•")}</div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} className="btn px-0 py-2" onClick={() => code.length < 3 && setCode(code + n)}>{n}</button>
          ))}
          <button className="btn px-0 py-2" onClick={() => setCode("")}>C</button>
          <button className="btn px-0 py-2" onClick={() => code.length < 3 && setCode(code + 0)}>0</button>
          <button className="btn btn-accent px-0 py-2" disabled={code.length < 1} onClick={() =>
            code === "158" ? submit(true, "🔓 Cofre aberto! Calculadora: 90 − 10% = R$ 81. Total: 180 + 81 + 56 + 25 = R$ 342. Sobra: 500 − 342 = R$ 158.")
            : submit(false, `Senha ${code} incorreta. Calcule 10% de 90 primeiro, some tudo e subtraia de 500.`)
          }>OK</button>
        </div>
      </div>
    </Panel>
  );
}

/* Calculadora auxiliar do cofre */
function Calc() {
  const [expr, setExpr] = useState("");
  const press = (k: string) => setExpr((e) => (k === "C" ? "" : k === "⌫" ? e.slice(0, -1) : e + k));
  const result = useMemo(() => {
    if (!expr) return "";
    try {
      if (!/^[\d+\-*/(). ]+$/.test(expr)) return "?";
      const r = Function(`"use strict"; return (${expr})`)() as number;
      return Number.isFinite(r) ? String(Math.round(r * 100) / 100) : "?";
    } catch { return "?"; }
  }, [expr]);
  return (
    <div className="mx-auto w-56 rounded-2xl border-4 border-accent bg-card p-3">
      <p className="font-pixel mb-2 text-center text-[9px] text-muted-foreground">🧮 CALCULADORA DO TUCA</p>
      <div className="mb-2 min-h-8 rounded border-2 border-border bg-background px-2 py-1 text-right font-mono text-lg">
        {expr || "0"}{result && <span className="text-primary"> = {result}</span>}
      </div>
      <div className="grid grid-cols-4 gap-1">
        {["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "+", "⌫"].map((k) => (
          <button key={k} className="btn px-0 py-1 text-sm" onClick={() => press(k)}>{k}</button>
        ))}
        <button className="btn col-span-4 px-0 py-1 text-sm" onClick={() => press("C")}>LIMPAR</button>
      </div>
    </div>
  );
}

/* 8 — Decisão e consequência */
export function C8({ submit }: { submit: Submit }) {
  return (
    <Panel>
      <p>No caixa, a vendedora oferece: <i>"Faz o cartão da loja e ganha R$ 15 de desconto hoje! Só tem uma anuidade de R$ 12 por mês."</i></p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button className="btn" onClick={() => submit(false, "Consequência: Júlia economizou R$ 15 hoje, mas pagaria 12 × R$ 12 = R$ 144 por ano. Prejuízo de R$ 129! Sempre calcule o custo total.")}>💳 Aceitar o cartão</button>
        <button className="btn" onClick={() => submit(true, "Consequência: Júlia perdeu R$ 15 de desconto, mas evitou R$ 144 de anuidade no ano. Boa escolha: desconto pequeno não compensa custo fixo.")}>🙅 Recusar educadamente</button>
      </div>
    </Panel>
  );
}
