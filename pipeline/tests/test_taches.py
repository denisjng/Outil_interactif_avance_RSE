IDS = {"question-courte", "conversation", "redaction", "code"}


def test_quatre_taches(charger):
    taches = charger("tasks.json")["data"]
    assert {t["id"] for t in taches} == IDS


def test_quantiles_ordonnes(charger):
    for t in charger("tasks.json")["data"]:
        tok = t["tokens"]
        assert 0 < tok["bas"] < tok["haut"], t["id"]
        assert tok["bas"] <= tok["central"] <= tok["haut"], t["id"]


def test_echantillon_suffisant(charger):
    effectifs = charger("tasks.json")["meta"]["n"]
    for tid in IDS:
        assert effectifs[tid] >= 500, tid


def test_redaction_plus_longue_que_question_courte(charger):
    t = {x["id"]: x for x in charger("tasks.json")["data"]}
    assert t["redaction"]["tokens"]["central"] > t["question-courte"]["tokens"]["central"]
