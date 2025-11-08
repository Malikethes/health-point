import math, pickle, os
from typing import Any, Dict, List, Optional
import numpy as np
from functools import lru_cache

LABEL_FS = 700
LABEL_MAP = {
    0: "transient",
    1: "baseline",
    2: "stress",
    3: "amusement",
    4: "meditation",
    5: "ignore",
    6: "ignore",
    7: "ignore",
}
DEFAULT_FS = {
    "EDA": 4,
    "BVP": 64,
    "TEMP": 4,
    "ACC": 32,
    "ECG": 700,
    "RESP": 700,
    "EMG": 700,
}
WRIST_ACC_DIVISOR = 64
@lru_cache(maxsize=16)
def load_pkl(path: str) -> Dict[str, Any]:
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    with open(path, "rb") as f:
        return pickle.load(f, encoding="latin1")

def _units(modality: str) -> str:
    return {
        "EDA": "µS",
        "BVP": "a.u.",
        "TEMP": "°C",
        "ACC": "g",
        "ECG": "mV",
        "RESP": "a.u.",
        "EMG": "a.u.",
        "LABEL": "ID",
    }.get(modality.upper(), "a.u.")

def list_signals(obj: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {"subject": obj.get("subject"), "sensors": {}}
    sig = obj.get("signal", {})
    for sensor in ("wrist", "chest"):
        sensor_block = sig.get(sensor)
        if not sensor_block:
            continue
        out["sensors"][sensor] = {}
        for modality, payload in sensor_block.items():
            # Two possible shapes:
            # 1) dict with keys: sampling_rate, signal
            # 2) raw ndarray/list (no metadata)
            if isinstance(payload, dict) and "signal" in payload:
                data = payload.get("signal")
                fs = payload.get("sampling_rate")
            else:
                data = payload
                fs = None
            shape = None
            try:

                if hasattr(data, "shape"):
                    shape = tuple(int(x) for x in data.shape)
                else:
                    shape = (len(data),)
            except Exception:
                try:
                    shape = (len(data),)
                except Exception:
                    shape = None
            if fs is None:
                fs = DEFAULT_FS.get(modality.upper())
            out["sensors"][sensor][modality] = {"sampling_rate": fs, "shape": shape}
    out["label"] = {"sampling_rate": LABEL_FS, "desc": LABEL_MAP}
    return out

def extract_series(
    obj: Dict[str, Any],
    sensor: str,
    modality: str,
    axis: Optional[str] = None,
    stride: int = 1,
    limit: Optional[int] = None,
) -> Dict[str, Any]:
    sensor = sensor.lower()
    modality_u = modality.upper()

    # Labels special case
    if sensor == "label" or modality_u == "LABEL":
        y_vals = _ensure_list(obj["label"])
        fs = LABEL_FS
        title = f"Labels @ {fs} Hz"
        y_label = "Condition ID"
    else:
        payload = obj["signal"][sensor][modality]
        if isinstance(payload, dict) and "signal" in payload:
            raw = payload["signal"]
            fs = payload.get("sampling_rate") or DEFAULT_FS.get(modality_u, 1)
        else:
            raw = payload
            fs = DEFAULT_FS.get(modality_u, 1)

        # Convert data
        try:
            arr = np.asarray(raw, dtype=float)
            if modality_u == "ACC" and arr.ndim == 2 and arr.shape[1] >= 3:
                if axis and axis.lower() in ("x","y","z"):
                    idx = {"x":0,"y":1,"z":2}[axis.lower()]
                    arr_use = arr[:, idx]
                else:
                    arr_use = np.sqrt((arr[:,0]**2)+(arr[:,1]**2)+(arr[:,2]**2))
                if sensor == "wrist":
                    arr_use = arr_use / WRIST_ACC_DIVISOR
                y_vals = arr_use.tolist()
                axis_suffix = f" ({axis.lower() if axis else 'mag'})"
            else:
                if modality_u == "ACC" and sensor == "wrist":
                    arr = arr / WRIST_ACC_DIVISOR
                y_vals = arr.tolist()
                axis_suffix = ""
        except Exception:
            if modality_u == "ACC" and isinstance(raw, list) and raw and isinstance(raw[0], (list, tuple)):
                if axis and axis.lower() in ("x","y","z"):
                    pos = {"x":0,"y":1,"z":2}[axis.lower()]
                    y_vals = [float(v[pos]) for v in raw]
                    if sensor == "wrist":
                        y_vals = [val / WRIST_ACC_DIVISOR for val in y_vals]
                    axis_suffix = f" ({axis.lower()})"
                else:
                    vals = [math.sqrt(v[0]**2+v[1]**2+v[2]**2) for v in raw]
                    if sensor == "wrist":
                        vals = [val / WRIST_ACC_DIVISOR for val in vals]
                    y_vals = vals
                    axis_suffix = " (mag)"
            else:
                y_vals = [float(v) for v in raw]
                if modality_u == "ACC" and sensor == "wrist":
                    y_vals = [val / WRIST_ACC_DIVISOR for val in y_vals]
                axis_suffix = ""
        unit = _units(modality_u)
        y_label = f"{modality_u}{axis_suffix} [{unit}]"
        title = f"{sensor.capitalize()} {modality_u}{axis_suffix} @ {fs} Hz"

    # Downsample / limit
    if stride > 1:
        y_vals = y_vals[::stride]
    if limit is not None and limit > 0:
        y_vals = y_vals[:limit]

    x_vals = [i / fs for i in range(len(y_vals))]
    return {
        "chart_title": title,
        "x_label": "Time (s)",
        "y_label": y_label,
        "x_values": x_vals,
        "y_values": y_vals,
    }

def _ensure_list(x) -> List[float]:
    try:
        import numpy as np
        if isinstance(x, np.ndarray):
            return x.astype(float).tolist()
    except Exception:
        pass
    return [float(v) for v in x]