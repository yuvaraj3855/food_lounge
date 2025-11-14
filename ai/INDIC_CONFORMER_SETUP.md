# IndicConformer Setup Guide

## Overview

We're using **AI4Bharat IndicConformer-600M-Multilingual** for Speech-to-Text instead of Whisper API. This model is specifically designed for 22 Indian languages and provides better accuracy for Indian language speech recognition.

**Model:** [ai4bharat/indic-conformer-600m-multilingual](https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual)

## Why IndicConformer?

✅ **22 Indian Languages** - Specifically trained for Indian languages  
✅ **High Accuracy** - Better than generic models for Indian languages  
✅ **Open Source** - MIT licensed, free to use  
✅ **Local Processing** - No external API calls needed  
✅ **Two Decoding Methods** - CTC and RNNT options  

## Supported Languages

The model supports all 22 officially recognized languages of India:

- Hindi (`hi`)
- Tamil (`ta`)
- Telugu (`te`)
- Kannada (`kn`)
- Malayalam (`ml`)
- Marathi (`mr`)
- Gujarati (`gu`)
- Bengali (`bn`)
- Punjabi (`pa`)
- Assamese (`as`)
- Odia (`or`)
- Urdu (`ur`)
- Nepali (`ne`)
- Sanskrit (`sa`)
- And 8 more languages

## Installation

The dependencies are already added to `pyproject.toml`:

```bash
cd ai
poetry install
```

This will install:
- `transformers` - For loading Hugging Face models
- `torch` - PyTorch for model inference
- `torchaudio` - For audio processing

## First Run

On first run, the model will be downloaded from Hugging Face (~600MB). This happens automatically when the service starts.

**Important:** You need to:
1. **Accept the model's terms:**
   - Visit: https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual
   - Log in or sign up
   - Accept the terms to access the model

2. **Get your Hugging Face token:**
   - Visit: https://huggingface.co/settings/tokens
   - Create a new token (read access is enough)
   - Copy the token

3. **Add token to `.env` file:**
   ```bash
   HF_TOKEN=your_token_here
   ```

## Configuration

In `.env` file:

```bash
# IndicConformer Configuration
INDIC_CONFORMER_MODEL=ai4bharat/indic-conformer-600m-multilingual
USE_GPU=false  # Set to true if GPU available for faster inference
```

## Usage

### API Endpoint

```bash
POST /voice/transcribe
```

**Parameters:**
- `file`: Audio file (WAV, FLAC, MP3, etc.)
- `language`: Language code (hi, ta, te, etc.) - default: "hi"
- `decoding`: "ctc" or "rnnt" - default: "ctc"

**Example:**

```bash
curl -X POST "http://localhost:8000/voice/transcribe?language=ta&decoding=ctc" \
  -F "file=@audio.wav"
```

### Python Code

```python
from services.stt_service import STTService

stt = STTService()

# Transcribe audio
result = stt.transcribe_audio(audio_bytes, language="ta", decoding="ctc")
print(result["text"])
```

## Decoding Methods

### CTC (Connectionist Temporal Classification)
- **Faster** inference
- **Default** method
- Good for most use cases

### RNNT (Recurrent Neural Network Transducer)
- **More accurate** in some cases
- Slightly slower
- Better for complex audio

## Performance

- **Model Size:** ~600MB
- **Inference Speed:** 
  - CPU: ~1-2 seconds per audio file
  - GPU: ~0.1-0.5 seconds per audio file
- **Memory:** ~2-4GB RAM required

## GPU Support

If you have a CUDA-capable GPU:

1. Install CUDA-enabled PyTorch (if not already):
   ```bash
   poetry add torch torchaudio --source pytorch
   ```

2. Set in `.env`:
   ```bash
   USE_GPU=true
   ```

3. Restart the service

## Troubleshooting

### Model Download Issues

If model download fails:
1. Check Hugging Face access (accept terms)
2. Set Hugging Face token:
   ```bash
   export HF_TOKEN=your_token_here
   ```

### Memory Issues

If you get out-of-memory errors:
- Use CPU mode: `USE_GPU=false`
- Process shorter audio files
- Consider using a smaller model variant

### Audio Format Issues

The service supports:
- WAV (recommended)
- FLAC
- MP3
- M4A
- OGG

Audio is automatically resampled to 16kHz if needed.

## Migration from Whisper API

The API interface remains the same, so no backend changes are needed. The service now:
- ✅ Processes audio locally (no external API)
- ✅ Better accuracy for Indian languages
- ✅ Supports more Indian languages
- ✅ No API rate limits

## References

- [Hugging Face Model Page](https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual)
- [AI4Bharat Documentation](https://huggingface.co/ai4bharat)

