# Spec : « Le vrai coût d'un prompt », outil interactif d'impact de l'IA générative

- **Date** : 28/10/2026
- **Auteur** : Denis Popescu
- **Statut** : design validé, en attente de relecture de la spec
- **Cadre** : défi « L'impact environnemental de l'IA générative » (ADEME, Open Data University, saison 4), livrable « Niveau avancé : outil interactif avancé d'estimation d'impact basé sur des paramètres multiples (modèle, fréquence d'usage, localisation du data center, mix énergétique) ».
- **Maquette** : canvas Design « Le vrai coût d'un prompt », https://claude.ai/artifact/EHg7Ja6WLxttPfzzDDh2sP (privé)

## 1. Intention

### Problématique du défi
Face à l'opacité du secteur de l'IA générative sur son impact environnemental, comment mobiliser les données existantes pour éclairer le débat public et permettre des choix avisés ?

### Ce que l'outil doit permettre
1. Comprendre les ordres de grandeur de l'impact d'un usage réel de l'IA (énergie, carbone, eau), à l'échelle d'une personne, d'une entreprise et de la France.
2. Confronter les chiffres publiés par les entreprises (Google, OpenAI, Mistral) à une estimation ouverte, en rendant visible le périmètre de chaque chiffre.
3. Montrer les leviers de réduction et leurs limites (effet rebond).
4. Être lui-même transparent : chaque chiffre est relié à sa formule, ses hypothèses et sa source.

### Contraintes
- Projet réalisé seul, le plus vite possible.
- Pas de serveur à maintenir.
- L'outil traite de frugalité : il doit être léger et sobre lui-même.

### Critères de réussite
- Les 4 vues fonctionnent en ligne sur GitHub Pages.
- Le moteur reproduit les valeurs de référence d'EcoLogits à 5 % près sur 3 modèles.
- Chaque résultat affiche une fourchette basse et haute.
- Moins de 500 Ko transférés au premier chargement.
- Une réutilisation est publiée sur data.gouv.fr.

## 2. Architecture

### Principe
Le traitement lourd des données se fait une fois, hors ligne, en Python. Le site est statique : il charge de petits JSON et calcule tout dans le navigateur. Pas de serveur, pas d'API, pas de tracking.

```
Sources brutes ──► pipeline Python (hors ligne) ──► JSON légers (< 300 Ko) ──► app React
                    DuckDB + pandas                  versionnés dans le repo      moteur TS
```

### Stack
| Couche | Choix |
|---|---|
| Pipeline de données | Python 3.12, DuckDB (lecture des Parquet Compar:IA), pandas, pytest |
| Front | Vite, React 18, TypeScript, Tailwind CSS |
| Graphiques | Observable Plot |
| Tests front | Vitest |
| Déploiement | GitHub Actions vers GitHub Pages |

### Structure du repo
```
Outil_interactif_avance_RSE/
  pipeline/
    build_data.py        télécharge, nettoie, agrège, valide, écrit les JSON
    sources.yaml         URL, licence et date de chaque source
    tests/               pytest sur les JSON produits
  public/data/
    models.json          modèles : paramètres actifs (bas, central, haut), fournisseur
    providers.json       PUE et WUE par fournisseur (bas, central, haut)
    countries.json       intensité carbone, eau de l'électricité, stress hydrique par pays
    tasks.json           tokens par réponse par type de tâche (p25, p50, p75)
    claims.json          chiffres déclarés par les entreprises, avec leur périmètre
    equivalences.json    facteurs d'équivalence ADEME
    coefficients.json    coefficients du moteur (α, β, surcoût serveur, part fabrication)
  src/
    engine/              calcul pur TypeScript, sans dépendance à React
    data/                chargement et typage des JSON
    views/               Simulateur, Discours, Leviers, Methodologie
    components/          contrôles, cartes de résultat, graphiques
  docs/
    methodologie.md      version texte de la méthodologie, pour le jury
  .github/workflows/     CI et déploiement
```

### Format commun des JSON
Chaque fichier de `public/data/` a la forme :
```json
{
  "meta": { "source": "Ember", "url": "https://…", "licence": "CC BY 4.0", "extrait_le": "2026-10-28" },
  "data": [ … ]
}
```
Une valeur incertaine est toujours un triplet `{ "bas": x, "central": y, "haut": z }`.

### Rôle des sources
| Source | Utilisation |
|---|---|
| EcoLogits | Coefficients du moteur, paramètres estimés des modèles fermés, PUE et WUE fournisseurs, facteurs eau de l'électricité, part fabrication |
| Compar:IA (Parquet, 1,5 Go) | Distribution réelle des tokens générés par catégorie de tâche. DuckDB n'en extrait que les quantiles |
| AI Energy Score | Validation du moteur sur les modèles ouverts |
| Foundation Model Transparency Index | Score de transparence par entreprise (vue Discours) |
| Ember | Intensité carbone de l'électricité par pays |
| ADEME Base Empreinte | Facteurs des équivalences |
| WRI Aqueduct | Stress hydrique par pays, affiché à titre d'alerte |
| Google, OpenAI, Mistral | Chiffres déclarés (vue Discours) |

ODRE et OpenStreetMap sont réservés à la carte des data centers, hors V1.

## 3. Moteur de calcul

### Entrées
- Modèle : paramètres actifs, fournisseur.
- Type de tâche : tokens générés par réponse.
- Requêtes par jour et par personne (1 à 200).
- Pays du data center.
- Échelle : 1 personne, une entreprise de 1 000 personnes, la France (10 millions d'utilisateurs, hypothèse affichée).
- Durée : 1 an.

### Formules (méthode EcoLogits, approche bottom-up)
```
énergie_GPU par token  = α × params_actifs + β
énergie par requête    = tokens × énergie_GPU par token × surcoût serveur × PUE       [Wh]
carbone usage          = énergie × intensité carbone du pays                          [gCO2e]
carbone fabrication    = part amortie des serveurs                                     [gCO2e]
eau directe            = énergie IT × WUE du site                                      [mL]
eau indirecte          = énergie × eau consommée pour produire l'électricité          [mL]
total annuel           = par requête × requêtes/jour × 365 × nombre d'utilisateurs
```
Les coefficients exacts (α, β, surcoût serveur, part fabrication, facteurs eau) sont extraits du dépôt EcoLogits par le pipeline et écrits dans `coefficients.json`. À l'étape 1 de la construction, ce fichier est rempli à la main en recopiant les valeurs du dépôt EcoLogits, avec le chemin du fichier source et le commit dans `meta`. Le pipeline prend le relais à l'étape 2. Aucun coefficient n'est saisi de mémoire.

### Incertitude
- Chaque paramètre incertain est un triplet bas, central, haut.
- Le calcul ne contient que des produits et des sommes de valeurs positives. Le bas de la fourchette est donc obtenu en combinant toutes les valeurs basses, le haut en combinant toutes les valeurs hautes. Pas de Monte-Carlo.
- L'interface affiche toujours la valeur centrale, la fourchette et la mention « ordre de grandeur ».

### Interface du module `src/engine`
```ts
type Triplet = { bas: number; central: number; haut: number };

type Entrees = {
  modeleId: string;
  tacheId: string;
  requetesParJour: number;
  paysId: string;
  utilisateurs: number;
  jours: number; // 365 par défaut
};

type Resultat = {
  energieWh: Triplet;          // total
  energieParRequeteWh: Triplet;
  carboneUsageG: Triplet;
  carboneFabricationG: Triplet;
  eauDirecteMl: Triplet;
  eauIndirecteMl: Triplet;
};

function estimer(entrees: Entrees, donnees: Donnees): Resultat;
function equivalences(resultat: Resultat, facteurs: Facteurs): Equivalence[];
function formater(valeur: number, unite: "Wh" | "gCO2e" | "mL"): string; // Wh → kWh → MWh → GWh, etc.
```
Le moteur ne dépend ni de React ni du réseau : il reçoit les données déjà chargées.

## 4. Les vues

L'identité visuelle et la mise en page suivent la maquette Design.

### Identité
- Fond papier `#F3F4F1`, encre `#15201B`, texte secondaire `#4A5550`, filets `#D9DDD7`.
- Une couleur par indicateur, identique dans toutes les vues : énergie `#B45309`, carbone `#334155`, eau `#1D4ED8`. Vert `#14532D` réservé aux gains.
- Typographies : Space Grotesk (titres), IBM Plex Sans (texte), IBM Plex Mono (chiffres). Auto-hébergées et réduites aux caractères utilisés.

### 4.1 Simulateur (page d'accueil)
- À gauche, les réglages : modèle, type de tâche (avec rappel du nombre de tokens), curseur de requêtes par jour, pays (avec rappel de l'intensité carbone), échelle.
- À droite, trois cartes : énergie, carbone, eau. Chaque carte montre la valeur annuelle centrale, la valeur par requête, une barre de fourchette basse/haute et la répartition en deux postes (calcul / refroidissement, usage / fabrication, eau de l'électricité / eau du site).
- En dessous, un bandeau d'équivalences : km en voiture thermique, douches de 60 L, recharges de smartphone.
- Un encart rappelle que les chiffres sont des ordres de grandeur et renvoie vers les Leviers.

### 4.2 Discours vs réalité
- Quatre cartes : Google (Gemini, août 2025), OpenAI (ChatGPT, juin 2025), Mistral (Large 2, 2025), estimation ouverte calculée par le moteur pour une requête comparable.
- Matrice « Qui compte quoi ? » : pour chaque poste (calcul, serveur, capacité inactive, PUE, eau du refroidissement, eau de l'électricité, fabrication, méthode publiée), l'état « inclus », « exclu » ou « non précisé ». Chaque case renvoie vers le passage de la source qui la justifie. La matrice est vérifiée source par source avant publication.
- Badge FMTI par entreprise si le score est récupérable simplement.
- Deux encarts d'analyse : l'eau oubliée, et pourquoi une médiane ne fait pas un total.

### 4.3 Leviers frugaux
- Point de départ fixe affiché : grand modèle fermé, conversation, 20 requêtes par jour, hébergement aux États-Unis.
- Quatre leviers activables : modèle plus petit, hébergement en France, réponses courtes, moitié moins de requêtes.
- Résultat : carbone annuel avant et après, gain en pourcentage, barres comparant chaque levier seul et la sélection combinée.
- Encarts : effet rebond (paradoxe de Jevons) et les 3 principes de l'IA frugale.

### 4.4 Méthodologie
- La chaîne de calcul en 5 étapes, avec formule et source.
- Le tableau des hypothèses (bas, central, haut, source), alimenté par les JSON.
- Un nuage de points « estimation du moteur / mesure AI Energy Score », un point par modèle. Les écarts sont affichés.
- La liste des sources et licences, lue depuis les blocs `meta`.
- Les limites : pas d'entraînement, paramètres des modèles fermés estimés, réseau et terminaux exclus, intensité carbone annuelle moyenne, impacts locaux signalés mais non chiffrés.

## 5. Gestion des erreurs
- **Pipeline** : échec explicite plutôt qu'un JSON faux. Vérification des colonnes attendues, des unités et des plages plausibles (exemple : intensité carbone hors de 0 à 1 200 gCO2e/kWh, build bloqué).
- **App** : si un JSON ne se charge pas, message clair avec un bouton « réessayer », jamais de page blanche.
- **Entrées** : toutes bornées (curseurs, choix fermés).
- **Moteur** : refuse une valeur négative ou `NaN` en entrée et lève une erreur explicite.

## 6. Tests
- **Vitest, moteur** :
  - écart d'au plus 5 % avec les valeurs de référence EcoLogits sur 3 modèles ;
  - fourchettes ordonnées (bas ≤ central ≤ haut) pour toutes les combinaisons d'entrées ;
  - résultat croissant avec le nombre de requêtes et d'utilisateurs ;
  - formatage des unités.
- **pytest, pipeline** : schéma et plages de chaque JSON produit.
- **Smoke test** : `npm run build` passe et les 4 vues s'affichent.

## 7. Sobriété et accessibilité
- Moins de 500 Ko transférés au premier chargement.
- Aucun tracking, aucun cookie, aucun appel à un service tiers à l'exécution.
- Contrastes AA, navigation complète au clavier, zones cliquables d'au moins 44 px, graphiques doublés d'un texte alternatif.
- Mise en page fluide jusqu'à la largeur d'un téléphone.
- Le pied de page affiche le poids de la page.

## 8. Déploiement et publication
- GitHub Action à chaque push sur `main` : lint, tests, build, publication sur GitHub Pages.
- Le pipeline Python ne tourne pas en CI. Il est lancé à la main (`python pipeline/build_data.py`) et les JSON sont commités.
- Réutilisation déclarée sur data.gouv.fr, liée aux 5 jeux de données du défi.

## 9. Ordre de construction
1. Moteur TypeScript et tests Vitest, avec des coefficients EcoLogits saisis depuis le dépôt dans `coefficients.json`.
2. Pipeline Python qui produit tous les JSON.
3. Vue Simulateur.
4. Vue Méthodologie.
5. Vue Discours vs réalité.
6. Vue Leviers.
7. Déploiement GitHub Pages, `README`, `docs/methodologie.md`, publication de la réutilisation.

## 10. Hors périmètre V1
- Carte des data centers en France (OpenStreetMap + ODRE).
- Impact de l'entraînement des modèles.
- Réseau et terminaux.
- Intensité carbone heure par heure.
- Comptes utilisateurs, sauvegarde de scénarios.
