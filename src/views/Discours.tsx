import { Encart } from "../components/Encart";
import type { DonneesChargees } from "../data/charger";
import { estimer } from "../engine/estimer";
import { formater, type Unite } from "../engine/format";
import type { EtatPoste, PosteId, Triplet } from "../engine/types";

const POSTES: { id: PosteId; libelle: string }[] = [
  { id: "calcul", libelle: "Calcul des puces (GPU, TPU)" },
  { id: "serveur", libelle: "Serveur hors puces (CPU, mémoire)" },
  { id: "inactif", libelle: "Capacité inactive" },
  { id: "pue", libelle: "Refroidissement et bâtiment (PUE)" },
  { id: "eauSite", libelle: "Eau du refroidissement" },
  { id: "eauElectricite", libelle: "Eau de la production d'électricité" },
  { id: "fabrication", libelle: "Fabrication du matériel" },
  { id: "methodePublique", libelle: "Méthode publiée" },
];

// Ce que compte la méthode EcoLogits portée par le moteur.
const ESTIMATION: Record<PosteId, EtatPoste> = {
  calcul: "inclus", serveur: "inclus", inactif: "exclu", pue: "inclus",
  eauSite: "inclus", eauElectricite: "inclus", fabrication: "inclus", methodePublique: "inclus",
};

const BADGES: Record<EtatPoste, { texte: string; classe: string }> = {
  inclus: { texte: "✓ Inclus", classe: "bg-[#DCEFE2] text-gain" },
  exclu: { texte: "✕ Exclu", classe: "bg-[#FBE4E6] text-[#9F1239]" },
  "non-precise": { texte: "? Non précisé", classe: "bg-[#EEF0EC] text-secondaire" },
};

function Badge({ etat, titre, url }: { etat: EtatPoste; titre?: string; url?: string }) {
  const b = BADGES[etat];
  const classe = `inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 font-semibold ${b.classe}`;
  return url ? <a href={url} title={titre} className={`${classe} no-underline`}>{b.texte}</a> : <span title={titre} className={classe}>{b.texte}</span>;
}

const fourchette = (t: Triplet, u: Unite) => `${formater(t.bas, u)} à ${formater(t.haut, u)}`;
const ou = (v: number | null, u: Unite) => (v === null ? "non publié" : formater(v, u));

function Valeurs({ e, c, w }: { e: string; c: string; w: string }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1.5">
      <dt className="text-[13px] font-semibold text-energie">Énergie</dt>
      <dd data-testid="energie" className="font-chiffre text-lg font-semibold">{e}</dd>
      <dt className="text-[13px] font-semibold text-carbone">Carbone</dt>
      <dd data-testid="carbone" className="font-chiffre text-lg font-semibold">{c}</dd>
      <dt className="text-[13px] font-semibold text-eau">Eau</dt>
      <dd data-testid="eau" className="font-chiffre text-lg font-semibold">{w}</dd>
    </dl>
  );
}

