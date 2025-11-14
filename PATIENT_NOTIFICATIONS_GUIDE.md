# Patient Notifications System

## Overview

The patient notifications system provides real-time notifications to patients via Server-Sent Events (SSE). Patients receive:
1. **Medication Reminders** - When it's time to take medication
2. **AI Warnings** - About potential health issues if medication is skipped
3. **Doctor Instructions** - Messages from the doctor (auto-translated to patient's language)

All notifications include `text` and `language` fields for frontend TTS (Text-to-Speech).

## Endpoints

### 1. Patient SSE Stream
**GET** `/patient-notifications/stream/:patientId`

Establishes an SSE connection for a specific patient to receive real-time notifications.

**Example:**
```bash
curl -N http://localhost:3000/patient-notifications/stream/9eedabb8-a5e5-4a60-b8d7-3146f545495b
```

**Response Format:**
```
data: {"id":"notif-123","patient_id":"...","type":"medication_reminder","text":"कृपया अपनी दवा लें","language":"hi","scheduled_time":"2025-11-14T10:00:00Z","timestamp":"2025-11-14T10:00:00Z","acknowledged":false}
```

### 2. Send Medication Reminder
**POST** `/patient-notifications/reminder/:patientId`

Manually trigger a medication reminder.

**Request:**
```json
{
  "drug_name": "Furosemide",
  "scheduled_time": "2025-11-14T10:00:00Z"
}
```

### 3. Send AI Warning
**POST** `/patient-notifications/warning/:patientId`

Send AI-generated warning about skipping medication.

**Request:**
```json
{
  "drug_name": "Furosemide",
  "scheduled_time": "2025-11-14T10:00:00Z"
}
```

### 4. Send Doctor Instruction
**POST** `/patient-notifications/doctor-instruction/:patientId`

Send doctor message to patient (auto-translated).

**Request:**
```json
{
  "message": "Please take your medication on time",
  "language": "en"  // Optional: source language
}
```

## Notification Types

### 1. `medication_reminder`
- **When:** Scheduled medication time
- **Content:** Reminder to take medication
- **Example Text (Hindi):** "कृपया अभी अपनी Furosemide दवा लें। यह आपकी निर्धारित खुराक का समय है।"

### 2. `ai_warning`
- **When:** Patient is about to skip or has skipped medication
- **Content:** AI-generated warning about potential health risks
- **Example Text (Hindi):** "⚠️ महत्वपूर्ण: कृपया अपनी Furosemide दवा लें। Skipping this medication may cause serious health issues."

### 3. `doctor_instruction`
- **When:** Doctor sends a message
- **Content:** Doctor's message translated to patient's language
- **Example Text (Hindi):** "कृपया अपनी दवा समय पर लें"

## Frontend Integration

### 1. Connect to SSE Stream
```javascript
const eventSource = new EventSource(
  `http://localhost:3000/patient-notifications/stream/${patientId}`
);

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  
  // Use notification.text and notification.language for TTS
  speakText(notification.text, notification.language);
  
  // Display notification in UI
  displayNotification(notification);
};
```

### 2. TTS Integration
The notification includes:
- `text`: Text to speak (in patient's language)
- `language`: Language code for TTS engine

**Example:**
```javascript
function speakText(text, language) {
  // Use browser TTS or your TTS service
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language; // e.g., 'hi-IN', 'en-US', 'ta-IN'
  window.speechSynthesis.speak(utterance);
}
```

## Automatic Notifications

### Medication Reminders
- Triggered when scheduled medication time arrives
- Can be scheduled via cron job or scheduled task

### AI Warnings
- Automatically sent when patient skips medication (via `record-dose` endpoint with `status="skipped"`)
- AI analyzes risk and generates warning text

### Doctor Instructions
- Sent when doctor uses `/doctor/respond` endpoint
- Automatically translated to patient's preferred language

## Notification Flow

```
Patient Action/Event
    ↓
PatientNotificationsService
    ↓
Generate Notification (with text + language)
    ↓
Emit 'patient.notification' event
    ↓
SSE Stream sends to patient's frontend
    ↓
Frontend receives notification
    ↓
Frontend uses text + language for TTS
    ↓
Patient hears notification in their language
```

## Example Use Cases

### Use Case 1: Medication Reminder
1. Patient has medication scheduled for 8:00 AM
2. System sends reminder at 8:00 AM
3. Patient receives notification: "कृपया अभी अपनी Furosemide दवा लें"
4. Frontend plays TTS in Hindi

### Use Case 2: AI Warning for Skipped Medication
1. Patient skips medication (clicks "Remind Me Later")
2. System sends AI warning: "⚠️ महत्वपूर्ण: कृपया अपनी Furosemide दवा लें। Skipping this medication may cause serious health issues."
3. Patient hears warning in their language
4. Doctor also receives alert via `/alerts/stream`

### Use Case 3: Doctor Instruction
1. Doctor sends message: "Please take your medication on time"
2. System translates to patient's language (e.g., Hindi)
3. Patient receives: "कृपया अपनी दवा समय पर लें"
4. Patient hears TTS in Hindi

## Testing

### Test SSE Stream
```bash
# Terminal 1: Listen to patient notifications
curl -N http://localhost:3000/patient-notifications/stream/9eedabb8-a5e5-4a60-b8d7-3146f545495b

# Terminal 2: Send a reminder
curl -X POST http://localhost:3000/patient-notifications/reminder/9eedabb8-a5e5-4a60-b8d7-3146f545495b \
  -H 'Content-Type: application/json' \
  -d '{
    "drug_name": "Furosemide",
    "scheduled_time": "2025-11-14T10:00:00Z"
  }'
```

### Test AI Warning
```bash
curl -X POST http://localhost:3000/patient-notifications/warning/9eedabb8-a5e5-4a60-b8d7-3146f545495b \
  -H 'Content-Type: application/json' \
  -d '{
    "drug_name": "Furosemide",
    "scheduled_time": "2025-11-14T10:00:00Z"
  }'
```

### Test Doctor Instruction
```bash
curl -X POST http://localhost:3000/patient-notifications/doctor-instruction/9eedabb8-a5e5-4a60-b8d7-3146f545495b \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Please take your medication on time"
  }'
```

