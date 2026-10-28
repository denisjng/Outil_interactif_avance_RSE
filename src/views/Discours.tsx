import type { DonneesChargees } from "../data/charger";

export function Discours(_: { d: DonneesChargees }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <h1 className="font-titre text-4xl font-bold">Les chiffres des entreprises ne mesurent pas la même chose</h1>
    </main>
  );
}
