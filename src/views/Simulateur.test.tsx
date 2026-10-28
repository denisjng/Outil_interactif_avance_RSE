import { fireEvent, render, screen, within } from "@testing-library/react";
import { donneesChargeesTest } from "../__fixtures__/donneesChargees";
import { estimer } from "../engine/estimer";
import { formater } from "../engine/format";
import { Simulateur } from "./Simulateur";

const norm = (s: string | null) => (s ?? "").replace(/ | /g, " ");
const tuile = (titre: string) => screen.getByRole("heading", { name: titre }).closest("article") as HTMLElement;

describe("Simulateur", () => {
  it("une phrase-résultat et 3 tuiles", () => {
    render(<Simulateur d={donneesChargeesTest} />);
    expect(norm(screen.getByTestId("phrase").textContent)).toMatch(/^Sur un an, votre usage émet autant de CO2 que .+ km en voiture thermique/);
    for (const t of ["Électricité", "CO2", "Eau"]) expect(tuile(t)).toBeInTheDocument();
    expect(screen.getAllByTestId("equivalence")).toHaveLength(3);
  });

  it("réglages compacts : modèle et pays en listes déroulantes", () => {
    render(<Simulateur d={donneesChargeesTest} />);
    expect(screen.getByLabelText("Modèle d'IA").tagName).toBe("SELECT");
    expect(screen.getByLabelText("Pays du data center").tagName).toBe("SELECT");
  });

  it("à l'échelle de la France, l'électricité affichée est celle du moteur", () => {
    render(<Simulateur d={donneesChargeesTest} />);
    fireEvent.click(screen.getByRole("button", { name: /La France/ }));
    const d = donneesChargeesTest.donnees;
    const attendu = estimer({ modeleId: d.modeles.find((m) => !m.ouvert)!.id, tacheId: "conversation",
      requetesParJour: 20, paysId: "US", utilisateurs: 10_000_000, jours: 365 }, d).energieWh.central;
    expect(norm(within(tuile("Électricité")).getByTestId("valeur").textContent)).toBe(norm(formater(attendu, "Wh")));
    expect(norm(screen.getByTestId("phrase").textContent)).toMatch(/^Sur un an, la France émet/);
    expect(document.body.textContent).not.toMatch(/e\+/);
  });

  it("petit modèle et 1 question par jour : aucune valeur à « 0 »", () => {
    render(<Simulateur d={donneesChargeesTest} />);
    fireEvent.change(screen.getByLabelText("Modèle d'IA"), { target: { value: "test/petit-ouvert-8md" } });
    fireEvent.change(screen.getByLabelText(/Questions par jour/), { target: { value: "1" } });
    for (const v of screen.getAllByTestId("valeur")) expect(norm(v.textContent)).not.toMatch(/^0 /);
  });

  it("rappelle l'intensité carbone du pays choisi, en mots simples", () => {
    render(<Simulateur d={donneesChargeesTest} />);
    expect(norm(screen.getByText(/g de CO2 par kWh/).textContent)).toContain("≈ 380 g de CO2 par kWh");
  });

  it("signale le stress hydrique quand il est élevé", () => {
    const d = structuredClone(donneesChargeesTest);
    d.donnees.pays[1].stressHydrique = "extrêmement élevé";
    render(<Simulateur d={d} />);
    expect(within(tuile("Eau")).getByText(/Région où l'eau manque : stress extrêmement élevé/)).toBeInTheDocument();
  });

  it("le détail du calcul est replié", () => {
    render(<Simulateur d={donneesChargeesTest} />);
    const details = screen.getByText("Comment c'est calculé ?").closest("details")!;
    expect(details.open).toBe(false);
    expect(within(details).getByText(/Fabrication des serveurs/)).toBeInTheDocument();
  });
});
