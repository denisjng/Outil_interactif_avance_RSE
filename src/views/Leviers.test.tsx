import { fireEvent, render, screen, within } from "@testing-library/react";
import { donneesChargeesTest } from "../__fixtures__/donneesChargees";
import { Leviers } from "./Leviers";

describe("Réduire (leviers)", () => {
  it("résultat compact : après, avant, gain", () => {
    render(<Leviers d={donneesChargeesTest} />);
    expect(screen.getByText(/au lieu de/)).toBeInTheDocument();
    expect(screen.getByTestId("gain").textContent).toMatch(/^−\d+ %$/);
  });

  it("l'effet de chaque levier seul est replié (6 barres)", () => {
    render(<Leviers d={donneesChargeesTest} />);
    const details = screen.getByText(/Effet de chaque geste/).closest("details")!;
    expect(details.open).toBe(false);
    expect(within(details).getAllByTestId("barre")).toHaveLength(6);
  });

  it("les leviers sont des boutons à bascule, « Héberger en France » actif au départ", () => {
    render(<Leviers d={donneesChargeesTest} />);
    const france = screen.getByRole("button", { name: /Héberger en France/ });
    expect(france).toHaveAttribute("aria-pressed", "true");
    const petit = screen.getByRole("button", { name: /modèle plus petit/ });
    expect(petit).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(petit);
    expect(petit).toHaveAttribute("aria-pressed", "true");
  });
});
