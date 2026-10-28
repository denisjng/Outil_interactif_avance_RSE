"""Tâches : longueur des réponses (tokens générés) par type de tâche, depuis Compar:IA."""
from pathlib import Path

import duckdb
import yaml

from .commun import CACHE, RACINE, SOURCES, ecrire, meta, triplet

MAPPING = yaml.safe_load((RACINE / "pipeline" / "mapping_taches.yaml").read_text(encoding="utf-8"))
ORDRE = ["code", "redaction", "question-courte"]  # premier type qui correspond ; « conversation » = tout
EXTRAIT = CACHE / "comparia_extrait.parquet"


def _extrait(con: duckdb.DuckDBPyConnection) -> Path:
    """Copie locale des seules colonnes utiles (le fichier complet pèse 2,6 Go)."""
    if not EXTRAIT.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        con.execute("INSTALL httpfs; LOAD httpfs;")
        con.execute(f"""
            COPY (SELECT conv_turns, total_conv_a_output_tokens ta, total_conv_b_output_tokens tb, opening_msg
                  FROM read_parquet('{SOURCES['comparia']['url']}'))
            TO '{EXTRAIT.as_posix()}' (FORMAT parquet)""")
    return EXTRAIT


def _condition(tid: str) -> str:
    regle = MAPPING[tid]
    if "motifs" in regle:
        motifs = " OR ".join(f"regexp_matches(opening_msg, '(?i){m}')" for m in regle["motifs"])
        return f"({motifs})"
    return f"len(string_split(trim(opening_msg), ' ')) <= {int(regle['mots_max'])}"


def taches():
    con = duckdb.connect()
    extrait = _extrait(con)
    cas = " ".join(f"WHEN {_condition(t)} THEN '{t}'" for t in ORDRE)
    con.execute(f"""
        CREATE TABLE reponses AS
        WITH conv AS (
            SELECT CASE {cas} ELSE NULL END AS tache, conv_turns, ta, tb
            FROM read_parquet('{extrait.as_posix()}')
            WHERE conv_turns > 0 AND opening_msg IS NOT NULL
        )
        SELECT tache, ta / conv_turns AS tokens FROM conv WHERE ta > 0
        UNION ALL
        SELECT tache, tb / conv_turns AS tokens FROM conv WHERE tb > 0""")

    def quantiles(filtre: str):
        return con.execute(f"""
            SELECT quantile_cont(tokens, 0.25), quantile_cont(tokens, 0.5), quantile_cont(tokens, 0.75), count(*)
            FROM reponses WHERE {filtre}""").fetchone()

    data, effectifs = [], {}
    for tid in ["question-courte", "conversation", "redaction", "code"]:
        bas, central, haut, n = quantiles("TRUE" if tid == "conversation" else f"tache = '{tid}'")
        effectifs[tid] = n
        data.append({"id": tid, "nom": MAPPING[tid]["nom"], "tokens": triplet(round(bas), round(central), round(haut))})

    c = SOURCES["comparia"]
    m = meta("Compar:IA, conversations (quantiles p25, p50, p75 des tokens par réponse ; types de tâche : "
             "pipeline/mapping_taches.yaml)", c["page"], c["licence"])
    m["n"] = effectifs
    ecrire("tasks.json", m, data)
