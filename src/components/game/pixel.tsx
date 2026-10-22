// Sprites em pixel art (32×48) desenhados por código — ver art/characters.ts.
// A API pública (Sprite, NPC, Dir, Pal) é a mesma de antes; só o visual mudou.
import { ROW, spriteSheet, type CharKind, type Dir } from "./art/characters";
import { pigArt } from "./art/rooms";
import { useHydrated } from "./art/useArt";

export type { Dir };
export type Pal = { kind?: CharKind };

export function Sprite({ dir, frame = 0, pal, className, style }: { dir: Dir; frame?: number; pal?: Pal; className?: string; style?: React.CSSProperties }) {
  const ready = useHydrated();
  const kind = pal?.kind ?? "julia";
  const src = ready ? spriteSheet(kind) : "";
  return (
    <div role="img" aria-label={kind} className={className}
      style={{ ...style, backgroundImage: src ? `url(${src})` : undefined, backgroundRepeat: "no-repeat", backgroundSize: "300% 400%",
        backgroundPosition: `${(frame % 3) * 50}% ${ROW[dir] * (100 / 3)}%`, imageRendering: "pixelated" }} />
  );
}

export const NPC: Record<"mae" | "vend" | "procon" | "promo", Pal> = {
  mae: { kind: "mae" }, vend: { kind: "vend" }, procon: { kind: "procon" }, promo: { kind: "promo" },
};

/** Tuca, o cofrinho */
export function PigArt({ className }: { className?: string }) {
  const ready = useHydrated();
  return <div role="img" aria-label="Tuca" className={className} style={{ backgroundImage: ready ? `url(${pigArt()})` : undefined, backgroundSize: "100% 100%", imageRendering: "pixelated" }} />;
}
