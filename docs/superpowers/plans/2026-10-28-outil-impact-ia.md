# « Le vrai coût d'un prompt » : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire un site statique qui estime l'énergie, le carbone et l'eau d'un usage d'IA générative, confronte les chiffres des entreprises à une estimation ouverte et montre les leviers frugaux.

**Architecture:** Un pipeline Python hors ligne produit des JSON `{meta, data}` dans `public/data/`. Un moteur TypeScript pur (`src/engine`) porte les formules d'EcoLogits et propage des triplets bas/central/haut. Quatre vues React lisent ces JSON et appellent le moteur dans le navigateur.

**Tech Stack:** Python 3.12, DuckDB, pandas, pytest, `ecologits` (référence) · Node 20, Vite, React 18, TypeScript, Tailwind CSS, Observable Plot, Vitest · GitHub Actions, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-28-outil-impact-ia-design.md`
**Maquette:** https://claude.ai/artifact/EHg7Ja6WLxttPfzzDDh2sP

## Global Constraints

- Toute l'interface est en français, `lang="fr"`, nombres formatés en `fr-FR`.
- Couleurs : fond `#F3F4F1`, encre `#15201B`, secondaire `#4A5550`, filets `#D9DDD7`, énergie `#B45309`, carbone `#334155`, eau `#1D4ED8`, gain `#14532D`.
- Polices Space Grotesk (titres), IBM Plex Sans (texte), IBM Plex Mono (chiffres), auto-hébergées en woff2 dans `public/fonts/`, sans appel à Google Fonts.
- Aucun appel réseau à l'exécution hors `public/data/*.json` du site lui-même. Aucun tracking, aucun cookie.
- Moins de 500 Ko transférés au premier chargement (vérifié par `scripts/budget.mjs`, tâche 13).
- Toute valeur incertaine est un triplet `{ "bas", "central", "haut" }` avec `bas ≤ central ≤ haut`.
- Chaque JSON de `public/data/` a la forme `{ "meta": { "source", "url", "licence", "extrait_le" }, "data": … }`.
- Aucun coefficient saisi de mémoire : chaque valeur numérique de donnée vient d'une source citée dans `meta` ou `pipeline/sources.yaml`.
- Les formules du moteur sont un portage fidèle de `ecologits/impacts/llm.py` (version figée dans `pipeline/requirements.txt`). La formule simplifiée de la spec (§3) en est la lecture pédagogique, affichée dans la vue Méthodologie.
- Vite `base: "/Outil_interactif_avance_RSE/"`. Navigation par hash : `#/simulateur` (défaut), `#/discours`, `#/leviers`, `#/methodologie`.
- Zones cliquables ≥ 44 px, contrastes AA, mise en page fluide jusqu'à 360 px de large.
- Tests de formatage : comparer après normalisation des espaces insécables (`s.replace(/ | /g, " ")`).

## Review Focus

