import numpy as np
from scipy.signal import butter, filtfilt, find_peaks
from typing import Dict, List

from services.pkl_loader import load_pkl, DEFAULT_FS

BREATHING_BAND = [0.1, 0.5]
RESP_FS = 700


def _butter_bandpass_filter(data, lowcut, highcut, fs, order=2):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype="band")
    y = filtfilt(b, a, data)
    return y


def process_respiration_signal(
    raw_signal: List[float], fs: int = RESP_FS, winsec: int = 15, step_sec: int = 5
) -> Dict[float, float]:
    """
    Calculates the breathing rate over time from a raw respiration signal.

    :param raw_signal: The raw signal array from the .pkl file.
    :param fs: The sampling frequency of the signal (default: 700 Hz).
    :param winsec: The duration of the analysis window (in seconds).
    :param step_sec: The time to step forward for each new calculation (in seconds).
    :return: A dictionary of {timestamp_in_sec: breathing_rate_in_bpm}.
    """

    sig = np.array(raw_signal)
    sig = sig.flatten()

    try:
        filtered_sig = _butter_bandpass_filter(
            sig, BREATHING_BAND[0], BREATHING_BAND[1], fs
        )
    except ValueError as e:
        return {0.0: 0.0}

    win_samples = winsec * fs
    step_samples = step_sec * fs
    total_samples = len(filtered_sig)

    rates = {}

    if total_samples < step_samples:
        return {0.0: 0.0}

    # safety: ensure integer stepping in seconds
    step_sec_safe = max(1, step_sec)
    for t_sec in range(step_sec_safe, int(total_samples / fs) + 1, step_sec_safe):

        end_sample = t_sec * fs
        start_sample = max(0, end_sample - win_samples)

        window = filtered_sig[start_sample:end_sample]

        if window.size == 0:
            continue
        peaks, _ = find_peaks(
            window, height=0, distance=fs * 1.0
        )

        num_peaks = len(peaks)
        window_duration_sec = (end_sample - start_sample) / fs

        if window_duration_sec == 0:
            rate_bpm = 0.0
        else:
            rate_bpm = (num_peaks / window_duration_sec) * 60

        rates[float(t_sec)] = rate_bpm

    return rates


def get_breathing_rate(subject: str, winsec: int = 5, step_sec: int = 5) -> Dict:
    """
    Load the subject pkl, extract chest RESP signal, compute breathing rates using
    process_respiration_signal and return a JSON-serializable dict:
    {
      "x_label": "Time (s)",
      "y_label": "Breathrate (BPM)",
      "x_values": [...],
      "y_values": [...]
    }

    Raises FileNotFoundError if subject file not found.
    Raises KeyError if RESP signal not present.
    """
    path = f"data/WESAD/{subject}/{subject}.pkl"
    obj = load_pkl(path)  # may raise FileNotFoundError upstream

    chest_data = obj["signal"]["chest"]

    resp_key = None
    for key in chest_data.keys():
        if key.upper() == "RESP":
            resp_key = key
            break

    if resp_key is None:
        raise KeyError("RESP key not found in chest data")

    payload = chest_data[resp_key]

    if isinstance(payload, dict) and "signal" in payload:
        raw_signal = payload["signal"]
        fs = payload.get("sampling_rate") or DEFAULT_FS.get("RESP", RESP_FS)
    else:
        raw_signal = payload
        fs = DEFAULT_FS.get("RESP", RESP_FS)

    rates_dict = process_respiration_signal(raw_signal, fs=fs, winsec=winsec, step_sec=step_sec)

    x_values = list(rates_dict.keys())
    y_values = list(rates_dict.values())

    return {
        "x_label": "Time (s)",
        "y_label": "Breathrate (BPM)",
        "x_values": x_values,
        "y_values": y_values,
    }
