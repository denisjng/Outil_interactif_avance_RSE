import reference from "./__fixtures__/ecologits_reference.json";
import { donneesTest } from "./__fixtures__/donnees";
import { estimer } from "./estimer";
import type { Donnees, Entrees, Resultat, Triplet } from "./types";

const t = (v: number): Triplet => ({ bas: v, central: v, haut: v });
const proche = (x: number, ref: number) => Math.abs(x - ref) / ref <= 0.05;

const unitaire: Entrees = {
  modeleId: "test/moyen-ouvert-70md", tacheId: "conversation", requetesParJour: 1,
  paysId: "FR", utilisateurs: 1, jours: 1,
};

type Ref = (typeof reference)[number];

// Un jeu de données à un seul modèle et un seul pays reprenant exactement le cas de référence.
function donneesPour(ref: Ref): Donnees {
  return {
    ...donneesTest,
    modeles: [{ id: "ref", nom: ref.cas, fournisseurId: "openai", ouvert: true,
      paramsActifsMd: t(ref.paramsActifsMd), paramsTotauxMd: t(ref.paramsTotauxMd), tps: ref.tps, ttft: ref.ttft }],
    pays: [{ id: "REF", nom: ref.mix, intensiteCarbone: t(ref.intensiteCarbone),
      eauElectricite: t(ref.eauElectricite), stressHydrique: null }],
  };
}

function triplets(r: Resultat): Triplet[] {
  return Object.values(r);
}

describe("estimer : fidélité à EcoLogits", () => {
  it.each(reference.map((r) => [`${r.cas} / ${r.mix}`, r] as const))("%s à 5 % près", (_, ref) => {
    const r = estimer({ ...unitaire, modeleId: "ref", paysId: "REF" }, donneesPour(ref));
    expect(proche(r.energieParRequeteWh.central, ref.energieWh)).toBe(true);
    expect(proche(r.carboneUsageG.central, ref.carboneUsageG)).toBe(true);
    expect(proche(r.carboneFabricationG.central, ref.carboneFabricationG)).toBe(true);
    expect(proche(r.eauDirecteMl.central + r.eauIndirecteMl.central, ref.eauMl)).toBe(true);
  });
});

describe("estimer : propriétés", () => {
  it("fourchettes ordonnées pour toutes les combinaisons", () => {
    for (const m of donneesTest.modeles)
      for (const tache of donneesTest.taches)
        for (const p of donneesTest.pays)
          for (const req of [1, 20, 200]) {
            const r = estimer({ ...unitaire, modeleId: m.id, tacheId: tache.id, paysId: p.id, requetesParJour: req }, donneesTest);
            for (const x of triplets(r)) {
              expect(x.bas).toBeLessThanOrEqual(x.central);
              expect(x.central).toBeLessThanOrEqual(x.haut);
            }
          }
  });

  it("modèle ouvert et entrées fixes : fourchette plate", () => {
    const r = estimer({ ...unitaire, modeleId: "test/petit-ouvert-8md" }, donneesTest);
    for (const x of triplets(r)) expect(x.bas).toBeCloseTo(x.haut, 12);
  });

  it("doubler les requêtes ou les utilisateurs double l'énergie totale", () => {
    const base = estimer(unitaire, donneesTest).energieWh.central;
    expect(estimer({ ...unitaire, requetesParJour: 2 }, donneesTest).energieWh.central).toBeCloseTo(2 * base, 9);
    expect(estimer({ ...unitaire, utilisateurs: 2 }, donneesTest).energieWh.central).toBeCloseTo(2 * base, 9);
  });

  it("identifiants inconnus : erreur explicite", () => {
    expect(() => estimer({ ...unitaire, modeleId: "inconnu" }, donneesTest)).toThrow("Modèle inconnu : inconnu");
    expect(() => estimer({ ...unitaire, paysId: "XX" }, donneesTest)).toThrow("Pays inconnu : XX");
    expect(() => estimer({ ...unitaire, tacheId: "poeme" }, donneesTest)).toThrow("Tâche inconnue : poeme");
  });

  it("entrées invalides : erreur explicite", () => {
    expect(() => estimer({ ...unitaire, requetesParJour: -1 }, donneesTest)).toThrow("Entrée invalide : requetesParJour");
    expect(() => estimer({ ...unitaire, requetesParJour: NaN }, donneesTest)).toThrow("Entrée invalide : requetesParJour");
  });
});
