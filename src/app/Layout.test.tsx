import { render, screen } from "@testing-library/react";
import { Layout } from "./Layout";

afterEach(() => vi.unstubAllGlobals());

describe("Layout", () => {
  it("rend 4 liens, la route courante marquée aria-current", () => {
    render(<Layout route="reduire"><p>contenu</p></Layout>);
    const liens = screen.getAllByRole("link", { name: /^(Simuler|Comparer|Réduire|Méthode)$/ });
    expect(liens).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Réduire" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Simuler" })).not.toHaveAttribute("aria-current");
  });

  it("affiche le poids de la page lu dans poids.json", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ko: 312 }) })));
    render(<Layout route="simuler"><p>contenu</p></Layout>);
    expect(await screen.findByText("Cette page pèse 312 Ko")).toBeInTheDocument();
  });
});
