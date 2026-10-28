import { render, screen, within } from "@testing-library/react";
import { donneesChargeesTest } from "../__fixtures__/donneesChargees";
import { ecartMedian, pointsValidation } from "./Methodologie";
import { Methodologie } from "./Methodologie";

describe("Methodologie", () => {
  it("le tableau des hypothèses affiche les valeurs des données, sans texte entre crochets", () => {
    render(<Methodologie d={donneesChargeesTest} />);
    const tableau = screen.getByRole("table", { name: /Hypothèses/ });
    expect(tableau.textContent).not.toMatch(/\[/);
    // paramètres actifs du modèle fermé de test : 44 à 132 Md
    expect(within(tableau).getByRole("row", { name: /Paramètres actifs/ }).textContent).toContain("132");
  });

  it("une ligne par source", () => {
    render(<Methodologie d={donneesChargeesTest} />);
    expect(within(screen.getByRole("list", { name: "Sources" })).getAllByRole("listitem")).toHaveLength(8);
  });

  it("graphique de validation légendé avec l'écart médian", () => {
    render(<Methodologie d={donneesChargeesTest} />);
    const figure = screen.getByRole("figure");
    expect(within(figure).getByText(/écart médian/)).toBeInTheDocument();
    expect(within(figure).getByRole("img")).toHaveAttribute("aria-label");
  });

  it("pointsValidation et ecartMedian", () => {
    const points = pointsValidation(donneesChargeesTest);
    expect(points).toHaveLength(3);
    expect(points.every((p) => p.estimationWh > 0)).toBe(true);
    expect(ecartMedian([{ mesureWh: 1, estimationWh: 2 }, { mesureWh: 1, estimationWh: 1 }, { mesureWh: 2, estimationWh: 1 }])).toBe(50);
  });
});
