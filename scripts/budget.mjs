// Mesure le poids transféré au premier chargement (fichiers compressés en gzip) et l'écrit dans dist/poids.json.
// Échoue au-delà du budget de 500 Ko fixé par la spec.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const BUDGET_KO = 500;
const DIST = "dist";

function fichiers(dossier) {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin];
  });
}

// Le navigateur charge le HTML, les JS et CSS, les polices woff2 (pas les woff de secours) et les 8 JSON de données.
const charges = fichiers(DIST).filter((f) => /\.(html|js|css|woff2)$/.test(f) || /[\\/]data[\\/].+\.json$/.test(f));
const octets = charges.reduce((total, f) => total + gzipSync(readFileSync(f)).length, 0);
const ko = Math.round(octets / 1024);

writeFileSync(join(DIST, "poids.json"), JSON.stringify({ ko }) + "\n");
console.log(`Poids au premier chargement : ${ko} Ko (gzip, ${charges.length} fichiers, budget ${BUDGET_KO} Ko)`);
if (ko > BUDGET_KO) {
  console.error(`Budget dépassé de ${ko - BUDGET_KO} Ko`);
  process.exit(1);
}
