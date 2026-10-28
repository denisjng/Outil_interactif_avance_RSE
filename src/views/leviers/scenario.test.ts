import { donneesTest } from "../../engine/__fixtures__/donnees";
import { estimer } from "../../engine/estimer";
import { appliquerLeviers, scenarioDepart, type LevierId } from "./scenario";

const d = donneesTest;
const carbone = (leviers: LevierId[]) => {
  const r = estimer(appliquerLeviers(scenarioDepart(d), leviers, d), d);
  return r.carboneUsageG.central + r.carboneFabricationG.central;
};

describe("scénario et leviers", () => {
  it("départ : modèle fermé, conversation, 20 requêtes, États-Unis, 1 personne, 1 an", () => {
    expect(scenarioDepart(d)).toEqual({ modeleId: "test/ferme-gpt-4o", tacheId: "conversation", requetesParJour: 20,
      paysId: "US", utilisateurs: 1, jours: 365 });
  });

  it("aucun levier : scénario inchangé", () => {
    expect(appliquerLeviers(scenarioDepart(d), [], d)).toEqual(scenarioDepart(d));
  });

  it("chaque levier ne change que son champ", () => {
    const base = scenarioDepart(d);
    expect(appliquerLeviers(base, ["petit-modele"], d)).toEqual({ ...base, modeleId: "test/petit-ouvert-8md" });
    expect(appliquerLeviers(base, ["france"], d)).toEqual({ ...base, paysId: "FR" });
    expect(appliquerLeviers(base, ["court"], d)).toEqual({ ...base, tacheId: "question-courte" });
    expect(appliquerLeviers(base, ["moitie"], d)).toEqual({ ...base, requetesParJour: 10 });
  });

  it("les 4 leviers combinés font mieux que chacun seul", () => {
    const tous = carbone(["petit-modele", "france", "court", "moitie"]);
    for (const l of ["petit-modele", "france", "court", "moitie"] as LevierId[]) expect(tous).toBeLessThan(carbone([l]));
  });
});
