import re
from pathlib import Path


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
    path = Path(f"data/WESAD/{subject}/{subject}_readme.txt")
    
    if not path.exists():
        return {}
    
    result = {
        "personal": {},
        "prerequisites": {},
        "notes": ""
    }
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    age_match = re.search(r'Age:\s*(\d+)', content)
    if age_match:
        result["personal"]["age"] = int(age_match.group(1))
    
    height_match = re.search(r'Height.*?:\s*(\d+)', content)
    if height_match:
        result["personal"]["height_cm"] = int(height_match.group(1))
    
    weight_match = re.search(r'Weight.*?:\s*(\d+)', content)
    if weight_match:
        result["personal"]["weight_kg"] = int(weight_match.group(1))
    
    gender_match = re.search(r'Gender:\s*(\w+)', content)
    if gender_match:
        result["personal"]["gender"] = gender_match.group(1).lower()
    
    hand_match = re.search(r'Dominant hand:\s*(\w+)', content)
    if hand_match:
        result["personal"]["dominant_hand"] = hand_match.group(1).lower()
    
    coffee_today = re.search(r'drink coffee today\?\s*(YES|NO)', content)
    if coffee_today:
        result["prerequisites"]["coffee_today"] = coffee_today.group(1) == "YES"
    
    coffee_hour = re.search(r'coffee within the last hour\?\s*(YES|NO)', content)
    if coffee_hour:
        result["prerequisites"]["coffee_last_hour"] = coffee_hour.group(1) == "YES"
    
    sports = re.search(r'do any sports today\?\s*(YES|NO)', content)
    if sports:
        result["prerequisites"]["sports_today"] = sports.group(1) == "YES"
    
    smoker = re.search(r'Are you a smoker\?\s*(YES|NO)', content)
    if smoker:
        result["prerequisites"]["is_smoker"] = smoker.group(1) == "YES"
    
    smoked = re.search(r'smoke within the last hour\?\s*(YES|NO)', content)
    if smoked:
        result["prerequisites"]["smoked_last_hour"] = smoked.group(1) == "YES"
    
    ill = re.search(r'feel ill today\?\s*(YES|NO)', content)
    if ill:
        result["prerequisites"]["feels_ill"] = ill.group(1) == "YES"
    
    notes_match = re.search(r'### Additional notes ###\s*(.+)', content, re.DOTALL)
    if notes_match:
        result["notes"] = notes_match.group(1).strip()
    
    if "height_cm" in result["personal"] and "weight_kg" in result["personal"]:
        height_m = result["personal"]["height_cm"] / 100
        bmi = result["personal"]["weight_kg"] / (height_m ** 2)
        result["personal"]["bmi"] = round(bmi, 2)
    
    return result


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
