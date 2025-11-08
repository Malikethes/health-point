import numpy as np
from typing import Dict, Any, Optional
from services.overall_data.heart_rate import get_heart_rate
from services.overall_data.breathing_rate import get_breathing_rate
from services.overall_data.stress_level import get_stress_level
from services.overall_data.temperature import get_temperature
from services.overall_data.pulse_transit_time import get_pulse_transit_time
from services.overall_data.skin_conductance import get_skin_conductance
from services.questionnaire_parser import (
    parse_questionnaire,
    parse_readme,
    calculate_questionnaire_scores
)

def get_comprehensive_health_analysis(subject: str) -> Dict[str, Any]:
    """
    Returns:
        Dict with full analysis:
        - physiological_metrics: all physiological indicators
        - questionnaire_data: questionnaire data
        - personal_data: personal information
        - health_scores: calculated health scores
        - overall_state: overall state (0-100)
        - ai_ready_summary: data ready for AI analysis
    """
    
    physiological_metrics = {}
    
    try:
        hr_data = get_heart_rate(subject, sensor="chest", modality="ECG")
        physiological_metrics["heart_rate"] = {
            "mean": float(np.mean(hr_data["y_values"])) if hr_data["y_values"] else 0,
            "std": float(np.std(hr_data["y_values"])) if hr_data["y_values"] else 0,
            "min": float(np.min(hr_data["y_values"])) if hr_data["y_values"] else 0,
            "max": float(np.max(hr_data["y_values"])) if hr_data["y_values"] else 0
        }
    except Exception as e:
        physiological_metrics["heart_rate"] = {"error": str(e)}
    
    try:
        br_data = get_breathing_rate(subject, winsec=5, step_sec=5)
        physiological_metrics["breathing_rate"] = {
            "mean": float(np.mean(br_data["y_values"])) if br_data["y_values"] else 0,
            "std": float(np.std(br_data["y_values"])) if br_data["y_values"] else 0
        }
    except Exception as e:
        physiological_metrics["breathing_rate"] = {"error": str(e)}
    
    try:
        stress_data = get_stress_level(subject, sensor="wrist")
        physiological_metrics["stress_level"] = {
            "mean": float(np.mean(stress_data["y_values"])) if stress_data["y_values"] else 0,
            "std": float(np.std(stress_data["y_values"])) if stress_data["y_values"] else 0,
            "max": float(np.max(stress_data["y_values"])) if stress_data["y_values"] else 0
        }
    except Exception as e:
        physiological_metrics["stress_level"] = {"error": str(e)}
    
    try:
        temp_data = get_temperature(subject, sensor="wrist", modality="TEMP")
        physiological_metrics["temperature"] = {
            "mean": float(np.mean(temp_data["y_values"])) if temp_data["y_values"] else 0,
            "std": float(np.std(temp_data["y_values"])) if temp_data["y_values"] else 0
        }
    except Exception as e:
        physiological_metrics["temperature"] = {"error": str(e)}
    
    try:
        ptt_data = get_pulse_transit_time(subject, winsec=5, step_sec=5)
        physiological_metrics["pulse_transit_time"] = {
            "mean": float(np.mean(ptt_data["y_values"])) if ptt_data["y_values"] else 0,
            "std": float(np.std(ptt_data["y_values"])) if ptt_data["y_values"] else 0
        }
    except Exception as e:
        physiological_metrics["pulse_transit_time"] = {"error": str(e)}
    
    try:
        sc_data = get_skin_conductance(subject, sensor="wrist", modality="EDA")
        physiological_metrics["skin_conductance"] = {
            "mean": float(np.mean(sc_data["y_values"])) if sc_data["y_values"] else 0,
            "std": float(np.std(sc_data["y_values"])) if sc_data["y_values"] else 0
        }
    except Exception as e:
        physiological_metrics["skin_conductance"] = {"error": str(e)}
    
    questionnaire_data = parse_questionnaire(subject)
    questionnaire_scores = calculate_questionnaire_scores(questionnaire_data)
    personal_data = parse_readme(subject)
    
    health_scores = calculate_health_scores(
        physiological_metrics,
        questionnaire_scores,
        personal_data
    )
    
    overall_state = calculate_overall_state(health_scores)
    
    ai_ready_summary = prepare_ai_summary(
        physiological_metrics,
        questionnaire_scores,
        personal_data,
        health_scores,
        overall_state
    )
    
    return ai_ready_summary


