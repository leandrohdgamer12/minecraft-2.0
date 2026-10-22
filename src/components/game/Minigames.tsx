import { useEffect, useRef, useState } from "react";
import { brl, type Submit } from "./Challenges";

/* Planilha de contas no computador */
export function Planilha({ submit }: { submit: Submit }) {
  const [v, setV] = useState({ a: "", b: "", c: "" });
  const n = (s: string) => Number(s.replace(",", "."));
  const cell = (k: keyof typeof v) => (
    <input inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })}
      className="w-28 border-2 border-primary bg-background px-2 py-1 text-right font-pixel text-xs" placeholder="?" />
  );
  return (
    <div className="space-y-3">
      <p>Planilha <b>Orcamento.xls</b> — preencha as células com <b>?</b></p>
      <table className="w-full border-2 border-border text-left">
        <tbody className="[&_td]:border [&_td]:border-border [&_td]:p-2">
          <tr><td>💰 Dinheiro guardado</td><td className="text-right">R$ 500</td></tr>
          <tr><td>🧮 Calculadora comprada online ontem (TecNet)</td><td className="text-right text-destructive">− R$ 95</td></tr>
          <tr className="bg-muted"><td><b>= Saldo na carteira agora</b></td><td className="text-right">R$ {cell("a")}</td></tr>
          <tr><td>📒 4 cadernos a R$ 14 cada</td><td className="text-right">R$ {cell("b")}</td></tr>
          <tr className="bg-muted"><td><b>= Sobra depois dos cadernos</b></td><td className="text-right">R$ {cell("c")}</td></tr>
        </tbody>
      </table>
      <button className="btn btn-primary" onClick={() => {
        if (n(v.a) !== 405) return submit(false, "Saldo errado. Conta: 500 − 95. Quem gasta precisa tirar do total!");
        if (n(v.b) !== 56) return submit(false, "Cadernos errados. Multiplique: 4 × 14.");
        if (n(v.c) !== 349) return submit(false, "Sobra errada. Use o saldo que você achou: 405 − 56.");
        submit(true, "Planilha certinha! 500 − 95 = 405; 4 × 14 = 56; 405 − 56 = 349. Anotar as contas mostra quanto ainda dá pra gastar.");
      }}>Salvar planilha</button>
    </div>
  );
}

/* Devolução online (direito de arrependimento) */
export function Devolucao({ submit }: { submit: Submit }) {
  const [m, setM] = useState<number>();
  const [r, setR] = useState<number>();
  const motivos = ["Produto com defeito", "Direito de arrependimento (CDC art. 49)", "Não gostei da cor"];
  const forma = ["Vale-compra da TecNet", "Dinheiro de volta (estorno de R$ 95)"];
  return (
    <div className="space-y-3">
      <div className="border-2 border-border bg-muted p-3 text-sm">📦 Pedido #4821 · Calculadora científica · <b>R$ 95,00</b> · comprado há <b>2 dias</b> · caixa lacrada</div>
      <p className="font-bold">Motivo da devolução:</p>
      {motivos.map((o, i) => <button key={o} onClick={() => setM(i)} className={`block w-full border-2 p-2 text-left ${m === i ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{o}</button>)}
      <p className="font-bold">Como quer receber?</p>
      {forma.map((o, i) => <button key={o} onClick={() => setR(i)} className={`block w-full border-2 p-2 text-left ${r === i ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{o}</button>)}
      <button className="btn btn-primary" disabled={m === undefined || r === undefined} onClick={() => {
        if (m !== 1) return submit(false, m === 0 ? "A calculadora não tem defeito! Mentir no motivo não é necessário: comprando pela internet, a lei já garante desistir em 7 dias." : "Não precisa inventar motivo. Qual artigo do CDC o Procon explicou?");
        if (r !== 1) return submit(false, "No arrependimento, o CDC garante devolução do valor pago. Vale-compra prende o dinheiro na loja!");
        submit(true, "Devolução aprovada! +R$ 95 de volta na carteira. Art. 49 do CDC: compra fora da loja física pode ser desfeita em até 7 dias, com dinheiro de volta.");
      }}>Enviar pedido</button>
    </div>
  );
}

/* Pix com tempo */
export function Pix({ submit }: { submit: Submit }) {
  const [v, setV] = useState("");
  const [t, setT] = useState(25);
  const done = useRef(false);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x - 1), 1000);
    return () => clearInterval(i);
  }, []);
  useEffect(() => { if (t <= 0 && !done.current) { done.current = true; submit(false, "O QR code expirou! Calcule rápido: 10% de 90 é 90 ÷ 10 = 9."); } }, [t, submit]);
  return (
    <div className="space-y-3">
      <p>Calculadora: <b>R$ 90</b>. No Pix: <b>10% de desconto</b>. Digite o valor final antes do QR code expirar!</p>
      <div className="h-3 w-full border-2 border-border"><div className="h-full bg-accent transition-all" style={{ width: `${(t / 25) * 100}%` }} /></div>
      <p className="font-pixel text-xs">⏱ {Math.max(0, t)}s</p>
      <div className="flex gap-2"><span className="self-center font-bold">R$</span>
        <input autoFocus inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} className="w-32 border-2 border-primary bg-background p-2 text-xl" />
        <button className="btn btn-primary" onClick={() => {
          done.current = true;
          Number(v.replace(",", ".")) === 81 ? submit(true, "Pix de R$ 81 pago! 10% de 90 = 9 → 90 − 9 = 81. Contra os R$ 95 do site, Júlia economizou R$ 14.")
            : submit(false, `R$ ${v} não está certo. 10% de 90 = 9. Agora subtraia.`);
        }}>Gerar Pix</button>
      </div>
    </div>
  );
}

