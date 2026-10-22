import { createFileRoute } from "@tanstack/react-router";
import { World } from "@/components/game/World";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A Promoção Termina Hoje — Jogo de Educação Financeira" },
      { name: "description", content: "Ajude Júlia a comprar os materiais escolares com R$ 500 sem cair nas armadilhas das promoções." },
      { property: "og:title", content: "A Promoção Termina Hoje" },
      { property: "og:description", content: "Ande pela cidade, compre de verdade e cumpra 13 missões financeiras." },
    ],
  }),
  component: World,
});
