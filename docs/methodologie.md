# Méthodologie

Version texte de la vue Méthodologie de l'outil « Le vrai coût d'un prompt ». Données extraites le 28/10/2026.

## Principe

L'outil estime l'impact d'une requête à un modèle de langage, puis le multiplie par le nombre de requêtes par jour, 365 jours et le nombre d'utilisateurs. Seule l'utilisation (inférence) est comptée, pas l'entraînement.

La méthode est celle d'EcoLogits 0.11.3 (`ecologits/impacts/llm.py`), portée ligne à ligne en TypeScript dans `src/engine/estimer.ts`. Un test compare le moteur à la librairie Python sur 10 cas (3 tailles de modèle, France et États-Unis) : l'écart reste sous 5 %.

## La chaîne de calcul

Pour une requête qui génère `tokens` tokens avec un modèle de `A` milliards de paramètres actifs et `T` milliards de paramètres au total :

1. **Énergie d'un GPU** : `tokens × (α × e^(β × lot) × A + γ)`, en Wh.
2. **Nombre de GPU** : mémoire nécessaire `1,2 × T × 16 / 8` Go, divisée par 80 Go, arrondie à la puissance de 2 supérieure.
3. **Latence** : `tokens / tps + ttft` quand le débit du modèle est publié, sinon `tokens × (a × A + b × lot + c)`.
4. **Énergie du serveur hors GPU** : `latence × 1,2 kW × (GPU / 8) / lot`.
5. **Énergie IT** : serveur + GPU × énergie d'un GPU. **Énergie totale** : énergie IT × PUE.
6. **Carbone d'usage** : énergie totale × intensité carbone du pays.
7. **Carbone de fabrication** : part de l'empreinte de fabrication du serveur et des GPU, au prorata de la latence sur une durée de vie de 3 ans, divisée par la taille du lot.
8. **Eau** : énergie IT × WUE du site (refroidissement) + énergie IT × PUE × eau consommée pour produire l'électricité du pays.

### Coefficients (EcoLogits 0.11.3)

| Clé | Valeur |
|---|---|
| `model_quantization_bits` | 16 |
| `gpu_energy_alpha` | 1.1665273170451914e-06 |
| `gpu_energy_beta` | -0.011205921025579175 |
| `gpu_energy_gamma` | 4.052928146734005e-05 |
| `latency_alpha` | 0.0006785088094353663 |
| `latency_beta` | 0.0003119310311688259 |
| `latency_gamma` | 0.019473717579473387 |
| `gpu_memory` (Go) | 80 |
| `gpu_embodied_gwp` (kgCO2e) | 273 |
| `server_gpu_count` | 8 |
| `server_power` (kW) | 1.2 |
| `server_embodied_gwp` (kgCO2e) | 5700 |
| `server_lifetime` (s) | 94 608 000 (3 ans) |
| `batch_size` | 64 |

## Fourchettes

Chaque paramètre incertain a une valeur basse, centrale et haute. Le calcul est croissant dans chacun d'eux : le bas de la fourchette combine toutes les valeurs basses, le haut toutes les valeurs hautes.

- **Paramètres des modèles fermés** : plage estimée par EcoLogits ; valeur centrale = moyenne géométrique des bornes.
- **Longueur des réponses** : quantiles 25 %, 50 % et 75 % mesurés dans Compar:IA.
- **PUE** : valeur déclarée du fournisseur (EcoLogits) en bas, 1,56 en haut (moyenne mondiale, Uptime Institute 2024).
- **WUE** : plage EcoLogits quand elle existe.
- **Intensité carbone** : dernière année Ember en valeur centrale, minimum et maximum des 3 dernières années pour les bornes.

### Longueur des réponses (Compar:IA, tokens générés par réponse)

Compar:IA classe les conversations par thème, pas par type de tâche. Le type est donc déduit du premier message (règles dans `pipeline/mapping_taches.yaml`) : mots-clés de code, mots-clés de rédaction, ou message de 12 mots au plus pour une question courte.

