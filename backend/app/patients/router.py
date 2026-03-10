from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app.models import Patient, MedicalRecord, User
from app.schemas import PatientCreate, PatientUpdate, PatientResponse, PatientDetailResponse, RecordResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/patients", tags=["Patients"])


@router.get("/", response_model=List[PatientResponse])
async def list_patients(
    search: Optional[str] = Query(None, description="Search query"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all patients with optional search."""
    query = db.query(Patient)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Patient.name.ilike(search_term),
                Patient.phone.ilike(search_term),
            )
        )

    patients = query.order_by(Patient.updated_at.desc()).offset(skip).limit(limit).all()

    # Add record count
    result = []
    for patient in patients:
        p = PatientResponse.model_validate(patient)
        p.record_count = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient.id).count()
        result.append(p)

    return result


@router.get("/search", response_model=List[PatientResponse])
async def search_patients(
    q: str = Query(..., description="Search query"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Smart search patients by name, phone, or diagnosis keywords."""
    search_term = f"%{q}%"

    # Search in patients
    patients = db.query(Patient).filter(
        or_(
            Patient.name.ilike(search_term),
            Patient.phone.ilike(search_term),
            Patient.allergies.ilike(search_term),
        )
    ).limit(20).all()

    # Also search by diagnosis in records
    record_patient_ids = db.query(MedicalRecord.patient_id).filter(
        MedicalRecord.diagnosis.ilike(search_term)
    ).distinct().limit(20).all()

    record_patients = []
    if record_patient_ids:
        ids = [r[0] for r in record_patient_ids]
        existing_ids = {p.id for p in patients}
        record_patients = db.query(Patient).filter(
            Patient.id.in_(ids),
            ~Patient.id.in_(existing_ids)
        ).all()

    all_patients = list(patients) + record_patients

    result = []
    for patient in all_patients:
        p = PatientResponse.model_validate(patient)
        p.record_count = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient.id).count()
        result.append(p)

    return result


@router.get("/{patient_id}", response_model=PatientDetailResponse)
async def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get patient details with full medical history."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return PatientDetailResponse.model_validate(patient)


@router.post("/", response_model=PatientResponse)
async def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new patient."""
    new_patient = Patient(**patient_data.model_dump())
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    p = PatientResponse.model_validate(new_patient)
    p.record_count = 0
    return p


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a patient's information."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    update_data = patient_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(patient, key, value)

    db.commit()
    db.refresh(patient)
    p = PatientResponse.model_validate(patient)
    p.record_count = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient.id).count()
    return p


@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a patient and all their records."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db.delete(patient)
    db.commit()
    return {"message": "Patient deleted successfully"}
