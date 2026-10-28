import type { ReactNode } from "react";
import { formater, type Unite } from "../engine/format";
import type { Triplet } from "../engine/types";
import { BarreFourchette } from "./BarreFourchette";

type Poste = { libelle: string; valeur: number };

export function CarteResultat({
  titre, couleur, total, parRequete, postes, unite, alerte,
}: {
  titre: string;
  couleur: string;
  total: Triplet;
  parRequete: string;
  postes: [Poste, Poste];
  unite: Unite;
  alerte?: ReactNode;
}) {
  const somme = postes[0].valeur + postes[1].valeur;
  const part = somme > 0 ? (postes[0].valeur / somme) * 100 : 100;
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-xl border border-filet bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: couleur }} aria-hidden="true" />
        <h2 className="text-[15px] font-semibold">{titre}</h2>
      </div>
      <p data-testid="valeur" className="font-chiffre text-3xl font-semibold leading-tight tracking-tight">
        {formater(total.central, unite)}
      </p>
      <p className="text-[13px] text-secondaire">par an · {parRequete} par requête</p>
      <div className="flex flex-col gap-1.5">
        <BarreFourchette valeur={total} couleur={couleur} />
        <p className="flex justify-between font-chiffre text-xs text-secondaire">
          <span>bas {formater(total.bas, unite)}</span>
          <span>haut {formater(total.haut, unite)}</span>
        </p>
      </div>
      <div className="flex flex-col gap-1.5 border-t border-[#E7EAE5] pt-3">
        <div className="flex h-1.5 overflow-hidden rounded bg-[#E7EAE5]" aria-hidden="true">
          <div style={{ width: `${part.toFixed(1)}%`, background: couleur }} />
          <div className="flex-1 opacity-35" style={{ background: couleur }} />
        </div>
        {postes.map((p, i) => (
          <p key={p.libelle} className={`flex justify-between gap-2 text-[13px] ${i ? "text-secondaire" : ""}`}>
            <span>{p.libelle}</span>
            <span className="font-chiffre">{formater(p.valeur, unite)}</span>
          </p>
        ))}
      </div>
      {alerte}
    </article>
  );
}
