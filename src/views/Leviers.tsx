import { useState } from "react";
import { Encart } from "../components/Encart";
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
  const modele = donnees.modeles.find((m) => m.id === base.modeleId)!;

  const barres = [
    { libelle: "Point de départ", g: avant, couleur: "#9AA39E", fort: false },
    ...LEVIERS.map((l) => ({ libelle: `Seulement : ${l.libelle.toLowerCase()}`, g: carbone(appliquerLeviers(base, [l.id], donnees), donnees), couleur: "#334155", fort: false })),
    { libelle: "Votre sélection", g: apres, couleur: "#14532D", fort: true },
  ];
  const basculer = (id: LevierId) => setActifs((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-8 px-4 pb-14 pt-10 sm:px-8">
      <div className="max-w-3xl">
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-widest text-energie">Leviers frugaux</p>
        <h1 className="mb-3 font-titre text-4xl font-bold leading-tight">Même besoin, empreinte différente</h1>
        <p className="text-lg text-secondaire">
          Point de départ : {modele.nom}, en conversation, 20 requêtes par jour, data center aux États-Unis. Activez
          les leviers pour voir ce que chacun change.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-label="Leviers" className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
          {LEVIERS.map((l) => {
            const on = actifs.includes(l.id);
            return (
              <button
                key={l.id}
                type="button"
                aria-pressed={on}
                onClick={() => basculer(l.id)}
                className={`flex min-h-16 w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left ${
                  on ? "border-encre bg-encre text-white" : "border-[#C9CEC7] bg-white text-encre hover:border-encre"
                }`}
              >
                <span aria-hidden="true" className={`inline-flex h-6 w-6 flex-none items-center justify-center rounded-md font-bold ${
                  on ? "bg-white text-encre" : "border-2 border-[#9AA39E]"}`}>{on ? "✓" : ""}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold">{l.libelle}</span>
                  <span className="text-[13px] opacity-80">{l.detail}</span>
                </span>
              </button>
            );
          })}
        </section>

        <section aria-label="Comparaison" className="flex min-w-0 flex-[999_1_560px] flex-col gap-5 rounded-xl border border-filet bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[13px] text-secondaire">Carbone sur un an, une personne</p>
              <p className="font-chiffre text-4xl font-semibold leading-tight">{formater(apres, "gCO2e")}</p>
              <p className="text-sm text-secondaire">au lieu de {formater(avant, "gCO2e")}</p>
            </div>
            <p data-testid="gain" className="font-titre text-5xl font-bold leading-none text-gain">
              −{Math.round((1 - apres / avant) * 100)} %
            </p>
          </div>
          <div className="flex flex-col gap-3.5">
            {barres.map((b) => (
              <div key={b.libelle} data-testid="barre" className="flex flex-col gap-1">
                <p className="flex justify-between gap-2 text-sm">
                  <span className={b.fort ? "font-bold" : ""}>{b.libelle}</span>
                  <span className="font-chiffre">{formater(b.g, "gCO2e")}</span>
                </p>
                <div className="h-3.5 rounded bg-[#EEF0EC]" aria-hidden="true">
                  <div className="h-3.5 rounded" style={{ background: b.couleur, width: `${Math.max(1, (b.g / avant) * 100).toFixed(1)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-4">
        <Encart ton="sombre" titre="Attention à l'effet rebond" className="flex-[1_1_360px]">
          <p className="text-[#DDE3DF]">
            Un modèle plus efficace coûte moins cher, donc on s'en sert davantage. C'est le paradoxe de Jevons : les gains
            par requête peuvent être annulés par la hausse du nombre de requêtes. Le levier « moins de requêtes » est le
            seul qui agit sur le volume.
          </p>
        </Encart>
        <Encart ton="clair" titre="Les 3 principes de l'IA frugale" className="flex-[1_1_360px]">
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[#2F3A35]">
            <li>Démontrer que l'IA est nécessaire, face à une solution moins consommatrice.</li>
            <li>Adopter les bonnes pratiques qui réduisent les impacts.</li>
            <li>Questionner les usages pour rester dans les limites planétaires.</li>
          </ol>
          <p className="text-[13px] text-secondaire">Référentiel général pour l'IA frugale, ministère de la Transition écologique.</p>
        </Encart>
      </div>
    </main>
  );
}
