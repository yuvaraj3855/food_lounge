import requests
import os
import base64
from typing import Dict, Optional


class STTService:
    def __init__(self, sarvam_api_key: str = None, sarvam_base_url: str = None):
        self.sarvam_api_key = sarvam_api_key or os.getenv("SARVAM_API_KEY", "")
        self.sarvam_base_url = sarvam_base_url or os.getenv("SARVAM_BASE_URL", "https://api.sarvam.ai")
        # Fallback to Whisper if Sarvam not configured
        self.use_sarvam = bool(self.sarvam_api_key)

    def transcribe_audio(self, audio_data: bytes, language: str = "hi") -> Dict[str, str]:
        """
        Transcribe audio using Sarvam API (supports Indian languages)
        Returns: {text, language}
        """
        if self.use_sarvam:
            return self._transcribe_sarvam(audio_data, language)
        else:
            # Fallback to local Whisper if available
            return self._transcribe_whisper(audio_data, language)

    def _transcribe_sarvam(self, audio_data: bytes, language: str) -> Dict[str, str]:
        """Transcribe using Sarvam API"""
        try:
            # Encode audio to base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Map language codes to Sarvam supported languages
            language_map = {
                "hi": "hi",  # Hindi
                "ta": "ta",  # Tamil
                "te": "te",  # Telugu
                "kn": "kn",  # Kannada
                "ml": "ml",  # Malayalam
                "mr": "mr",  # Marathi
                "gu": "gu",  # Gujarati
                "bn": "bn",  # Bengali
                "pa": "pa",  # Punjabi
                "en": "en"   # English
            }
            sarvam_lang = language_map.get(language, "hi")

            response = requests.post(
                f"{self.sarvam_base_url}/v1/audio/transcriptions",
                headers={
                    "Authorization": f"Bearer {self.sarvam_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "audio": audio_base64,
                    "language": sarvam_lang,
                    "model": "sarvam-ai/OpenHathi-v0.1-Base"
                },
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            return {
                "text": data.get("text", ""),
                "language": sarvam_lang
            }
        except Exception as e:
            print(f"Error in Sarvam transcription: {e}")
            # Fallback
            return {
                "text": "",
                "language": language
            }

    def _transcribe_whisper(self, audio_data: bytes, language: str) -> Dict[str, str]:
        """Fallback: Transcribe using local Whisper (if available)"""
        try:
            import whisper
            model = whisper.load_model("base")
            
            # Save audio to temp file
            import tempfile
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
                tmp_file.write(audio_data)
                tmp_path = tmp_file.name
            
            result = model.transcribe(tmp_path, language=language if language != "hi" else None)
            os.unlink(tmp_path)
            
            return {
                "text": result.get("text", ""),
                "language": result.get("language", language)
            }
        except Exception as e:
            print(f"Error in Whisper transcription: {e}")
            return {
                "text": "",
                "language": language
            }