/* Chuva de ofertas: pegue necessidades, fuja dos desejos */
const NEED = [
  { e: "📒", l: "Caderno" }, { e: "✏️", l: "Lápis" }, { e: "📘", l: "Livro" }, { e: "🧮", l: "Calculadora" }, { e: "📏", l: "Régua" },
];
const WANT = [
  { e: "✨", l: "Glitter" }, { e: "🎧", l: "Fone LED" }, { e: "🗂️", l: "Fichário" }, { e: "🎮", l: "Estojo gamer" }, { e: "🧸", l: "Chaveiro" }, { e: "🍭", l: "Doces" },
];
type Drop = { id: number; x: number; y: number; e: string; l: string; need: boolean };
export function Chuva({ submit }: { submit: Submit }) {
  const COLS = 7;
  const [x, setX] = useState(3);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [got, setGot] = useState(0);
  const [life, setLife] = useState(3);
  const st = useRef({ x: 3, id: 0, end: false });
  const dropsRef = useRef<Drop[]>([]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const d = ["arrowleft", "a"].includes(e.key.toLowerCase()) ? -1 : ["arrowright", "d"].includes(e.key.toLowerCase()) ? 1 : 0;
      if (d) { e.preventDefault(); st.current.x = Math.max(0, Math.min(COLS - 1, st.current.x + d)); setX(st.current.x); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  useEffect(() => {
    const i = setInterval(() => {
      if (st.current.end) return;
      const next: Drop[] = [];
      for (const d of dropsRef.current) {
        const y = d.y + 0.35;
        if (y >= 9 && y < 9.7 && d.x === st.current.x) {
          if (d.need) setGot((g) => g + 1); else setLife((l) => l - 1);
          continue;
        }
        if (y < 11) next.push({ ...d, y });
      }
      if (Math.random() < 0.14) {
        const need = Math.random() < 0.5;
        const pool = need ? NEED : WANT;
        const it = pool[Math.floor(Math.random() * pool.length)]!;
        next.push({ id: st.current.id++, x: Math.floor(Math.random() * COLS), y: 0, e: it.e, l: it.l, need });
      }
      dropsRef.current = next;
      setDrops(next);
    }, 60);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    if (st.current.end) return;
    if (life <= 0) { st.current.end = true; submit(false, "A mochila encheu de desejos! Pegue só os itens VERDES da lista (Caderno, Lápis, Livro, Calculadora, Régua). Os VERMELHOS são tentação!"); }
    else if (got >= 10) { st.current.end = true; submit(true, "Mochila arrumada só com o necessário! Desejos podem esperar — e o dinheiro continua no bolso."); }
  }, [life, got, submit]);
  const mv = (d: number) => { st.current.x = Math.max(0, Math.min(COLS - 1, st.current.x + d)); setX(st.current.x); };
  return (
    <div className="space-y-2">
      <p>Use <b>← →</b> para pegar <b>10 materiais</b> da lista. Itens <b className="text-success">VERDES</b> entram na mochila; os <b className="text-destructive">VERMELHOS</b> são desejos e tiram uma vida!</p>
      <div className="flex justify-between font-pixel text-xs"><span>🎒 {got}/10</span><span>{"❤️".repeat(Math.max(0, life))}</span></div>
      <div className="relative mx-auto overflow-hidden border-4 border-primary bg-background" style={{ width: 7 * 52, height: 10 * 52 }}>
        {drops.map((d) => (
          <div key={d.id} className={`absolute flex flex-col items-center justify-center gap-0.5 rounded border-2 ${d.need ? "border-success bg-success/20" : "border-destructive bg-destructive/20"}`}
            style={{ left: d.x * 52 + 2, top: d.y * 52 + 2, width: 48, height: 48 }}>
            <span className="text-xl leading-none">{d.e}</span>
            <span className={`px-0.5 text-center text-[7px] font-bold leading-none ${d.need ? "text-success" : "text-destructive"}`}>{d.l}</span>
          </div>
        ))}
        <div className="absolute grid place-items-center text-3xl transition-all duration-75" style={{ left: x * 52, top: 9 * 52, width: 52, height: 52 }}>🎒</div>
      </div>
      <div className="flex justify-center gap-3">
        <button className="btn" onPointerDown={() => mv(-1)}>◀</button>
        <button className="btn" onPointerDown={() => mv(1)}>▶</button>
      </div>
    </div>
  );
}

export { brl };
