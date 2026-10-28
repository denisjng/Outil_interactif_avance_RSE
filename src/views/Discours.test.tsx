import { render, screen, within } from "@testing-library/react";
import { donneesChargeesTest } from "../__fixtures__/donneesChargees";
import { Discours } from "./Discours";

describe("Discours", () => {
  it("4 cartes : 3 déclarations et l'estimation ouverte", () => {
    render(<Discours d={donneesChargeesTest} />);
    expect(screen.getAllByRole("article")).toHaveLength(4);
  });

  it("une valeur non publiée est affichée comme telle", () => {
    render(<Discours d={donneesChargeesTest} />);
    const openai = screen.getByRole("heading", { name: /OpenAI/ }).closest("article") as HTMLElement;
    expect(within(openai).getByTestId("carbone")).toHaveTextContent("non publié");
  });

  it("matrice : 8 postes, 4 colonnes de données", () => {
    render(<Discours d={donneesChargeesTest} />);
    const lignes = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(lignes).toHaveLength(8);
    for (const l of lignes) expect(within(l).getAllByRole("cell")).toHaveLength(4);
  });

  it("Google exclut l'eau de la production d'électricité", () => {
    render(<Discours d={donneesChargeesTest} />);
    const ligne = screen.getByRole("row", { name: /Eau de la production d'électricité/ });
    expect(within(ligne).getAllByRole("cell")[0]).toHaveTextContent("✕ Exclu");
  });

  it("l'estimation ouverte est calculée, sans texte entre crochets", () => {
    render(<Discours d={donneesChargeesTest} />);
    const carte = screen.getByRole("heading", { name: /Estimation ouverte/ }).closest("article") as HTMLElement;
    expect(carte.textContent).not.toMatch(/\[/);
    expect(within(carte).getByTestId("energie").textContent).toMatch(/Wh/);
  });
});
