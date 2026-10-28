import { render, screen, within } from "@testing-library/react";
import { donneesChargeesTest } from "../__fixtures__/donneesChargees";
import { Discours } from "./Discours";

describe("Comparer (discours vs réalité)", () => {
  it("un graphique : 3 chiffres déclarés et l'estimation ouverte", () => {
    render(<Discours d={donneesChargeesTest} />);
    const lignes = within(screen.getByRole("list", { name: /Électricité par question/ })).getAllByRole("listitem");
    expect(lignes).toHaveLength(4);
    expect(lignes[2]).toHaveTextContent("non publié");
    expect(lignes[3].textContent).toMatch(/Wh à .+Wh/);
  });

  it("4 questions simples sur ce que chaque chiffre compte", () => {
    render(<Discours d={donneesChargeesTest} />);
    const tableau = screen.getByRole("table", { name: "Que compte chaque chiffre ?" });
    const lignes = within(tableau).getAllByRole("row").slice(1);
    expect(lignes).toHaveLength(4);
    for (const l of lignes) expect(within(l).getAllByRole("cell")).toHaveLength(4);
    const eau = within(tableau).getByRole("row", { name: /eau des centrales/ });
    expect(within(eau).getAllByRole("cell")[0]).toHaveTextContent("Non");
  });

  it("le détail complet (8 postes) est replié", () => {
    render(<Discours d={donneesChargeesTest} />);
    const details = screen.getByText(/Voir le détail complet/).closest("details")!;
    expect(details.open).toBe(false);
    expect(within(details).getAllByRole("row").slice(1)).toHaveLength(8);
  });

  it("à retenir : transparence de l'entraînement", () => {
    render(<Discours d={donneesChargeesTest} />);
    expect(screen.getByText(/Aucune des 3 entreprises ne publie l'énergie/)).toBeInTheDocument();
  });
});
