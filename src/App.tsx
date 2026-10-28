import { useCallback, useEffect, useState } from "react";
import { Layout } from "./app/Layout";
import { useRoute } from "./app/route";
import * as charger from "./data/charger";
import type { DonneesChargees } from "./data/charger";
import { Discours } from "./views/Discours";
import { Leviers } from "./views/Leviers";
import { Methodologie } from "./views/Methodologie";
import { Simulateur } from "./views/Simulateur";

type Etat = { statut: "chargement" } | { statut: "erreur"; message: string } | { statut: "pret"; d: DonneesChargees };

const VUES = { simulateur: Simulateur, discours: Discours, leviers: Leviers, methodologie: Methodologie };

export default function App() {
  const route = useRoute();
  const [etat, setEtat] = useState<Etat>({ statut: "chargement" });

  const charge = useCallback(() => {
    setEtat({ statut: "chargement" });
    charger.chargerDonnees().then(
      (d) => setEtat({ statut: "pret", d }),
      (e: unknown) => setEtat({ statut: "erreur", message: e instanceof Error ? e.message : String(e) }),
    );
  }, []);

  useEffect(charge, [charge]);

  const Vue = VUES[route];
  return (
    <Layout route={route}>
      {etat.statut === "chargement" && (
        <p className="px-8 py-10 text-secondaire" role="status">Chargement des données…</p>
      )}
      {etat.statut === "erreur" && (
        <div role="alert" className="mx-auto max-w-xl px-4 py-10">
          <p className="mb-4">Les données n'ont pas pu être chargées : {etat.message}.</p>
          <button type="button" onClick={charge} className="min-h-11 rounded-lg bg-encre px-5 font-semibold text-white">
            Réessayer
          </button>
        </div>
      )}
      {etat.statut === "pret" && <Vue d={etat.d} />}
    </Layout>
  );
}
