import numpy as np
from services.pkl_loader import load_pkl, extract_series
window_sec = 5.0
def compute_skin_conductance(y_values, fs: float):
    sig = np.asarray(y_values, dtype=float).flatten()
    win = max(1, int(round(window_sec * fs)))

    times, vals = [], []
    for i in range(0, len(sig) - win + 1, win):
        window = sig[i : i + win]
        times.append(i / fs)
        vals.append(float(np.nanmean(window)))

    return {
        "x_label": "Time (s)",
        "y_label": "Skin Conductance",
        "x_values": times,
        "y_values": vals,
    }

def get_skin_conductance(subject: str, sensor: str = "wrist", modality: str = "EDA"):
    path = f"data/WESAD/{subject}/{subject}.pkl"
    obj = load_pkl(path)

    series = extract_series(obj, sensor=sensor, modality=modality, stride=1, limit=None)

    block = obj["signal"][sensor]
    # dopasowanie case-insensitive
    key = modality if modality in block else next((k for k in block if k.upper() == modality.upper()), modality)
    payload = block.get(key)
    if isinstance(payload, dict):
        fs = float(payload.get("sampling_rate", 4.0))
    else:
        # wrist domyślnie 4 Hz, chest 700 Hz; mamy tylko EDA więc przyjmij 4 jeśli brak meta
        fs = 4.0 if sensor == "wrist" else 700.0

    return compute_skin_conductance(series["y_values"], fs=fs)