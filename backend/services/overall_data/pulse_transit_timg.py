import numpy as np
from scipy.signal import butter, filtfilt, find_peaks
from typing import Dict, List, Any

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


def _find_all_peaks(
    signal: np.ndarray, fs: int, band: List[float], min_dist_sec: float
) -> np.ndarray:
    """Helper to filter a signal and find all its peaks."""
    try:
        filtered_sig = _butter_bandpass_filter(signal, band[0], band[1], fs)
    except ValueError:
        return np.array([])

    distance = fs * min_dist_sec
    peaks, _ = find_peaks(filtered_sig, height=0, distance=distance)
    return peaks


def process_pulse_transit_time(
    raw_ecg: List[float],
    raw_bvp: List[float],
    ecg_fs: int = ECG_FS,
    bvp_fs: int = BVP_FS,
    winsec: int = 5,
    step_sec: int = 5,
) -> Dict[float, float]:
    """
    Calculates the Pulse Transit Time (PTT) over time.

    :return: A dictionary of {timestamp_in_sec: ptt_in_milliseconds}.
    """

    ecg_sig = np.array(raw_ecg).flatten()
    bvp_sig = np.array(raw_bvp).flatten()

    ecg_peaks_idx = _find_all_peaks(ecg_sig, ecg_fs, ECG_BAND, min_dist_sec=0.35)
    bvp_peaks_idx = _find_all_peaks(bvp_sig, bvp_fs, BVP_BAND, min_dist_sec=0.35)

    if ecg_peaks_idx.size == 0 or bvp_peaks_idx.size == 0:
        return {0.0: 0.0}

    ecg_peak_times = ecg_peaks_idx / ecg_fs
    bvp_peak_times = bvp_peaks_idx / bvp_fs

    ptt_values = []
    ptt_timestamps = []

    bvp_idx = 0
    for t_ecg in ecg_peak_times:
        while bvp_idx < len(bvp_peak_times) and bvp_peak_times[bvp_idx] <= t_ecg:
            bvp_idx += 1

        if bvp_idx >= len(bvp_peak_times):
            break

        t_bvp = bvp_peak_times[bvp_idx]

        ptt_ms = (t_bvp - t_ecg) * 1000.0

        if 50 < ptt_ms < 500:
            ptt_values.append(ptt_ms)
            ptt_timestamps.append(t_ecg)

    if not ptt_values:
        return {0.0: 0.0}

    ptt_results = {}
    total_duration_sec = int(max(ptt_timestamps))

    step_sec_safe = max(1, step_sec)
    for t_sec in range(step_sec_safe, total_duration_sec + 1, step_sec_safe):

        end_time = float(t_sec)
        start_time = max(0.0, end_time - winsec)

        window_values = []
        for i, timestamp in enumerate(ptt_timestamps):
            if start_time <= timestamp < end_time:
                window_values.append(ptt_values[i])

        if window_values:
            ptt_results[end_time] = np.mean(window_values)
        else:
            if ptt_results:
                ptt_results[end_time] = list(ptt_results.values())[-1]
            else:
                ptt_results[end_time] = 0.0

    return ptt_results