export function Discours({ d }: { d: DonneesChargees }) {
  const { donnees } = d;
  const modele = donnees.modeles.find((m) => !m.ouvert) ?? donnees.modeles[0];
  const tache = [...donnees.taches].sort((a, b) => Math.abs(a.tokens.central - 400) - Math.abs(b.tokens.central - 400))[0];
  const paysId = donnees.pays.some((p) => p.id === "US") ? "US" : donnees.pays[0].id;
  const r = estimer({ modeleId: modele.id, tacheId: tache.id, requetesParJour: 1, paysId, utilisateurs: 1, jours: 1 }, donnees);
  const somme = (a: Triplet, b: Triplet): Triplet => ({ bas: a.bas + b.bas, central: a.central + b.central, haut: a.haut + b.haut });

  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-8 px-4 pb-14 pt-10 sm:px-8">
      <div className="max-w-3xl">
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-widest text-energie">Discours vs réalité</p>
        <h1 className="mb-3 font-titre text-4xl font-bold leading-tight">Les chiffres des entreprises ne mesurent pas la même chose</h1>
        <p className="text-lg text-secondaire">
          Chaque acteur publie un chiffre « par requête ». Mais chacun choisit son périmètre : médiane ou moyenne, eau du
          site ou eau totale, avec ou sans la fabrication des serveurs. Comparer ces valeurs telles quelles induit en erreur.
        </p>
      </div>

      <section aria-labelledby="t-declare" className="flex flex-col gap-4">
        <h2 id="t-declare" className="font-titre text-2xl font-bold">Ce qui est déclaré, par requête</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          {d.claims.map((c) => (
            <article key={c.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-filet bg-white p-5">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold">{c.acteur} · {c.modele}</h3>
                <span className="text-xs text-secondaire">{c.date}</span>
              </div>
              <p className="text-[13px] text-secondaire">{c.perimetre}</p>
              <Valeurs e={ou(c.energieWh, "Wh")} c={ou(c.carboneG, "gCO2e")} w={ou(c.eauMl, "mL")} />
              {c.fmti !== null && (
                <p className="border-t border-[#E7EAE5] pt-2.5 text-[13px]">
                  Transparence (FMTI, Stanford) : <strong className="font-chiffre">{c.fmti}/100</strong>
                  {c.fmtiEnvironnement && !c.fmtiEnvironnement.energie && " · énergie d'entraînement non publiée"}
                </p>
              )}
              <a href={c.source} className="text-[13px]">Source</a>
            </article>
          ))}
          <article className="flex min-w-0 flex-col gap-3 rounded-xl border-2 border-energie bg-[#FFF7ED] p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold">Estimation ouverte</h3>
              <span className="text-xs text-secondaire">EcoLogits</span>
            </div>
            <p className="text-[13px] text-secondaire">
              {modele.nom}, {tache.tokens.central} tokens, data center : {donnees.pays.find((p) => p.id === paysId)!.nom}, recalculé par ce site
            </p>
            <Valeurs
              e={fourchette(r.energieParRequeteWh, "Wh")}
              c={fourchette(somme(r.carboneUsageG, r.carboneFabricationG), "gCO2e")}
              w={fourchette(somme(r.eauDirecteMl, r.eauIndirecteMl), "mL")}
            />
            <p className="border-t border-[#F3D9B8] pt-2.5 text-[13px]">Fourchette basse et haute, hypothèses dans la Méthodologie.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="t-perim" className="flex flex-col gap-4 rounded-xl border border-filet bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="t-perim" className="font-titre text-2xl font-bold">Qui compte quoi&nbsp;?</h2>
            <p className="text-[15px] text-secondaire">Le périmètre de chaque chiffre, poste par poste. Chaque badge renvoie à sa source.</p>
          </div>
          <p className="flex flex-wrap gap-3 text-[13px]">
            <Badge etat="inclus" /> <Badge etat="exclu" /> <Badge etat="non-precise" />
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-encre text-left">
                <th scope="col" className="px-3 py-2.5">Poste</th>
                {d.claims.map((c) => <th key={c.id} scope="col" className="px-3 py-2.5">{c.acteur}</th>)}
                <th scope="col" className="bg-[#FFF7ED] px-3 py-2.5">Estimation ouverte</th>
              </tr>
            </thead>
            <tbody>
              {POSTES.map((p) => (
                <tr key={p.id} className="border-b border-[#E7EAE5]">
                  <th scope="row" className="px-3 py-2.5 text-left font-medium">{p.libelle}</th>
                  {d.claims.map((c) => {
                    const poste = c.postes[p.id];
                    return (
                      <td key={c.id} className="px-3 py-2.5">
                        <Badge etat={poste.etat} titre={poste.justification} url={poste.url || undefined} />
                      </td>
                    );
                  })}
                  <td className="bg-[#FFF7ED] px-3 py-2.5"><Badge etat={ESTIMATION[p.id]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap gap-4">
        <Encart ton="sombre" titre="Ce que ça change" className="flex-[1_1_320px]">
          <p className="text-[#DDE3DF]">
            Google ne compte que l'eau du refroidissement. L'eau consommée pour produire l'électricité, souvent la plus
            grosse part, n'apparaît pas dans son chiffre.
          </p>
        </Encart>
        <Encart ton="clair" titre="Une médiane ne fait pas un total" className="flex-[1_1_320px]">
          <p className="text-secondaire">
            Sans le nombre de requêtes par jour ni la longueur des réponses, un chiffre par requête ne permet pas de
            calculer l'empreinte totale d'un service.
          </p>
        </Encart>
      </div>
    </main>
  );
}
