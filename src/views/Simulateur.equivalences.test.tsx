import { fireEvent, render, screen } from "@testing-library/react";
import { donneesChargeesTest } from "../__fixtures__/donneesChargees";
import { Simulateur } from "./Simulateur";

it("à l'échelle de la France, les équivalences restent courtes (notation compacte)", () => {
  render(<Simulateur d={donneesChargeesTest} />);
  fireEvent.click(screen.getByRole("button", { name: /La France/ }));
  fireEvent.change(screen.getByLabelText(/Requêtes par jour/), { target: { value: "200" } });
  for (const e of screen.getAllByTestId("equivalence")) {
    const nombre = e.firstElementChild!.textContent!.replace(/\u202f|\u00a0/g, " ");
    expect(nombre.length).toBeLessThanOrEqual(8);
  }
});
