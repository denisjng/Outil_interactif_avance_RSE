POSTES = {"calcul", "serveur", "inactif", "pue", "eauSite", "eauElectricite", "fabrication", "methodePublique"}


def test_trois_declarations(charger):
    claims = charger("claims.json")["data"]
    assert {c["id"] for c in claims} == {"google", "openai", "mistral"}


def test_postes_complets_et_sources(charger):
    for c in charger("claims.json")["data"]:
        assert set(c["postes"]) == POSTES, c["id"]
        for nom, p in c["postes"].items():
            assert p["etat"] in {"inclus", "exclu", "non-precise"}, (c["id"], nom)
            assert p["justification"], (c["id"], nom)
            if p["etat"] != "non-precise":
                assert p["url"].startswith("https://"), (c["id"], nom)


def test_scores_fmti(charger):
    for c in charger("claims.json")["data"]:
        assert c["fmti"] is None or 0 <= c["fmti"] <= 100, c["id"]


def test_valeurs_declarees(charger):
    claims = {c["id"]: c for c in charger("claims.json")["data"]}
    assert claims["google"]["energieWh"] == 0.24
    assert claims["openai"]["carboneG"] is None
    assert claims["mistral"]["energieWh"] is None


def test_validation(charger):
    points = charger("validation.json")["data"]
    assert len(points) >= 3
    for p in points:
        assert p["paramsMd"] > 0 and p["tokens"] > 0 and p["mesureWh"] > 0, p


def test_equivalences(charger):
    facteurs = charger("equivalences.json")["data"]
    assert {f["indicateur"] for f in facteurs} == {"energie", "carbone", "eau"}
    assert all(f["parUnite"] > 0 and f["source"] for f in facteurs)


def test_validation_sans_melange_d_experts(charger):
    # Un nom « 30B-A3B » donne la taille totale, pas les paramètres actifs : ces modèles sont exclus.
    import re
    for p in charger("validation.json")["data"]:
        assert not re.search(r"-A\d+(\.\d+)?B", p["modele"], re.IGNORECASE), p["modele"]
