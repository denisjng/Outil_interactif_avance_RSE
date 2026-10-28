import type { Triplet } from "../engine/types";

// Barre basse/haute avec un repère sur la valeur centrale. Une fourchette plate place le repère au milieu.
export function BarreFourchette({ valeur, couleur }: { valeur: Triplet; couleur: string }) {
  const etendue = valeur.haut - valeur.bas;
  const position = etendue > 0 ? ((valeur.central - valeur.bas) / etendue) * 100 : 50;
  return (
    <div className="relative h-2 rounded bg-[#E7EAE5]" aria-hidden="true">
      <div className="absolute inset-0 rounded opacity-25" style={{ background: couleur }} />
      <div
        data-testid="repere"
        className="absolute -top-1 h-4 w-1 rounded-sm"
        style={{ background: couleur, left: `calc(${Number(position.toFixed(1))}% - 2px)` }}
      />
    </div>
  );
}
