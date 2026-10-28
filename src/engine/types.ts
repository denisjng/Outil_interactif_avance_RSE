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

export type EtatPoste = "inclus" | "exclu" | "non-precise";
export type PosteId =
  | "calcul" | "serveur" | "inactif" | "pue" | "eauSite" | "eauElectricite" | "fabrication" | "methodePublique";

export type Claim = {
  id: "google" | "openai" | "mistral";
  acteur: string;
  modele: string;
  date: string;
  perimetre: string;
  energieWh: number | null;
  carboneG: number | null;
  eauMl: number | null;
  source: string;
  postes: Record<PosteId, { etat: EtatPoste; justification: string; url: string }>;
  fmti: number | null;
  fmtiEnvironnement: { energie: boolean; carbone: boolean; eau: boolean } | null;
};

// Mesure AI Energy Score : énergie GPU d'une requête, pour un modèle de taille connue.
export type PointValidation = { modele: string; paramsMd: number; tokens: number; mesureWh: number };