def calculate_health_scores(
    phys_metrics: Dict,
    quest_scores: Dict,
    personal: Dict
) -> Dict[str, float]:
    scores = {}
    
    cv_components = []
    
    if "heart_rate" in phys_metrics and "mean" in phys_metrics["heart_rate"]:
        hr_mean = phys_metrics["heart_rate"]["mean"]
        # 60-100 bpm
        hr_score = 100 - abs(hr_mean - 80) * 2
        hr_score = max(0, min(100, hr_score))
        cv_components.append(hr_score)
    
    if "pulse_transit_time" in phys_metrics and "mean" in phys_metrics["pulse_transit_time"]:
        ptt_mean = phys_metrics["pulse_transit_time"]["mean"]
        # 200-400 ms typical higher is better
        ptt_score = min(100, (ptt_mean / 4))
        cv_components.append(ptt_score)
    
    scores["cardiovascular_health"] = (
        sum(cv_components) / len(cv_components) if cv_components else 50
    )
    
    # Stress Index 0-100
    stress_components = []
    
    if "stress_level" in phys_metrics and "mean" in phys_metrics["stress_level"]:
        stress_components.append(phys_metrics["stress_level"]["mean"])
    
    if "skin_conductance" in phys_metrics and "mean" in phys_metrics["skin_conductance"]:
        sc_mean = phys_metrics["skin_conductance"]["mean"]
        sc_stress = min(100, sc_mean * 20)
        stress_components.append(sc_stress)
    
    if quest_scores.get("stai_mean"):
        stai_stress = (quest_scores["stai_mean"] - 1) * 33.3
        stress_components.append(stai_stress)
    
    if quest_scores.get("sssq_mean"):
        sssq_stress = (quest_scores["sssq_mean"] - 1) * 25
        stress_components.append(sssq_stress)
    
    scores["stress_index"] = (
        sum(stress_components) / len(stress_components) if stress_components else 50
    )
    
    if "breathing_rate" in phys_metrics and "mean" in phys_metrics["breathing_rate"]:
        br_mean = phys_metrics["breathing_rate"]["mean"]
        # Normal breathe 12-20 bpm
        br_score = 100 - abs(br_mean - 16) * 5
        scores["respiratory_health"] = max(0, min(100, br_score))
    else:
        scores["respiratory_health"] = 50
    
    # Emotional Well-being (0-100)
    emotional_components = []
    
    if quest_scores.get("dim_valence_mean"):
        # DIM valence
        valence_score = (quest_scores["dim_valence_mean"] - 1) * 12.5
        emotional_components.append(valence_score)
    
    if quest_scores.get("panas_mean"):
        # PANAS: 
        panas_score = (quest_scores["panas_mean"] - 1) * 25
        emotional_components.append(panas_score)
    
    # STAI
    if quest_scores.get("stai_mean"):
        anxiety_inverted = 100 - ((quest_scores["stai_mean"] - 1) * 33.3)
        emotional_components.append(anxiety_inverted)
    
    scores["emotional_wellbeing"] = (
        sum(emotional_components) / len(emotional_components) if emotional_components else 50
    )
    
    physical_components = []
    
    if personal.get("personal", {}).get("bmi"):
        bmi = personal["personal"]["bmi"]
        # optimal BMI 18.5-24.9
        if 18.5 <= bmi <= 24.9:
            bmi_score = 100
        elif 25 <= bmi <= 29.9:
            bmi_score = 75
        elif bmi < 18.5:
            bmi_score = 70 - (18.5 - bmi) * 10
        else:
            bmi_score = 50 - (bmi - 30) * 5
        physical_components.append(max(0, min(100, bmi_score)))
    
    prereq = personal.get("prerequisites", {})
    if prereq.get("sports_today"):
        physical_components.append(80)
    if not prereq.get("feels_ill"):
        physical_components.append(90)
    if not prereq.get("is_smoker"):
        physical_components.append(85)
    
    scores["physical_condition"] = (
        sum(physical_components) / len(physical_components) if physical_components else 50
    )
    
    if quest_scores.get("dim_arousal_mean"):
        scores["arousal_level"] = (quest_scores["dim_arousal_mean"] - 1) * 12.5
    else:
        scores["arousal_level"] = 50
    
    return scores


