import type { Resultat } from "./types";

// parUnite est exprimé en Wh, gCO2e ou mL par unité d'équivalence (un km, une douche…).
export type FacteurEquivalence = {
  id: string;
  libelle: string;
  indicateur: "energie" | "carbone" | "eau";
  parUnite: number;
  source: string;
};

export type Equivalence = { id: string; libelle: string; valeur: number };

export function equivalences(r: Resultat, facteurs: FacteurEquivalence[]): Equivalence[] {
  const totaux = {
    energie: r.energieWh.central,
    carbone: r.carboneUsageG.central + r.carboneFabricationG.central,
    eau: r.eauDirecteMl.central + r.eauIndirecteMl.central,
  };
  return facteurs.map((f) => {
    if (!(f.parUnite > 0)) throw new Error(`Facteur invalide : ${f.id}`);
    return { id: f.id, libelle: f.libelle, valeur: totaux[f.indicateur] / f.parUnite };
  });
}
