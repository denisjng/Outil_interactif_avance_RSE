import type { FacteurEquivalence } from "../engine/equivalences";
import type { Claim, Coefficients, Donnees, Fournisseur, Meta, Modele, Pays, PointValidation, Tache } from "../engine/types";

export type DonneesChargees = {
  donnees: Donnees;
  claims: Claim[];
  facteurs: FacteurEquivalence[];
  validation: PointValidation[];
  sources: Meta[];
};

export const FICHIERS = [
  "coefficients.json", "models.json", "providers.json", "countries.json",
  "tasks.json", "claims.json", "equivalences.json", "validation.json",
] as const;

type Fichier<T> = { meta: Meta; data: T };

async function lire<T>(base: string, nom: (typeof FICHIERS)[number]): Promise<Fichier<T>> {
  let reponse: Response;
  try {
    reponse = await fetch(`${base}data/${nom}`);
  } catch {
    throw new Error(`Impossible de charger ${nom}`);
  }
  if (!reponse.ok) throw new Error(`Impossible de charger ${nom}`);
  return (await reponse.json()) as Fichier<T>;
}

export async function chargerDonnees(base: string = import.meta.env.BASE_URL): Promise<DonneesChargees> {
  const [coefficients, modeles, fournisseurs, pays, taches, claims, facteurs, validation] = await Promise.all([
    lire<Coefficients>(base, "coefficients.json"),
    lire<Modele[]>(base, "models.json"),
    lire<Fournisseur[]>(base, "providers.json"),
    lire<Pays[]>(base, "countries.json"),
    lire<Tache[]>(base, "tasks.json"),
    lire<Claim[]>(base, "claims.json"),
    lire<FacteurEquivalence[]>(base, "equivalences.json"),
    lire<PointValidation[]>(base, "validation.json"),
  ]);
  return {
    donnees: {
      coefficients: coefficients.data,
      modeles: modeles.data,
      fournisseurs: fournisseurs.data,
      pays: pays.data,
      taches: taches.data,
    },
    claims: claims.data,
    facteurs: facteurs.data,
    validation: validation.data,
    sources: [coefficients, modeles, fournisseurs, pays, taches, claims, facteurs, validation].map((f) => f.meta),
  };
}
