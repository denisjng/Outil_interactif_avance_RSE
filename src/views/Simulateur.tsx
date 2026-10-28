import { useMemo, useState, type ReactNode } from "react";
import { ChoixGroupe } from "../components/ChoixGroupe";
import { Infobulle } from "../components/Infobulle";
import { ListeDeroulante } from "../components/ListeDeroulante";
import { Replier } from "../components/Replier";
import type { DonneesChargees } from "../data/charger";
import { equivalences, type Equivalence } from "../engine/equivalences";
import { estimer } from "../engine/estimer";
import { formater, type Unite } from "../engine/format";
import type { Triplet } from "../engine/types";

const ECHELLES = [
  { id: "moi", libelle: "Moi", sujet: "votre usage", n: 1 },
  { id: "entreprise", libelle: "1 000 salariés", sujet: "votre entreprise", n: 1000 },
  { id: "france", libelle: "La France", sujet: "la France", n: 10_000_000 },
] as const;
type EchelleId = (typeof ECHELLES)[number]["id"];

const TACHES: Record<string, string> = {
  "question-courte": "Question rapide",
  conversation: "Discussion",
  redaction: "Rédaction",
  code: "Code",
};

const STRESS_ALERTE = ["élevé", "extrêmement élevé"];
const nombre = (x: number) => x.toLocaleString("fr-FR", { maximumSignificantDigits: 2 });
// Les équivalences dépassent le milliard à l'échelle de la France : « 670 Md » plutôt que 12 chiffres.
const compact = (x: number) => x.toLocaleString("fr-FR", { notation: "compact", maximumSignificantDigits: 2 });
const somme = (a: Triplet, b: Triplet): Triplet => ({ bas: a.bas + b.bas, central: a.central + b.central, haut: a.haut + b.haut });

function Tuile({ titre, couleur, aide, total, unite, parQuestion, equivalence, alerte }: {
  titre: string;
  couleur: string;
  aide: string;
  total: Triplet;
  unite: Unite;
  parQuestion: string;
  equivalence?: Equivalence;
  alerte?: ReactNode;
}) {
  return (
    <article className="flex min-w-0 flex-col gap-1 rounded-xl border border-filet bg-white p-4" style={{ borderTop: `4px solid ${couleur}` }}>
      <div className="flex items-center gap-1.5">
        <h2 className="text-sm font-semibold">{titre}</h2>
        <Infobulle terme={titre}>{aide}</Infobulle>
      </div>
      <p data-testid="valeur" className="font-chiffre text-[28px] font-semibold leading-tight tracking-tight">
        {formater(total.central, unite)}
      </p>
      <p className="text-[13px] text-secondaire">
        entre {formater(total.bas, unite)} et {formater(total.haut, unite)}
      </p>
      {equivalence && (
        <p className="text-sm">≈ <strong data-testid="equivalence" className="font-chiffre">{compact(equivalence.valeur)}</strong> {equivalence.libelle}</p>
      )}
      <p className="text-[13px] text-secondaire">soit {parQuestion} par question</p>
      {alerte}
    </article>
  );
}

