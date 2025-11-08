import numpy as np
from scipy.stats import zscore
from services.pkl_loader import load_pkl, extract_series

def compute_stress_level(eda, hr, temp, fs: float = 4.0, window_sec: float = 5.0):
    # Z-score normalization [0 - average]
    eda_z = zscore(eda)
    hr_z = zscore(hr) 
    temp_z = zscore(temp)

    stress_raw = 0.5 * eda_z + 0.3 * hr_z - 0.2 * temp_z

    stress_index = 100 / (1 + np.exp(-stress_raw))
    stress_index = np.clip(stress_index, 0, 100)

    window = int(window_sec * fs)
    x_values, y_values = [], []
    
    for i in range(0, len(stress_index) - window, window):
        window_stress = stress_index[i:i + window]
        avg_stress = float(np.nanmean(window_stress))
        x_values.append((i / fs) + 5)  
        y_values.append(avg_stress)

    return {
        "x_label": "Time (s)",
        "y_label": "Stress Level (0-100)",
        "x_values": x_values,
        "y_values": y_values
    }


def get_stress_level(subject: str, sensor: str = "wrist"):
    path = f"data/WESAD/{subject}/{subject}.pkl"
    obj = load_pkl(path)

    eda_data = extract_series(obj, sensor=sensor, modality="EDA")
    temp_data = extract_series(obj, sensor=sensor, modality="TEMP")
    
    ecg_data = extract_series(obj, sensor="chest", modality="ECG")
    
    eda_series = np.array(eda_data["y_values"])
    temp_series = np.array(temp_data["y_values"])
    ecg_series = np.array(ecg_data["y_values"])

    payload = obj["signal"][sensor]["EDA"]
    if isinstance(payload, dict):
        fs = payload.get("sampling_rate", 4.0)
    else:
        fs = 4.0

    downsample_factor = int(700 / 4)
    ecg_downsampled = ecg_series[::downsample_factor]
    
    min_len = min(len(eda_series), len(ecg_downsampled), len(temp_series))
    eda_series = eda_series[:min_len]
    ecg_series = ecg_downsampled[:min_len]
    temp_series = temp_series[:min_len]

    return compute_stress_level(eda_series, ecg_series, temp_series, fs=fs)
