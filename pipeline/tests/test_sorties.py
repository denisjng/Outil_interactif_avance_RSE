import math

import pytest

from conftest import triplets

FICHIERS = ["models.json", "providers.json", "countries.json", "coefficients.json"]
PAYS = {"FR", "DE", "IE", "NL", "SE", "FI", "PL", "ES", "GB", "US", "CA", "CN", "IN", "SG", "JP"}


@pytest.mark.parametrize("nom", FICHIERS)
def test_meta_complete(charger, nom):
    meta = charger(nom)["meta"]
    for champ in ("source", "url", "licence", "extrait_le"):
        assert meta.get(champ), f"{nom} : meta.{champ} vide"


@pytest.mark.parametrize("nom", ["models.json", "providers.json", "countries.json"])
def test_triplets_ordonnes_et_finis(charger, nom):
    trouves = list(triplets(charger(nom)["data"]))
    assert trouves, f"{nom} : aucun triplet"
    for t in trouves:
        valeurs = [t["bas"], t["central"], t["haut"]]
        assert all(isinstance(v, (int, float)) and math.isfinite(v) and v >= 0 for v in valeurs), t
        assert t["bas"] <= t["central"] <= t["haut"], t


def test_pays(charger):
    pays = charger("countries.json")["data"]
    assert {p["id"] for p in pays} == PAYS
    for p in pays:
        assert 0 < p["intensiteCarbone"]["central"] < 1200, p["id"]
        assert p["stressHydrique"] is None or isinstance(p["stressHydrique"], str)


def test_fournisseurs(charger):
    for f in charger("providers.json")["data"]:
        assert f["pue"]["bas"] >= 1, f["id"]


def test_modeles(charger):
    modeles = charger("models.json")["data"]
    fournisseurs = {f["id"] for f in charger("providers.json")["data"]}
    assert 5 <= len(modeles) <= 15
    for m in modeles:
        assert m["fournisseurId"] in fournisseurs, m["id"]
        assert m["paramsActifsMd"]["central"] <= m["paramsTotauxMd"]["central"], m["id"]
    assert any(m["ouvert"] for m in modeles) and any(not m["ouvert"] for m in modeles)


def test_coefficients(charger):
    c = charger("coefficients.json")["data"]
    assert c["batch_size"] > 0 and c["server_lifetime"] > 0
