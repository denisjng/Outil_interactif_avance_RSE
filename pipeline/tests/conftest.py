import json
from pathlib import Path

import pytest

DATA = Path(__file__).resolve().parents[2] / "public" / "data"


@pytest.fixture
def charger():
    def _charger(nom: str):
        chemin = DATA / nom
        assert chemin.exists(), f"{nom} absent : lancer python pipeline/build_data.py"
        return json.loads(chemin.read_text(encoding="utf-8"))
    return _charger


def triplets(objet):
    """Tous les triplets {bas, central, haut} contenus dans un objet JSON."""
    if isinstance(objet, dict):
        if set(objet) == {"bas", "central", "haut"}:
            yield objet
        else:
            for v in objet.values():
                yield from triplets(v)
    elif isinstance(objet, list):
        for v in objet:
            yield from triplets(v)
