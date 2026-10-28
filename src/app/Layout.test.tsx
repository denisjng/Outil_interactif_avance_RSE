import { render, screen } from "@testing-library/react";
import { Layout } from "./Layout";

describe("Layout", () => {
  it("rend 4 liens, la route courante marquée aria-current", () => {
    render(<Layout route="leviers"><p>contenu</p></Layout>);
    const liens = screen.getAllByRole("link", { name: /Simulateur|Discours vs réalité|Leviers frugaux|Méthodologie/ });
    expect(liens).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Leviers frugaux" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Simulateur" })).not.toHaveAttribute("aria-current");
  });
});
