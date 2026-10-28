import { Replier } from "../components/Replier";
import type { DonneesChargees } from "../data/charger";
import { estimer } from "../engine/estimer";
import { formater } from "../engine/format";
import type { EtatPoste, PosteId } from "../engine/types";

const POSTES: { id: PosteId; libelle: string }[] = [
  { id: "calcul", libelle: "Calcul des puces (GPU, TPU)" },
  { id: "serveur", libelle: "Serveur hors puces (CPU, mémoire)" },
  { id: "inactif", libelle: "Serveurs allumés mais inactifs" },
  { id: "pue", libelle: "Refroidissement et bâtiment" },
  { id: "eauSite", libelle: "Eau de refroidissement" },
  { id: "eauElectricite", libelle: "Eau des centrales électriques" },
  { id: "fabrication", libelle: "Fabrication du matériel" },
  { id: "methodePublique", libelle: "Méthode publiée" },
];

const QUESTIONS: { id: PosteId; question: string }[] = [
  { id: "pue", question: "Compte le refroidissement des serveurs ?" },
  { id: "eauElectricite", question: "Compte l'eau des centrales électriques ?" },
  { id: "fabrication", question: "Compte la fabrication du matériel ?" },
  { id: "methodePublique", question: "Méthode de calcul publiée ?" },
];

// Ce que compte la méthode EcoLogits portée par le moteur.
const ESTIMATION: Record<PosteId, EtatPoste> = {
  calcul: "inclus", serveur: "inclus", inactif: "exclu", pue: "inclus",
  eauSite: "inclus", eauElectricite: "inclus", fabrication: "inclus", methodePublique: "inclus",
};

const REPONSES: Record<EtatPoste, { court: string; long: string; classe: string }> = {
  inclus: { court: "✓ Oui", long: "✓ Inclus", classe: "bg-[#DCEFE2] text-gain" },
  exclu: { court: "✕ Non", long: "✕ Exclu", classe: "bg-[#FBE4E6] text-[#9F1239]" },
  "non-precise": { court: "? Pas dit", long: "? Non précisé", classe: "bg-[#EEF0EC] text-secondaire" },
};

function Pastille({ etat, long = false, titre, url }: { etat: EtatPoste; long?: boolean; titre?: string; url?: string }) {
  const r = REPONSES[etat];
  const classe = `inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-semibold no-underline ${r.classe}`;
  const texte = long ? r.long : r.court;
  return url ? <a href={url} title={titre} className={classe}>{texte}</a> : <span title={titre} className={classe}>{texte}</span>;
}

