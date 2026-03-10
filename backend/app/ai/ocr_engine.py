"""
OCR Engine for MedArchive AI.
Uses EasyOCR for text extraction from medical document images.
Falls back to a basic placeholder if EasyOCR is not installed.
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Try to import EasyOCR
_reader = None
_ocr_available = False

try:
    import easyocr
    _ocr_available = True
    logger.info("EasyOCR is available")
except ImportError:
    logger.warning("EasyOCR not installed. OCR will return placeholder text. Install with: pip install easyocr")


def get_reader():
    """Lazily initialize the EasyOCR reader."""
    global _reader
    if _reader is None and _ocr_available:
        logger.info("Initializing EasyOCR reader (this may take a moment on first run)...")
        _reader = easyocr.Reader(['en'], gpu=False)
        logger.info("EasyOCR reader initialized.")
    return _reader


def extract_text_from_image(image_path: str) -> str:
    """
    Extract text from a medical document image using OCR.

    Args:
        image_path: Path to the image file
    
    Returns:
        Extracted text string
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    if not _ocr_available:
        logger.warning("OCR not available, returning demo text")
        return _get_demo_text()

    try:
        reader = get_reader()
        results = reader.readtext(image_path, detail=0, paragraph=True)
        text = "\n".join(results)
        logger.info(f"OCR extracted {len(text)} characters from {image_path}")
        return text if text.strip() else "No text could be extracted from this image."
    except Exception as e:
        logger.error(f"OCR error: {e}")
        return f"OCR Error: {str(e)}"


def _get_demo_text() -> str:
    """Return demo prescription text for testing without OCR installed."""
    return """Dr. Sharma Medical Clinic
123 Health Street, Mumbai

Patient: Ravi Kumar
Age: 45 years | Gender: Male
Date: 15/01/2024

Diagnosis: Hypertension (High Blood Pressure)

Rx:
1. Tab. Amlodipine 5mg - Once daily (morning)
2. Tab. Losartan 50mg - Once daily (evening)
3. Tab. Aspirin 75mg - Once daily (after lunch)

Advice:
- Low salt diet
- Regular exercise
- Follow up after 2 weeks

Dr. R. Sharma
MBBS, MD (Medicine)
Reg. No: 12345"""
