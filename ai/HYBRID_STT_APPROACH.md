# Hybrid STT Approach ✅

## Overview

The STT service now uses a **hybrid approach** for optimal accuracy:

- **Whisper API** → English speech transcription
- **IndicConformer** → 22 Indian languages speech transcription

## How It Works

The service automatically routes requests based on language:

```python
if language == "en":
    → Use Whisper API (http://10.10.110.24:40004)
else:
    → Use IndicConformer (local model)
```

## Language Support

### ✅ English (en)
- **Service**: Whisper API
- **Accuracy**: High (optimized for English)
- **Endpoint**: `http://10.10.110.24:40004/v1/audio/transcriptions`

### ✅ Indian Languages (22 languages)
- **Service**: IndicConformer
- **Accuracy**: High (optimized for Indian languages)
- **Languages**: Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Bengali, Punjabi, Assamese, Odia, Urdu, Nepali, Sanskrit, and 8 more

## Configuration

In `.env` file:

```bash
# IndicConformer (for Indian languages)
INDIC_CONFORMER_MODEL=ai4bharat/indic-conformer-600m-multilingual
USE_GPU=false
HF_TOKEN=your_token_here

# Whisper API (for English)
WHISPER_API_URL=http://10.10.110.24:40004
WHISPER_MODEL=whisper-large-v3
```

## API Usage

### English Speech
```bash
POST /voice/transcribe?language=en
# Automatically uses Whisper API
```

### Indian Language Speech
```bash
POST /voice/transcribe?language=hi&decoding=ctc
# Automatically uses IndicConformer
```

### Combined (Speech → Translation)
```bash
POST /voice/transcribe-and-translate?source_language=hi&target_language=English
# Uses IndicConformer for STT, then Sarvam for translation
```

## Benefits

| Feature | Before | After (Hybrid) |
|---------|--------|----------------|
| **English** | ⚠️ Poor (IndicConformer) | ✅ High (Whisper API) |
| **Indian Languages** | ✅ High (IndicConformer) | ✅ High (IndicConformer) |
| **Coverage** | 22 languages | ✅ 23 languages (English + 22) |
| **Accuracy** | Mixed | ✅ Optimal for each language |

## Automatic Routing

The service automatically selects the best STT engine:

```python
# English → Whisper API
transcribe_audio(audio, language="en")
# Output: "🌐 Using Whisper API for English transcription"

# Hindi → IndicConformer
transcribe_audio(audio, language="hi")
# Output: "🇮🇳 Using IndicConformer for hi transcription"

# Tamil → IndicConformer
transcribe_audio(audio, language="ta")
# Output: "🇮🇳 Using IndicConformer for ta transcription"
```

## Supported Languages

**Total: 23 languages**

1. **English** (en) - Whisper API
2. **Hindi** (hi) - IndicConformer
3. **Tamil** (ta) - IndicConformer
4. **Telugu** (te) - IndicConformer
5. **Kannada** (kn) - IndicConformer
6. **Malayalam** (ml) - IndicConformer
7. **Marathi** (mr) - IndicConformer
8. **Gujarati** (gu) - IndicConformer
9. **Bengali** (bn) - IndicConformer
10. **Punjabi** (pa) - IndicConformer
11. **Assamese** (as) - IndicConformer
12. **Odia** (or) - IndicConformer
13. **Urdu** (ur) - IndicConformer
14. **Nepali** (ne) - IndicConformer
15. **Sanskrit** (sa) - IndicConformer
16. **Bodo** (brx) - IndicConformer
17. **Dogri** (doi) - IndicConformer
18. **Konkani** (kok) - IndicConformer
19. **Kashmiri** (ks) - IndicConformer
20. **Maithili** (mai) - IndicConformer
21. **Manipuri** (mni) - IndicConformer
22. **Santali** (sat) - IndicConformer
23. **Sindhi** (sd) - IndicConformer

## Status

✅ **Hybrid approach implemented and tested**
✅ **Automatic routing based on language**
✅ **Optimal accuracy for both English and Indian languages**

---

**Last Updated:** Auto-generated


