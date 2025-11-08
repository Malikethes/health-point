import numpy as np
from scipy.signal import find_peaks
from services.pkl_loader import load_pkl, extract_series

def compute_heart_rate(y_values, fs: float, window_sec: float = 5.0):
    """
    Compute heart rate (BPM) from ECG or BVP values using peak detection.
    Ensures the signal is 1D.
    """
    signal = np.asarray(y_values)

    if signal.ndim > 1:
        signal = signal.flatten()

    peaks, _ = find_peaks(signal, distance=fs*0.4, prominence=np.std(signal)*0.5)

    hr_times, hr_values = [], []
    window = int(window_sec * fs)
    for i in range(0, len(signal) - window, window):
        window_peaks = peaks[(peaks >= i) & (peaks < i + window)]
        if len(window_peaks) >= 2:
            duration = (window_peaks[-1] - window_peaks[0]) / fs
            hr = (len(window_peaks) - 1) / duration * 60.0
            hr_times.append(i / fs)
            hr_values.append(hr)

    return {"x_label": "Time (s)", "y_label": "Heartrate (BPM)", "x_values": hr_times, "y_values": hr_values}

def get_heart_rate(subject: str, sensor: str = "chest", modality: str = "ECG"):
    path = f"data/WESAD/{subject}/{subject}.pkl"
    obj = load_pkl(path)

    series = extract_series(obj, sensor=sensor, modality=modality)

    payload = obj["signal"][sensor][modality]
    if isinstance(payload, dict):
        fs = payload.get("sampling_rate", 700)
    else:
        fs = 700 

    return compute_heart_rate(series["y_values"], fs)
