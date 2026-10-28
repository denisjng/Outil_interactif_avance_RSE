import { render, screen, within } from "@testing-library/react";
import { donneesChargeesTest } from "../__fixtures__/donneesChargees";
import { Methodologie } from "./Methodologie";

// La mesure AI Energy Score inclut la lecture d'un long texte d'entrée, que le moteur ne modélise pas :
// la vue ne doit pas présenter ce graphique comme une validation de l'ordre de grandeur.
describe("Methodologie : comparaison avec AI Energy Score", () => {
  it("ne se présente pas comme une validation", () => {
    render(<Methodologie d={donneesChargeesTest} />);
    expect(screen.queryByRole("heading", { name: /Le moteur est-il juste/ })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /angle mort/ })).toBeInTheDocument();
  });

  it("la légende explique pourquoi les protocoles ne se comparent pas", () => {
    render(<Methodologie d={donneesChargeesTest} />);
    const legende = within(screen.getByRole("figure")).getByText(/écart médian/).closest("figcaption")!;
    expect(legende.textContent).toMatch(/lecture du texte d'entrée/);
    expect(document.body.textContent).not.toMatch(/vaut pour l'ordre de grandeur/);
  });
});
