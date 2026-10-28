import { fireEvent, render, screen, within } from "@testing-library/react";
import { donneesChargeesTest } from "../__fixtures__/donneesChargees";
import { estimer } from "../engine/estimer";
import { formater } from "../engine/format";
import { Simulateur } from "./Simulateur";

const norm = (s: string | null) => (s ?? "").replace(/ | /g, " ");

function carte(titre: string) {
  return screen.getByRole("heading", { name: titre }).closest("article") as HTMLElement;
}

describe("Simulateur", () => {
  it("affiche 3 cartes et 3 équivalences", () => {
    render(<Simulateur d={donneesChargeesTest} />);
    for (const t of ["Énergie", "Carbone", "Eau"]) expect(carte(t)).toBeInTheDocument();
    expect(screen.getAllByTestId("equivalence")).toHaveLength(3);
  });

  it("à l'échelle de la France, l'énergie affichée est celle du moteur, sans notation e+", () => {
    render(<Simulateur d={donneesChargeesTest} />);
    fireEvent.click(screen.getByRole("button", { name: /La France/ }));
    const d = donneesChargeesTest.donnees;
    const attendu = estimer({ modeleId: d.modeles.find((m) => !m.ouvert)!.id, tacheId: "conversation",
      requetesParJour: 20, paysId: "US", utilisateurs: 10_000_000, jours: 365 }, d).energieWh.central;
    const texte = norm(within(carte("Énergie")).getByTestId("valeur").textContent);
    expect(texte).toBe(norm(formater(attendu, "Wh")));
    expect(document.body.textContent).not.toMatch(/e\+/);
  });

  it("modèle ouvert et 1 requête : aucune valeur à « 0 »", () => {
    render(<Simulateur d={donneesChargeesTest} />);
    fireEvent.click(screen.getByRole("button", { name: /Petit ouvert/ }));
    fireEvent.change(screen.getByLabelText(/Requêtes par jour/), { target: { value: "1" } });
    for (const v of screen.getAllByTestId("valeur")) expect(norm(v.textContent)).not.toMatch(/^0 /);
  });

  it("affiche l'intensité carbone du pays choisi", () => {
    render(<Simulateur d={donneesChargeesTest} />);
    expect(norm(screen.getByText(/gCO2e\/kWh/).textContent)).toContain("≈ 380 gCO2e/kWh");
  });

  it("signale le stress hydrique quand il est élevé", () => {
    const d = structuredClone(donneesChargeesTest);
    d.donnees.pays[1].stressHydrique = "extrêmement élevé";
    render(<Simulateur d={d} />);
    expect(within(carte("Eau")).getByText(/Zone de stress hydrique : extrêmement élevé/)).toBeInTheDocument();
  });
});
