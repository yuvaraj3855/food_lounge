# MedMentor AI Service

FastAPI service for medication risk analysis, STT/TTS, and drug intelligence.

> **Note**: This project uses [Poetry](https://python-poetry.org/) for dependency management.

## Setup

1. Install Poetry (if not already installed):
```bash
curl -sSL https://install.python-poetry.org | python3 -
# Or on macOS: brew install poetry
```

2. Install dependencies:
```bash
poetry install
```

3. Activate the virtual environment:
```bash
poetry shell
```

4. Set environment variables (create `.env` file):
```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://10.11.7.65:11434
GEMMA_MODEL=gemma3:4b
# Alternative: GEMMA_MODEL=gemma3:27b (for more powerful analysis)
BGE_MODEL=bge-m3:latest

# Whisper API Configuration (for STT - Speech to Text)
WHISPER_API_URL=http://10.10.110.24:40004
WHISPER_MODEL=whisper-large-v3

# Sarvam Base URL (for TTS and Translation)
# Same URL for both Sarvam TTS and Translation services
SARVAM_BASE_URL=http://10.11.7.65:8092

# Sarvam API Key (optional, if required by your Sarvam setup)
# SARVAM_API_KEY=your_sarvam_api_key_here

# Drug Dataset Path (optional, defaults to ai/data/drugs_sample.json)
# DRUG_DATASET_PATH=path/to/your/drugs.json
```

**Note:** The Ollama server is configured at `http://10.11.7.65:11434` with the following models available:
- `gemma3:4b` - For medication risk analysis
- `gemma3:27b` - Alternative (more powerful) model
- `bge-m3:latest` - For drug similarity embeddings

4. Place your drug dataset JSON file at the configured path (or use default location).

5. Run the service:
```bash
# Using Poetry
poetry run uvicorn main:app --reload --port 8000

# Or if you're in the poetry shell:
uvicorn main:app --reload --port 8000

# Or use the script:
poetry run start
```

## Managing Dependencies

To add a new dependency:
```bash
poetry add package-name
```

To add a development dependency:
```bash
poetry add --group dev package-name
```

To update dependencies:
```bash
poetry update
```

To export requirements.txt (if needed for CI/CD or other tools):
```bash
poetry export -f requirements.txt --output requirements.txt --without-hashes
```

## Endpoints

- `POST /analyze_skip` - Analyze medication skip risk
- `POST /voice/transcribe` - Transcribe audio (WAV) to text
- `POST /voice/synthesize` - Synthesize text to speech
- `POST /translate` - Translate text between languages
- `GET /drugs` - List all drugs
- `GET /drugs/{drug_name}` - Get specific drug information

## Drug Dataset Format

The drug dataset should be a JSON array or object with "drugs" key containing an array of drug objects:

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

