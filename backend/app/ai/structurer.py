"""
AI Medical Text Structurer for MedArchive AI.
Uses Google Gemini API to convert raw OCR text into structured medical data.
Falls back to regex-based parsing if Gemini is not configured.
"""
import json
import re
import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

# Try to import Gemini
_gemini_available = False
_model = None

try:
    import google.generativeai as genai
    _gemini_available = True
except ImportError:
    logger.warning("google-generativeai not installed. Using fallback parser.")


def _init_gemini():
    """Initialize Gemini model."""
    global _model
    if _model is None and _gemini_available and settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _model = genai.GenerativeModel('gemini-2.0-flash')
        logger.info("Gemini AI model initialized")
    return _model


STRUCTURING_PROMPT = """You are a medical data extraction AI. Analyze the following text from a medical prescription/document and extract structured information.

Return ONLY a valid JSON object with these fields (use null for missing fields):
{
    "patient_name": "string or null",
    "patient_age": "integer or null",
    "patient_gender": "string or null",
    "doctor_name": "string or null",
    "hospital_name": "string or null",
    "diagnosis": "string or null",
    "symptoms": "string or null",
    "date": "string in YYYY-MM-DD format or null",
    "medicines": [
        {
            "medicine_name": "string",
            "dosage": "string or null",
            "frequency": "string or null",
            "duration": "string or null",
            "instructions": "string or null"
        }
    ],
    "notes": "string or null",
    "confidence": 0.0 to 1.0
}

IMPORTANT: Return ONLY the JSON, no markdown formatting, no code blocks, no explanation.

Medical text to analyze:
"""


async def structure_medical_text(raw_text: str) -> dict:
    """
    Convert raw OCR text into structured medical data using AI.
    
    Args:
        raw_text: Raw text extracted from OCR
    
    Returns:
        Structured dictionary with medical information
    """
    if not raw_text or not raw_text.strip():
        return _empty_result()

    # Try Gemini first
    model = _init_gemini()
    if model:
        try:
            result = await _gemini_structure(model, raw_text)
            if result:
                return result
        except Exception as e:
            logger.error(f"Gemini structuring error: {e}")

    # Fallback to regex-based extraction
    logger.info("Using fallback regex parser")
    return _fallback_parse(raw_text)


async def _gemini_structure(model, raw_text: str) -> Optional[dict]:
    """Use Gemini API to structure medical text."""
    try:
        response = model.generate_content(STRUCTURING_PROMPT + raw_text)
        text = response.text.strip()

        # Remove any markdown code block markers
        if text.startswith("```"):
            text = re.sub(r'^```(?:json)?\s*', '', text)
            text = re.sub(r'\s*```$', '', text)

        result = json.loads(text)
        logger.info("Gemini successfully structured medical text")
        return result
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}")
        return None
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return None


def _fallback_parse(raw_text: str) -> dict:
    """Regex-based fallback parser for when AI is not available."""
    result = _empty_result()
    text_lower = raw_text.lower()

    # Extract patient name
    name_patterns = [
        r"patient[:\s]+([A-Za-z\s\.]+?)(?:\n|age|gender|\d)",
        r"name[:\s]+([A-Za-z\s\.]+?)(?:\n|age|gender|\d)",
        r"mr\./mrs\./ms\.\s+([A-Za-z\s]+?)(?:\n|age)",
    ]
    for pattern in name_patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            result["patient_name"] = match.group(1).strip()
            break

    # Extract age
    age_match = re.search(r"age[:\s]*(\d+)", raw_text, re.IGNORECASE)
    if age_match:
        result["patient_age"] = int(age_match.group(1))

    # Extract gender
    gender_match = re.search(r"gender[:\s]*(male|female|m|f)", raw_text, re.IGNORECASE)
    if gender_match:
        g = gender_match.group(1).upper()
        result["patient_gender"] = "Male" if g in ("M", "MALE") else "Female"

    # Extract doctor name
    doctor_patterns = [
        r"dr\.?\s+([A-Za-z\s\.]+?)(?:\n|MBBS|MD|reg)",
        r"doctor[:\s]+([A-Za-z\s\.]+?)(?:\n)",
    ]
    for pattern in doctor_patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            result["doctor_name"] = "Dr. " + match.group(1).strip()
            break

    # Extract diagnosis
    diag_match = re.search(r"diagnosis[:\s]+(.+?)(?:\n|rx|medicine)", raw_text, re.IGNORECASE)
    if diag_match:
        result["diagnosis"] = diag_match.group(1).strip()

    # Extract date
    date_patterns = [
        r"date[:\s]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
        r"(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
    ]
    for pattern in date_patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            result["date"] = match.group(1).strip()
            break

    # Extract medicines
    medicine_patterns = [
        r"(?:tab\.?|cap\.?|syrup\.?|inj\.?)\s+([A-Za-z\s]+?)(?:\s+(\d+\s*mg|\d+\s*ml))?(?:\s*[-–]\s*(.+?))?(?:\n|$)",
        r"\d+\.\s*(?:tab\.?|cap\.?|syrup\.?|inj\.?)?\s*([A-Za-z\s]+?)(?:\s+(\d+\s*mg|\d+\s*ml))?(?:\s*[-–]\s*(.+?))?(?:\n|$)",
    ]
    medicines = []
    for pattern in medicine_patterns:
        matches = re.findall(pattern, raw_text, re.IGNORECASE)
        for match in matches:
            med = {
                "medicine_name": match[0].strip() if match[0] else "Unknown",
                "dosage": match[1].strip() if len(match) > 1 and match[1] else None,
                "frequency": match[2].strip() if len(match) > 2 and match[2] else None,
                "duration": None,
                "instructions": None,
            }
            if med["medicine_name"] and len(med["medicine_name"]) > 2:
                medicines.append(med)
        if medicines:
            break

    result["medicines"] = medicines
    result["confidence"] = 0.4  # Low confidence for regex

    # Extract hospital name
    hospital_match = re.search(r"(.+?(?:clinic|hospital|medical|centre|center))", raw_text, re.IGNORECASE)
    if hospital_match:
        result["hospital_name"] = hospital_match.group(1).strip()

    return result


def _empty_result() -> dict:
    """Return an empty structured result."""
    return {
        "patient_name": None,
        "patient_age": None,
        "patient_gender": None,
        "doctor_name": None,
        "hospital_name": None,
        "diagnosis": None,
        "symptoms": None,
        "date": None,
        "medicines": [],
        "notes": None,
        "confidence": 0.0,
    }
