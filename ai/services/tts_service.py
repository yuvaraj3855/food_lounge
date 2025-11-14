import requests
import os
import base64
from typing import Optional
from pathlib import Path


class TTSService:
    def __init__(self, sarvam_api_key: str = None, sarvam_base_url: str = None, output_dir: str = None):
        # Sarvam Base URL (same for TTS and translation)
        self.sarvam_base_url = sarvam_base_url or os.getenv("SARVAM_BASE_URL", "http://10.11.7.65:8092")
        self.sarvam_api_key = sarvam_api_key or os.getenv("SARVAM_API_KEY", "")
        self.output_dir = output_dir or os.path.join(Path(__file__).parent.parent, "output", "audio")
        os.makedirs(self.output_dir, exist_ok=True)
        # Use Sarvam if base URL is configured (API key optional for some endpoints)
        self.use_sarvam = bool(self.sarvam_base_url and self.sarvam_base_url != "http://localhost:8092")

    def synthesize_speech(self, text: str, language: str = "hi") -> str:
        """
        Synthesize speech using Sarvam API (supports Indian languages)
        Returns: Path to generated audio file
        """
        if self.use_sarvam:
            return self._synthesize_sarvam(text, language)
        else:
            # Fallback to gTTS
            return self._synthesize_gtts(text, language)

    def _synthesize_sarvam(self, text: str, language: str) -> str:
        """Synthesize using Sarvam API"""
        try:
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

            # Build headers (API key may be optional depending on Sarvam setup)
            headers = {
                "Content-Type": "application/json"
            }
            if self.sarvam_api_key:
                headers["Authorization"] = f"Bearer {self.sarvam_api_key}"
            
            response = requests.post(
                f"{self.sarvam_base_url}/v1/audio/speech",
                headers=headers,
                json={
                    "text": text,
                    "language": sarvam_lang,
                    "model": "sarvam-ai/OpenHathi-v0.1-Base",
                    "voice": "default"
                },
                timeout=30
            )
            response.raise_for_status()
            
            # Save audio file
            import hashlib
            import time
            audio_hash = hashlib.md5(f"{text}_{language}_{time.time()}".encode()).hexdigest()
            audio_path = os.path.join(self.output_dir, f"{audio_hash}.wav")
            
            with open(audio_path, "wb") as f:
                f.write(response.content)
            
            return audio_path
        except Exception as e:
            print(f"Error in Sarvam TTS: {e}")
            # Fallback to gTTS
            return self._synthesize_gtts(text, language)

    def _synthesize_gtts(self, text: str, language: str) -> str:
        """Fallback: Synthesize using gTTS"""
        try:
            from gtts import gTTS
            import hashlib
            import time
            
            audio_hash = hashlib.md5(f"{text}_{language}_{time.time()}".encode()).hexdigest()
            audio_path = os.path.join(self.output_dir, f"{audio_hash}.mp3")
            
            tts = gTTS(text=text, lang=language, slow=False)
            tts.save(audio_path)
            
            return audio_path
        except Exception as e:
            print(f"Error in gTTS: {e}")
            raise Exception("TTS synthesis failed")

