import type { Coefficients, Donnees, Entrees, Resultat, Triplet } from "./types";

type Borne = keyof Triplet;
const BORNES: Borne[] = ["bas", "central", "haut"];

type ParRequete = {
  energieWh: number;
  carboneUsageG: number;
  carboneFabricationG: number;
  eauDirecteMl: number;
  eauIndirecteMl: number;
};

type Point = {
  actifsMd: number;
  totauxMd: number;
  tps: number | null;
  ttft: number | null;
  tokens: number;
  pue: number;
  wue: number;
  intensiteCarbone: number; // gCO2e/kWh
  eauElectricite: number; // L/kWh
};

// Portage de ecologits/impacts/llm.py (v0.11.3), pour une requête sans latence mesurée.
function impactRequete(p: Point, c: Coefficients): ParRequete {
  const batch = c.batch_size;
  const gpuKWh =
    (p.tokens * (c.gpu_energy_alpha * Math.exp(c.gpu_energy_beta * batch) * p.actifsMd + c.gpu_energy_gamma)) / 1000;

  const latenceParToken = p.tps ? 1 / p.tps : c.latency_alpha * p.actifsMd + c.latency_beta * batch + c.latency_gamma;
  const latence = p.tokens * latenceParToken + (p.ttft ?? 0);

  const memoire = (1.2 * p.totauxMd * c.model_quantization_bits) / 8;
  const gpus = 2 ** Math.ceil(Math.log2(Math.ceil(memoire / c.gpu_memory)));

  const serveurKWh = (latence / 3600) * c.server_power * (gpus / c.server_gpu_count) * (1 / batch);
  const itKWh = serveurKWh + gpus * gpuKWh;
  const energieKWh = p.pue * itKWh;

  const fabricationServeurKg = (gpus / c.server_gpu_count) * c.server_embodied_gwp + gpus * c.gpu_embodied_gwp;
  const fabricationKg = (latence * fabricationServeurKg) / (c.server_lifetime * batch);

  return {
    energieWh: energieKWh * 1000,
    carboneUsageG: energieKWh * p.intensiteCarbone,
    carboneFabricationG: fabricationKg * 1000,
    eauDirecteMl: itKWh * p.wue * 1000,
    eauIndirecteMl: itKWh * p.pue * p.eauElectricite * 1000,
  };
}

function trouver<T extends { id: string }>(liste: T[], id: string, message: string): T {
  const x = liste.find((e) => e.id === id);
  if (!x) throw new Error(`${message} : ${id}`);
  return x;
}

function verifierEntree(nom: keyof Entrees, v: number) {
  if (!Number.isFinite(v) || v < 0) throw new Error(`Entrée invalide : ${nom}`);
}

export function estimer(entrees: Entrees, donnees: Donnees): Resultat {
  verifierEntree("requetesParJour", entrees.requetesParJour);
  verifierEntree("utilisateurs", entrees.utilisateurs);
  verifierEntree("jours", entrees.jours);

  const modele = trouver(donnees.modeles, entrees.modeleId, "Modèle inconnu");
  const pays = trouver(donnees.pays, entrees.paysId, "Pays inconnu");
  const tache = trouver(donnees.taches, entrees.tacheId, "Tâche inconnue");
  const fournisseur = trouver(donnees.fournisseurs, modele.fournisseurId, "Fournisseur inconnu");

  // Chaque borne combine toutes les entrées de même borne : le calcul est croissant en chacune.
  const points = BORNES.map((b) =>
    impactRequete(
      {
        actifsMd: modele.paramsActifsMd[b],
        totauxMd: modele.paramsTotauxMd[b],
        tps: modele.tps,
        ttft: modele.ttft,
        tokens: tache.tokens[b],
        pue: fournisseur.pue[b],
        wue: fournisseur.wue[b],
        intensiteCarbone: pays.intensiteCarbone[b],
        eauElectricite: pays.eauElectricite[b],
      },
      donnees.coefficients,
    ),
  );

  const volume = entrees.requetesParJour * entrees.jours * entrees.utilisateurs;
  const triplet = (cle: keyof ParRequete, facteur: number): Triplet => {
    const [bas, central, haut] = points.map((p) => p[cle] * facteur);
    if (![bas, central, haut].every(Number.isFinite)) throw new Error(`Donnée invalide pour ${cle}`);
    return { bas, central, haut };
  };

  return {
    energieWh: triplet("energieWh", volume),
    energieParRequeteWh: triplet("energieWh", 1),
    carboneUsageG: triplet("carboneUsageG", volume),
    carboneFabricationG: triplet("carboneFabricationG", volume),
    eauDirecteMl: triplet("eauDirecteMl", volume),
    eauIndirecteMl: triplet("eauIndirecteMl", volume),
  };
}
