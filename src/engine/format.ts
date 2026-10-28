export type Unite = "Wh" | "gCO2e" | "mL";

// Un libellé par puissance de 1000, de l'unité de base au plus grand palier.
const PALIERS: Record<Unite, string[]> = {
  Wh: ["Wh", "kWh", "MWh", "GWh", "TWh"],
  gCO2e: ["gCO2e", "kgCO2e", "tCO2e", "ktCO2e", "MtCO2e"],
  mL: ["mL", "L", "m³", "milliers de m³", "millions de m³"],
};

export function formater(valeur: number, unite: Unite): string {
  if (!Number.isFinite(valeur) || valeur < 0) throw new Error(`Valeur invalide : ${valeur}`);
  const libelles = PALIERS[unite];
  let rang = 0;
  while (rang < libelles.length - 1 && valeur >= 1000 ** (rang + 1)) rang++;
  const nombre = (valeur / 1000 ** rang).toLocaleString("fr-FR", { maximumSignificantDigits: 2 });
  return `${nombre} ${libelles[rang]}`;
}
