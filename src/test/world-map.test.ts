import { describe, expect, it } from "vitest";
import { BLDS, HOUSES, SH, SW, VIEW_RUA, cameraTarget, hitsThin, validateWorld } from "@/components/game/worldMap";

describe("mapa da cidade", () => {
  it("o mundo é bem maior que a tela", () => {
    expect(SW).toBeGreaterThan(VIEW_RUA.w * 2);
    expect(SH).toBeGreaterThan(VIEW_RUA.h * 3);
  });
  it("todas as lojas ficam com a porta voltada para a rua de baixo e acessível", () => {
    BLDS.forEach((b) => expect(b.top).toBe(true));
    expect(HOUSES.length).toBeGreaterThan(20);
  });
  it("ruas conectadas, portas alcançáveis, interiores sem itens presos", () => {
    expect(validateWorld()).toEqual([]);
  });
  it("a câmera fica sempre dentro do mundo", () => {
    for (const [px, py] of [[0, 0], [SW, SH], [SW / 2, SH / 2], [3, 40]] as const) {
      const c = cameraTarget(px, py, VIEW_RUA.w, VIEW_RUA.h, SW, SH);
      expect(c.x).toBeGreaterThanOrEqual(0); expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x + VIEW_RUA.w).toBeLessThanOrEqual(SW); expect(c.y + VIEW_RUA.h).toBeLessThanOrEqual(SH);
    }
  });
  it("postes não bloqueiam o meio da calçada", () => {
    expect(hitsThin(5.5, 6.5)).toBe(false);
  });
});
