export type Triplet = { bas: number; central: number; haut: number };

export type Modele = {
  id: string;
  nom: string;
  fournisseurId: string;
  ouvert: boolean;
  paramsActifsMd: Triplet;
  paramsTotauxMd: Triplet;
  tps: number | null; // tokens générés par seconde, quand EcoLogits le publie
  ttft: number | null; // latence du premier token en secondes
};

export type Fournisseur = { id: string; nom: string; pue: Triplet; wue: Triplet };

export type Pays = {
  id: string;
  nom: string;
  intensiteCarbone: Triplet; // gCO2e/kWh
  eauElectricite: Triplet; // L/kWh
  stressHydrique: string | null;
};

export type TacheId = "question-courte" | "conversation" | "redaction" | "code";
export type Tache = { id: TacheId; nom: string; tokens: Triplet };

export type Coefficients = Record<string, number>;

export type Donnees = {
  modeles: Modele[];
  fournisseurs: Fournisseur[];
  pays: Pays[];
  taches: Tache[];
  coefficients: Coefficients;
};

export type Entrees = {
  modeleId: string;
  tacheId: string;
  requetesParJour: number;
  paysId: string;
  utilisateurs: number;
  jours: number;
};

export type Resultat = {
  energieWh: Triplet;
  energieParRequeteWh: Triplet;
  carboneUsageG: Triplet;
  carboneFabricationG: Triplet;
  eauDirecteMl: Triplet;
  eauIndirecteMl: Triplet;
};

export type Meta = { source: string; url: string; licence: string; extrait_le: string };
