# Le vrai coût d'un prompt

Outil interactif qui estime l'impact environnemental d'un usage d'IA générative : énergie, carbone et eau, sur un an, à l'échelle d'une personne, d'une entreprise ou de la France.

Réalisé pour le défi « L'impact environnemental de l'IA générative » proposé par l'ADEME dans le cadre de l'Open Data University (saison 4, niveau avancé).

Site : https://denisjng.github.io/Outil_interactif_avance_RSE/

## Ce que fait l'outil

- **Simulateur** : choisissez un modèle, un type de tâche, un nombre de requêtes par jour, le pays du data center et une échelle. L'outil affiche l'énergie, le carbone et l'eau avec une fourchette basse et haute, plus des équivalences concrètes.
- **Discours vs réalité** : les chiffres publiés par Google, OpenAI et Mistral, à côté d'une estimation ouverte, avec une matrice qui montre ce que chaque chiffre compte ou oublie.
- **Leviers frugaux** : ce que change un modèle plus petit, un hébergement en France, des questions courtes ou moins de requêtes, et pourquoi l'effet rebond peut tout annuler.
- **Méthodologie** : formules, hypothèses, sources, licences, limites, et une comparaison du moteur avec des mesures réelles (AI Energy Score).

Le calcul reprend la méthode d'[EcoLogits](https://ecologits.ai), portée en TypeScript et vérifiée à 5 % près contre la librairie Python.

## Lancer le site en local

```bash
npm ci
npm run dev
```

Tests, vérification des types et build :

```bash
npm test
npm run lint
npm run build && npm run budget
```

`npm run budget` mesure le poids transféré au premier chargement et échoue au-delà de 500 Ko.

## Regénérer les données

Les fichiers de `public/data/` sont produits par un pipeline Python à partir des sources ouvertes, puis commités.

```bash
python -m venv .venv
.venv/Scripts/pip install -r pipeline/requirements.txt
.venv/Scripts/python pipeline/build_data.py
.venv/Scripts/python -m pytest pipeline/tests
```

Une étape seule : `python pipeline/build_data.py --etape pays`. Les téléchargements sont gardés dans `pipeline/.cache/` (ignoré par git). Toutes les URL et licences sont dans `pipeline/sources.yaml`.

## Sources

| Source | Usage | Licence |
|---|---|---|
| EcoLogits 0.11.3 | méthode, coefficients, modèles, PUE et WUE, eau des mix électriques | MPL-2.0 |
| Compar:IA (Ministère de la Culture) | longueur réelle des réponses par type de tâche | Licence Ouverte 2.0 |
| Ember, Yearly Electricity Data | intensité carbone de l'électricité par pays | CC BY 4.0 |
| WRI Aqueduct 4.0 | stress hydrique par pays | CC BY 4.0 |
| AI Energy Score | mesures réelles pour valider le moteur | Apache-2.0 |
| Foundation Model Transparency Index (Stanford) | score de transparence des développeurs | voir le dépôt |
| ADEME Impact CO2 | équivalence en km de voiture | Licence Ouverte 2.0 |
| Google, OpenAI, Mistral | chiffres déclarés par requête | publications citées dans l'outil |

Détail des formules et des valeurs : [docs/methodologie.md](docs/methodologie.md).

## Structure

```
pipeline/        construction des données (Python, DuckDB, pandas)
public/data/     JSON produits, chacun avec un bloc meta (source, url, licence, date)
src/engine/      moteur de calcul pur, sans React
src/views/       les 4 vues
src/components/  contrôles, cartes de résultat, encarts
docs/            méthodologie, spec et plan
```
