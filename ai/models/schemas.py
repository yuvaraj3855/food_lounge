from pydantic import BaseModel
from typing import Optional, List


class SkipDoseRequest(BaseModel):
    drug_name: str
    skips: int
    patient_age: int
    conditions: List[str] = []


class RiskAnalysisResponse(BaseModel):
    risk_level: str  # "Low", "Medium", "High"
    message: str
    ai_explanation: str
    similar_drugs: Optional[List[str]] = None


class VoiceTranscribeRequest(BaseModel):
    audio_data: str  # Base64 encoded audio
    language: Optional[str] = "en"


class VoiceTranscribeResponse(BaseModel):
    text: str
    language: str


class VoiceSynthesizeRequest(BaseModel):
    text: str
    language: str = "en"


class VoiceSynthesizeResponse(BaseModel):
    audio_url: str  # Path to generated audio file


class TranslationRequest(BaseModel):
    text: str
    target_language: str  # Language code (e.g., "ta", "hi", "en") or full name (e.g., "Tamil", "Hindi")
    source_language: str = "auto"  # "auto" for auto-detect, or specific language code/name


class TranslationResponse(BaseModel):
    text: str  # Translated text
    source_language: str
    target_language: str


class VoiceTranscribeWithTranslationResponse(BaseModel):
    original_text: str  # Text in original language (from STT)
    translated_text: str  # Translated text
    source_language: str  # Language of the audio
    target_language: str  # Target translation language

