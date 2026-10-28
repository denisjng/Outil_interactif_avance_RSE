import { donneesTest } from "../engine/__fixtures__/donnees";
import type { FacteurEquivalence } from "../engine/equivalences";
import type { Claim, EtatPoste, Meta, PosteId } from "../engine/types";
import type { DonneesChargees } from "../data/charger";

const POSTES: PosteId[] = ["calcul", "serveur", "inactif", "pue", "eauSite", "eauElectricite", "fabrication", "methodePublique"];

function postes(etats: Partial<Record<PosteId, EtatPoste>>): Claim["postes"] {
  return Object.fromEntries(
    POSTES.map((p) => [p, { etat: etats[p] ?? "non-precise", justification: `justification ${p}`, url: "https://exemple.org" }]),
  ) as Claim["postes"];
}

export const claimsTest: Claim[] = [
  { id: "google", acteur: "Google", modele: "Gemini", date: "août 2025", perimetre: "Prompt texte médian",
    energieWh: 0.24, carboneG: 0.03, eauMl: 0.26, source: "https://arxiv.org/abs/2508.15734",
    postes: postes({ calcul: "inclus", serveur: "inclus", inactif: "inclus", pue: "inclus", eauSite: "inclus",
      eauElectricite: "exclu", methodePublique: "inclus" }),
    fmti: 41, fmtiEnvironnement: { energie: false, carbone: false, eau: false } },
  { id: "openai", acteur: "OpenAI", modele: "ChatGPT", date: "juin 2025", perimetre: "Requête moyenne",
    energieWh: 0.34, carboneG: null, eauMl: 0.32, source: "https://blog.samaltman.com/the-gentle-singularity",
    postes: postes({ methodePublique: "exclu" }), fmti: 35, fmtiEnvironnement: { energie: false, carbone: false, eau: false } },
  { id: "mistral", acteur: "Mistral AI", modele: "Mistral Large 2", date: "juillet 2025", perimetre: "Réponse de 400 tokens",
    energieWh: null, carboneG: 1.14, eauMl: 45, source: "https://mistral.ai",
    postes: postes({ fabrication: "inclus", methodePublique: "inclus" }), fmti: 18, fmtiEnvironnement: null },
];

export const facteursTest: FacteurEquivalence[] = [
  { id: "voiture", libelle: "km en voiture thermique", indicateur: "carbone", parUnite: 142, source: "ADEME" },
  { id: "douche", libelle: "douches de 60 L", indicateur: "eau", parUnite: 60000, source: "outil" },
  { id: "smartphone", libelle: "recharges de smartphone", indicateur: "energie", parUnite: 15, source: "outil" },
];

const meta = (source: string): Meta => ({ source, url: "https://exemple.org", licence: "CC BY 4.0", extrait_le: "2026-10-28" });

export const donneesChargeesTest: DonneesChargees = {
  donnees: donneesTest,
  claims: claimsTest,
  facteurs: facteursTest,
  validation: [
    { modele: "test/a-7B", paramsMd: 7, tokens: 10, mesureWh: 0.019 },
    { modele: "test/b-13B", paramsMd: 13, tokens: 10, mesureWh: 0.026 },
    { modele: "test/c-70B", paramsMd: 70, tokens: 10, mesureWh: 1.7 },
  ],
  sources: ["EcoLogits", "Modèles", "Fournisseurs", "Ember", "Compar:IA", "Déclarations", "ADEME", "AI Energy Score"].map(meta),
};
