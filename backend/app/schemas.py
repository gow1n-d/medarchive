from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ==================== Auth Schemas ====================

class UserRole(str, Enum):
    DOCTOR = "doctor"
    ADMIN = "admin"
    STAFF = "staff"


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole = UserRole.DOCTOR
    clinic_name: Optional[str] = None
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    clinic_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ==================== Patient Schemas ====================

class PatientCreate(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = None


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = None


class PatientResponse(BaseModel):
    id: int
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = None
    created_at: datetime
    record_count: Optional[int] = 0

    class Config:
        from_attributes = True


# ==================== Medicine Schemas ====================

class MedicineCreate(BaseModel):
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None


class MedicineResponse(BaseModel):
    id: int
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== Medical Record Schemas ====================

class RecordCreate(BaseModel):
    patient_id: int
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    notes: Optional[str] = None
    record_date: Optional[datetime] = None
    record_type: Optional[str] = "prescription"
    medicines: Optional[List[MedicineCreate]] = []


class RecordResponse(BaseModel):
    id: int
    patient_id: int
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    notes: Optional[str] = None
    raw_ocr_text: Optional[str] = None
    image_url: Optional[str] = None
    record_date: datetime
    record_type: str
    medicines: List[MedicineResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class PatientDetailResponse(BaseModel):
    id: int
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = None
    created_at: datetime
    records: List[RecordResponse] = []

    class Config:
        from_attributes = True


# ==================== AI/Scan Schemas ====================

class ScanResult(BaseModel):
    raw_text: str
    structured_data: dict
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    diagnosis: Optional[str] = None
    medicines: List[MedicineCreate] = []
    date: Optional[str] = None
    confidence: Optional[float] = None


# ==================== Dashboard Schemas ====================

class DashboardStats(BaseModel):
    total_patients: int
    total_records: int
    records_today: int
    records_this_week: int
    recent_patients: List[PatientResponse] = []
