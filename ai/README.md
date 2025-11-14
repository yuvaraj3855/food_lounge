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
OLLAMA_BASE_URL=http://localhost:11434
GEMMA_MODEL=gemma:4b
BGE_MODEL=bge-large

# Sarvam AI Configuration (for Indian language STT/TTS)
SARVAM_API_KEY=your_sarvam_api_key_here
SARVAM_BASE_URL=https://api.sarvam.ai

# Drug Dataset Path (optional, defaults to ai/data/drugs_sample.json)
DRUG_DATASET_PATH=path/to/your/drugs.json
```

3. Ensure Ollama is running with Gemma and BGE models:
```bash
# Pull models if not already available
ollama pull gemma:4b
ollama pull bge-large
```

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

