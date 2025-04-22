from fastapi import APIRouter
from .lab_results import router as lab_results_router
from .patients import router as patients_router
from .auth import router as auth_router

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok"}

router.include_router(auth_router, prefix="/auth", tags=["Auth"])
router.include_router(patients_router, tags=["Patients"])
router.include_router(lab_results_router, tags=["Lab Results"])



