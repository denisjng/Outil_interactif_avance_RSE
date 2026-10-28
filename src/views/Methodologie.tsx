import * as Plot from "@observablehq/plot";
import { useEffect, useMemo, useRef } from "react";
import { Replier } from "../components/Replier";
import type { DonneesChargees } from "../data/charger";
import { estimer } from "../engine/estimer";
import type { Donnees, Triplet } from "../engine/types";

const ETAPES = [
  { n: "01", titre: "Énergie par token", formule: "α × e^(β × lot) × params actifs + γ", source: "Coefficients EcoLogits" },
  { n: "02", titre: "Énergie par requête", formule: "tokens × énergie GPU × nb de GPU\n+ énergie serveur, × PUE", source: "Tokens : Compar:IA · PUE : fournisseurs" },
  { n: "03", titre: "Carbone", formule: "énergie × intensité du pays\n+ part de fabrication", source: "Ember · EcoLogits" },
  { n: "04", titre: "Eau", formule: "énergie IT × WUE du site\n+ énergie × eau de l'électricité", source: "Fournisseurs · EcoLogits" },
  { n: "05", titre: "Passage à l'échelle", formule: "par requête × requêtes/jour\n× 365 × utilisateurs", source: "Vos réglages" },
];

const RESUME = [
  { titre: "Comment on calcule", texte: "On estime l'électricité nécessaire pour générer chaque réponse, selon la taille du modèle et la longueur de la réponse (méthode ouverte EcoLogits)." },
  { titre: "D'où viennent les données", texte: "Des données publiques : conversations réelles de Compar:IA, électricité par pays (Ember), eau (WRI), chiffres des entreprises." },
  { titre: "Ce qu'on ne sait pas", texte: "L'entraînement des modèles, le réseau et les téléphones ne sont pas comptés. La taille des modèles fermés est estimée." },
];

const nombre = (x: number) => x.toLocaleString("fr-FR", { maximumSignificantDigits: 3 });

export type PointCompare = { modele: string; paramsMd: number; mesureWh: number; estimationWh: number };

// Même calcul que le simulateur, mais sans surcoût du bâtiment (PUE = 1) : AI Energy Score mesure le matériel seul.
export function pointsValidation(d: DonneesChargees): PointCompare[] {
  const plat = (v: number): Triplet => ({ bas: v, central: v, haut: v });
  return d.validation.map((p) => {
    const donnees: Donnees = {
      ...d.donnees,
      modeles: [{ id: "v", nom: p.modele, fournisseurId: "v", ouvert: true, paramsActifsMd: plat(p.paramsMd),
        paramsTotauxMd: plat(p.paramsMd), tps: null, ttft: null }],
      fournisseurs: [{ id: "v", nom: "mesure", pue: plat(1), wue: plat(0) }],
      taches: [{ id: "conversation", nom: "protocole", tokens: plat(p.tokens) }],
    };
    const r = estimer({ modeleId: "v", tacheId: "conversation", requetesParJour: 1, paysId: d.donnees.pays[0].id,
      utilisateurs: 1, jours: 1 }, donnees);
    return { modele: p.modele, paramsMd: p.paramsMd, mesureWh: p.mesureWh, estimationWh: r.energieParRequeteWh.central };
  });
}

export function ecartMedian(points: { mesureWh: number; estimationWh: number }[]): number {
  const ecarts = points.map((p) => Math.abs(p.estimationWh - p.mesureWh) / p.mesureWh).sort((a, b) => a - b);
  const m = Math.floor(ecarts.length / 2);
  const mediane = ecarts.length % 2 ? ecarts[m] : (ecarts[m - 1] + ecarts[m]) / 2;
  return Math.round(mediane * 100);
}

function Nuage({ points }: { points: PointCompare[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const max = Math.max(...points.flatMap((p) => [p.mesureWh, p.estimationWh]));
    const min = Math.min(...points.flatMap((p) => [p.mesureWh, p.estimationWh]));
    const graphique = Plot.plot({
      width: 420, height: 300, marginLeft: 56, style: { fontFamily: "IBM Plex Mono, monospace", fontSize: "11px" },
      x: { type: "log", label: "Mesure AI Energy Score (Wh)", domain: [min / 1.5, max * 1.5] },
      y: { type: "log", label: "Estimation du moteur (Wh)", domain: [min / 1.5, max * 1.5] },
      marks: [
        Plot.line([[min / 1.5, min / 1.5], [max * 1.5, max * 1.5]], { stroke: "#9AA39E", strokeDasharray: "4 4" }),
        Plot.dot(points, { x: "mesureWh", y: "estimationWh", fill: "#B45309", r: 4, title: "modele" }),
      ],
    });
    ref.current?.replaceChildren(graphique);
    return () => graphique.remove();
  }, [points]);
  return (
    <div ref={ref} role="img" className="overflow-x-auto"
      aria-label={`Nuage de ${points.length} modèles : énergie estimée par le moteur en fonction de l'énergie mesurée par AI Energy Score, échelles logarithmiques ; les estimations sont nettement sous la diagonale`} />
  );
}

