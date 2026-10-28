"""Pays : intensité carbone (Ember), eau de l'électricité (EcoLogits), stress hydrique (Aqueduct)."""
import zipfile

import pandas as pd

from .commun import SOURCES, ecrire, meta, plat, telecharger, triplet
from .ecologits import eau_des_mix


def _intensites() -> dict:
    csv = telecharger(SOURCES["ember"]["url"], "ember_yearly.csv")
    d = pd.read_csv(csv, usecols=["ISO 3 code", "Year", "Variable", "Unit", "Value"])
    d = d[(d["Variable"] == "CO2 intensity") & (d["Unit"] == "gCO2/kWh")].dropna(subset=["Value"])
    resultat = {}
    for iso3, g in d.groupby("ISO 3 code"):
        g = g.sort_values("Year").tail(3)
        valeurs = g["Value"]
        resultat[iso3] = (float(valeurs.min()), float(valeurs.iloc[-1]), float(valeurs.max()), int(g["Year"].iloc[-1]))
    return resultat


def _stress() -> dict:
    archive = telecharger(SOURCES["aqueduct"]["url"], "aqueduct.zip")
    with zipfile.ZipFile(archive) as z:
        xlsx = next(n for n in z.namelist() if n.endswith(".xlsx"))
        with z.open(xlsx) as f:
            d = pd.read_excel(f, sheet_name="country_baseline")
    a = SOURCES["aqueduct"]
    d = d[(d["indicator_name"] == a["indicateur"]) & (d["weight"] == a["ponderation"])]
    traduction = SOURCES["stress_hydrique"]
    return {r.gid_0: traduction.get(r.label) for r in d.itertuples()}


def pays():
    intensites, eau, stress = _intensites(), eau_des_mix(), _stress()
    data, annees = [], set()
    for iso2, iso3, nom in SOURCES["pays"]:
        if iso3 not in intensites or eau.get(iso3) is None:
            print(f"pays exclu, donnée manquante : {iso2}")
            continue
        bas, central, haut, annee = intensites[iso3]
        annees.add(annee)
        data.append({
            "id": iso2,
            "nom": nom,
            "intensiteCarbone": triplet(bas, central, haut),
            "eauElectricite": plat(eau[iso3]),
            "stressHydrique": stress.get(iso3),
        })
    source = (f"Ember Yearly Electricity Data (dernière année {max(annees)}, plage sur 3 ans) ; "
              f"eau : EcoLogits {SOURCES['ecologits']['version']} ; stress hydrique : WRI Aqueduct 4.0")
    licence = "CC BY 4.0 (Ember, Aqueduct), MPL-2.0 (EcoLogits)"
    ecrire("countries.json", meta(source, SOURCES["ember"]["page"], licence), data)
