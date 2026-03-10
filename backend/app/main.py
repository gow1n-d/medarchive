import os
import logging
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import settings
from app.database import init_db, get_db
from app.models import User, Patient, MedicalRecord, UserRole
from app.schemas import DashboardStats, PatientResponse
from app.auth.router import router as auth_router
from app.auth.dependencies import get_current_user
from app.auth.utils import get_password_hash
from app.patients.router import router as patients_router
from app.records.router import router as records_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    logger.info("🏥 Starting MedArchive AI...")
    init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Create default admin user if none exists
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin:
            admin_user = User(
                email="admin@medarchive.ai",
                hashed_password=get_password_hash("admin123"),
                full_name="MedArchive Admin",
                role=UserRole.ADMIN,
                clinic_name="MedArchive HQ",
            )
            db.add(admin_user)

            # Also create a demo doctor
            doctor_user = User(
                email="doctor@medarchive.ai",
                hashed_password=get_password_hash("doctor123"),
                full_name="Dr. Sharma",
                role=UserRole.DOCTOR,
                clinic_name="Sharma Medical Clinic",
            )
            db.add(doctor_user)
            db.commit()
            logger.info("✅ Default users created (admin@medarchive.ai / admin123, doctor@medarchive.ai / doctor123)")
    finally:
        db.close()

    logger.info("✅ MedArchive AI is ready!")
    yield
    # Shutdown
    logger.info("👋 MedArchive AI shutting down...")


# Create FastAPI app
app = FastAPI(
    title="MedArchive AI",
    description="AI-powered Medical Record Digitization and Patient Timeline System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(records_router)


@app.get("/")
async def root():
    return {
        "app": "MedArchive AI",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/dashboard", response_model=DashboardStats)
async def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dashboard statistics."""
    total_patients = db.query(Patient).count()
    total_records = db.query(MedicalRecord).count()

    today = datetime.utcnow().date()
    records_today = db.query(MedicalRecord).filter(
        MedicalRecord.created_at >= datetime(today.year, today.month, today.day)
    ).count()

    week_ago = datetime.utcnow() - timedelta(days=7)
    records_this_week = db.query(MedicalRecord).filter(
        MedicalRecord.created_at >= week_ago
    ).count()

    recent_patients = db.query(Patient).order_by(Patient.updated_at.desc()).limit(5).all()
    recent_list = []
    for p in recent_patients:
        pr = PatientResponse.model_validate(p)
        pr.record_count = db.query(MedicalRecord).filter(MedicalRecord.patient_id == p.id).count()
        recent_list.append(pr)

    return DashboardStats(
        total_patients=total_patients,
        total_records=total_records,
        records_today=records_today,
        records_this_week=records_this_week,
        recent_patients=recent_list,
    )


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
