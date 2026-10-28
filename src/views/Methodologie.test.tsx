import { render, screen, within } from "@testing-library/react";
import { donneesChargeesTest } from "../__fixtures__/donneesChargees";
import { ecartMedian, Methodologie, pointsValidation } from "./Methodologie";

describe("Méthode", () => {
  it("un résumé en 3 blocs, le détail en 4 sections repliées", () => {
    render(<Methodologie d={donneesChargeesTest} />);
    expect(screen.getAllByTestId("resume")).toHaveLength(3);
    const replies = document.querySelectorAll("details");
    expect(replies).toHaveLength(4);
    replies.forEach((r) => expect(r.open).toBe(false));
  });

  it("le tableau des hypothèses affiche les valeurs des données, sans texte entre crochets", () => {
    render(<Methodologie d={donneesChargeesTest} />);
    const tableau = screen.getByRole("table", { name: /Hypothèses/, hidden: true });
    expect(tableau.textContent).not.toMatch(/\[/);
    expect(within(tableau).getByRole("row", { name: /Paramètres actifs/, hidden: true }).textContent).toContain("132");
  });

  it("une ligne par source", () => {
    render(<Methodologie d={donneesChargeesTest} />);
    expect(within(screen.getByRole("list", { name: "Sources", hidden: true })).getAllByRole("listitem", { hidden: true })).toHaveLength(8);
  });

  it("graphique de comparaison légendé avec l'écart médian", () => {
    render(<Methodologie d={donneesChargeesTest} />);
    const figure = screen.getByRole("figure", { hidden: true });
    expect(within(figure).getByText(/écart médian/)).toBeInTheDocument();
    expect(within(figure).getByRole("img", { hidden: true })).toHaveAttribute("aria-label");
  });

  it("pointsValidation et ecartMedian", () => {
    const points = pointsValidation(donneesChargeesTest);
    expect(points).toHaveLength(3);
    expect(points.every((p) => p.estimationWh > 0)).toBe(true);
    expect(ecartMedian([{ mesureWh: 1, estimationWh: 2 }, { mesureWh: 1, estimationWh: 1 }, { mesureWh: 2, estimationWh: 1 }])).toBe(50);
  });
});
