import { useState } from "react";
import { Replier } from "../components/Replier";
import type { DonneesChargees } from "../data/charger";
import { estimer } from "../engine/estimer";
import { formater } from "../engine/format";
import type { Donnees, Entrees } from "../engine/types";
import { appliquerLeviers, LEVIERS, scenarioDepart, type LevierId } from "./leviers/scenario";

function carbone(e: Entrees, d: Donnees): number {
  const r = estimer(e, d);
  return r.carboneUsageG.central + r.carboneFabricationG.central;
}

export function Leviers({ d }: { d: DonneesChargees }) {
  const { donnees } = d;
  const [actifs, setActifs] = useState<LevierId[]>(["france"]);
  const base = scenarioDepart(donnees);
  const avant = carbone(base, donnees);
  const apres = carbone(appliquerLeviers(base, actifs, donnees), donnees);
  const gain = avant > 0 ? Math.round((1 - apres / avant) * 100) : 0;
  const modele = donnees.modeles.find((m) => m.id === base.modeleId)!;
  const pays = donnees.pays.find((p) => p.id === base.paysId)!;

  const barres = [
    { libelle: "Au départ", g: avant, couleur: "#9AA39E", fort: false },
    ...LEVIERS.map((l) => ({ libelle: l.libelle, g: carbone(appliquerLeviers(base, [l.id], donnees), donnees), couleur: "#334155", fort: false })),
    { libelle: "Vos gestes combinés", g: apres, couleur: "#14532D", fort: true },
  ];
  const basculer = (id: LevierId) => setActifs((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  return (
    <main className="mx-auto flex max-w-[1180px] flex-col gap-5 px-4 pb-10 pt-6 sm:px-8">
      <div>
        <h1 className="font-titre text-[28px] font-bold leading-tight sm:text-4xl">Comment réduire l'impact&nbsp;?</h1>
        <p className="mt-1 text-secondaire">
          Exemple : {modele.nom}, 20 questions par jour, serveurs {pays.id === "US" ? "aux États-Unis" : `en ${pays.nom}`}. Choisissez vos gestes.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        <section aria-label="Gestes" className="grid gap-3 sm:grid-cols-2">
          {LEVIERS.map((l) => {
            const on = actifs.includes(l.id);
            return (
              <button
                key={l.id}
                type="button"
                aria-pressed={on}
                onClick={() => basculer(l.id)}
                className={`flex min-h-11 items-start gap-3 rounded-xl border p-4 text-left ${
                  on ? "border-encre bg-encre text-white" : "border-[#C9CEC7] bg-white text-encre hover:border-encre"
                }`}
              >
                <span aria-hidden="true" className={`mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded font-bold ${
                  on ? "bg-white text-encre" : "border-2 border-[#9AA39E]"}`}>{on ? "✓" : ""}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold leading-snug">{l.libelle}</span>
                  <span className="text-[13px] leading-snug opacity-80">{l.detail}</span>
                </span>
              </button>
            );
          })}
        </section>

        <section aria-label="Résultat" aria-live="polite" className="flex flex-col justify-center gap-1 rounded-xl border border-filet bg-white p-5">
          <p className="text-sm text-secondaire">CO2 sur un an, pour une personne</p>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-chiffre text-4xl font-semibold leading-tight">{formater(apres, "gCO2e")}</p>
            <p data-testid="gain" className="font-titre text-4xl font-bold leading-none text-gain">−{gain} %</p>
          </div>
          <p className="text-sm text-secondaire">au lieu de {formater(avant, "gCO2e")}</p>
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <p className="rounded-xl bg-encre p-4 text-[15px] text-[#DDE3DF]">
          <strong className="text-white">Attention à l'effet rebond.</strong> Une IA plus efficace incite à s'en servir
          plus. Seul le geste « moins de questions » réduit le volume.
        </p>
        <p className="rounded-xl border border-filet bg-white p-4 text-[15px]">
          <strong>La bonne question d'abord :</strong> ai-je vraiment besoin d'une IA pour ça, ou un moteur de recherche suffit-il&nbsp;?
        </p>
      </div>

      <Replier titre="Effet de chaque geste pris seul">
        <div className="flex flex-col gap-3">
          {barres.map((b) => (
            <div key={b.libelle} data-testid="barre" className="flex flex-col gap-1">
              <p className="flex justify-between gap-2 text-sm">
                <span className={b.fort ? "font-bold" : ""}>{b.libelle}</span>
                <span className="font-chiffre">{formater(b.g, "gCO2e")}</span>
              </p>
              <div className="h-3 rounded bg-[#EEF0EC]" aria-hidden="true">
                <div className="h-3 rounded" style={{ background: b.couleur, width: `${Math.max(1, avant > 0 ? (b.g / avant) * 100 : 0).toFixed(1)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[13px] text-secondaire">
          Principes de l'IA frugale (ministère de la Transition écologique) : démontrer que l'IA est nécessaire, adopter
          les bonnes pratiques, questionner les usages pour rester dans les limites planétaires.
        </p>
      </Replier>
    </main>
  );
}
