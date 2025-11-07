from fastapi import APIRouter
from services.pkl_loader import load_pkl  # changed import

router = APIRouter(prefix="/data", tags=["data"])

@router.get("/")
async def get_data():
    data = load_pkl("data/WESAD/S2/S2.pkl")  # path relative to backend/
    return {"data": data}