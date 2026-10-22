import { useState } from "react";

/* Gabarito comentado em modal retrô — resposta, cálculo, erros comuns e fontes */
const TABS = ["Missões 1–4", "Missões 5–8", "Missões 9–12", "Missão 13 + final", "Fontes"] as const;

const G: { t: string; r: string; c: string; e: string }[] = [
  { t: "1 · Lista: necessidade x desejo", r: "Necessidade: livro de inglês, calculadora, 4 cadernos, kit lápis. Desejo: mochila de marca, canetas glitter, fichário de personagem.", c: "Pergunta-chave: \"a escola pede?\" e \"Júlia já tem algo que funciona?\". A mochila antiga ainda serve → desejo.", e: "Erro comum: achar que \"gostar muito\" torna o item necessidade." },
  { t: "2 · Planilha do PC", r: "Saldo R$ 405 · cadernos R$ 56 · sobra R$ 349.", c: "500 − 95 = 405 · 4 × 14 = 56 · 405 − 56 = 349.", e: "Erro comum: esquecer de descontar a compra online do total." },
  { t: "3 · Corrida de preços", r: "Visitar Estrela, Loja do Bairro e MegaShop antes do tempo acabar.", c: "Estrela: pacote R$ 60 · Bairro: 4 × R$ 14 = R$ 56 · MegaShop: 4 × R$ 16 = R$ 64.", e: "Erro comum: esquecer uma das três lojas ou comprar antes de comparar." },
  { t: "4 · Comprar os cadernos", r: "Comprar os 4 cadernos na Loja do Bairro por R$ 56.", c: "Estrela: R$ 60. MegaShop: 4 × R$ 16 = R$ 64, apesar da oferta \"leve 5 pague 4\".", e: "Erro comum: escolher pelo anúncio em vez do menor preço total necessário." },
  { t: "5 · Outdoor 70% OFF*", r: "Identificar a urgência e a condição escondida no asterisco.", c: "O desconto só vale acima de R$ 400 em produtos Premium selecionados.", e: "Erro comum: ler só o número grande e ignorar a letra miúda." },
  { t: "6 · Livro de inglês", r: "Comprar só o livro por R$ 180 e recusar o combo de R$ 230.", c: "O combo acrescenta um fichário de desejo por R$ 50.", e: "Erro comum: achar que todo combo anunciado como economia vale a pena." },
  { t: "7 · Pesquisar a calculadora", r: "A calculadora científica custa R$ 90; no Pix fica R$ 81.", c: "10% de R$ 90 = R$ 9; R$ 90 − R$ 9 = R$ 81. É R$ 14 menos que os R$ 95 pagos online.", e: "Erro comum: confundir a pesquisa do preço com a compra, que acontece na missão 10." },
  { t: "8 · Consultar o Procon", r: "Em compra pela internet, Júlia pode desistir em até 7 dias e receber o dinheiro de volta.", c: "CDC, art. 49: direito de arrependimento em compra fora do estabelecimento.", e: "Erro comum: pensar que só pode devolver se o produto estiver com defeito." },
  { t: "9 · Devolver a calculadora online", r: "Selecionar direito de arrependimento e receber o estorno em dinheiro.", c: "A compra foi feita pela internet há 2 dias; a caixa está lacrada e o prazo legal é de 7 dias.", e: "Erro comum: escolher motivo falso ou aceitar vale-compra em vez do estorno." },
  { t: "10 · Comprar a calculadora no Pix", r: "Pagar R$ 81 no Pix.", c: "10% de R$ 90 = R$ 9; preço final: R$ 81.", e: "Erro comum: informar o desconto (R$ 9) como se fosse o valor final." },
  { t: "11 · Comprar o kit lápis", r: "Comprar o kit na Loja do Bairro por R$ 25 e recusar o cartão da loja.", c: "Estrela: R$ 40. Cartão: economiza R$ 15 hoje, mas cobra 12 × R$ 12 = R$ 144 por ano; prejuízo líquido de R$ 129.", e: "Erro comum: considerar só o desconto imediato e ignorar a anuidade." },
  { t: "12 · Arrumar a mochila", r: "Pegar 10 materiais necessários e evitar os desejos.", c: "Caderno, lápis, livro e calculadora são necessários; glitter, fone LED, fichário, estojo gamer, chaveiro e doces são desejos.", e: "Erro comum: pegar itens vermelhos de desejo; eles tiram vidas no minijogo." },
  { t: "13 · Abrir o cofre do Tuca", r: "A senha é R$ 158.", c: "Livro 180 + calculadora no Pix 81 + cadernos 56 + kit lápis 25 = R$ 342; R$ 500 − R$ 342 = R$ 158.", e: "Erro comum: calcular o desconto do Pix errado ou esquecer uma das compras necessárias." },
];

