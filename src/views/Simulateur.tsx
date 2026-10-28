import type { DonneesChargees } from "../data/charger";

export function Simulateur(_: { d: DonneesChargees }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <h1 className="font-titre text-4xl font-bold">Combien pèse votre usage de l'IA sur un an ?</h1>
    </main>
  );
}
