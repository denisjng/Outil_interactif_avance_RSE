"""Calcule des valeurs de référence avec la librairie EcoLogits.

Le moteur TypeScript (src/engine/estimer.ts) doit retrouver ces valeurs à 5 % près.
Usage : python pipeline/reference_ecologits.py
"""
import json
import math
from pathlib import Path

from ecologits.electricity_mix_repository import electricity_mixes
from ecologits.impacts.llm import compute_llm_impacts

SORTIE = Path(__file__).resolve().parent.parent / "src" / "engine" / "__fixtures__" / "ecologits_reference.json"

PUE, WUE = 1.20, 0.569  # configuration EcoLogits du fournisseur « openai »
TOKENS = 400

# (cas, paramètres actifs, paramètres totaux, tps, ttft)
CAS = [
    ("petit-ouvert-8md", 8, 8, None, None),
    ("moyen-ouvert-70md", 70, 70, None, None),
    # gpt-4o dans EcoLogits : MoE 440 Md, actifs 44 à 132 Md ; valeur centrale = moyenne géométrique
    ("ferme-gpt-4o-central", math.sqrt(44 * 132), 440, 74.0, 0.61),
    ("ferme-gpt-4o-bas", 44, 440, 74.0, 0.61),
    ("ferme-gpt-4o-haut", 132, 440, 74.0, 0.61),
]


def valeur(v):
    return v.value if isinstance(v.value, (int, float)) else v.value.mean


def main():
    lignes = []
    for zone in ("FRA", "USA"):
        mix = electricity_mixes.find_electricity_mix(zone=zone)
        for cas, actifs, totaux, tps, ttft in CAS:
            r = compute_llm_impacts(
                model_active_parameter_count=actifs,
                model_total_parameter_count=totaux,
                output_token_count=TOKENS,
                if_electricity_mix_adpe=mix.adpe,
                if_electricity_mix_pe=mix.pe,
                if_electricity_mix_gwp=mix.gwp,
                if_electricity_mix_wue=mix.wue,
                datacenter_pue=PUE,
                datacenter_wue=WUE,
                tps=tps,
                ttft=ttft,
            )
            lignes.append({
                "cas": cas, "mix": zone,
                "paramsActifsMd": actifs, "paramsTotauxMd": totaux, "tps": tps, "ttft": ttft,
                "tokens": TOKENS, "pue": PUE, "wue": WUE,
                "intensiteCarbone": mix.gwp * 1000, "eauElectricite": mix.wue,
                "energieWh": valeur(r.energy) * 1000,
                "carboneUsageG": valeur(r.usage.gwp) * 1000,
                "carboneFabricationG": valeur(r.embodied.gwp) * 1000,
                "eauMl": valeur(r.wcf) * 1000,
            })
    SORTIE.write_text(json.dumps(lignes, indent=2), encoding="utf-8")
    print(f"{len(lignes)} cas écrits dans {SORTIE}")


if __name__ == "__main__":
    main()
