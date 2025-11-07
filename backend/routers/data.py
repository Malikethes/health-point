from fastapi import APIRouter, HTTPException, Query
from services.pkl_loader import load_pkl, list_signals, extract_series

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
    modality: str = Query("EDA", description="e.g. EDA, BVP, TEMP, ACC, ECG, RESP, EMG, LABEL"),
    axis: str | None = Query(None, description="For ACC: x|y|z|mag"),
    stride: int = Query(10, ge=1, description="Return every Nth sample"),
    limit: int | None = Query(5000, ge=1, description="Max samples after stride (None for all)"),
):
    path = f"data/WESAD/{subject}/{subject}.pkl"
    try:
        obj = load_pkl(path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    try:
        chart = extract_series(obj, sensor=sensor, modality=modality, axis=axis, stride=stride, limit=limit)
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Invalid key: {e}")
    return chart