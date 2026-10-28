import { equivalences, type FacteurEquivalence } from "./equivalences";
import type { Resultat, Triplet } from "./types";

const t = (v: number): Triplet => ({ bas: v, central: v, haut: v });
const resultat: Resultat = {
  energieWh: t(300), energieParRequeteWh: t(1), carboneUsageG: t(800), carboneFabricationG: t(200),
  eauDirecteMl: t(10_000), eauIndirecteMl: t(50_000),
};
const facteur = (id: string, indicateur: FacteurEquivalence["indicateur"], parUnite: number): FacteurEquivalence =>
  ({ id, libelle: id, indicateur, parUnite, source: "test" });

describe("equivalences", () => {
  it("carbone total central divisé par le facteur", () => {
    expect(equivalences(resultat, [facteur("km", "carbone", 200)])[0].valeur).toBe(5);
  });

  it("énergie et eau totale", () => {
    const [e, eau] = equivalences(resultat, [facteur("tel", "energie", 15), facteur("douche", "eau", 60_000)]);
    expect(e.valeur).toBe(20);
    expect(eau.valeur).toBe(1);
  });

  it("conserve l'ordre des facteurs", () => {
    const ids = equivalences(resultat, [facteur("b", "eau", 1), facteur("a", "energie", 1)]).map((x) => x.id);
    expect(ids).toEqual(["b", "a"]);
  });

  it("refuse un facteur nul", () => {
    expect(() => equivalences(resultat, [facteur("zero", "carbone", 0)])).toThrow("Facteur invalide : zero");
  });
});
