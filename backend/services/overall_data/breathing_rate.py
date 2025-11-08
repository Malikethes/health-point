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

    Strategy:
     - Filter the full signal
     - Detect peaks once for the entire signal
     - For each timestep (every step_sec seconds), compute rate from:
         1) the mean inter-peak interval inside the window (preferred)
         2) if only one peak inside window: estimate using nearest peak before+after
         3) fallback: count-based estimate (num_peaks/window_duration * 60)
    This gives fractional BPM values instead of only integer multiples produced by simple counting.
    """
    sig = np.array(raw_signal)
    sig = sig.flatten()

    try:
        filtered_sig = _butter_bandpass_filter(
            sig, BREATHING_BAND[0], BREATHING_BAND[1], fs
        )
    except ValueError:
        return {0.0: 0.0}

    win_samples = int(winsec * fs)
    step_samples = int(step_sec * fs)
    total_samples = len(filtered_sig)

    rates: Dict[float, float] = {}

    if total_samples < step_samples or total_samples == 0:
        return {0.0: 0.0}

    min_distance = max(1, int(fs * 0.5))
    peaks, _ = find_peaks(filtered_sig, distance=min_distance)

    peaks = np.array(peaks, dtype=int)

    def rate_from_intervals(intervals_sec: np.ndarray) -> float:
        if len(intervals_sec) == 0:
            return 0.0
        mean_interval = float(np.mean(intervals_sec))
        if mean_interval <= 0:
            return 0.0
        return 60.0 / mean_interval

    step_sec_safe = max(1, step_sec)
    last_t = int(total_samples / fs)
    for t_sec in range(step_sec_safe, last_t + 1, step_sec_safe):
        end_sample = int(t_sec * fs)
        start_sample = max(0, end_sample - win_samples)
        window_duration_sec = (end_sample - start_sample) / fs if fs > 0 else 0

        if window_duration_sec <= 0:
            continue

        peaks_in_window = peaks[(peaks >= start_sample) & (peaks <= end_sample)]

        rate_bpm = 0.0

        if len(peaks_in_window) >= 2:
            diffs = np.diff(peaks_in_window).astype(float) / fs
            rate_bpm = rate_from_intervals(diffs)
        elif len(peaks_in_window) == 1:
            single_peak = peaks_in_window[0]
            idx = np.searchsorted(peaks, single_peak)

            before_idx = idx - 1
            after_idx = (
                idx + 0
            )

            if before_idx >= 0 and (idx + 1) < len(peaks):
                interval_sec = (peaks[idx + 1] - peaks[before_idx]) / fs
                if interval_sec > 0:
                    rate_bpm = 60.0 / interval_sec
                else:
                    rate_bpm = 0.0
            else:
                if before_idx >= 0:
                    interval_sec = (single_peak - peaks[before_idx]) / fs
                    if interval_sec > 0:
                        rate_bpm = 60.0 / interval_sec
                elif (idx + 1) < len(peaks):
                    interval_sec = (peaks[idx + 1] - single_peak) / fs
                    if interval_sec > 0:
                        rate_bpm = 60.0 / interval_sec
                else:
                    rate_bpm = 0.0

        if rate_bpm == 0.0:
            num_peaks = len(peaks_in_window)
            rate_bpm = (num_peaks / window_duration_sec) * 60.0

        rates[float(t_sec)] = float(rate_bpm)

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
    obj = load_pkl(path)

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

    rates_dict = process_respiration_signal(
        raw_signal, fs=fs, winsec=winsec, step_sec=step_sec
    )

    x_values = list(rates_dict.keys())
    y_values = list(rates_dict.values())

    return {
        "x_label": "Time (s)",
        "y_label": "Breathrate (BPM)",
        "x_values": x_values,
        "y_values": y_values,
    }
