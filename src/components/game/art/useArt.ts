import { useEffect, useState, useSyncExternalStore } from "react";

/** false no servidor e durante a hidratação; true depois (evita divergência de HTML com o canvas). */
export function useHydrated() {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}

let fontP: Promise<unknown> | null = null;
function fontsReady() {
  if (!fontP) {
    const f = typeof document !== "undefined" ? document.fonts : undefined;
    fontP = f ? Promise.race([f.load('8px "Press Start 2P"'), new Promise((r) => setTimeout(r, 1500))]).catch(() => {}) : Promise.resolve();
  }
  return fontP;
}

const cache = new Map<string, unknown>();

/** Gera (uma vez) e guarda em cache a arte de um cenário. Devolve null enquanto não estiver pronta. */
export function useArt<T>(key: string, make: () => T): T | null {
  const [, tick] = useState(0);
  useEffect(() => {
    if (cache.has(key)) return;
    let dead = false;
    fontsReady().then(() => { if (dead || cache.has(key)) return; cache.set(key, make()); tick((n) => n + 1); });
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (cache.get(key) as T | undefined) ?? null;
}

/** Pré-gera cenários em segundo plano para as transições não piscarem. */
export function warmArt(jobs: [string, () => unknown][]) {
  fontsReady().then(() => jobs.forEach(([k, f], i) => setTimeout(() => { if (!cache.has(k)) cache.set(k, f()); }, 40 * i)));
}
