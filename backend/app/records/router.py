import os
import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.models import Patient, MedicalRecord, Medicine, User
from app.schemas import RecordCreate, RecordResponse, ScanResult, MedicineCreate
from app.auth.dependencies import get_current_user
from app.ai.ocr_engine import extract_text_from_image
from app.ai.structurer import structure_medical_text
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/records", tags=["Medical Records"])


@router.post("/scan", response_model=ScanResult)
async def scan_prescription(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Scan a prescription image using OCR and AI.
    Returns structured medical data without saving to database.
    Doctor can review and confirm before saving.
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/bmp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}")

    # Save uploaded file temporarily
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    file_id = str(uuid.uuid4())
    file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}.{file_ext}")

    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # Step 1: OCR extraction
        raw_text = extract_text_from_image(file_path)
        logger.info(f"OCR extracted text: {raw_text[:200]}...")

        # Step 2: AI structuring
        structured = await structure_medical_text(raw_text)
        logger.info(f"AI structured result: {json.dumps(structured, indent=2)[:500]}")

        # Build medicines list
        medicines = []
        for med in structured.get("medicines", []):
            medicines.append(MedicineCreate(
                medicine_name=med.get("medicine_name", "Unknown"),
                dosage=med.get("dosage"),
                frequency=med.get("frequency"),
                duration=med.get("duration"),
                instructions=med.get("instructions"),
            ))

        return ScanResult(
            raw_text=raw_text,
            structured_data=structured,
            patient_name=structured.get("patient_name"),
            patient_age=structured.get("patient_age"),
            patient_gender=structured.get("patient_gender"),
            doctor_name=structured.get("doctor_name"),
            hospital_name=structured.get("hospital_name"),
            diagnosis=structured.get("diagnosis"),
            medicines=medicines,
            date=structured.get("date"),
            confidence=structured.get("confidence", 0.0),
        )
    except Exception as e:
        logger.error(f"Scan error: {e}")
        raise HTTPException(status_code=500, detail=f"Scan processing error: {str(e)}")


import json


@router.post("/save", response_model=RecordResponse)
async def save_record(
    record_data: RecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Save a reviewed medical record to the database.
    Creates patient if doesn't exist.
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == record_data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Create medical record
    new_record = MedicalRecord(
        patient_id=record_data.patient_id,
        doctor_name=record_data.doctor_name,
        hospital_name=record_data.hospital_name,
        diagnosis=record_data.diagnosis,
        symptoms=record_data.symptoms,
        notes=record_data.notes,
        record_date=record_data.record_date or datetime.utcnow(),
        record_type=record_data.record_type or "prescription",
        created_by=current_user.id,
    )
    db.add(new_record)
    db.flush()  # Get the ID

    # Add medicines
    for med_data in (record_data.medicines or []):
        medicine = Medicine(
            record_id=new_record.id,
            medicine_name=med_data.medicine_name,
            dosage=med_data.dosage,
            frequency=med_data.frequency,
            duration=med_data.duration,
            instructions=med_data.instructions,
        )
        db.add(medicine)

    db.commit()
    db.refresh(new_record)

    return RecordResponse.model_validate(new_record)


@router.post("/save-with-patient", response_model=RecordResponse)
async def save_record_with_patient(
    patient_name: str = Form(...),
    patient_age: Optional[int] = Form(None),
    patient_gender: Optional[str] = Form(None),
    patient_phone: Optional[str] = Form(None),
    doctor_name: Optional[str] = Form(None),
    hospital_name: Optional[str] = Form(None),
    diagnosis: Optional[str] = Form(None),
    symptoms: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    record_date: Optional[str] = Form(None),
    record_type: str = Form("prescription"),
    medicines_json: Optional[str] = Form("[]"),
    raw_ocr_text: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Save a record and create/find patient automatically.
    This is used after scanning when the doctor confirms the data.
    """
    # Find or create patient
    patient = None
    if patient_phone:
        patient = db.query(Patient).filter(Patient.phone == patient_phone).first()

    if not patient and patient_name:
        # Try to find by exact name match
        patient = db.query(Patient).filter(Patient.name == patient_name).first()

    if not patient:
        # Create new patient
        patient = Patient(
            name=patient_name,
            age=patient_age,
            gender=patient_gender,
            phone=patient_phone,
        )
        db.add(patient)
        db.flush()

    # Parse record date
    parsed_date = datetime.utcnow()
    if record_date:
        try:
            parsed_date = datetime.fromisoformat(record_date)
        except ValueError:
            try:
                parsed_date = datetime.strptime(record_date, "%d/%m/%Y")
            except ValueError:
                pass

    # Create medical record
    new_record = MedicalRecord(
        patient_id=patient.id,
        doctor_name=doctor_name,
        hospital_name=hospital_name,
        diagnosis=diagnosis,
        symptoms=symptoms,
        notes=notes,
        raw_ocr_text=raw_ocr_text,
        record_date=parsed_date,
        record_type=record_type,
        created_by=current_user.id,
    )
    db.add(new_record)
    db.flush()

    # Parse and add medicines
    try:
        medicines_list = json.loads(medicines_json) if medicines_json else []
        for med_data in medicines_list:
            medicine = Medicine(
                record_id=new_record.id,
                medicine_name=med_data.get("medicine_name", "Unknown"),
                dosage=med_data.get("dosage"),
                frequency=med_data.get("frequency"),
                duration=med_data.get("duration"),
                instructions=med_data.get("instructions"),
            )
            db.add(medicine)
    except json.JSONDecodeError:
        pass

    db.commit()
    db.refresh(new_record)

    return RecordResponse.model_validate(new_record)


@router.get("/patient/{patient_id}", response_model=List[RecordResponse])
async def get_patient_records(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all medical records for a patient (timeline)."""
    records = db.query(MedicalRecord).filter(
        MedicalRecord.patient_id == patient_id
    ).order_by(MedicalRecord.record_date.desc()).all()

    return [RecordResponse.model_validate(r) for r in records]


@router.get("/{record_id}", response_model=RecordResponse)
async def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single medical record."""
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return RecordResponse.model_validate(record)


@router.delete("/{record_id}")
async def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a medical record."""
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return {"message": "Record deleted successfully"}
