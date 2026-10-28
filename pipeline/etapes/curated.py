"""Données curées : déclarations des entreprises, équivalences, points de validation AI Energy Score."""
import re

import pandas as pd
import yaml

from .commun import RACINE, SOURCES, ecrire, meta, telecharger

CURATED = RACINE / "pipeline" / "curated"
INDICATEURS_ENV = {
    "energie": "Energy usage for final training run",
    "carbone": "Carbon emissions for final training run",
    "eau": "Water usage for final training run",
}


def _fmti() -> pd.DataFrame:
    f = SOURCES["fmti"]
    return pd.read_csv(telecharger(f["url"], "fmti_dec2025_scores.csv")).set_index("Indicator")


def claims():
    brut = yaml.safe_load((CURATED / "claims.yaml").read_text(encoding="utf-8"))
    fmti = _fmti()
    data = []
    for cid, c in brut.items():
        col = fmti[c["fmti_colonne"]]
        data.append({
            "id": cid,
            "acteur": c["acteur"],
            "modele": c["modele"],
            "date": c["date"],
            "perimetre": c["perimetre"],
            "energieWh": c["energieWh"],
            "carboneG": c["carboneG"],
            "eauMl": c["eauMl"],
            "source": c["source"],
            "postes": {nom: {"etat": e, "justification": j, "url": u} for nom, (e, j, u) in c["postes"].items()},
            "fmti": int(col.sum()),
            # Le développeur publie-t-il l'énergie, le carbone et l'eau de l'entraînement ? (indicateurs FMTI)
            "fmtiEnvironnement": {cle: bool(col[ind]) for cle, ind in INDICATEURS_ENV.items()},
        })
    f = SOURCES["fmti"]
    ecrire("claims.json", meta(f"Déclarations publiques (voir chaque poste) ; transparence : {f['source']}",
                               f["page"], f["licence"]), data)


def equivalences():
    brut = yaml.safe_load((CURATED / "equivalences.yaml").read_text(encoding="utf-8"))
    ecrire("equivalences.json", meta("ADEME Impact CO2 et unités de comparaison fixées par l'outil",
                                     "https://impactco2.fr", "Licence Ouverte 2.0 (Etalab)"), brut)


def _parametres(nom: str) -> float | None:
    """Taille en milliards de paramètres lue dans le nom du modèle (« 8B », « 1.7B », « 360M »)."""
    # Mélange d'experts (« 8x7B », « 30B-A3B ») : la taille du nom n'est pas le nombre de paramètres actifs.
    if re.search(r"\d+x\d+|-A\d+(\.\d+)?B", nom, re.IGNORECASE):
        return None
    m = re.search(r"(\d+(?:\.\d+)?)([BM])\b", nom.split("/")[-1], re.IGNORECASE)
    if not m:
        return None
    valeur = float(m.group(1))
    return valeur if m.group(2).upper() == "B" else valeur / 1000


def validation():
    a = SOURCES["aienergyscore"]
    d = pd.read_csv(telecharger(a["url"], "aies_text_generation.csv"), encoding="utf-8-sig")
    data = []
    for r in d.itertuples():
        params = _parametres(r.model)
        if params is None or params < 1:
            continue
        # total_gpu_energy : kWh pour 1000 requêtes, soit des Wh par requête.
        data.append({"modele": r.model, "paramsMd": params, "tokens": a["tokens_generes"],
                     "mesureWh": float(r.total_gpu_energy)})
    m = meta(f"AI Energy Score, génération de texte ({a['protocole']})", a["page"], a["licence"])
    ecrire("validation.json", m, data)
