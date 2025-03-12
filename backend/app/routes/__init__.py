from fastapi import APIRouter
from .lab_results import router as lab_results_router
from .patients import router as patients_router

router = APIRouter()
router.include_router(lab_results.router, prefix="/api", tags=["Lab Results"])
router.include_router(patients.router, prefix="/api", tags=["Patients"])

