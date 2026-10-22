import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/gabarito")({
  head: () => ({
    meta: [
      { title: "Gabarito comentado — A Promoção Termina Hoje" },
      { name: "description", content: "Respostas, cálculos e fontes dos 8 desafios do jogo de educação financeira." },
      { property: "og:title", content: "Gabarito comentado — A Promoção Termina Hoje" },
      { property: "og:description", content: "Respostas, cálculos e fontes dos 8 desafios." },
    ],
  }),
  component: Gabarito,
});

const G = [
  ["1", "Necessidade: livro, calculadora, cadernos, kit lápis. Desejo: mochila de marca, glitter, fichário.", "Critério: a escola exige ou Júlia não possui.", "Mochila é tentadora, mas a atual funciona; glitter e fichário são vontade.", "Lista do case / BCB – Cidadania Financeira"],
  ["2", "Loja do Bairro (B)", "A: 60 · B: 4×14 = 56 · C: 4×16 = 64", "Pacote (R$15/un.) e 'leve 5 pague 4' saem mais caros para 4 unidades.", "Procon-SP – dicas de compra"],
  ["3", "Carrinho com os 4 necessários (R$ 351) e total ≤ R$ 500", "180+90+56+25 = 351", "Incluir mochila estoura o limite; faltar item necessário quebra a missão.", "BCB – Caderno de Educação Financeira"],
  ["4", "Urgência + desconto condicionado", "—", "Não é 70% em tudo (asterisco); toda propaganda tem estratégia.", "CDC art. 37 (propaganda enganosa)"],
  ["5", "Direito de arrependimento: 7 dias", "—", "Compra fora da loja física permite desistir sem justificar.", "CDC art. 49"],
  ["6", "Lista → necessidade/desejo → orçamento → pesquisar → comprar → nota fiscal", "—", "Comprar antes de pesquisar gera gasto por impulso.", "Procon / BCB"],
  ["7", "Senha 158", "90×0,9 = 81; 180+81+56+25 = 342; 500−342 = 158", "Erros comuns: esquecer o desconto (149) ou somar errado.", "Cálculo de porcentagem"],
  ["8", "Recusar o cartão", "12 × 12 = 144 de anuidade − 15 de desconto = −129", "Aceitar parece vantagem imediata, mas gera custo fixo.", "BCB – Meu Bolso em Dia"],
];

function Gabarito() {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="paper mx-auto max-w-5xl p-6 pl-14 sm:pl-16">
        <h1 className="font-hand text-5xl">Gabarito comentado</h1>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead><tr className="bg-primary text-primary-foreground">
              {["Nº", "Resposta correta", "Cálculo / raciocínio", "Por que as outras estão erradas", "Fonte"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}
            </tr></thead>
            <tbody>{G.map((r) => <tr key={r[0]} className="border-b-2 bg-card align-top">{r.map((c, i) => <td key={i} className="p-2">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <h2 className="font-hand mt-8 text-3xl">Decisão final</h2>
        <p><b>A)</b> Comprar o kit: sobra R$ 30, faltam R$ 231 para livro e calculadora. <b>B)</b> Pesquisar: lista completa por R$ 342, sobra R$ 158.</p>
        <h2 className="font-hand mt-6 text-3xl">Fontes consultadas</h2>
        <ul className="list-disc pl-5">
          <li>Código de Defesa do Consumidor (Lei 8.078/1990) – arts. 37 e 49</li>
          <li>Banco Central do Brasil – Caderno de Educação Financeira / Meu Bolso em Dia</li>
          <li>Procon-SP – orientações sobre compras e promoções</li>
        </ul>
        <Link to="/" className="btn btn-primary mt-8">◀ Voltar ao jogo</Link>
      </div>
    </main>
  );
}
