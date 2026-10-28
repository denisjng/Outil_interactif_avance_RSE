import { fireEvent, render, screen } from "@testing-library/react";
import { Infobulle } from "./Infobulle";
import { ListeDeroulante } from "./ListeDeroulante";
import { Replier } from "./Replier";

describe("Replier", () => {
  it("cache le contenu jusqu'au clic sur le titre", () => {
    render(<Replier titre="En savoir plus"><p>détail</p></Replier>);
    const details = screen.getByText("En savoir plus").closest("details")!;
    expect(details.open).toBe(false);
    fireEvent.click(screen.getByText("En savoir plus"));
    expect(details.open).toBe(true);
  });
});

describe("Infobulle", () => {
  it("bouton nommé qui affiche la définition au clic", () => {
    render(<Infobulle terme="CO2">Gaz à effet de serre.</Infobulle>);
    const bouton = screen.getByRole("button", { name: "Qu'est-ce que CO2 ?" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.click(bouton);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Gaz à effet de serre.");
    expect(bouton).toHaveAttribute("aria-expanded", "true");
  });
});

describe("ListeDeroulante", () => {
  it("libellé visible, groupes d'options, changement de valeur", () => {
    const onChange = vi.fn();
    render(
      <ListeDeroulante id="m" libelle="Modèle" valeur="b" onChange={onChange}
        groupes={[{ libelle: "Fermés", options: [{ id: "a", libelle: "A" }] }, { libelle: "Ouverts", options: [{ id: "b", libelle: "B" }] }]} />,
    );
    const select = screen.getByLabelText("Modèle") as HTMLSelectElement;
    expect(select.value).toBe("b");
    expect(screen.getByRole("group", { name: "Fermés" })).toBeInTheDocument();
    fireEvent.change(select, { target: { value: "a" } });
    expect(onChange).toHaveBeenCalledWith("a");
  });
});
