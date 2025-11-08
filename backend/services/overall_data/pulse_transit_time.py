import numpy as np
from scipy.signal import butter, filtfilt, find_peaks
from typing import Dict, List, Any

from services.pkl_loader import load_pkl, DEFAULT_FS

ECG_FS = 700
BVP_FS = 64

BVP_BAND = [0.83, 3.0]
ECG_BAND = [5.0, 15.0]


def _butter_bandpass_filter(data, lowcut, highcut, fs, order=2):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype="band")
    y = filtfilt(b, a, data)
    return y


def _find_all_peaks(signal: np.ndarray, fs: int, band: List[float], min_dist_sec: float) -> np.ndarray:
    """Filter a signal and find peaks. Returns sample indices of peaks."""
    try:
        filtered = _butter_bandpass_filter(signal, band[0], band[1], fs)
    except ValueError:
        return np.array([], dtype=int)

    distance = max(1, int(fs * min_dist_sec))
    peaks, _ = find_peaks(filtered, height=0, distance=distance)
    return np.array(peaks, dtype=int)


def _compute_ptt_from_signals(
    raw_ecg: List[float],
    raw_bvp: List[float],
    ecg_fs: int,
    bvp_fs: int,
    winsec: int,
    step_sec: int,
) -> Dict[float, float]:
    """Core PTT computation: returns dict {timestamp_sec: mean_ptt_ms_in_window}."""

    ecg_sig = np.array(raw_ecg).flatten()
    bvp_sig = np.array(raw_bvp).flatten()

    ecg_peaks_idx = _find_all_peaks(ecg_sig, ecg_fs, ECG_BAND, min_dist_sec=0.35)
    bvp_peaks_idx = _find_all_peaks(bvp_sig, bvp_fs, BVP_BAND, min_dist_sec=0.35)

    if ecg_peaks_idx.size == 0 or bvp_peaks_idx.size == 0:
        return {0.0: 0.0}

    ecg_times = ecg_peaks_idx / float(ecg_fs)
    bvp_times = bvp_peaks_idx / float(bvp_fs)

    ptt_values = []
    ptt_timestamps = []

    bvp_idx = 0
    for t_ecg in ecg_times:
        while bvp_idx < len(bvp_times) and bvp_times[bvp_idx] <= t_ecg:
            bvp_idx += 1
        if bvp_idx >= len(bvp_times):
            break
        t_bvp = bvp_times[bvp_idx]
        ptt_ms = (t_bvp - t_ecg) * 1000.0
        if 20.0 < ptt_ms < 800.0:
            ptt_values.append(ptt_ms)
            ptt_timestamps.append(t_ecg)

    if not ptt_values:
        return {0.0: 0.0}

    results: Dict[float, float] = {}
    total_duration = int(max(ptt_timestamps))

    step_sec_safe = max(1, step_sec)
    for t_sec in range(step_sec_safe, total_duration + 1, step_sec_safe):
        end_time = float(t_sec)
        start_time = max(0.0, end_time - winsec)
        window_vals = [
            ptt_values[i]
            for i, ts in enumerate(ptt_timestamps)
            if start_time <= ts < end_time
        ]
        if window_vals:
            results[end_time] = float(np.mean(window_vals))
        else:
            results[end_time] = float(list(results.values())[-1]) if results else 0.0

    return results


def get_pulse_transit_time(subject: str, winsec: int = 5, step_sec: int = 5) -> Dict[str, Any]:
    """
    Load .pkl for subject, extract ECG (chest) and BVP (wrist), compute PTT windows.
    Returns a JSON-serializable dict:
      {
        "x_label": "Time (s)",
        "y_label": "PTT (ms)",
        "x_values": [...],
        "y_values": [...]
      }

    Raises:
      FileNotFoundError if pkl not found (propagated from load_pkl)
      KeyError if ECG or BVP not found in expected locations
    """
    path = f"data/WESAD/{subject}/{subject}.pkl"
    obj = load_pkl(path) 

    chest = obj["signal"]["chest"]
    ecg_key = None
    for k in chest.keys():
        if k.upper() == "ECG":
            ecg_key = k
            break
    if ecg_key is None:
        raise KeyError("ECG key not found")

    ecg_payload = chest[ecg_key]
    if isinstance(ecg_payload, dict) and "signal" in ecg_payload:
        raw_ecg = ecg_payload["signal"]
        ecg_fs = ecg_payload.get("sampling_rate") or DEFAULT_FS.get("ECG", ECG_FS)
    else:
        raw_ecg = ecg_payload
        ecg_fs = DEFAULT_FS.get("ECG", ECG_FS)

    wrist = obj["signal"]["wrist"]
    bvp_key = None
    for k in wrist.keys():
        if k.upper() == "BVP":
            bvp_key = k
            break
    if bvp_key is None:
        raise KeyError("BVP key not found")

    bvp_payload = wrist[bvp_key]
    if isinstance(bvp_payload, dict) and "signal" in bvp_payload:
        raw_bvp = bvp_payload["signal"]
        bvp_fs = bvp_payload.get("sampling_rate") or DEFAULT_FS.get("BVP", BVP_FS)
    else:
        raw_bvp = bvp_payload
        bvp_fs = DEFAULT_FS.get("BVP", BVP_FS)

    ptt_dict = _compute_ptt_from_signals(
        raw_ecg, raw_bvp, ecg_fs=int(ecg_fs), bvp_fs=int(bvp_fs), winsec=winsec, step_sec=step_sec
    )

    x_values = list(ptt_dict.keys())
    y_values = list(ptt_dict.values())

    return {
        "x_label": "Time (s)",
        "y_label": "PTT (ms)",
        "x_values": x_values,
        "y_values": y_values,
    }