def calculate_overall_state(health_scores: Dict[str, float]) -> Dict[str, Any]:
    weights = {
        "cardiovascular_health": 0.25,
        "stress_index": 0.25,  
        "respiratory_health": 0.15,
        "emotional_wellbeing": 0.20,
        "physical_condition": 0.15
    }
    
    weighted_sum = 0
    total_weight = 0
    
    for key, weight in weights.items():
        if key in health_scores:
            value = health_scores[key]
            if key == "stress_index":
                value = 100 - value
            weighted_sum += value * weight
            total_weight += weight
    
    overall_score = weighted_sum / total_weight if total_weight > 0 else 50
    
    if overall_score >= 80:
        state_class = "excellent"
        state_description = "Excellent condition"
    elif overall_score >= 65:
        state_class = "good"
        state_description = "Good condition"
    elif overall_score >= 50:
        state_class = "fair"
        state_description = "Fair condition"
    elif overall_score >= 35:
        state_class = "poor"
        state_description = "Poor condition"
    else:
        state_class = "critical"
        state_description = "Critical condition"
    
    return {
        "overall_score": round(overall_score, 2),
        "state_class": state_class,
        "state_description": state_description,
        "components": health_scores
    }


def prepare_ai_summary(
    phys_metrics: Dict,
    quest_scores: Dict,
    personal: Dict,
    health_scores: Dict,
    overall_state: Dict
) -> Dict[str, Any]:
    summary = {
        "vital_signs": {},
        "psychological_state": {},
        "demographics": {},
        "risk_factors": [],
        "key_observations": []
    }
    
    if "heart_rate" in phys_metrics and "mean" in phys_metrics["heart_rate"]:
        summary["vital_signs"]["heart_rate_bpm"] = round(phys_metrics["heart_rate"]["mean"], 1)
        summary["vital_signs"]["heart_rate_variability"] = round(phys_metrics["heart_rate"]["std"], 1)
    
    if "breathing_rate" in phys_metrics and "mean" in phys_metrics["breathing_rate"]:
        summary["vital_signs"]["breathing_rate_bpm"] = round(phys_metrics["breathing_rate"]["mean"], 1)
    
    if "temperature" in phys_metrics and "mean" in phys_metrics["temperature"]:
        summary["vital_signs"]["skin_temperature_c"] = round(phys_metrics["temperature"]["mean"], 2)
    
    if "stress_level" in phys_metrics and "mean" in phys_metrics["stress_level"]:
        summary["vital_signs"]["stress_level_0_100"] = round(phys_metrics["stress_level"]["mean"], 1)
    
    if quest_scores.get("stai_mean"):
        summary["psychological_state"]["anxiety_level"] = round(quest_scores["stai_mean"], 2)
    
    if quest_scores.get("dim_valence_mean"):
        summary["psychological_state"]["emotional_valence"] = round(quest_scores["dim_valence_mean"], 2)
    
    if quest_scores.get("dim_arousal_mean"):
        summary["psychological_state"]["arousal_level"] = round(quest_scores["dim_arousal_mean"], 2)
    
    pers = personal.get("personal", {})
    if pers:
        summary["demographics"] = {
            "age": pers.get("age"),
            "gender": pers.get("gender"),
            "bmi": pers.get("bmi"),
            "height_cm": pers.get("height_cm"),
            "weight_kg": pers.get("weight_kg")
        }
    
    prereq = personal.get("prerequisites", {})
    if prereq.get("is_smoker"):
        summary["risk_factors"].append("smoker")
    if prereq.get("feels_ill"):
        summary["risk_factors"].append("feeling_ill")
    if prereq.get("coffee_last_hour"):
        summary["risk_factors"].append("recent_caffeine")
    
    if pers.get("bmi"):
        if pers["bmi"] > 30:
            summary["risk_factors"].append("obesity")
        elif pers["bmi"] < 18.5:
            summary["risk_factors"].append("underweight")
    
    if health_scores.get("stress_index", 0) > 70:
        summary["key_observations"].append("High stress levels detected")
    
    if health_scores.get("cardiovascular_health", 100) < 60:
        summary["key_observations"].append("Cardiovascular metrics show concern")
    
    if health_scores.get("emotional_wellbeing", 100) < 50:
        summary["key_observations"].append("Low emotional well-being")
    
    if summary["vital_signs"].get("heart_rate_bpm", 75) > 100:
        summary["key_observations"].append("Elevated heart rate")
    
    return summary
