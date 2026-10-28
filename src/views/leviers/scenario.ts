import type { Donnees, Entrees } from "../../engine/types";

export type LevierId = "petit-modele" | "france" | "court" | "moitie";

export const LEVIERS: { id: LevierId; libelle: string; detail: string }[] = [
  { id: "petit-modele", libelle: "Prendre un modèle plus petit", detail: "Le plus petit modèle ouvert du catalogue suffit pour beaucoup de tâches" },
  { id: "france", libelle: "Héberger en France", detail: "Électricité bas carbone, mais attention à l'eau et au foncier" },
  { id: "court", libelle: "Poser des questions courtes", detail: "Une question brève appelle une réponse plus courte" },
  { id: "moitie", libelle: "Faire deux fois moins de requêtes", detail: "Regrouper ses questions, éviter les relances" },
];

// Identifiant voulu s'il existe dans les données, sinon le premier disponible.
function ou<T extends { id: string }>(liste: T[], voulu: string): string {
  return liste.some((x) => x.id === voulu) ? voulu : liste[0].id;
}

export function scenarioDepart(d: Donnees): Entrees {
  const ferme = d.modeles.find((m) => !m.ouvert) ?? d.modeles[0];
  return { modeleId: ferme.id, tacheId: ou(d.taches, "conversation"), requetesParJour: 20, paysId: ou(d.pays, "US"),
    utilisateurs: 1, jours: 365 };
}

export function appliquerLeviers(base: Entrees, leviers: LevierId[], d: Donnees): Entrees {
  const e = { ...base };
  if (leviers.includes("petit-modele")) {
    const ouverts = d.modeles.filter((m) => m.ouvert);
    if (ouverts.length) {
      e.modeleId = ouverts.reduce((a, b) => (b.paramsActifsMd.central < a.paramsActifsMd.central ? b : a)).id;
    }
  }
  // Un levier dont la cible a disparu des données reste sans effet.
  if (leviers.includes("france") && d.pays.some((p) => p.id === "FR")) e.paysId = "FR";
  if (leviers.includes("court") && d.taches.some((t) => t.id === "question-courte")) e.tacheId = "question-courte";
  if (leviers.includes("moitie")) e.requetesParJour = base.requetesParJour / 2;
  return e;
}
