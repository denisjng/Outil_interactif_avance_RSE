import { useMemo, useState } from "react";
import { CarteResultat } from "../components/CarteResultat";
import { ChoixGroupe } from "../components/ChoixGroupe";
import { Encart } from "../components/Encart";
import type { DonneesChargees } from "../data/charger";
import { equivalences } from "../engine/equivalences";
import { estimer } from "../engine/estimer";
import { formater } from "../engine/format";

const ECHELLES = [
  { id: "moi", libelle: "Moi", detail: "1 personne", n: 1 },
  { id: "entreprise", libelle: "Mon entreprise", detail: "1 000 personnes", n: 1000 },
  { id: "france", libelle: "La France", detail: "10 M d'utilisateurs (hypothèse)", n: 10_000_000 },
] as const;
type EchelleId = (typeof ECHELLES)[number]["id"];

const STRESS_ALERTE = ["élevé", "extrêmement élevé"];
const nombre = (x: number) => x.toLocaleString("fr-FR", { maximumSignificantDigits: 2 });

export function Simulateur({ d }: { d: DonneesChargees }) {
  const { donnees } = d;
  const [modeleId, setModele] = useState(() => (donnees.modeles.find((m) => !m.ouvert) ?? donnees.modeles[0]).id);
  const [tacheId, setTache] = useState("conversation");
  const [requetes, setRequetes] = useState(20);
  const [paysId, setPays] = useState(() => (donnees.pays.some((p) => p.id === "US") ? "US" : donnees.pays[0].id));
  const [echelle, setEchelle] = useState<EchelleId>("moi");

  const utilisateurs = ECHELLES.find((e) => e.id === echelle)!.n;
  const r = useMemo(
    () => estimer({ modeleId, tacheId, requetesParJour: requetes, paysId, utilisateurs, jours: 365 }, donnees),
    [modeleId, tacheId, requetes, paysId, utilisateurs, donnees],
  );
  const pays = donnees.pays.find((p) => p.id === paysId)!;
  const tache = donnees.taches.find((t) => t.id === tacheId)!;
  const volume = requetes * 365 * utilisateurs;
  const carbone = {
    bas: r.carboneUsageG.bas + r.carboneFabricationG.bas,
    central: r.carboneUsageG.central + r.carboneFabricationG.central,
    haut: r.carboneUsageG.haut + r.carboneFabricationG.haut,
  };
  const eau = {
    bas: r.eauDirecteMl.bas + r.eauIndirecteMl.bas,
    central: r.eauDirecteMl.central + r.eauIndirecteMl.central,
    haut: r.eauDirecteMl.haut + r.eauIndirecteMl.haut,
  };
  const pue = donnees.fournisseurs.find((f) => f.id === donnees.modeles.find((m) => m.id === modeleId)!.fournisseurId)!.pue.central;
  const energieIt = r.energieWh.central / pue;

  return (
    <main className="mx-auto max-w-[1240px] px-4 pb-14 pt-10 sm:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-widest text-energie">Simulateur</p>
        <h1 className="mb-3 font-titre text-4xl font-bold leading-tight">Combien pèse votre usage de l'IA sur un an&nbsp;?</h1>
        <p className="text-lg text-secondaire">
          Réglez votre usage. L'outil estime l'énergie, le carbone et l'eau, avec une fourchette basse et haute plutôt
          qu'un chiffre faussement précis.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-label="Paramètres" className="flex min-w-0 flex-[1_1_340px] flex-col gap-6 rounded-xl border border-filet bg-white p-6">
          <ChoixGroupe
            legende="Modèle"
            options={donnees.modeles.map((m) => ({ id: m.id, libelle: m.nom }))}
            valeur={modeleId}
            onChange={setModele}
          />
          <div>
            <ChoixGroupe
              legende="Type de tâche"
              options={donnees.taches.map((t) => ({ id: t.id, libelle: t.nom }))}
              valeur={tacheId}
              onChange={setTache}
            />
            <p className="mt-2 text-[13px] text-secondaire">
              ≈ {tache.tokens.central} tokens générés par réponse (médiane Compar:IA)
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="requetes" className="flex justify-between font-semibold">
              <span>Requêtes par jour et par personne</span>
              <span className="font-chiffre">{requetes}</span>
            </label>
            <input
              id="requetes"
              type="range"
              min={1}
              max={200}
              value={requetes}
              onChange={(e) => setRequetes(Number(e.target.value))}
              className="min-h-11 w-full accent-energie"
            />
          </div>
          <div>
            <ChoixGroupe
              legende="Pays du data center"
              options={donnees.pays.map((p) => ({ id: p.id, libelle: p.nom }))}
              valeur={paysId}
              onChange={setPays}
            />
            <p className="mt-2 text-[13px] text-secondaire">
              Intensité carbone du réseau : ≈ {nombre(pays.intensiteCarbone.central)} gCO2e/kWh (Ember)
            </p>
          </div>
          <ChoixGroupe legende="Échelle" options={[...ECHELLES]} valeur={echelle} onChange={setEchelle} empile />
        </section>

        <section aria-label="Résultats sur un an" className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <CarteResultat
              titre="Énergie" couleur="#B45309" unite="Wh" total={r.energieWh}
              parRequete={formater(r.energieParRequeteWh.central, "Wh")}
              postes={[
                { libelle: "Calcul (GPU et serveur)", valeur: energieIt },
                { libelle: "Refroidissement et bâtiment (PUE)", valeur: r.energieWh.central - energieIt },
              ]}
            />
            <CarteResultat
              titre="Carbone" couleur="#334155" unite="gCO2e" total={carbone}
              parRequete={formater(carbone.central / volume, "gCO2e")}
              postes={[
                { libelle: "Électricité consommée", valeur: r.carboneUsageG.central },
                { libelle: "Fabrication des serveurs", valeur: r.carboneFabricationG.central },
              ]}
            />
            <CarteResultat
              titre="Eau" couleur="#1D4ED8" unite="mL" total={eau}
              parRequete={formater(eau.central / volume, "mL")}
              postes={[
                { libelle: "Production d'électricité", valeur: r.eauIndirecteMl.central },
                { libelle: "Refroidissement du site", valeur: r.eauDirecteMl.central },
              ]}
              alerte={pays.stressHydrique && STRESS_ALERTE.includes(pays.stressHydrique) ? (
                <p className="rounded-md bg-[#EFF4FF] px-3 py-2 text-[13px] text-[#1E3A8A]">
                  Zone de stress hydrique : {pays.stressHydrique} (WRI Aqueduct)
                </p>
              ) : null}
            />
          </div>

          <Encart ton="sombre" titre={"À quoi ça correspond ?"}>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
              {equivalences(r, d.facteurs).map((e) => (
                <div key={e.id} data-testid="equivalence" className="flex min-w-0 flex-col gap-1">
                  <span className="font-chiffre text-2xl font-semibold">{nombre(e.valeur)}</span>
                  <span className="text-sm text-[#C9D1CB]">{e.libelle}</span>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-[#C9D1CB]">Calculé sur la valeur centrale. Facteurs et sources dans la Méthodologie.</p>
          </Encart>

          <Encart ton="alerte">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-2xl text-sm">
                Ces chiffres sont des ordres de grandeur. Les paramètres des modèles fermés ne sont pas publiés : la
                fourchette reflète cette opacité.
              </p>
              <a href="#/leviers" className="inline-flex min-h-11 items-center rounded-lg bg-energie px-4 font-semibold text-white no-underline">
                Voir comment réduire →
              </a>
            </div>
          </Encart>
        </section>
      </div>
    </main>
  );
}