| Tâche | Bas (p25) | Central (p50) | Haut (p75) |
|---|---|---|---|
| Question courte | 190 | 457 | 786 |
| Conversation | 304 | 597 | 983 |
| Rédaction longue | 386 | 692 | 1136 |
| Code | 489 | 803 | 1315 |

Une question courte appelle quand même une réponse de plus de 450 tokens en médiane : la longueur de la réponse dépend plus du modèle que de la question.

### Fournisseurs

| Fournisseur | PUE | WUE (L/kWh) |
|---|---|---|
| OpenAI | 1,2 à 1,56 | 0,569 |
| Google | 1,09 à 1,56 | 0,999 |
| Anthropic | 1,09 à 1,56 | 0,13 à 0,999 |
| Mistral AI | 1,16 à 1,56 | 0,09 |
| Hugging Face (modèles ouverts) | 1,09 à 1,56 | 0,13 à 0,99 |

### Pays

| Pays | Intensité carbone (gCO2/kWh, Ember) | Eau de l'électricité (L/kWh, EcoLogits) | Stress hydrique (Aqueduct) |
|---|---|---|---|
| France | 41 | 3,67 | faible à moyen |
| Allemagne | 330 | 1,95 | moyen à élevé |
| Irlande | 256 | 1,48 | faible |
| Pays-Bas | 254 | 3,43 | faible à moyen |
| Suède | 35 | 6,03 | faible |
| Finlande | 57 | 4,53 | faible |
| Pologne | 591 | 2,51 | faible à moyen |
| Espagne | 154 | 6,21 | élevé |
| Royaume-Uni | 217 | 2,33 | faible à moyen |
| États-Unis | 384 | 3,13 | moyen à élevé |
| Canada | 191 | 8,17 | faible à moyen |
| Chine | 526 | 6,01 | moyen à élevé |
| Inde | 671 | 3,44 | extrêmement élevé |
| Singapour | 497 | 3,91 | non disponible |
| Japon | 477 | 2,31 | faible à moyen |

Un pays à électricité bas carbone n'est pas forcément sobre en eau : la Suède et le Canada consomment beaucoup d'eau par kWh (hydroélectricité, évaporation des retenues).

## Validation contre des mesures

AI Energy Score publie l'énergie GPU mesurée sur des modèles ouverts (1000 requêtes, H100, 10 tokens générés après la lecture d'un texte long). La vue Méthodologie place chaque modèle sur un nuage de points, estimation du moteur contre mesure, avec PUE = 1 pour comparer le matériel seul.

Les protocoles ne se comparent pas directement. La mesure est dominée par la lecture du texte d'entrée, que la méthode EcoLogits ne chiffre pas : l'écart est d'un à deux ordres de grandeur. Ce graphique ne valide donc pas le moteur. Il montre que les chiffres du simulateur sont plutôt un plancher dès que la question est longue (document collé, long historique). La fidélité du moteur à EcoLogits est vérifiée à part, par les tests (écart inférieur à 5 %).

## Équivalences

- **Voiture thermique** : 142 gCO2e par km (ADEME, Impact CO2, moyenne diesel, modélisation 2025).
- **Douche** : unité fixée par l'outil, 60 litres.
- **Recharge de smartphone** : unité fixée par l'outil, batterie de 15 Wh.

## Limites

- L'entraînement des modèles n'est pas compté.
- Les paramètres des modèles fermés sont estimés, pas publiés.
- Le réseau et les terminaux ne sont pas inclus.
- L'intensité carbone d'Ember est celle du CO2 de la production d'électricité (moyenne annuelle), pas un facteur en cycle de vie ni l'heure réelle de la requête. EcoLogits utilise des facteurs en cycle de vie, un peu plus élevés.
- Les impacts locaux (foncier, minerais, stress hydrique) sont signalés, pas chiffrés.
- Les types de tâche sont déduits du premier message par des règles simples.
