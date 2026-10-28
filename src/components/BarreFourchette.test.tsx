import { render } from "@testing-library/react";
import { BarreFourchette } from "./BarreFourchette";

describe("BarreFourchette", () => {
  it("place le repère selon la position du central dans la fourchette", () => {
    const { getByTestId } = render(<BarreFourchette valeur={{ bas: 0, central: 25, haut: 100 }} couleur="#B45309" />);
    expect(getByTestId("repere").style.left).toBe("calc(25% - 2px)");
  });

  it("fourchette plate : repère au milieu, sans NaN", () => {
    const { getByTestId, container } = render(<BarreFourchette valeur={{ bas: 3, central: 3, haut: 3 }} couleur="#B45309" />);
    expect(getByTestId("repere").style.left).toBe("calc(50% - 2px)");
    expect(container.innerHTML).not.toContain("NaN");
  });
});
