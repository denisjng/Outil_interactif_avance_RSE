"""Coefficients, modèles, fournisseurs et facteur eau des mix électriques, lus dans EcoLogits."""
import json
from pathlib import Path

import ecologits
from ecologits.impacts import llm
from ecologits.tracers.utils import PROVIDER_CONFIG_MAP
from ecologits.utils.range_value import RangeValue

from .commun import SOURCES, ecrire, meta, moyenne_geometrique, plat, triplet

E = SOURCES["ecologits"]
DONNEES_ECOLOGITS = Path(ecologits.__file__).parent / "data"


def _triplet_parametres(v) -> dict:
    if isinstance(v, dict):
        return triplet(v["min"], moyenne_geometrique(v["min"], v["max"]), v["max"])
    return plat(v)


def _triplet_plage(v) -> dict:
    if isinstance(v, RangeValue):
        return triplet(v.min, v.mean, v.max)
    return plat(v)


def coefficients():
    data = {
        "model_quantization_bits": llm.MODEL_QUANTIZATION_BITS,
        "gpu_energy_alpha": llm.GPU_ENERGY_ALPHA,
        "gpu_energy_beta": llm.GPU_ENERGY_BETA,
        "gpu_energy_gamma": llm.GPU_ENERGY_GAMMA,
        "latency_alpha": llm.LATENCY_ALPHA,
        "latency_beta": llm.LATENCY_BETA,
        "latency_gamma": llm.LATENCY_GAMMA,
        "gpu_memory": llm.GPU_MEMORY,
        "gpu_embodied_gwp": llm.GPU_EMBODIED_IMPACT_GWP,
        "server_gpu_count": llm.SERVER_GPUS,
        "server_power": llm.SERVER_POWER,
        "server_embodied_gwp": llm.SERVER_EMBODIED_IMPACT_GWP,
        "server_lifetime": llm.HARDWARE_LIFESPAN,
        "batch_size": llm.BATCH_SIZE,
    }
    source = f"EcoLogits {E['version']}, ecologits/impacts/llm.py"
    ecrire("coefficients.json", meta(source, E["url_llm"], E["licence"]), data)


def modeles():
    catalogue = json.loads((DONNEES_ECOLOGITS / "models.json").read_text(encoding="utf-8"))["models"]
    index = {(m["provider"], m["name"]): m for m in catalogue}
    data = []
    for fournisseur, nom, libelle in SOURCES["modeles"]:
        m = index.get((fournisseur, nom))
        if m is None:
            raise ValueError(f"Modèle absent d'EcoLogits : {fournisseur}/{nom}")
        p = m["architecture"]["parameters"]
        if isinstance(p, dict) and "total" in p:  # mixture of experts
            actifs, totaux = _triplet_parametres(p["active"]), _triplet_parametres(p["total"])
        else:
            actifs = totaux = _triplet_parametres(p)
        deploiement = m.get("deployment") or {}
        data.append({
            "id": f"{fournisseur}/{nom}",
            "nom": libelle,
            "fournisseurId": fournisseur,
            "ouvert": fournisseur == "huggingface_hub",
            "paramsActifsMd": actifs,
            "paramsTotauxMd": totaux,
            "tps": deploiement.get("tps"),
            "ttft": deploiement.get("ttft"),
        })
    source = f"EcoLogits {E['version']}, data/models.json"
    ecrire("models.json", meta(source, E["url_modeles"], E["licence"]), data)


def fournisseurs():
    pue_haut = SOURCES["uptime"]["pue_moyen_mondial"]
    data = []
    for fid, nom in SOURCES["fournisseurs"].items():
        cfg = PROVIDER_CONFIG_MAP[fid]
        pue = _triplet_plage(cfg.datacenter_pue)
        pue["haut"] = max(pue["haut"], pue_haut)
        data.append({"id": fid, "nom": nom, "pue": pue, "wue": _triplet_plage(cfg.datacenter_wue)})
    source = f"EcoLogits {E['version']} (PUE et WUE déclarés) ; PUE haut : {SOURCES['uptime']['source']}"
    ecrire("providers.json", meta(source, E["url_fournisseurs"], E["licence"]), data)


def eau_des_mix() -> dict:
    """Litres d'eau consommés par kWh produit, par code ISO 3."""
    fichier = DONNEES_ECOLOGITS / "electricity_mixes.json"
    mixes = json.loads(fichier.read_text(encoding="utf-8"))["electricity_mixes"]
    eau = {m["name"]: m.get("wue") for m in mixes}
    if not any(v is not None for v in eau.values()):
        raise ValueError("Le fichier de mix électrique d'EcoLogits n'a pas de facteur eau (wue)")
    return eau
