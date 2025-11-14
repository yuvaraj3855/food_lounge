import os
import torch
import torchaudio
from typing import Dict, Optional
from io import BytesIO
import tempfile
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class STTService:
    """
    Speech-to-Text Service with Hybrid Approach
    - Whisper API for English
    - IndicConformer for 22 Indian languages
    """
    
    def __init__(self, model_name: str = None, use_gpu: bool = None, whisper_api_url: str = None):
        # IndicConformer model from Hugging Face
        self.model_name = model_name or os.getenv("INDIC_CONFORMER_MODEL", "ai4bharat/indic-conformer-600m-multilingual")
        self.use_gpu = use_gpu if use_gpu is not None else (torch.cuda.is_available() and os.getenv("USE_GPU", "false").lower() == "true")
        self.indic_model = None
        self._load_indic_model()
        
        # Whisper API configuration (for English)
        self.whisper_api_url = whisper_api_url or os.getenv("WHISPER_API_URL", "http://10.10.110.24:40004")
        self.whisper_model = os.getenv("WHISPER_MODEL", "whisper-large-v3")
        self.use_whisper_api = bool(self.whisper_api_url and self.whisper_api_url != "http://localhost:40004")
        
        # Indian languages supported by IndicConformer
        self.indic_languages = {
            "hi", "ta", "te", "kn", "ml", "mr", "gu", "bn", "pa",
            "as", "or", "ur", "ne", "sa", "brx", "doi", "kok", "ks",
            "mai", "mni", "sat", "sd"
        }
        
        # Language code mapping for IndicConformer
        self.language_map = {
            "hi": "hi",  # Hindi
            "ta": "ta",  # Tamil
            "te": "te",  # Telugu
            "kn": "kn",  # Kannada
            "ml": "ml",  # Malayalam
            "mr": "mr",  # Marathi
            "gu": "gu",  # Gujarati
            "bn": "bn",  # Bengali
            "pa": "pa",  # Punjabi
            "as": "as",  # Assamese
            "or": "or",  # Odia
            "ur": "ur",  # Urdu
            "ne": "ne",  # Nepali
            "sa": "sa",  # Sanskrit
        }
    
    def _load_indic_model(self):
        """Load IndicConformer model from Hugging Face"""
        try:
            from transformers import AutoModel
            import os
            
            print(f"Loading IndicConformer model: {self.model_name}")
            
            # Get Hugging Face token from environment
            hf_token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_TOKEN")
            
            # Prepare model loading arguments
            model_kwargs = {
                "trust_remote_code": True
            }
            
            # Add token if available
            if hf_token:
                model_kwargs["token"] = hf_token
                print("✅ Using Hugging Face token for authentication")
            else:
                print("⚠️  No HF_TOKEN found. Make sure you have access to the model.")
            
            device = "cuda" if self.use_gpu else "cpu"
            self.indic_model = AutoModel.from_pretrained(
                self.model_name,
                **model_kwargs
            )
            self.indic_model.to(device)
            self.indic_model.eval()
            print(f"✅ IndicConformer model loaded on {device}")
        except Exception as e:
            print(f"Error loading IndicConformer model: {e}")
            if "403" in str(e) or "gated" in str(e).lower():
                print("\n⚠️  Access denied. Please:")
                print("   1. Visit https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual")
                print("   2. Accept the model terms")
                print("   3. Set HF_TOKEN in your .env file")
            self.indic_model = None
    
    def _transcribe_whisper_api(self, audio_data: bytes, language: str) -> Dict[str, str]:
        """Transcribe using Whisper API (for English)"""
        try:
            # Prepare multipart form data
            files = {
                'file': ('audio.wav', BytesIO(audio_data), 'audio/wav')
            }
            data = {
                'model': self.whisper_model,
                'language': language
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
            text = result.get("text", "") or result.get("transcription", "") or result.get("transcript", "")
            
            return {
                "text": text,
                "language": language
            }
        except Exception as e:
            print(f"Error in Whisper API transcription: {e}")
            raise Exception(f"Whisper API transcription failed: {str(e)}")
    
    def _transcribe_indic_conformer(self, audio_data: bytes, language: str, decoding: str) -> Dict[str, str]:
        """Transcribe using IndicConformer (for Indian languages)"""
        if self.indic_model is None:
            raise Exception("IndicConformer model not loaded. Please check model installation.")
        
        try:
            # Map language code
            indic_lang = self.language_map.get(language.lower(), "hi")
            
            # Save audio to temporary file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
                tmp_file.write(audio_data)
                tmp_path = tmp_file.name
            
            try:
                # Load audio file
                wav, sr = torchaudio.load(tmp_path)
                
                # Convert to mono if stereo
                if wav.shape[0] > 1:
                    wav = torch.mean(wav, dim=0, keepdim=True)
                
                # Resample to 16kHz if needed (IndicConformer expects 16kHz)
                target_sample_rate = 16000
                if sr != target_sample_rate:
                    resampler = torchaudio.transforms.Resample(
                        orig_freq=sr,
                        new_freq=target_sample_rate
                    )
                    wav = resampler(wav)
                
                # Move to appropriate device
                device = "cuda" if self.use_gpu else "cpu"
                wav = wav.to(device)
                
                # Perform ASR
                with torch.no_grad():
                    transcription = self.indic_model(wav, indic_lang, decoding)
                
                # Clean up transcription
                text = transcription.strip() if transcription else ""
                
                return {
                    "text": text,
                    "language": indic_lang
                }
            
            finally:
                # Clean up temp file
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                    
        except Exception as e:
            print(f"Error in IndicConformer transcription: {e}")
            raise Exception(f"IndicConformer transcription failed: {str(e)}")
    
    def transcribe_audio(self, audio_data: bytes, language: str = "hi", decoding: str = "ctc") -> Dict[str, str]:
        """
        Transcribe audio using hybrid approach:
        - Whisper API for English
        - IndicConformer for 22 Indian languages
        
        Args:
            audio_data: Audio file bytes (WAV, FLAC, etc.)
            language: Language code (en, hi, ta, te, etc.)
            decoding: "ctc" or "rnnt" for IndicConformer (default: "ctc")
        
        Returns:
            {text, language}
        """
        language_lower = language.lower()
        
        # Route to appropriate service
        if language_lower == "en":
            # English: Use Whisper API
            if not self.use_whisper_api:
                raise Exception("Whisper API not configured. Set WHISPER_API_URL in .env")
            print("🌐 Using Whisper API for English transcription")
            return self._transcribe_whisper_api(audio_data, "en")
        
        elif language_lower in self.indic_languages:
            # Indian languages: Use IndicConformer
            if self.indic_model is None:
                raise Exception("IndicConformer model not loaded. Please check model installation.")
            print(f"🇮🇳 Using IndicConformer for {language} transcription")
            print(f"   ⚠️  WARNING: Make sure audio is actually in {language}!")
            print(f"   ⚠️  If audio is in a different language, transcription will be poor/incorrect.")
            return self._transcribe_indic_conformer(audio_data, language, decoding)
        
        else:
            # Unknown language: Try IndicConformer with Hindi as fallback
            print(f"⚠️  Unknown language '{language}', using IndicConformer with Hindi fallback")
            if self.indic_model is None:
                raise Exception(f"Language '{language}' not supported and IndicConformer not available")
            return self._transcribe_indic_conformer(audio_data, "hi", decoding)
    
    def get_supported_languages(self) -> list:
        """Get list of supported language codes"""
        return ["en"] + list(self.indic_languages)
    
    def is_model_loaded(self) -> bool:
        """Check if IndicConformer model is loaded"""
        return self.indic_model is not None