export function Discours({ d }: { d: DonneesChargees }) {
  const { donnees } = d;
  const modele = donnees.modeles.find((m) => !m.ouvert) ?? donnees.modeles[0];
  const tache = [...donnees.taches].sort((a, b) => Math.abs(a.tokens.central - 400) - Math.abs(b.tokens.central - 400))[0];
  const paysId = donnees.pays.some((p) => p.id === "US") ? "US" : donnees.pays[0].id;
  const est = estimer({ modeleId: modele.id, tacheId: tache.id, requetesParJour: 1, paysId, utilisateurs: 1, jours: 1 }, donnees)
    .energieParRequeteWh;
  const max = Math.max(est.haut, ...d.claims.map((c) => c.energieWh ?? 0)) * 1.05;
  const pct = (v: number) => `${((v / max) * 100).toFixed(1)}%`;
  const entrainementCache = d.claims.length > 0 && d.claims.every((c) => c.fmtiEnvironnement && !c.fmtiEnvironnement.energie);

  return (
    <main className="mx-auto flex max-w-[1180px] flex-col gap-5 px-4 pb-10 pt-6 sm:px-8">
      <div>
        <h1 className="font-titre text-[28px] font-bold leading-tight sm:text-4xl">Peut-on croire les chiffres des géants de l'IA&nbsp;?</h1>
        <p className="mt-1 text-secondaire">Chacun publie un chiffre « par question », mais aucun ne mesure la même chose.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="t-graph" className="flex flex-col gap-4 rounded-xl border border-filet bg-white p-5">
          <h2 id="t-graph" className="font-titre text-lg font-bold">Électricité par question</h2>
          <ul aria-labelledby="t-graph" className="flex flex-col gap-4">
            {d.claims.map((c) => (
              <li key={c.id} className="flex flex-col gap-1">
                <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span><strong>{c.acteur}</strong> <span className="text-secondaire">· {c.modele}, {c.date}</span></span>
                  <span className="font-chiffre font-semibold">{c.energieWh === null ? "non publié" : formater(c.energieWh, "Wh")}</span>
                </p>
                <div className="h-3 rounded bg-[#EEF0EC]" aria-hidden="true">
                  {c.energieWh !== null && <div className="h-3 rounded bg-[#9AA39E]" style={{ width: pct(c.energieWh) }} />}
                </div>
              </li>
            ))}
            <li className="flex flex-col gap-1">
              <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <span><strong>Notre estimation</strong> <span className="text-secondaire">· {modele.nom}, méthode ouverte</span></span>
                <span className="font-chiffre font-semibold">{formater(est.bas, "Wh")} à {formater(est.haut, "Wh")}</span>
              </p>
              <div className="relative h-3 rounded bg-[#EEF0EC]" aria-hidden="true">
                <div className="absolute h-3 rounded bg-energie/40" style={{ left: pct(est.bas), width: pct(est.haut - est.bas) }} />
                <div className="absolute -top-1 h-5 w-1 rounded-sm bg-energie" style={{ left: `calc(${pct(est.central)} - 2px)` }} />
              </div>
            </li>
          </ul>
          <p className="text-[13px] text-secondaire">
            Notre fourchette est large : la taille des modèles fermés n'est pas publiée. Elle encadre pourtant les chiffres annoncés.
          </p>
        </section>

        <section aria-labelledby="t-retenir" className="flex flex-col gap-3 rounded-xl bg-encre p-5 text-white">
          <h2 id="t-retenir" className="font-titre text-lg font-bold">À retenir</h2>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] text-[#DDE3DF]">
            <li>Ces chiffres ne se comparent pas : médiane ou moyenne, eau du site ou eau totale, avec ou sans fabrication.</li>
            <li>Un chiffre par question ne dit rien du total sans le nombre de questions posées chaque jour.</li>
            {entrainementCache && (
              <li>Aucune des 3 entreprises ne publie l'énergie utilisée pour entraîner ses modèles (indice de transparence de Stanford, décembre 2025).</li>
            )}
          </ul>
        </section>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-filet bg-white p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <caption className="mb-3 text-left font-titre text-lg font-bold">Que compte chaque chiffre ?</caption>
            <thead>
              <tr className="border-b-2 border-encre text-left">
                <th scope="col" className="py-2 pr-3"><span className="sr-only">Question</span></th>
                {d.claims.map((c) => <th key={c.id} scope="col" className="px-2 py-2">{c.acteur}</th>)}
                <th scope="col" className="px-2 py-2 text-energie">Notre estimation</th>
              </tr>
            </thead>
            <tbody>
              {QUESTIONS.map((q) => (
                <tr key={q.id} className="border-b border-[#E7EAE5]">
                  <th scope="row" className="py-2.5 pr-3 text-left font-medium">{q.question}</th>
                  {d.claims.map((c) => (
                    <td key={c.id} className="px-2 py-2.5">
                      <Pastille etat={c.postes[q.id].etat} titre={c.postes[q.id].justification} url={c.postes[q.id].url || undefined} />
                    </td>
                  ))}
                  <td className="px-2 py-2.5"><Pastille etat={ESTIMATION[q.id]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Replier titre="Voir le détail complet (8 postes) et les sources">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-encre text-left">
                <th scope="col" className="py-2 pr-3">Poste</th>
                {d.claims.map((c) => <th key={c.id} scope="col" className="px-2 py-2">{c.acteur}</th>)}
                <th scope="col" className="px-2 py-2">Notre estimation</th>
              </tr>
            </thead>
            <tbody>
              {POSTES.map((p) => (
                <tr key={p.id} className="border-b border-[#E7EAE5]">
                  <th scope="row" className="py-2 pr-3 text-left font-medium">{p.libelle}</th>
                  {d.claims.map((c) => (
                    <td key={c.id} className="px-2 py-2">
                      <Pastille long etat={c.postes[p.id].etat} titre={c.postes[p.id].justification} url={c.postes[p.id].url || undefined} />
                    </td>
                  ))}
                  <td className="px-2 py-2"><Pastille long etat={ESTIMATION[p.id]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="flex flex-col gap-1 text-[13px] text-secondaire">
          {d.claims.map((c) => (
            <li key={c.id}>
              {c.acteur} ({c.perimetre.toLowerCase()}) : <a href={c.source}>source</a>
              {c.fmti !== null && <> · transparence Stanford : {c.fmti}/100</>}
            </li>
          ))}
        </ul>
      </Replier>
    </main>
  );
}
