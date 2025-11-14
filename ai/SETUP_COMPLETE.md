# AI Service Setup Complete ✅

## Configuration Summary

### ✅ Fixed Issues
1. **Poetry Configuration**: Added `package-mode = false` to `pyproject.toml`
2. **Ollama Models**: Updated to use correct model names:
   - `gemma3:4b` (was `gemma:4b`)
   - `bge-m3:latest` (was `bge-large`)
3. **Ollama Base URL**: Updated default to `http://10.11.7.65:11434`
4. **BGE Embeddings API**: Verified working with `/api/embeddings` endpoint

### Available Ollama Models
Based on your Ollama server at `http://10.11.7.65:11434`:
- ✅ `gemma3:4b` - For medication risk analysis (default)
- ✅ `gemma3:27b` - Alternative (more powerful) model
- ✅ `bge-m3:latest` - For drug similarity embeddings (default)

### Services Status

#### ✅ MedGemmaService
- **Status**: Ready
- **Model**: `gemma3:4b` (configurable via `GEMMA_MODEL` env var)
- **Endpoint**: `/api/generate`
- **Purpose**: Medication skip risk analysis

#### ✅ BGEService
- **Status**: Ready
- **Model**: `bge-m3:latest` (configurable via `BGE_MODEL` env var)
- **Endpoint**: `/api/embeddings`
- **Purpose**: Drug similarity search using embeddings

#### ✅ STTService
- **Status**: Ready
- **Provider**: Whisper API (primary) at `http://10.10.110.24:40004`
- **Model**: `whisper-large-v3`
- **Endpoint**: `/v1/audio/transcriptions` (multipart form data)
- **Languages**: Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Bengali, Punjabi, English
- **Fallback**: Sarvam AI (if configured) or local Whisper library
- **Requires**: `WHISPER_API_URL` environment variable (default: `http://10.10.110.24:40004`)

#### ✅ TTSService
- **Status**: Ready
- **Provider**: Sarvam AI (with gTTS fallback)
- **Endpoint**: `/v1/audio/speech`
- **Languages**: Same as STT
- **Requires**: `SARVAM_API_KEY` environment variable

#### ✅ DrugService
- **Status**: Ready
- **Data Path**: `ai/data/drugs_sample.json` (default)
- **Note**: You mentioned you have your own dataset - update `DRUG_DATASET_PATH` env var or place it at default location

## Next Steps

### 1. Set Environment Variables
Create a `.env` file in the `ai/` directory:

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://10.11.7.65:11434
GEMMA_MODEL=gemma3:4b
BGE_MODEL=bge-m3:latest

# Whisper API Configuration (for STT - Speech to Text)
WHISPER_API_URL=http://10.10.110.24:40004
WHISPER_MODEL=whisper-large-v3

# Sarvam AI Configuration (for TTS - Text to Speech, optional fallback for STT)
SARVAM_API_KEY=your_sarvam_api_key_here
SARVAM_BASE_URL=https://api.sarvam.ai

# Drug Dataset Path (optional)
# DRUG_DATASET_PATH=path/to/your/drugs.json
```

### 2. Add Your Drug Dataset
Place your drug dataset JSON file at:
- `ai/data/drugs_sample.json` (default), OR
- Set `DRUG_DATASET_PATH` environment variable to your custom path

**Dataset Format:**
```json
[
  {
    "name": "Furosemide",
    "category": "Diuretic",
    "critical": true,
    "conditions": ["Heart Failure", "Hypertension"],
    "risk_if_skipped": "High - Fluid accumulation",
    "dosage": "20-80mg daily"
  }
]
```

### 3. Start the AI Service
```bash
cd ai
poetry shell
poetry run uvicorn main:app --reload --port 8000
```

Or use the script:
```bash
poetry run start
```

### 4. Test Endpoints

#### Test Risk Analysis
```bash
curl -X POST http://localhost:8000/analyze_skip \
  -H "Content-Type: application/json" \
  -d '{
    "drug_name": "Furosemide",
    "skips": 2,
    "patient_age": 65,
    "conditions": ["Heart Failure"]
  }'
```

#### Test Voice Transcription
```bash
curl -X POST http://localhost:8000/voice/transcribe?language=hi \
  -F "file=@audio.wav"
```

#### Test Voice Synthesis
```bash
curl -X POST http://localhost:8000/voice/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "आपने अपनी दवा छोड़ दी है",
    "language": "hi"
  }'
```

## Integration with Backend

The backend is already configured to call these AI endpoints:
- `POST /analyze_skip` - Called by `POST /patient/skip-dose`
- `POST /voice/transcribe` - Called by `POST /patient/voice-query` and `POST /messages/voice`
- `POST /voice/synthesize` - Called by `POST /patient/voice-query`

**Backend AI Service URL**: Configured in `backend/src/ai/ai.service.ts` (default: `http://localhost:8000`)

## Troubleshooting

### Ollama Connection Issues
- Verify Ollama is running: `curl http://10.11.7.65:11434/api/tags`
- Check model availability: Models should be listed in the response

### Sarvam API Issues
- Verify API key is set: `echo $SARVAM_API_KEY`
- Test API connection (if you have the key)
- Service will fallback to Whisper/gTTS if Sarvam is not configured

### Drug Dataset Issues
- Check file exists at configured path
- Verify JSON format is valid
- Service will use sample data if dataset not found (but you mentioned you have your own)

## All Set! 🚀

The AI service is ready to use. Start it and test the endpoints!

