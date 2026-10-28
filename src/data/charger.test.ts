import { chargerDonnees, FICHIERS } from "./charger";

function reponse(nom: string) {
  return { meta: { source: nom, url: "https://x", licence: "l", extrait_le: "2026-10-28" }, data: nom === "coefficients.json" ? {} : [] };
}

afterEach(() => vi.unstubAllGlobals());

describe("chargerDonnees", () => {
  it("charge les 8 fichiers et renvoie leurs métadonnées", async () => {
    const fetch = vi.fn(async (url: string) => ({ ok: true, json: async () => reponse(url.split("/").pop()!) }));
    vi.stubGlobal("fetch", fetch);
    const d = await chargerDonnees("/base/");
    expect(FICHIERS).toHaveLength(8);
    expect(d.sources).toHaveLength(8);
    expect(fetch).toHaveBeenCalledWith("/base/data/models.json");
    expect(d.donnees.modeles).toEqual([]);
  });

  it("rejette avec le nom du fichier en échec", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) =>
      url.endsWith("models.json") ? { ok: false, json: async () => ({}) } : { ok: true, json: async () => reponse("x") }));
    await expect(chargerDonnees("/")).rejects.toThrow("Impossible de charger models.json");
  });
});
