import json
import math
from pathlib import Path

import requests
import yaml

RACINE = Path(__file__).resolve().parents[2]
DATA = RACINE / "public" / "data"
CACHE = RACINE / "pipeline" / ".cache"
SOURCES = yaml.safe_load((RACINE / "pipeline" / "sources.yaml").read_text(encoding="utf-8"))


def triplet(bas: float, central: float, haut: float) -> dict:
    return {"bas": bas, "central": central, "haut": haut}


def plat(v: float) -> dict:
    return triplet(v, v, v)


def moyenne_geometrique(a: float, b: float) -> float:
    return math.sqrt(a * b)


def meta(source: str, url: str, licence: str) -> dict:
    return {"source": source, "url": url, "licence": licence, "extrait_le": SOURCES["extrait_le"]}


def ecrire(nom: str, meta_: dict, data) -> Path:
    chemin = DATA / nom
    chemin.parent.mkdir(parents=True, exist_ok=True)
    # allow_nan=False : un NaN fait échouer l'écriture au lieu de produire un JSON faux.
    texte = json.dumps({"meta": meta_, "data": data}, ensure_ascii=False, indent=2, allow_nan=False)
    chemin.write_text(texte + "\n", encoding="utf-8")
    print(f"écrit {chemin.relative_to(RACINE)}")
    return chemin


def telecharger(url: str, nom: str) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    chemin = CACHE / nom
    if not chemin.exists():
        print(f"téléchargement {url}")
        r = requests.get(url, timeout=300)
        r.raise_for_status()
        chemin.write_bytes(r.content)
    return chemin