export function Gabarito({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState(0);
  return (
    <div className="fixed inset-0 z-[990] grid place-items-center bg-foreground/60 p-3" onClick={onClose}>
      <div className="pixel-box flex max-h-[92dvh] w-full max-w-2xl flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-primary px-3 py-2 font-pixel text-[10px] text-primary-foreground">
          <span>📜 GABARITO & FONTES</span>
          <button onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="flex flex-wrap gap-1 border-b-4 border-border p-2">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className={`chip font-pixel text-[8px] ${tab === i ? "chip-on" : ""}`}>{t}</button>
          ))}
        </div>
        <div className="space-y-3 overflow-y-auto p-4 text-sm leading-6">
          {tab < 4 && G.slice(tab * 4, tab * 4 + 4).map((g) => (
            <article key={g.t} className="border-2 border-border bg-card p-3">
              <h3 className="font-pixel text-[10px] text-primary">{g.t}</h3>
              <p className="mt-2"><span className="font-pixel text-[8px] text-success">✔ RESPOSTA </span>{g.r}</p>
              <p className="mt-1"><span className="font-pixel text-[8px] text-accent">🧮 CÁLCULO </span>{g.c}</p>
              <p className="mt-1 text-muted-foreground"><span className="font-pixel text-[8px] text-destructive">⚠ ATENÇÃO </span>{g.e}</p>
            </article>
          ))}
          {tab === 3 && (
            <article className="border-2 border-border bg-card p-3">
              <h3 className="font-pixel text-[10px] text-primary">MOCHILA DE MARCA: R$ 220 → R$ 150 \"SÓ HOJE\"</h3>
              <p className="mt-2"><span className="font-pixel text-[8px] text-success">✔ MELHOR ESCOLHA </span>Esperar e guardar. A mochila antiga ainda funciona; a pressa é fabricada pela loja.</p>
              <p className="mt-1"><span className="font-pixel text-[8px] text-destructive">A) COMPRAR </span>Sobram poucos reais; semanas depois a mesma mochila entra em liquidação por R$ 120 e falta dinheiro para o passeio da escola.</p>
              <p className="mt-1"><span className="font-pixel text-[8px] text-success">B) ESPERAR </span>Júlia guarda a sobra e, três meses depois, compra a mesma mochila por R$ 120 à vista, sem aperto e ainda com dinheiro sobrando.</p>
            </article>
          )}
          {tab === 4 && (
            <article className="border-2 border-border bg-card p-3">
              <h3 className="font-pixel text-[10px] text-primary">FONTES CONSULTADAS</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5">
                <li><b>CDC — Lei 8.078/1990, art. 49:</b> direito de arrependimento em compras fora do estabelecimento (7 dias, devolução integral).</li>
                <li><b>CDC, art. 37:</b> publicidade enganosa ou abusiva é proibida — descontos condicionados devem estar claros.</li>
                <li><b>Banco Central do Brasil:</b> educação financeira — orçamento, comparação de preços e custo de cartões/anuidades.</li>
                <li><b>Procon:</b> orientações ao consumidor sobre promoções, nota fiscal e troca.</li>
              </ul>
            </article>
          )}
        </div>
        <div className="border-t-4 border-border p-3 text-right">
          <button className="btn btn-primary font-pixel text-xs" onClick={onClose}>FECHAR (ESC)</button>
        </div>
      </div>
    </div>
  );
}
