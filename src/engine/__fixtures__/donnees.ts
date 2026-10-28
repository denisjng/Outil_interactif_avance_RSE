import coefficients from "../../../public/data/coefficients.json";
import type { Donnees, Modele, Triplet } from "../types";

const t = (v: number): Triplet => ({ bas: v, central: v, haut: v });

const modeles: Modele[] = [
  { id: "test/petit-ouvert-8md", nom: "Petit ouvert", fournisseurId: "openai", ouvert: true,
    paramsActifsMd: t(8), paramsTotauxMd: t(8), tps: null, ttft: null },
  { id: "test/moyen-ouvert-70md", nom: "Moyen ouvert", fournisseurId: "openai", ouvert: true,
    paramsActifsMd: t(70), paramsTotauxMd: t(70), tps: null, ttft: null },
  { id: "test/ferme-gpt-4o", nom: "Fermé type GPT-4o", fournisseurId: "openai", ouvert: false,
    paramsActifsMd: { bas: 44, central: Math.sqrt(44 * 132), haut: 132 }, paramsTotauxMd: t(440), tps: 74, ttft: 0.61 },
];

export const donneesTest: Donnees = {
  modeles,
  fournisseurs: [{ id: "openai", nom: "OpenAI", pue: t(1.2), wue: t(0.569) }],
  pays: [
    { id: "FR", nom: "France", intensiteCarbone: t(41.44), eauElectricite: t(3.6737), stressHydrique: "faible" },
    { id: "US", nom: "États-Unis", intensiteCarbone: { bas: 350, central: 383.11, haut: 420 },
      eauElectricite: t(3.1), stressHydrique: null },
  ],
  taches: [
    { id: "question-courte", nom: "Question courte", tokens: { bas: 80, central: 150, haut: 250 } },
    { id: "conversation", nom: "Conversation", tokens: t(400) },
    { id: "redaction", nom: "Rédaction longue", tokens: { bas: 600, central: 1000, haut: 1800 } },
    { id: "code", nom: "Code", tokens: { bas: 400, central: 800, haut: 1500 } },
  ],
  coefficients: coefficients.data,
};
