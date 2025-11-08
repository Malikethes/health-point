import numpy as np
from services.pkl_loader import load_pkl, extract_series

def compute_movement(y_values, fs: float, window_sec: float = 5.0):
    """
    Compute average movement intensity from precomputed ACC magnitude.
    """
    sig = np.asarray(y_values, dtype=float).flatten()

    win = int(window_sec * fs)
    times, vals = [], []

    for i in range(0, len(sig) - win + 1, win):
        window = sig[i : i + win]
        times.append((i + win) / fs)
        vals.append(float(np.nanmean(window)))

    return {
        "x_label": "Time (s)",
        "y_label": "Movement intensity (g)",
        "x_values": times,
        "y_values": vals,
    }

def get_movement(subject: str, sensor: str = "wrist", modality: str = "ACC"):
    """
    Load accelerometer data (already magnitude via extract_series)
    and compute movement intensity per 5s window.
    """
    path = f"data/WESAD/{subject}/{subject}.pkl"
    obj = load_pkl(path)

    series = extract_series(obj, sensor=sensor, modality=modality, stride=1, limit=None)

    payload_block = obj["signal"][sensor]
    payload = payload_block.get(modality)
    if isinstance(payload, dict):
        fs = float(payload.get("sampling_rate", 32.0))
    else:
        fs = 32.0

    return compute_movement(series["y_values"], fs)