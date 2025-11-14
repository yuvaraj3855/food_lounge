#!/bin/bash

# Test Voice Query Endpoint
# Usage: ./test_voice_query.sh <audio_file.wav> [language] [patient_id]

AUDIO_FILE="${1:-record_out(2).wav}"
LANGUAGE="${2:-hi}"
PATIENT_ID="${3:-9eedabb8-a5e5-4a60-b8d7-3146f545495b}"
BACKEND_URL="http://localhost:3000"

echo "Testing Voice Query Endpoint"
echo "============================"
echo "Audio file: $AUDIO_FILE"
echo "Language: $LANGUAGE"
echo "Patient ID: $PATIENT_ID"
echo ""

if [ ! -f "$AUDIO_FILE" ]; then
    echo "❌ Error: Audio file '$AUDIO_FILE' not found"
    echo ""
    echo "Available audio files:"
    find . -name "*.wav" -o -name "*.mp3" 2>/dev/null | head -5
    exit 1
fi

echo "Sending request..."
curl -X POST \
  "${BACKEND_URL}/patient/voice-query?language=${LANGUAGE}&patient_id=${PATIENT_ID}" \
  -H 'accept: application/json' \
  -F "file=@${AUDIO_FILE}" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | python3 -m json.tool 2>/dev/null || cat

echo ""