export function Simulateur({ d }: { d: DonneesChargees }) {
  const { donnees } = d;
  const [modeleId, setModele] = useState(() => (donnees.modeles.find((m) => !m.ouvert) ?? donnees.modeles[0]).id);
  const [tacheId, setTache] = useState(() =>
    donnees.taches.some((t) => t.id === "conversation") ? "conversation" : donnees.taches[0].id);
  const [requetes, setRequetes] = useState(20);
  const [paysId, setPays] = useState(() => (donnees.pays.some((p) => p.id === "US") ? "US" : donnees.pays[0].id));
  const [echelle, setEchelle] = useState<EchelleId>("moi");

  const choixEchelle = ECHELLES.find((e) => e.id === echelle)!;
  const r = useMemo(
    () => estimer({ modeleId, tacheId, requetesParJour: requetes, paysId, utilisateurs: choixEchelle.n, jours: 365 }, donnees),
    [modeleId, tacheId, requetes, paysId, choixEchelle.n, donnees],
  );
  const pays = donnees.pays.find((p) => p.id === paysId)!;
  const modele = donnees.modeles.find((m) => m.id === modeleId)!;
  const pue = donnees.fournisseurs.find((f) => f.id === modele.fournisseurId)!.pue.central;
  const volume = requetes * 365 * choixEchelle.n;
  const carbone = somme(r.carboneUsageG, r.carboneFabricationG);
  const eau = somme(r.eauDirecteMl, r.eauIndirecteMl);
  const equiv = equivalences(r, d.facteurs);
  const parIndicateur = (i: string) => equiv[d.facteurs.findIndex((f) => f.indicateur === i)];
  const voiture = parIndicateur("carbone");
  const energieIt = r.energieWh.central / pue;

  return (
    <main className="mx-auto flex max-w-[1180px] flex-col gap-5 px-4 pb-10 pt-6 sm:px-8">
      <div>
        <h1 className="font-titre text-[28px] font-bold leading-tight sm:text-4xl">Combien pèse votre usage de l'IA&nbsp;?</h1>
        <p className="mt-1 text-secondaire">Réglez votre usage, le résultat se met à jour tout seul.</p>
      </div>

      {voiture && (
          <p data-testid="phrase" aria-live="polite" className="sticky top-0 z-20 -mx-4 bg-encre px-5 py-3 font-titre text-base font-medium leading-snug text-white shadow-md sm:static sm:mx-0 sm:rounded-xl sm:py-4 sm:text-2xl sm:shadow-none">
            Sur un an, {choixEchelle.sujet} émet autant de CO2 que{" "}
            <strong data-testid="equivalence" className="font-chiffre text-[#FBBF77]">{compact(voiture.valeur)}</strong>{" "}
            {voiture.libelle}.
          </p>
        )}
      <section aria-label="Votre usage" className="grid gap-4 rounded-xl border border-filet bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
        <ListeDeroulante
          id="modele"
          libelle="Modèle d'IA"
          valeur={modeleId}
          onChange={setModele}
          groupes={[
            { libelle: "Grands modèles des entreprises", options: donnees.modeles.filter((m) => !m.ouvert).map((m) => ({ id: m.id, libelle: m.nom })) },
            { libelle: "Modèles ouverts", options: donnees.modeles.filter((m) => m.ouvert).map((m) => ({ id: m.id, libelle: m.nom })) },
          ].filter((g) => g.options.length)}
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="requetes" className="flex justify-between text-sm font-semibold">
            <span>Questions par jour</span>
            <span className="font-chiffre">{requetes}</span>
          </label>
          <input id="requetes" type="range" min={1} max={200} value={requetes}
            onChange={(e) => setRequetes(Number(e.target.value))} className="min-h-11 w-full accent-energie" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <ListeDeroulante
            id="pays"
            libelle="Pays du data center"
            valeur={paysId}
            onChange={setPays}
            groupes={[{ libelle: "Pays", options: donnees.pays.map((p) => ({ id: p.id, libelle: p.nom })) }]}
          />
          <p className="text-xs text-secondaire">Électricité à ≈ {nombre(pays.intensiteCarbone.central)} g de CO2 par kWh</p>
        </div>
        <div className="sm:col-span-2">
          <ChoixGroupe
            legende="Type de question"
            variante="segment"
            options={donnees.taches.map((t) => ({ id: t.id, libelle: TACHES[t.id] ?? t.nom }))}
            valeur={tacheId}
            onChange={setTache}
          />
        </div>
        <ChoixGroupe legende="Pour qui ?" variante="segment" options={ECHELLES.map((e) => ({ id: e.id, libelle: e.libelle }))}
          valeur={echelle} onChange={setEchelle} />
      </section>

      <section aria-label="Résultat sur un an" className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Tuile titre="Électricité" couleur="#B45309" unite="Wh" total={r.energieWh}
            aide="Électricité consommée par les serveurs pour répondre, refroidissement compris."
            parQuestion={formater(r.energieParRequeteWh.central, "Wh")} equivalence={parIndicateur("energie")} />
          <Tuile titre="CO2" couleur="#334155" unite="gCO2e" total={carbone}
            aide="Gaz à effet de serre émis, exprimés en équivalent CO2 : production de l'électricité et fabrication des serveurs."
            parQuestion={formater(carbone.central / volume, "gCO2e")} />
          <Tuile titre="Eau" couleur="#1D4ED8" unite="mL" total={eau}
            aide="Eau évaporée pour refroidir les serveurs et pour produire leur électricité."
            parQuestion={formater(eau.central / volume, "mL")} equivalence={parIndicateur("eau")}
            alerte={pays.stressHydrique && STRESS_ALERTE.includes(pays.stressHydrique) ? (
              <p className="mt-1 rounded-md bg-[#EFF4FF] px-2.5 py-1.5 text-xs text-[#1E3A8A]">
                Région où l'eau manque : stress {pays.stressHydrique}
              </p>
            ) : null} />
        </div>
        <p className="text-[13px] text-secondaire">
          Ce sont des ordres de grandeur : les entreprises ne publient pas la taille de leurs modèles, d'où la fourchette.{" "}
          <a href="#/reduire" className="font-semibold text-energie">Comment réduire&nbsp;? →</a>
        </p>
      </section>

      <Replier titre="Comment c'est calculé ?">
        <ul className="grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
          {[
            ["Calcul par les serveurs", formater(energieIt, "Wh")],
            ["Refroidissement et bâtiment", formater(r.energieWh.central - energieIt, "Wh")],
            ["CO2 de l'électricité", formater(r.carboneUsageG.central, "gCO2e")],
            ["Fabrication des serveurs", formater(r.carboneFabricationG.central, "gCO2e")],
            ["Eau des centrales électriques", formater(r.eauIndirecteMl.central, "mL")],
            ["Eau de refroidissement du site", formater(r.eauDirecteMl.central, "mL")],
          ].map(([l, v]) => (
            <li key={l} className="flex justify-between gap-3 border-b border-[#E7EAE5] py-1">
              <span>{l}</span><span className="font-chiffre">{v}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-secondaire">
          Une réponse de type « {TACHES[tacheId] ?? tacheId} » fait en moyenne{" "}
          {donnees.taches.find((t) => t.id === tacheId)!.tokens.central} tokens (morceaux de mots), d'après les conversations
          réelles de Compar:IA. Formules et sources : <a href="#/methode">méthode</a>.
        </p>
      </Replier>
    </main>
  );
}
