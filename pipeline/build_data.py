"""Construit les JSON de public/data/ à partir des sources ouvertes.

Usage :
    python pipeline/build_data.py                       # toutes les étapes
    python pipeline/build_data.py --etape modeles,pays  # étapes choisies
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from etapes import ecologits, pays  # noqa: E402

ETAPES = {
    "coefficients": ecologits.coefficients,
    "modeles": ecologits.modeles,
    "fournisseurs": ecologits.fournisseurs,
    "pays": pays.pays,
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--etape", help="étapes séparées par des virgules : " + ", ".join(ETAPES))
    args = parser.parse_args()
    noms = args.etape.split(",") if args.etape else list(ETAPES)
    inconnues = [n for n in noms if n not in ETAPES]
    if inconnues:
        parser.error(f"étape inconnue : {', '.join(inconnues)}")
    for nom in noms:
        ETAPES[nom]()


if __name__ == "__main__":
    main()