export function Methodologie({ d }: { d: DonneesChargees }) {
  const { donnees } = d;
  const ferme = donnees.modeles.find((m) => !m.ouvert) ?? donnees.modeles[0];
  const fournisseur = donnees.fournisseurs.find((f) => f.id === ferme.fournisseurId)!;
  const conversation = donnees.taches.find((t) => t.id === "conversation") ?? donnees.taches[0];
  const pays = donnees.pays.find((p) => p.id === "US") ?? donnees.pays[0];
  const hypotheses: { p: string; t: Triplet; unite: string; source: string }[] = [
    { p: `Paramètres actifs, ${ferme.nom}`, t: ferme.paramsActifsMd, unite: "Md", source: "EcoLogits" },
    { p: `Tokens par réponse, ${conversation.nom.toLowerCase()}`, t: conversation.tokens, unite: "", source: "Compar:IA (p25, p50, p75)" },
    { p: `PUE, ${fournisseur.nom}`, t: fournisseur.pue, unite: "", source: "EcoLogits ; haut : moyenne mondiale Uptime" },
    { p: `WUE du site, ${fournisseur.nom} (L/kWh)`, t: fournisseur.wue, unite: "", source: "EcoLogits" },
    { p: `Intensité carbone, ${pays.nom} (gCO2e/kWh)`, t: pays.intensiteCarbone, unite: "", source: "Ember, 3 dernières années" },
  ];
  const points = useMemo(() => pointsValidation(d), [d]);

  return (
    <main className="mx-auto flex max-w-[1180px] flex-col gap-5 px-4 pb-10 pt-6 sm:px-8">
      <div>
        <h1 className="font-titre text-[28px] font-bold leading-tight sm:text-4xl">Comment on calcule</h1>
        <p className="mt-1 text-secondaire">Un outil qui reproche aux entreprises leur opacité doit montrer toutes ses hypothèses.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {RESUME.map((r) => (
          <section key={r.titre} data-testid="resume" className="flex flex-col gap-1.5 rounded-xl border border-filet bg-white p-4">
            <h2 className="font-titre text-base font-bold">{r.titre}</h2>
            <p className="text-[15px] text-[#2F3A35]">{r.texte}</p>
          </section>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Replier titre="La chaîne de calcul, étape par étape">
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ETAPES.map((e) => (
              <li key={e.n} className="flex flex-col gap-1.5 rounded-lg bg-fond p-3">
                <span className="font-chiffre text-xs font-semibold text-energie">{e.n}</span>
                <span className="text-sm font-semibold">{e.titre}</span>
                <code className="whitespace-pre-wrap font-chiffre text-xs">{e.formule}</code>
                <span className="text-xs text-secondaire">{e.source}</span>
              </li>
            ))}
          </ol>
        </Replier>

        <Replier titre="Hypothèses et fourchettes">
          <div className="overflow-x-auto">
            <table aria-label="Hypothèses et fourchettes" className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-encre text-left">
                  <th scope="col" className="px-2.5 py-2">Paramètre</th>
                  <th scope="col" className="px-2.5 py-2 text-right">Bas</th>
                  <th scope="col" className="px-2.5 py-2 text-right">Central</th>
                  <th scope="col" className="px-2.5 py-2 text-right">Haut</th>
                  <th scope="col" className="px-2.5 py-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {hypotheses.map((h) => (
                  <tr key={h.p} className="border-b border-[#E7EAE5]">
                    <th scope="row" className="px-2.5 py-2 text-left font-medium">{h.p}</th>
                    {(["bas", "central", "haut"] as const).map((b) => (
                      <td key={b} className={`px-2.5 py-2 text-right font-chiffre ${b === "central" ? "font-semibold" : ""}`}>
                        {nombre(h.t[b])}{h.unite && ` ${h.unite}`}
                      </td>
                    ))}
                    <td className="px-2.5 py-2 text-secondaire">{h.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[13px] text-secondaire">
            Toutes les valeurs basses donnent le bas de la fourchette, toutes les hautes le haut.
          </p>
        </Replier>

        <Replier titre="Un angle mort : la lecture de la question">
          <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-start">
            <figure className="flex flex-col gap-2">
              <Nuage points={points} />
              <figcaption className="max-w-md text-[13px] text-secondaire">
                {points.length} modèles ouverts mesurés par AI Energy Score (GPU H100, 10 tokens générés). Diagonale :
                estimation égale à la mesure ; écart médian entre les deux : {ecartMedian(points)} %. La mesure inclut la
                lecture du texte d'entrée, un long document, que la méthode EcoLogits ne compte pas.
              </figcaption>
            </figure>
            <p className="text-[15px]">
              La fidélité du moteur à EcoLogits est vérifiée par des tests (écart inférieur à 5 %). Face à des mesures
              réelles, l'écart est d'un à deux ordres de grandeur : la méthode ne chiffre que la réponse, pas la lecture
              de la question. Une question longue (document collé, long historique) coûte donc plus que ce que le
              simulateur affiche : ses chiffres sont plutôt un plancher.
            </p>
          </div>
        </Replier>

        <Replier titre="Sources et licences">
          <ul aria-label="Sources" className="grid gap-2 sm:grid-cols-2">
            {d.sources.map((s) => (
              <li key={s.source} className="flex flex-col gap-1 rounded-lg bg-fond px-3 py-2">
                <a href={s.url} className="text-sm font-semibold">{s.source}</a>
                <span className="font-chiffre text-xs text-secondaire">{s.licence} · extrait le {s.extrait_le}</span>
              </li>
            ))}
          </ul>
        </Replier>
      </div>
    </main>
  );
}
