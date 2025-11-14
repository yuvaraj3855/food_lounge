#!/bin/bash

# Test Record Dose Endpoint
# Tests both "taken" and "skipped" status

PATIENT_ID="${1:-9eedabb8-a5e5-4a60-b8d7-3146f545495b}"
BACKEND_URL="http://localhost:3000"

echo "Testing Record Dose Endpoint"
echo "============================"
echo "Patient ID: $PATIENT_ID"
echo ""

echo "1. Testing 'taken' status (should return dose record):"
echo "------------------------------------------------------"
curl -X POST "${BACKEND_URL}/patient/record-dose" \
  -H 'Content-Type: application/json' \
  -H 'accept: application/json' \
  -d "{
    \"patient_id\": \"${PATIENT_ID}\",
    \"drug_name\": \"Furosemide\",
    \"status\": \"taken\"
  }" 2>&1 | python3 -m json.tool 2>/dev/null || cat

echo ""
echo ""
echo "2. Testing 'skipped' status (should trigger AI alert and send to doctor via SSE):"
echo "---------------------------------------------------------------------------------"
curl -X POST "${BACKEND_URL}/patient/record-dose" \
  -H 'Content-Type: application/json' \
  -H 'accept: application/json' \
  -d "{
    \"patient_id\": \"${PATIENT_ID}\",
    \"drug_name\": \"Metformin\",
    \"status\": \"skipped\"
  }" 2>&1 | python3 -m json.tool 2>/dev/null || cat

echo ""
echo ""
echo "Note: If status='skipped', the alert is also sent to doctor via SSE stream at:"
echo "  GET ${BACKEND_URL}/alerts/stream"
