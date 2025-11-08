import re
from pathlib import Path
from services.subject_info import load_subject_info


def parse_questionnaire(subject: str) -> dict:
    path = Path(f"data/WESAD/{subject}/{subject}_quest.csv")
    
    if not path.exists():
        return {}
    
    result = {
        "PANAS": [],
        "STAI": [],
        "DIM": [],
        "SSSQ": [],
        "time_intervals": {}
    }
    
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for line in lines:
        line = line.strip()
        
        if line.startswith("# START"):
            times = line.split(";")[1:]
            result["time_intervals"]["start"] = [float(t) if t else None for t in times if t]
        elif line.startswith("# END"):
            times = line.split(";")[1:]
            result["time_intervals"]["end"] = [float(t) if t else None for t in times if t]
        elif line.startswith("# ORDER"):
            phases = line.split(";")[1:]
            result["time_intervals"]["phases"] = [p.strip() for p in phases if p.strip()]
        
        elif line.startswith("# PANAS"):
            values = line.split(";")[1:]
            scores = [int(v) for v in values if v and v.isdigit()]
            result["PANAS"].append(scores)
        
        elif line.startswith("# STAI"):
            values = line.split(";")[1:]
            scores = [int(v) for v in values if v and v.isdigit()]
            result["STAI"].append(scores)
        
        elif line.startswith("# DIM"):
            values = line.split(";")[1:]
            scores = [int(v) for v in values if v and v.isdigit()]
            result["DIM"].append(scores)
        
        elif line.startswith("# SSSQ"):
            values = line.split(";")[1:]
            scores = [int(v) for v in values if v and v.isdigit()]
            result["SSSQ"].append(scores)
    
    return result


def parse_readme(subject: str) -> dict:
    try:
        subject_info = load_subject_info(subject)
        
        result = {
            "personal": {},
            "prerequisites": {},
            "notes": ""
        }
        
        if subject_info.get("age"):
            result["personal"]["age"] = subject_info["age"]
        if subject_info.get("height"):
            result["personal"]["height_cm"] = subject_info["height"]
        if subject_info.get("weight"):
            result["personal"]["weight_kg"] = subject_info["weight"]
        if subject_info.get("gender"):
            result["personal"]["gender"] = subject_info["gender"]
        if subject_info.get("dominant_hand"):
            result["personal"]["dominant_hand"] = subject_info["dominant_hand"]
        
        if subject_info.get("coffee_today") is not None:
            result["prerequisites"]["coffee_today"] = subject_info["coffee_today"]
        if subject_info.get("coffee_last_hour") is not None:
            result["prerequisites"]["coffee_last_hour"] = subject_info["coffee_last_hour"]
        if subject_info.get("sports_today") is not None:
            result["prerequisites"]["sports_today"] = subject_info["sports_today"]
        if subject_info.get("smoker") is not None:
            result["prerequisites"]["is_smoker"] = subject_info["smoker"]
        if subject_info.get("smoke_last_hour") is not None:
            result["prerequisites"]["smoked_last_hour"] = subject_info["smoke_last_hour"]
        if subject_info.get("ill") is not None:
            result["prerequisites"]["feels_ill"] = subject_info["ill"]
        
        if subject_info.get("additional_notes"):
            result["notes"] = subject_info["additional_notes"]
        
        if "height_cm" in result["personal"] and "weight_kg" in result["personal"]:
            height_m = result["personal"]["height_cm"] / 100
            bmi = result["personal"]["weight_kg"] / (height_m ** 2)
            result["personal"]["bmi"] = round(bmi, 2)
        
        return result
        
    except FileNotFoundError:
        return {
            "personal": {},
            "prerequisites": {},
            "notes": ""
        }


def calculate_questionnaire_scores(quest_data: dict) -> dict:
    scores = {}
    
    if quest_data.get("PANAS"):
        panas_all = quest_data["PANAS"]
        if panas_all:
            avg_panas = [sum(row) / len(row) for row in panas_all if row]
            scores["panas_mean"] = sum(avg_panas) / len(avg_panas) if avg_panas else 0
            scores["panas_std"] = float(
                (sum((x - scores["panas_mean"]) ** 2 for x in avg_panas) / len(avg_panas)) ** 0.5
            ) if len(avg_panas) > 1 else 0
    
    if quest_data.get("STAI"):
        stai_all = quest_data["STAI"]
        if stai_all:
            avg_stai = [sum(row) / len(row) for row in stai_all if row]
            scores["stai_mean"] = sum(avg_stai) / len(avg_stai) if avg_stai else 0
            scores["stai_max"] = max(avg_stai) if avg_stai else 0
    
    if quest_data.get("DIM"):
        dim_all = quest_data["DIM"]
        if dim_all and len(dim_all[0]) >= 2:
            valence = [row[0] for row in dim_all if len(row) >= 1]
            arousal = [row[1] for row in dim_all if len(row) >= 2]
            scores["dim_valence_mean"] = sum(valence) / len(valence) if valence else 0
            scores["dim_arousal_mean"] = sum(arousal) / len(arousal) if arousal else 0
    
    if quest_data.get("SSSQ"):
        sssq_all = quest_data["SSSQ"]
        if sssq_all:
            avg_sssq = [sum(row) / len(row) for row in sssq_all if row]
            scores["sssq_mean"] = sum(avg_sssq) / len(avg_sssq) if avg_sssq else 0
    
    return scores