1. **Échelle France × 200 requêtes/jour** : des totaux en TWh, Mt et millions de m³. L'affichage doit rester lisible, sans notation scientifique. Test dans la tâche 2.
2. **Valeurs minuscules** (petit modèle, 1 requête, par requête) : jamais « 0 Wh ». Une valeur positive s'affiche avec 2 chiffres significatifs dans la plus petite unité. Test dans la tâche 2.
3. **Modèle ouvert** (paramètres connus, `bas == central == haut`) : la fourchette est plate mais valide, la barre de fourchette ne doit pas diviser par zéro. Tests dans les tâches 4 et 9.
4. **Identifiant inconnu** (modèle, pays ou tâche absent des JSON, par exemple après une mise à jour des données) : erreur explicite qui nomme l'id, pas d'écran blanc. Tests dans les tâches 3 et 8.
5. **Donnée manquante pour un pays** (eau de l'électricité ou stress hydrique absent) : le pipeline exclut le pays ou met `stressHydrique: null`, jamais un `NaN` en sortie. Tests dans les tâches 5 et 3.

---

## Fichiers

```
package.json, vite.config.ts, tsconfig.json, tailwind.config.ts, postcss.config.js, index.html
.github/workflows/ci.yml
src/main.tsx, src/App.tsx, src/styles.css
src/engine/types.ts            types partagés
src/engine/format.ts           formater()
src/engine/estimer.ts          estimer(), portage EcoLogits
src/engine/equivalences.ts     equivalences()
src/engine/__fixtures__/ecologits_reference.json
src/data/charger.ts            chargerDonnees()
src/app/route.ts               useRoute()
src/app/Layout.tsx             en-tête, navigation, pied de page
src/components/                ChoixGroupe, CarteResultat, BarreFourchette, Encart
src/views/Simulateur.tsx, Discours.tsx, Leviers.tsx, Methodologie.tsx
src/views/leviers/scenario.ts  scénario de départ et leviers
public/data/*.json, public/fonts/*.woff2
pipeline/build_data.py, pipeline/sources.yaml, pipeline/mapping_taches.yaml
pipeline/curated/claims.yaml, pipeline/curated/equivalences.yaml
pipeline/etapes/ecologits.py, ember.py, aqueduct.py, comparia.py, curated.py, validation.py
pipeline/reference_ecologits.py
pipeline/requirements.txt, pipeline/tests/
scripts/budget.mjs
README.md, docs/methodologie.md
```

---

### Task 1 : Socle du projet et CI

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `.github/workflows/ci.yml`, `.gitignore`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: scripts npm `dev`, `build`, `test` (`vitest run`), `lint` (`tsc --noEmit`). Tailwind expose les couleurs nommées `fond`, `encre`, `secondaire`, `filet`, `energie`, `carbone`, `eau`, `gain` et les familles `titre`, `texte`, `chiffre`.

- [ ] **Step 1 : Initialiser Vite React TS**, ajouter Tailwind, Vitest, `@testing-library/react`, `jsdom`. `index.html` : `lang="fr"`, titre « Le vrai coût d'un prompt ».
- [ ] **Step 2 : Écrire le test** `App.test.tsx` : `render(<App />)` puis `expect(screen.getByText("Le vrai coût d'un prompt")).toBeInTheDocument()`.
- [ ] **Step 3 : Lancer** `npm test`. Attendu : FAIL.
- [ ] **Step 4 : `App.tsx`** rend un titre `h1` « Le vrai coût d'un prompt ».
- [ ] **Step 5 : Lancer** `npm test && npm run lint && npm run build`. Attendu : tout PASS, `dist/` créé.
- [ ] **Step 6 : `ci.yml`** : sur push `main` et PR, Node 20, `npm ci`, `npm run lint`, `npm test`, `npm run build` ; sur push `main` uniquement, `actions/upload-pages-artifact` (dossier `dist`) puis `actions/deploy-pages`.
- [ ] **Step 7 : Commit** `chore: socle Vite React TS, Tailwind, Vitest et CI Pages`.

### Task 2 : Types du moteur et formatage des unités

**Files:**
- Create: `src/engine/types.ts`, `src/engine/format.ts`
- Test: `src/engine/format.test.ts`

**Interfaces:**
- Produces (dans `types.ts`) :
```ts
export type Triplet = { bas: number; central: number; haut: number };
export type Modele = { id: string; nom: string; fournisseurId: string; ouvert: boolean;
  paramsActifsMd: Triplet; paramsTotauxMd: Triplet };
export type Fournisseur = { id: string; nom: string; pue: Triplet; wue: Triplet };
export type Pays = { id: string; nom: string; intensiteCarbone: Triplet; eauElectricite: Triplet;
  stressHydrique: string | null };
export type Tache = { id: "question-courte" | "conversation" | "redaction" | "code"; nom: string; tokens: Triplet };
export type Coefficients = Record<string, number>;
export type Donnees = { modeles: Modele[]; fournisseurs: Fournisseur[]; pays: Pays[]; taches: Tache[];
  coefficients: Coefficients };
export type Entrees = { modeleId: string; tacheId: string; requetesParJour: number; paysId: string;
  utilisateurs: number; jours: number };
export type Resultat = { energieWh: Triplet; energieParRequeteWh: Triplet; carboneUsageG: Triplet;
  carboneFabricationG: Triplet; eauDirecteMl: Triplet; eauIndirecteMl: Triplet };
export type Meta = { source: string; url: string; licence: string; extrait_le: string };
```
- Produces : `formater(valeur: number, unite: "Wh" | "gCO2e" | "mL"): string`.

- [ ] **Step 1 : Écrire les tests** (`format.test.ts`) :
  - `formater(0.24, "Wh") === "0,24 Wh"` ; `formater(1530, "Wh") === "1,5 kWh"` ; `formater(2.3e12, "Wh") === "2,3 TWh"`
  - `formater(0.03, "gCO2e") === "0,03 gCO2e"` ; `formater(4.2e12, "gCO2e") === "4,2 MtCO2e"` (paliers g, kg, t, kt, Mt)
  - `formater(0.26, "mL") === "0,26 mL"` ; `formater(45000, "mL") === "45 L"` ; `formater(3.1e12, "mL") === "3,1 millions de m³"` (paliers mL, L, m³, milliers de m³, millions de m³)
  - `formater(0.0004, "Wh") === "0,0004 Wh"` (jamais « 0 ») ; `formater(0, "Wh") === "0 Wh"`
  - `expect(() => formater(NaN, "Wh")).toThrow("Valeur invalide")` ; idem pour `-1`
- [ ] **Step 2 : Lancer** `npx vitest run src/engine/format.test.ts`. Attendu : FAIL.
- [ ] **Step 3 : Implémenter** `formater` : 2 chiffres significatifs via `toLocaleString("fr-FR", { maximumSignificantDigits: 2 })`, palier choisi par puissance de 1000.
- [ ] **Step 4 : Relancer.** Attendu : PASS.
- [ ] **Step 5 : Commit** `feat(engine): types partagés et formatage des unités`.

### Task 3 : Référence EcoLogits et `estimer()`

**Files:**
- Create: `pipeline/requirements.txt` (`ecologits==<dernière version publiée>`, `duckdb`, `pandas`, `pyyaml`, `pytest`, `requests`), `pipeline/reference_ecologits.py`, `src/engine/__fixtures__/ecologits_reference.json`, `src/engine/__fixtures__/donnees.ts` (un `Donnees` de test : les 3 modèles de référence, un fournisseur, les pays `FR` et `US`, les 4 tâches, `coefficients` lus depuis `public/data/coefficients.json`), `public/data/coefficients.json`, `src/engine/estimer.ts`
- Test: `src/engine/estimer.test.ts`

**Interfaces:**
- Consumes : types de la tâche 2.
- Produces : `estimer(entrees: Entrees, donnees: Donnees): Resultat`. Les clés de `Coefficients` sont les noms des constantes de `ecologits/impacts/llm.py`, en snake_case, inchangées.

- [ ] **Step 1 : Lire** `ecologits/impacts/llm.py` et `ecologits/impacts/dag.py` de la version figée. Recopier chaque constante numérique dans `public/data/coefficients.json` (`data` = objet clé → nombre), `meta.url` = lien GitHub du fichier au tag de version.
- [ ] **Step 2 : `reference_ecologits.py`** appelle la fonction de calcul d'impact LLM d'EcoLogits pour 3 cas : un petit modèle ouvert (8 Md), un modèle moyen ouvert (70 Md), un modèle fermé à paramètres estimés ; 400 tokens chacun ; mix électrique `FRA` puis `USA`. Écrit `src/engine/__fixtures__/ecologits_reference.json` : `[{ cas, paramsActifsMd, paramsTotauxMd, tokens, mix, energieWh, carboneUsageG, carboneFabricationG, eauMl }]` (valeurs centrales).
- [ ] **Step 3 : Écrire les tests** (`estimer.test.ts`) :
  - `it.each(reference)` : `estimer` sur 1 requête, 1 utilisateur, 1 jour donne `energieParRequeteWh.central`, `carboneUsageG.central`, `carboneFabricationG.central` à 5 % près de la référence (`Math.abs(x - ref) / ref <= 0.05`).
  - ordre : pour 50 combinaisons tirées des données de test, chaque triplet du résultat vérifie `bas <= central <= haut`.
  - modèle ouvert (`bas == central == haut` partout) : chaque triplet du résultat a `bas == haut`.
  - monotonie : doubler `requetesParJour` double `energieWh.central` ; idem pour `utilisateurs`.
  - `estimer({ ...e, modeleId: "inconnu" }, d)` lève `Error("Modèle inconnu : inconnu")` ; même forme pour pays (`Pays inconnu : …`) et tâche (`Tâche inconnue : …`).
  - `requetesParJour: -1` ou `NaN` lève `Error("Entrée invalide : requetesParJour")`.
- [ ] **Step 4 : Lancer.** Attendu : FAIL.
- [ ] **Step 5 : Implémenter `estimer`** en portant les formules EcoLogits ligne à ligne. Chaque triplet est calculé trois fois : avec toutes les entrées `bas`, toutes `central`, toutes `haut`. `jours` vaut 365 par défaut dans les vues, le moteur le reçoit toujours explicitement.
- [ ] **Step 6 : Relancer.** Attendu : PASS. Si l'écart dépasse 5 %, corriger le portage, jamais la tolérance.
- [ ] **Step 7 : Commit** `feat(engine): estimer() porté d'EcoLogits, validé à 5 %`.

### Task 4 : Équivalences

**Files:**
- Create: `src/engine/equivalences.ts`
- Test: `src/engine/equivalences.test.ts`

**Interfaces:**
- Produces :
```ts
export type FacteurEquivalence = { id: string; libelle: string; indicateur: "energie" | "carbone" | "eau";
  parUnite: number; source: string }; // parUnite en Wh, gCO2e ou mL par unité d'équivalence
export type Equivalence = { id: string; libelle: string; valeur: number };
export function equivalences(r: Resultat, facteurs: FacteurEquivalence[]): Equivalence[];
```
  `energie` utilise `energieWh.central`, `carbone` utilise `carboneUsageG.central + carboneFabricationG.central`, `eau` utilise `eauDirecteMl.central + eauIndirecteMl.central`.

- [ ] **Step 1 : Tests** : avec un facteur `{ indicateur: "carbone", parUnite: 200 }` et un carbone total central de 1000 g, `valeur === 5` ; un facteur `parUnite: 0` lève `Error("Facteur invalide : <id>")` ; l'ordre de sortie suit l'ordre des facteurs.
- [ ] **Step 2 : Lancer.** Attendu : FAIL.
- [ ] **Step 3 : Implémenter.**
- [ ] **Step 4 : Relancer.** Attendu : PASS.
- [ ] **Step 5 : Commit** `feat(engine): équivalences`.

### Task 5 : Pipeline, modèles, fournisseurs et pays

**Files:**
- Create: `pipeline/build_data.py`, `pipeline/sources.yaml`, `pipeline/etapes/ecologits.py`, `pipeline/etapes/ember.py`, `pipeline/etapes/aqueduct.py`, `pipeline/etapes/validation.py`
- Output: `public/data/models.json`, `public/data/providers.json`, `public/data/countries.json`
- Test: `pipeline/tests/test_sorties.py`

**Interfaces:**
- Produces : JSON dont `data` suit exactement `Modele[]`, `Fournisseur[]`, `Pays[]` (tâche 2, noms de champs identiques). `build_data.py` accepte `--etape <nom>` et, sans argument, lance toutes les étapes.
- `validation.verifier(chemin: Path, schema: dict) -> None` lève `ValueError` en nommant le fichier et le champ fautif.

Règles de données :
- **Modèles** : depuis le fichier de modèles d'EcoLogits. `id` = `<fournisseur>/<nom EcoLogits>`. Paramètres en milliards. Un modèle dont EcoLogits donne une plage prend `bas`/`haut` de la plage et `central` = moyenne géométrique ; sinon les trois valeurs sont égales et `ouvert: true`. Garder 15 modèles au plus : ceux présents dans Compar:IA ou AI Energy Score, plus GPT-4o, Gemini et Mistral Large.
- **Fournisseurs** : PUE et WUE d'EcoLogits en `central` et `bas`. PUE `haut` = 1,56 (moyenne mondiale Uptime Institute 2024, citée dans `sources.yaml`). WUE `haut` = `central` (pas de source de plage).
- **Pays** : liste fixe FR, DE, IE, NL, SE, FI, PL, ES, GB, US, CA, CN, IN, SG, JP. `intensiteCarbone` depuis Ember Yearly Electricity Data : `central` = dernière année, `bas`/`haut` = min/max des 3 dernières années. `eauElectricite` depuis le fichier de mix électrique d'EcoLogits ; si la colonne eau n'existe pas dans la version figée, l'étape s'arrête avec un message explicite, sans source de repli. `stressHydrique` = catégorie Aqueduct 4.0 par pays, `null` si absente.

- [ ] **Step 1 : Tests** (`test_sorties.py`) : chaque fichier a `meta` avec 4 champs non vides ; chaque triplet vérifie `bas <= central <= haut` et ne contient ni `NaN` ni négatif ; `intensiteCarbone.central` entre 0 et 1200 ; `pue.bas >= 1` ; les 15 pays sont présents ou absents avec un message dans le log ; aucune valeur `NaN` sérialisée.
- [ ] **Step 2 : Lancer** `pytest pipeline/tests -v`. Attendu : FAIL (fichiers absents).
- [ ] **Step 3 : Implémenter** les étapes et `build_data.py --etape modeles,fournisseurs,pays`.
- [ ] **Step 4 : Lancer** `python pipeline/build_data.py --etape modeles,fournisseurs,pays && pytest pipeline/tests -v`. Attendu : PASS.
- [ ] **Step 5 : Vérifier** qu'un script jetable `node -e` chargeant `models.json`, `providers.json`, `countries.json` et appelant `estimer` sur chaque modèle et chaque pays ne lève aucune erreur.
- [ ] **Step 6 : Commit** `feat(pipeline): modèles, fournisseurs et pays`.

### Task 6 : Pipeline, tâches depuis Compar:IA

**Files:**
- Create: `pipeline/etapes/comparia.py`, `pipeline/mapping_taches.yaml`
- Output: `public/data/tasks.json`
- Test: `pipeline/tests/test_taches.py`

**Interfaces:**
- Produces : `data` = `Tache[]` avec les 4 ids `question-courte`, `conversation`, `redaction`, `code`. `tokens` = p25, p50, p75 du nombre de tokens générés par réponse.

- [ ] **Step 1 : Inspecter** le schéma du Parquet « conversations » avec DuckDB (`DESCRIBE`) et écrire `mapping_taches.yaml` : pour chaque tâche, les valeurs de catégorie Compar:IA qui la composent. Le Parquet est lu par DuckDB depuis son URL ou un cache local `pipeline/.cache/` (ajouté à `.gitignore`).
- [ ] **Step 2 : Tests** : 4 tâches exactement ; `tokens.bas < tokens.haut` ; chaque tâche agrège au moins 500 réponses (compté dans `meta.n` par tâche) ; `redaction.tokens.central > question-courte.tokens.central`.
- [ ] **Step 3 : Lancer.** Attendu : FAIL.
- [ ] **Step 4 : Implémenter** l'agrégation par quantiles en SQL DuckDB.
- [ ] **Step 5 : Lancer** `python pipeline/build_data.py --etape taches && pytest pipeline/tests -v`. Attendu : PASS.
- [ ] **Step 6 : Commit** `feat(pipeline): tâches et longueurs de réponse depuis Compar:IA`.

### Task 7 : Pipeline, données curées et validation

**Files:**
- Create: `pipeline/curated/claims.yaml`, `pipeline/curated/equivalences.yaml`, `pipeline/etapes/curated.py`
- Output: `public/data/claims.json`, `public/data/equivalences.json`, `public/data/validation.json`
- Test: `pipeline/tests/test_curated.py`

**Interfaces:**
- Produces :
```ts
type EtatPoste = "inclus" | "exclu" | "non-precise";
type Claim = { id: "google" | "openai" | "mistral"; acteur: string; modele: string; date: string;
  perimetre: string; energieWh: number | null; carboneG: number | null; eauMl: number | null;
  postes: Record<"calcul" | "serveur" | "inactif" | "pue" | "eauSite" | "eauElectricite" | "fabrication" | "methodePublique",
    { etat: EtatPoste; justification: string; url: string }>;
  fmti: number | null };
type PointValidation = { modeleId: string; tache: string; tokens: number; mesureWh: number };
```
  `equivalences.json` : `data` = `FacteurEquivalence[]` (tâche 4), 3 facteurs : km en voiture thermique (carbone), douche de 60 L (eau), recharge de smartphone (énergie), chacun avec sa valeur ADEME Base Empreinte et sa référence.

Valeurs déclarées à saisir (sources : `3_Sources.md`, section F) : Google 0,24 Wh, 0,03 gCO2e, 0,26 mL ; OpenAI 0,34 Wh, carbone `null`, 0,32 mL ; Mistral énergie `null`, 1,14 gCO2e, 45 mL. Chaque `postes.*.justification` cite le passage de la source ; un poste non documenté reste `non-precise`.

`validation.json` : pour chaque modèle ouvert présent à la fois dans `models.json` et dans AI Energy Score (tâche génération de texte), `mesureWh` = Wh mesuré par requête (valeur publiée pour 1000 requêtes divisée par 1000) et `tokens` = nombre moyen de tokens générés du protocole AI Energy Score. L'estimation n'est pas calculée en Python : la vue Méthodologie appelle `estimer` (pas de second portage des formules).

- [ ] **Step 1 : Tests** : 3 claims ; chaque claim a les 8 postes ; tout poste `inclus` ou `exclu` a une `url` non vide ; `fmti` est un nombre entre 0 et 100 ou `null` ; `validation.json` contient au moins 3 points ; 3 facteurs d'équivalence avec `parUnite > 0`.
- [ ] **Step 2 : Lancer.** Attendu : FAIL.
- [ ] **Step 3 : Remplir** les YAML en lisant les sources, puis implémenter `curated.py`.
- [ ] **Step 4 : Lancer** `python pipeline/build_data.py && pytest pipeline/tests -v`. Attendu : PASS.
- [ ] **Step 5 : Commit** `feat(pipeline): déclarations, équivalences et points de validation`.

### Task 8 : Chargement des données, navigation et mise en page

**Files:**
- Create: `src/data/charger.ts`, `src/app/route.ts`, `src/app/Layout.tsx`, `public/fonts/*.woff2`, `src/__fixtures__/donneesChargees.ts` (un `DonneesChargees` de test réutilisé par les tests des vues 9 à 12 : reprend `src/engine/__fixtures__/donnees.ts`, les 3 claims de la tâche 7, 3 facteurs, 3 points de validation)
- Modify: `src/App.tsx`, `src/styles.css`, `src/engine/types.ts` (ajout de `Claim`, `EtatPoste`, `PointValidation`, définis tâche 7)
- Test: `src/data/charger.test.ts`, `src/app/Layout.test.tsx`

**Interfaces:**
- Produces :
```ts
export type DonneesChargees = { donnees: Donnees; claims: Claim[]; facteurs: FacteurEquivalence[];
  validation: PointValidation[]; sources: Meta[] };
export async function chargerDonnees(base?: string): Promise<DonneesChargees>;
export type Route = "simulateur" | "discours" | "leviers" | "methodologie";
export function useRoute(): Route;
```
  `Claim` et `PointValidation` sont déclarés dans `src/engine/types.ts`.
- `App` charge les données une fois, affiche un état de chargement, puis la vue de la route courante dans `Layout`.

- [ ] **Step 1 : Tests** :
  - `chargerDonnees` avec `fetch` simulé renvoie un objet complet et 8 `sources`.
  - un `fetch` en 404 sur `models.json` rejette avec `Error("Impossible de charger models.json")`.
  - `App` affiche le message d'erreur et un bouton « Réessayer » ; un clic relance le chargement.
  - `Layout` rend 4 liens de navigation ; celui de la route courante a `aria-current="page"`.
  - `#/inconnu` affiche le simulateur.
- [ ] **Step 2 : Lancer.** Attendu : FAIL.
- [ ] **Step 3 : Implémenter.** En-tête, navigation et pied de page reprennent la maquette (logo SVG cercle + courbe, titre, sous-titre « Estimer l'impact environnemental de l'IA générative »). Polices sous-ensemblées (latin + `≈ → − ³ ✓ ✕`) et déclarées en `@font-face` dans `styles.css`.
- [ ] **Step 4 : Relancer** `npm test`. Attendu : PASS.
- [ ] **Step 5 : Commit** `feat(app): chargement des données, navigation et mise en page`.

### Task 9 : Vue Simulateur

**Files:**
- Create: `src/views/Simulateur.tsx`, `src/components/ChoixGroupe.tsx`, `src/components/CarteResultat.tsx`, `src/components/BarreFourchette.tsx`, `src/components/Encart.tsx`
- Test: `src/views/Simulateur.test.tsx`, `src/components/BarreFourchette.test.tsx`

**Interfaces:**
- Consumes : `estimer`, `equivalences`, `formater`, `DonneesChargees`.
- Produces : `BarreFourchette({ valeur: Triplet, couleur: string })` ; `ChoixGroupe<T extends string>({ legende, options: { id: T; libelle: string; detail?: string }[], valeur: T, onChange })` rendu en `fieldset` + boutons `aria-pressed` ; `CarteResultat({ titre, couleur, total: Triplet, parRequete: string, postes: [{ libelle, valeur }, { libelle, valeur }], unite })` ; `Encart({ ton: "sombre" | "clair" | "alerte", titre?, children })`.

Valeurs par défaut : premier modèle fermé de `models.json`, tâche `conversation`, 20 requêtes/jour, pays `US`, échelle 1 personne. Échelles : 1 personne, 1 000 personnes, 10 000 000 (libellé « La France · 10 M d'utilisateurs (hypothèse) »). Curseur 1 à 200.

- [ ] **Step 1 : Tests** :
  - le rendu par défaut affiche 3 cartes « Énergie », « Carbone », « Eau » et 3 équivalences.
  - passer l'échelle à « La France » multiplie le texte de l'énergie centrale (vérifié via `estimer` sur les mêmes entrées) et l'affiche sans notation `e+`.
  - le curseur à 1 et un modèle ouvert : aucune valeur affichée ne vaut « 0 ».
  - `BarreFourchette` avec `bas == haut` place le repère à 50 % sans `NaN` dans le style.
  - la ligne d'intensité carbone du pays choisi est affichée (« ≈ 380 gCO2e/kWh » pour la valeur du JSON de test).
- [ ] **Step 2 : Lancer.** Attendu : FAIL.
- [ ] **Step 3 : Implémenter** selon la maquette (colonne réglages à gauche, résultats à droite, bandeau d'équivalences sombre, encart d'alerte avec lien vers `#/leviers`). Si `stressHydrique` est « élevé » ou « extrêmement élevé », la carte Eau affiche « Zone de stress hydrique : <catégorie> ».
- [ ] **Step 4 : Relancer.** Attendu : PASS.
- [ ] **Step 5 : Commit** `feat(views): simulateur`.

### Task 10 : Vue Méthodologie

**Files:**
- Create: `src/views/Methodologie.tsx`
- Test: `src/views/Methodologie.test.tsx`

**Interfaces:**
- Consumes : `DonneesChargees`, `formater`. Observable Plot (`@observablehq/plot`) pour le nuage de points uniquement.

Contenu : chaîne de calcul en 5 étapes (textes et formules de la maquette), tableau des hypothèses lu depuis les JSON (paramètres actifs du modèle fermé par défaut, tokens de `conversation`, PUE et WUE du fournisseur par défaut, intensité carbone `US`), nuage de points estimation / `mesureWh`, l'estimation étant `estimer` sur 1 requête de `tokens` tokens (tâche dont `tokens.central` est le plus proche) en pays `US`, avec la diagonale y = x et un `figcaption` qui donne l'écart médian en %, liste des sources depuis `sources` (nom, licence, lien), encart des 5 limites de la spec §4.4.

- [ ] **Step 1 : Tests** : le tableau affiche les valeurs du JSON de test (pas de texte entre crochets) ; une ligne de source par `Meta` ; le `figcaption` contient « écart médian » ; le graphique a un `aria-label`.
- [ ] **Step 2 : Lancer.** Attendu : FAIL.
- [ ] **Step 3 : Implémenter.**
- [ ] **Step 4 : Relancer.** Attendu : PASS.
- [ ] **Step 5 : Commit** `feat(views): méthodologie`.

### Task 11 : Vue Discours vs réalité

**Files:**
- Create: `src/views/Discours.tsx`
- Test: `src/views/Discours.test.tsx`

**Interfaces:**
- Consumes : `claims`, `estimer`, `formater`.

La carte « Estimation ouverte » appelle `estimer` sur 1 requête, 400 tokens (tâche dont le `tokens.central` est le plus proche de 400), modèle fermé par défaut, pays `US`, et affiche le triplet en « bas à haut ». Les valeurs `null` d'un claim s'affichent « non publié ». La matrice est un `table` avec `scope` sur les en-têtes, dans un conteneur `overflow-x: auto` ; chaque badge est un lien vers `url` avec `title` = `justification`. Libellés : « ✓ Inclus », « ✕ Exclu », « ? Non précisé ». Le score FMTI s'affiche sous le nom de l'acteur quand il n'est pas `null`.

- [ ] **Step 1 : Tests** : 4 cartes ; la carte OpenAI affiche « non publié » pour le carbone ; la matrice a 8 lignes et 4 colonnes de données ; la cellule Google / eau de l'électricité affiche « ✕ Exclu » avec le JSON de test ; l'estimation ouverte n'affiche aucun texte entre crochets.
- [ ] **Step 2 : Lancer.** Attendu : FAIL.
- [ ] **Step 3 : Implémenter.** La colonne « Estimation ouverte » de la matrice est fixe : tout `inclus` sauf `inactif` = `exclu`.
- [ ] **Step 4 : Relancer.** Attendu : PASS.
- [ ] **Step 5 : Commit** `feat(views): discours vs réalité`.

### Task 12 : Vue Leviers frugaux

**Files:**
- Create: `src/views/leviers/scenario.ts`, `src/views/Leviers.tsx`
- Test: `src/views/leviers/scenario.test.ts`, `src/views/Leviers.test.tsx`

**Interfaces:**
- Produces :
```ts
export type LevierId = "petit-modele" | "france" | "court" | "moitie";
export function scenarioDepart(d: Donnees): Entrees; // modèle fermé par défaut, "conversation", 20, "US", 1 utilisateur, 365 jours
export function appliquerLeviers(base: Entrees, leviers: LevierId[], d: Donnees): Entrees;
```
  `petit-modele` → modèle ouvert au plus petit `paramsActifsMd.central` ; `france` → `"FR"` ; `court` → `"question-courte"` ; `moitie` → `requetesParJour / 2`.

- [ ] **Step 1 : Tests** : `appliquerLeviers(base, [], d)` égale `base` ; chaque levier seul change uniquement son champ ; les 4 combinés donnent un carbone central inférieur à celui de chaque levier seul ; la vue affiche « au lieu de », un gain « −N % » et 6 barres ; les boutons de levier ont `aria-pressed`.
- [ ] **Step 2 : Lancer.** Attendu : FAIL.
- [ ] **Step 3 : Implémenter** selon la maquette, avec les encarts effet rebond et les 3 principes de l'IA frugale (textes de la maquette). État initial : levier `france` actif.
- [ ] **Step 4 : Relancer.** Attendu : PASS.
- [ ] **Step 5 : Commit** `feat(views): leviers frugaux`.

### Task 13 : Budget de poids, documentation et mise en ligne

**Files:**
- Create: `scripts/budget.mjs`, `README.md`, `docs/methodologie.md`
- Modify: `src/app/Layout.tsx` (pied de page), `.github/workflows/ci.yml`, `package.json`

**Interfaces:**
- `scripts/budget.mjs` additionne la taille gzip de `dist/index.html`, des JS, CSS et polices et des JSON chargés au démarrage, écrit `dist/poids.json` (`{ "ko": n }`) et sort en erreur au-delà de 500.
- Le pied de page lit `poids.json` et affiche « Cette page pèse N Ko ».

- [ ] **Step 1 : Test** `Layout.test.tsx` : avec `poids.json` simulé à `{ "ko": 312 }`, le pied de page affiche « Cette page pèse 312 Ko ».
- [ ] **Step 2 : Lancer.** Attendu : FAIL.
- [ ] **Step 3 : Implémenter** `budget.mjs`, le pied de page, script npm `budget` lancé après `build` dans la CI.
- [ ] **Step 4 : Lancer** `npm run build && npm run budget && npm test`. Attendu : PASS, poids ≤ 500 Ko.
- [ ] **Step 5 : Écrire** `README.md` (objectif, lien du site, `npm ci && npm run dev`, `pip install -r pipeline/requirements.txt && python pipeline/build_data.py`, sources) et `docs/methodologie.md` (contenu de la vue Méthodologie en texte, avec les valeurs des JSON).
- [ ] **Step 6 : Commit** `feat: budget de poids, documentation`, puis push sur `main`. Vérifier que l'action publie le site et que les 4 vues s'ouvrent sur l'URL GitHub Pages.
- [ ] **Step 7 : Action manuelle de Denis** : activer GitHub Pages (source « GitHub Actions ») dans les réglages du repo, puis déclarer la réutilisation sur data.gouv.fr en la liant aux 5 jeux de données du défi.
