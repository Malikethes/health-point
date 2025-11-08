from fastapi import APIRouter, HTTPException, Query
from services.pkl_loader import load_pkl, list_signals, extract_series, DEFAULT_FS
from services.overall_data.heart_rate import get_heart_rate
from services.overall_data.breathing_rate import get_breathing_rate
from services.overall_data.stress_level import get_stress_level
from services.overall_data.temperature import get_temperature

from services.overall_data.pulse_transit_timg import process_pulse_transit_time

router = APIRouter(prefix="/data", tags=["data"])


@router.get("/info")
def get_info(subject: str = Query("S2", description="Subject ID, e.g. S2")):
    path = f"data/WESAD/{subject}/{subject}.pkl"
    try:
        obj = load_pkl(path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    return list_signals(obj)


@router.get("/series")
def get_series(
    subject: str = Query("S2", description="Subject ID, e.g. S2"),
    sensor: str = Query("wrist", description="wrist | chest | label"),
    modality: str = Query(
        "EDA", description="e.g. EDA, BVP, TEMP, ACC, ECG, RESP, EMG, LABEL"
    ),
    axis: str | None = Query(None, description="For ACC: x|y|z|mag"),
    stride: int = Query(10, ge=1, description="Return every Nth sample"),
    limit: int | None = Query(
        5000, ge=1, description="Max samples after stride (None for all)"
    ),
):
    path = f"data/WESAD/{subject}/{subject}.pkl"
    try:
        obj = load_pkl(path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    try:
        chart = extract_series(
            obj, sensor=sensor, modality=modality, axis=axis, stride=stride, limit=limit
        )
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Invalid key: {e}")
    return chart


@router.get("/heart_rate")
def heart_rate(
    subject: str = Query("S2", description="Subject ID, e.g. S2"),
    sensor: str = Query("chest", description="ECG usually from chest sensor"),
    modality: str = Query("ECG", description="Signal to derive heart rate from"),
):
    try:
        return get_heart_rate(subject, sensor, modality)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, detail=f"Subject file not found: {subject}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing heart rate: {e}")


@router.get("/breathing_rate")
def get_breathing_rate_endpoint(
    subject: str = Query("S2", description="Subject ID, e.g. S2"),
):
    try:
        return get_breathing_rate(subject, winsec=5, step_sec=5)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {subject}")
    except KeyError:
        raise HTTPException(
            status_code=400, detail="RESP signal not found in chest data."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing signal: {type(e).__name__}: {e}"
        )


@router.get("/stress_level")
def stress_level(
    subject: str = Query("S2", description="Subject ID, e.g. S2"),
    sensor: str = Query("wrist", description="Use wrist for EDA and TEMP"),
):
    try:
        return get_stress_level(subject, sensor)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, detail=f"Subject file not found: {subject}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error computing stress level: {e}"
        )


@router.get("/temperature")
def temperature(
    subject: str = Query("S2", description="Subject ID, e.g. S2"),
    sensor: str = Query("wrist", description="wrist | chest"),
    modality: str = Query("TEMP", description="TEMP or Temp depending on file"),
):
    try:
        return get_temperature(subject, sensor, modality)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, detail=f"Subject file not found: {subject}"
        )
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Modality error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing temperature: {e}")


@router.get("/pulse_transit_time")
def get_pulse_transit_time(
    subject: str = Query("S2", description="Subject ID, e.g. S2"),
):
    """
    Calculates the Pulse Transit Time (PTT) over time using a 5-second window.
    This is a proxy for blood pressure changes.
    Returns two arrays: {x_labels: [timestamps], y_labels: [ptt_in_ms]}
    """
    path = f"data/WESAD/{subject}/{subject}.pkl"
    try:
        obj = load_pkl(path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {path}")

    try:
        chest_data = obj["signal"]["chest"]
        ecg_key = None
        for key in chest_data.keys():
            if key.upper() == "ECG":
                ecg_key = key
                break
        if ecg_key is None:
            raise KeyError("ECG key not found")
        ecg_payload = chest_data[ecg_key]

        if isinstance(ecg_payload, dict) and "signal" in ecg_payload:
            raw_ecg = ecg_payload["signal"]
            ecg_fs = ecg_payload.get("sampling_rate") or DEFAULT_FS.get("ECG", 700)
        else:
            raw_ecg = ecg_payload
            ecg_fs = DEFAULT_FS.get("ECG", 700)

        wrist_data = obj["signal"]["wrist"]
        bvp_key = None
        for key in wrist_data.keys():
            if key.upper() == "BVP":
                bvp_key = key
                break
        if bvp_key is None:
            raise KeyError("BVP key not found")
        bvp_payload = wrist_data[bvp_key]

        if isinstance(bvp_payload, dict) and "signal" in bvp_payload:
            raw_bvp = bvp_payload["signal"]
            bvp_fs = bvp_payload.get("sampling_rate") or DEFAULT_FS.get("BVP", 64)
        else:
            raw_bvp = bvp_payload
            bvp_fs = DEFAULT_FS.get("BVP", 64)

        ptt_dict = process_pulse_transit_time(
            raw_ecg, raw_bvp, ecg_fs=ecg_fs, bvp_fs=bvp_fs, winsec=5, step_sec=5
        )

        x_labels = list(ptt_dict.keys())
        y_labels = list(ptt_dict.values())

        return {
            "x_label": "Time (s)",
            "y_label": "Tims (ms)",
            "x_labels": x_labels,
            "y_labels": y_labels,
        }

    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Signal not found: {e}")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing signal: {type(e).__name__}: {e}"
        )
