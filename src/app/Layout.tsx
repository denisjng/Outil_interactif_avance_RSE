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

const LIENS: { route: Route; libelle: string }[] = [
  { route: "simulateur", libelle: "Simulateur" },
  { route: "discours", libelle: "Discours vs réalité" },
  { route: "leviers", libelle: "Leviers frugaux" },
  { route: "methodologie", libelle: "Méthodologie" },
];

export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  const poids = usePoids();
  return (
    <div className="flex min-h-screen flex-col bg-fond text-encre">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-filet bg-white px-4 py-4 sm:px-8">
        <a href="#/simulateur" className="flex items-center gap-3 text-encre no-underline">
          <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#15201B" strokeWidth="2" />
            <path d="M11 22 L16 14 L20 19 L25 11" fill="none" stroke="#B45309" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            <span className="block font-titre text-xl font-bold leading-tight">Le vrai coût d'un prompt</span>
            <span className="block text-[13px] text-secondaire">Estimer l'impact environnemental de l'IA générative</span>
          </span>
        </a>
        <nav aria-label="Vues de l'outil" className="flex flex-wrap gap-1">
          {LIENS.map((l) => (
            <a
              key={l.route}
              href={`#/${l.route}`}
              aria-current={l.route === route ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-lg px-4 font-medium no-underline ${
                l.route === route ? "bg-encre text-white" : "text-encre hover:bg-fond"
              }`}
            >
              {l.libelle}
            </a>
          ))}
        </nav>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-filet px-4 py-5 text-[13px] text-secondaire sm:px-8">
        <span>Prototype · Défi ADEME, Open Data University · Données ouvertes, sources dans Méthodologie</span>
        <span>
          Aucun cookie, aucun traceur{poids !== null && <> · <span>{`Cette page pèse ${poids} Ko`}</span></>}
        </span>
      </footer>
    </div>
  );
}
