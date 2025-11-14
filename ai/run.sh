#!/bin/bash
# Run MedMentor AI Service with auto-reload

cd "$(dirname "$0")"
poetry run uvicorn main:app --reload --port 8000 --host 0.0.0.0

