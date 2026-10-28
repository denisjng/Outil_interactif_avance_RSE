import { render, screen } from "@testing-library/react";
import { donneesChargeesTest } from "./donneesChargees";
import { Simulateur } from "../views/Simulateur";
import { Leviers } from "../views/Leviers";
import { Discours } from "../views/Discours";
import { VueProtegee } from "../app/VueProtegee";

// Données mises à jour où la tâche « conversation » et la France ont disparu.
const incompletes = structuredClone(donneesChargeesTest);
incompletes.donnees.taches = incompletes.donnees.taches.filter((t) => t.id !== "conversation");
incompletes.donnees.pays = incompletes.donnees.pays.filter((p) => p.id !== "FR");

describe("données incomplètes", () => {
  it.each([["Simulateur", Simulateur], ["Leviers", Leviers], ["Discours", Discours]] as const)(
    "%s s'affiche avec des valeurs de repli", (_, Vue) => {
      render(<Vue d={incompletes} />);
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });

  it("une vue qui lève une erreur affiche un message au lieu d'un écran blanc", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const Casse = () => { throw new Error("Modèle inconnu : x"); };
    render(<VueProtegee><Casse /></VueProtegee>);
    expect(screen.getByRole("alert")).toHaveTextContent("Modèle inconnu : x");
  });
});
