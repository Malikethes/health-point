from fastapi import APIRouter, HTTPException, Query
from services.pkl_loader import load_pkl, list_signals, extract_series, DEFAULT_FS
from services.overall_data.heart_rate import get_heart_rate
from services.overall_data.breathing_rate import process_respiration_signal
from services.overall_data.stress_level import get_stress_level 
from services.overall_data.temperature import get_temperature


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
def get_breathing_rate(
    subject: str = Query("S2", description="Subject ID, e.g. S2"),
    # winsec parameter removed
):
    """
    Calculates the breathing rate over time for a subject using a 5-second window.
    Returns two arrays: {x_labels: [timestamps], y_labels: [rates_in_bpm]}
    """
    path = f"data/WESAD/{subject}/{subject}.pkl"
    try:
        obj = load_pkl(path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {path}")

    try:
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
            fs = payload.get("sampling_rate") or DEFAULT_FS.get("RESP", 700)
        else:
            raw_signal = payload
            fs = DEFAULT_FS.get("RESP", 700)

        rates_dict = process_respiration_signal(raw_signal, fs=fs, winsec=5, step_sec=5)

        x_values = list(rates_dict.keys())
        y_values = list(rates_dict.values())

        return {
            "x_label": "Time (s)",
            "y_label": "Breathrate (BPM)",
            "x_vales": x_values,
            "y_values": y_values,
        }

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
        raise HTTPException(status_code=404, detail=f"Subject file not found: {subject}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing stress level: {e}")
    
@router.get("/temperature")
def temperature(
    subject: str = Query("S2", description="Subject ID, e.g. S2"),
    sensor: str = Query("wrist", description="wrist | chest"),
    modality: str = Query("TEMP", description="TEMP or Temp depending on file"),
):
    try:
        return get_temperature(subject, sensor, modality)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Subject file not found: {subject}")
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Modality error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing temperature: {e}")
    
@router.get("/movement")
def movement(
    subject: str = Query("S2", description="Subject ID, e.g. S2"),
    sensor: str = Query("chest", description="wrist | chest"),
    modality: str = Query("ACC", description="Accelerometer modality (ACC)"),
):
    from services.overall_data.movement import get_movement
    try:
        return get_movement(subject, sensor, modality)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Subject file not found: {subject}")
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Invalid modality or sensor: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing movement: {e}")    

