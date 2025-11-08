import numpy as np
from services.pkl_loader import load_pkl, extract_series

def compute_temperature(y_values, fs: float):
    window_sec = 5.0
    sig = np.asarray(y_values, dtype=float).flatten()
    win = max(1, int(round(window_sec * fs)))

    times, vals = [], []
    for i in range(0, len(sig) - win + 1, win):
        window = sig[i : i + win]
        times.append(i / fs)
        vals.append(float(np.nanmean(window)))
    return {"x_label" : "Time (s)", "y_label" : "Temperature (°C)", "x_values": times, "y_values": vals}

def get_temperature(subject: str, sensor: str = "wrist", modality: str = "TEMP"):
    path = f"data/WESAD/{subject}/{subject}.pkl"
    obj = load_pkl(path)

    series = extract_series(obj, sensor=sensor, modality=modality, stride=1, limit=None)

    payload_block = obj["signal"][sensor]
    key = modality if modality in payload_block else next((k for k in payload_block if k.upper() == modality.upper()), modality)
    payload = payload_block.get(key)
    if isinstance(payload, dict):
        fs = float(payload.get("sampling_rate", 4.0))
    else:
        fs = 4.0
    return compute_temperature(series["y_values"], fs=fs)