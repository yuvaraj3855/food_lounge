import requests
import os
from typing import Dict, Optional


class TranslationService:
    """
    Sarvam Translation Service
    Uses Sarvam API for text translation between languages
    """
    def __init__(self, sarvam_api_url: str = None):
        # Sarvam Base URL (same for translation and TTS)
        self.sarvam_api_url = sarvam_api_url or os.getenv("SARVAM_BASE_URL", "http://10.11.7.65:8092")
        self.use_sarvam = bool(self.sarvam_api_url and self.sarvam_api_url != "http://localhost:8092")

    def translate(
        self,
        text: str,
        target_language: str,
        source_language: str = "auto"
    ) -> Dict[str, str]:
        """
        Translate text using Sarvam Translation API
        Returns: {text, source_language, target_language}
        
        Args:
            text: Text to translate
            target_language: Target language (e.g., "Tamil", "Hindi", "English") or code (e.g., "ta", "hi", "en")
            source_language: Source language (default: "auto" for auto-detect) or code
        """
        if not self.use_sarvam:
            # No translation available, return original text
            return {
                "text": text,
                "source_language": source_language,
                "target_language": target_language
            }

        return self._translate_sarvam(text, target_language, source_language)

    def _translate_sarvam(
        self,
        text: str,
        target_language: str,
        source_language: str
    ) -> Dict[str, str]:
        """Translate using Sarvam Translation API at http://10.11.7.65:8092"""
        try:
            # Normalize language names to match Sarvam's expected format
            language_map = {
                "hi": "Hindi",
                "ta": "Tamil",
                "te": "Telugu",
                "kn": "Kannada",
                "ml": "Malayalam",
                "mr": "Marathi",
                "gu": "Gujarati",
                "bn": "Bengali",
                "pa": "Punjabi",
                "en": "English"
            }
            
            # Convert language code to full name if needed
            target_lang = language_map.get(target_language.lower(), target_language)
            source_lang = language_map.get(source_language.lower(), source_language) if source_language != "auto" else "auto"

            response = requests.post(
                f"{self.sarvam_api_url}/api/v1/translation/translate",
                headers={
                    "accept": "application/json",
                    "Content-Type": "application/json"
                },
                json={
                    "text": text,
                    "source_language": source_lang,
                    "target_language": target_lang
                },
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            # Extract translated text from response
            # Response format may vary, try common fields
            translated_text = (
                result.get("translated_text", "") or
                result.get("text", "") or
                result.get("translation", "") or
                text  # Fallback to original if translation fails
            )
            
            return {
                "text": translated_text,
                "source_language": source_lang,
                "target_language": target_lang
            }
        except Exception as e:
            print(f"Error in Sarvam translation: {e}")
            # Return original text on error
            return {
                "text": text,
                "source_language": source_language,
                "target_language": target_language
            }

    def translate_to_language_code(
        self,
        text: str,
        target_language_code: str,
        source_language_code: str = "auto"
    ) -> str:
        """
        Convenience method: Translate text using language codes (e.g., "hi", "ta", "en")
        Returns: Translated text string
        """
        result = self.translate(text, target_language_code, source_language_code)
        return result["text"]

