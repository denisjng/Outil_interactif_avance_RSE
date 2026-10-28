import { useEffect, useState, type ReactNode } from "react";
import type { Route } from "./route";

// poids.json est écrit au build par scripts/budget.mjs ; absent en développement.
function usePoids(): number | null {
  const [ko, setKo] = useState<number | null>(null);
  useEffect(() => {
    let actif = true;
    fetch(`${import.meta.env.BASE_URL}poids.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p: { ko?: number } | null) => actif && typeof p?.ko === "number" && setKo(p.ko))
      .catch(() => {});
    return () => {
      actif = false;
    };
  }, []);
  return ko;
}

// Icônes au trait, 20 px : visibles surtout dans la barre du bas sur mobile.
const ICONES: Record<Route, string> = {
  simuler: "M4 6h12M4 10h8M4 14h10",
  comparer: "M5 16V9M10 16V4M15 16v-5",
  reduire: "M4 6l5 5 3-3 4 4M16 8v4h-4",
  methode: "M6 3h6l3 3v11H6zM9 9h3M9 12h3",
};

const LIENS: { route: Route; libelle: string }[] = [
  { route: "simuler", libelle: "Simuler" },
  { route: "comparer", libelle: "Comparer" },
  { route: "reduire", libelle: "Réduire" },
  { route: "methode", libelle: "Méthode" },
];

export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  const poids = usePoids();
  return (
    <div className="flex min-h-screen flex-col bg-fond pb-16 text-encre sm:pb-0">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Aller au contenu
      </a>
      <header className="flex items-center justify-between gap-4 border-b border-filet bg-white px-4 py-3 sm:px-8">
        <a href="#/simuler" className="flex items-center gap-2.5 text-encre no-underline">
          <svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#15201B" strokeWidth="2" />
            <path d="M11 22 L16 14 L20 19 L25 11" fill="none" stroke="#B45309" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-titre text-lg font-bold leading-tight">Le vrai coût d'un prompt</span>
        </a>
        <nav aria-label="Vues de l'outil"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-filet bg-white sm:static sm:flex sm:gap-1 sm:border-0 sm:bg-transparent">
          {LIENS.map((l) => {
            const actif = l.route === route;
            return (
              <a
                key={l.route}
                href={`#/${l.route}`}
                aria-current={actif ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium no-underline sm:min-h-11 sm:flex-row sm:rounded-lg sm:px-4 sm:text-base ${
                  actif ? "text-energie sm:bg-encre sm:text-white" : "text-secondaire hover:text-encre sm:text-encre sm:hover:bg-fond"
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="sm:hidden">
                  <path d={ICONES[l.route]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {l.libelle}
              </a>
            );
          })}
        </nav>
      </header>
      <div id="contenu" tabIndex={-1} className="flex-1 outline-none">{children}</div>
      <footer className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-t border-filet px-4 py-4 text-xs text-secondaire sm:px-8">
        <span>Défi ADEME, Open Data University · Données ouvertes, sources dans « Méthode »</span>
        <span>
          Aucun cookie, aucun traceur{poids !== null && <> · <span>{`Cette page pèse ${poids} Ko`}</span></>}
        </span>
      </footer>
    </div>
  );
}
