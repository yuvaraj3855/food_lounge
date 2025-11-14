import requests
import os
import base64
from typing import Dict, Optional
from io import BytesIO


class STTService:
    def __init__(self, whisper_api_url: str = None, sarvam_api_key: str = None, sarvam_base_url: str = None):
        # Whisper API (primary)
        self.whisper_api_url = whisper_api_url or os.getenv("WHISPER_API_URL", "http://10.10.110.24:40004")
        self.whisper_model = os.getenv("WHISPER_MODEL", "whisper-large-v3")
        
        # Sarvam API (fallback/alternative)
        self.sarvam_api_key = sarvam_api_key or os.getenv("SARVAM_API_KEY", "")
        self.sarvam_base_url = sarvam_base_url or os.getenv("SARVAM_BASE_URL", "https://api.sarvam.ai")
        
        # Use Whisper API by default (if URL is configured), otherwise fallback to Sarvam
        self.use_whisper = bool(self.whisper_api_url and self.whisper_api_url != "http://localhost:40004")
        self.use_sarvam = bool(self.sarvam_api_key) and not self.use_whisper

    def transcribe_audio(self, audio_data: bytes, language: str = "hi") -> Dict[str, str]:
        """
        Transcribe audio using Whisper API (primary) or Sarvam API (fallback)
        Supports Indian languages
        Returns: {text, language}
        """
        if self.use_whisper:
            return self._transcribe_whisper_api(audio_data, language)
        elif self.use_sarvam:
            return self._transcribe_sarvam(audio_data, language)
        else:
            # Final fallback to local Whisper if available
            return self._transcribe_whisper_local(audio_data, language)

    def _transcribe_whisper_api(self, audio_data: bytes, language: str) -> Dict[str, str]:
        """Transcribe using Whisper API (multipart form data)"""
        try:
            # Map language codes to ISO 639-1 codes
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
            whisper_lang = language_map.get(language, "hi")
            
            # Prepare multipart form data
            files = {
                'file': ('audio.wav', BytesIO(audio_data), 'audio/wav')
            }
            data = {
                'model': self.whisper_model,
                'language': whisper_lang
            }
            
            response = requests.post(
                f"{self.whisper_api_url}/v1/audio/transcriptions",
                files=files,
                data=data,
                timeout=60
            )
            response.raise_for_status()
            result = response.json()
            
            # Extract text from response
            # Response format may vary, try common fields
            text = result.get("text", "") or result.get("transcription", "") or result.get("transcript", "")
            
            return {
                "text": text,
                "language": whisper_lang
            }
        except Exception as e:
            print(f"Error in Whisper API transcription: {e}")
            # Fallback to Sarvam if available
            if self.use_sarvam:
                return self._transcribe_sarvam(audio_data, language)
            return {
                "text": "",
                "language": language
            }

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

    def _transcribe_whisper_local(self, audio_data: bytes, language: str) -> Dict[str, str]:
        """Fallback: Transcribe using local Whisper library (if available)"""
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

