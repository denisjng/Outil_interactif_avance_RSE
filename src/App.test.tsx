import { act, fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { donneesChargeesTest } from "./__fixtures__/donneesChargees";
import * as charger from "./data/charger";

afterEach(() => {
  vi.restoreAllMocks();
  window.location.hash = "";
});

it("affiche le titre de l'outil", async () => {
  vi.spyOn(charger, "chargerDonnees").mockResolvedValue(donneesChargeesTest);
  render(<App />);
  expect(screen.getByText("Le vrai coût d'un prompt")).toBeInTheDocument();
  await screen.findByRole("main");
});

it("en cas d'échec, affiche l'erreur et un bouton Réessayer qui relance le chargement", async () => {
  const spy = vi.spyOn(charger, "chargerDonnees")
    .mockRejectedValueOnce(new Error("Impossible de charger models.json"))
    .mockResolvedValueOnce(donneesChargeesTest);
  render(<App />);
  expect(await screen.findByText(/Impossible de charger models.json/)).toBeInTheDocument();
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Réessayer" })));
  expect(spy).toHaveBeenCalledTimes(2);
  await screen.findByRole("main");
});

it("une route inconnue affiche le simulateur", async () => {
  vi.spyOn(charger, "chargerDonnees").mockResolvedValue(donneesChargeesTest);
  window.location.hash = "#/inconnu";
  render(<App />);
  expect(await screen.findByRole("heading", { level: 1, name: /Combien pèse votre usage/ })).toBeInTheDocument();
});
