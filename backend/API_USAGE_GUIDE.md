# MedMentor.AI API Usage Guide

## Overview
This document explains **where**, **when**, and **why** to use each API endpoint in the MedMentor.AI system. Use this guide to understand the complete flow and integration points.

---

## 🏥 Patient Management Endpoints

### 1. `POST /patient` - Create New Patient
**Where to use:** Patient registration/onboarding screen  
**When to use:** When a doctor adds a new patient to the system  
**Why needed:** Initial patient setup with medication prescriptions

**Request Body:**
```json
{
  "name": "Rajesh Kumar",
  "age": 63,
  "conditions": ["Type 2 Diabetes", "Heart Failure"],
  "current_medications": ["Furosemide", "Metformin", "Lisinopril"],
  "doctor_id": "doctor-1",
  "medication_details": [
    {
      "drug_name": "Furosemide",
      "dosage": "40mg",
      "frequency": "twice daily",
      "timing": "morning and evening",
      "purpose": "Diuretic for heart failure",
      "risk_level": "High",
      "instructions": "Take with food"
    }
  ]
}
```

**Use Cases:**
- Doctor onboarding a new patient
- Initial medication prescription entry
- Setting up medication risk levels for AI analysis

**AI Integration:**
- Medication `risk_level` is used by AI when analyzing skipped doses
- AI considers patient age, conditions, and medication risk levels

---

### 2. `GET /patient` - Get All Patients
**Where to use:** Admin dashboard, patient list view  
**When to use:** Displaying all patients in the system  
**Why needed:** Overview of all patients for management

**Response:** Returns array of patients with `medication_details` included

**Use Cases:**
- Patient list page
- Search/filter functionality
- Admin overview

---

### 3. `GET /patient/:id` - Get Patient by ID
**Where to use:** Patient detail page, profile view  
**When to use:** Viewing individual patient information  
**Why needed:** Complete patient profile with all medication details

**Response:** Single patient object with:
- Basic info (name, age, conditions)
- Current medications list
- Detailed medication information (`medication_details`)
- Current risk level (AI-updated)
- Last alert timestamp

**Use Cases:**
- Patient profile page
- Before recording doses
- Checking patient status

---

### 4. `GET /patient/doctor/:doctorId` - Get Patients by Doctor
**Where to use:** Doctor's patient list page  
**When to use:** Doctor viewing their assigned patients  
**Why needed:** Doctor-specific patient view

**Response:** Array of patients assigned to the doctor

**Use Cases:**
- Doctor dashboard patient list
- Filtering by doctor
- Doctor-patient assignment management

---

### 5. `GET /patient/:id/medication-history` - Get Medication History
**Where to use:** Patient medication adherence report  
**When to use:** Viewing historical dose records  
**Why needed:** Track medication adherence over time

**Response:** Medication history grouped by drug:
```json
[
  {
    "drug_name": "Furosemide",
    "total_taken": 45,
    "total_skipped": 5,
    "adherence_rate": 90.0,
    "recent_doses": [...]
  }
]
```

**Use Cases:**
- Patient adherence report
- Doctor reviewing patient compliance
- Analytics and insights

---

### 6. `GET /patient/:id/recent-doses` - Get Recent Doses
**Where to use:** Patient dashboard, recent activity view  
**When to use:** Showing recent medication activity  
**Why needed:** Quick view of recent dose records

**Query Parameters:**
- `limit` (optional): Number of doses to return (default: 10)

**Use Cases:**
- Recent activity widget
- Quick status check
- Timeline view

---

### 7. `POST /patient/record-dose` - Record Medication Dose
**Where to use:** Patient app, medication reminder response  
**When to use:** Patient takes or skips a medication  
**Why needed:** Track actual medication adherence

**Request Body:**
```json
{
  "patient_id": "patient-uuid",
  "drug_name": "Furosemide",
  "status": "taken",  // or "skipped"
  "scheduled_time": "2024-01-15T08:00:00Z"
}
```

**Use Cases:**
- Patient marking medication as taken
- Recording skipped doses
- Medication reminder app integration

**AI Integration:**
- If `status: "skipped"`, automatically triggers AI risk analysis
- Creates alert with AI-determined risk level

---

### 8. `POST /patient/skip-dose` - Record Skipped Dose (with AI Analysis)
**Where to use:** Patient app, alert system  
**When to use:** When patient explicitly reports skipping medication  
**Why needed:** Immediate AI risk assessment for skipped doses

**Request Body:**
```json
{
  "patient_id": "patient-uuid",
  "drug_name": "Furosemide",
  "skips": 1
}
```

**What Happens:**
1. Records skipped dose(s)
2. **Calls AI service** `/analyze_skip` with:
   - Drug name
   - Number of skips
   - Patient age
   - Patient conditions
3. AI analyzes risk and returns:
   - Risk level (Low/Medium/High)
   - Risk message
   - AI explanation
4. Updates patient `risk_level` in database
5. Creates alert for doctor
6. Emits SSE event for real-time notification

**Use Cases:**
- Patient reporting missed medication
- Automatic risk assessment
- Doctor alert generation

**AI Integration Point:**
- **Primary AI endpoint** - This is where AI risk analysis happens
- AI considers:
  - Medication risk level (from `medication_details`)
  - Patient age and conditions
  - Number of consecutive skips
  - Drug interaction risks

---

### 9. `POST /patient/voice-query` - Process Voice Query
**Where to use:** Patient voice interface  
**When to use:** Patient asks questions via voice (Indian languages)  
**Why needed:** Voice-based interaction for elderly patients

**Request:** Multipart form-data with WAV audio file

**Query Parameters:**
- `language` (optional): Language code (hi, en, ta, etc.) - default: 'hi'
- `patient_id` (optional): Patient ID

**What Happens:**
1. Receives WAV audio file
2. **Calls AI service** `/voice/transcribe` (Sarvam STT)
3. Transcribes audio to text
4. Processes query (can integrate with MedGemma for Q&A)
5. **Calls AI service** `/voice/synthesize` (Sarvam TTS)
6. Returns text and audio URL

**Response:**
```json
{
  "text": "आपने अपनी दवा छोड़ दी है।",
  "audio_url": "http://localhost:8000/voice/audio/abc123.wav"
}
```

**Use Cases:**
- Voice-based medication queries
- Elderly patient interface
- Multilingual support (Hindi, Tamil, etc.)

**AI Integration Points:**
- **STT Service:** Sarvam AI for speech-to-text
- **TTS Service:** Sarvam AI for text-to-speech
- **Optional:** MedGemma for intelligent Q&A responses

---

## 👨‍⚕️ Doctor Dashboard Endpoints

### 10. `GET /doctor/dashboard/:doctorId` - Get Doctor Dashboard
**Where to use:** Doctor's main dashboard page  
**When to use:** Doctor logging in or refreshing dashboard  
**Why needed:** Comprehensive view of all patients and their status

**Response:** Complete dashboard with:
```json
{
  "doctor_id": "doctor-1",
  "doctor_name": "Dr. Sharma",
  "total_patients": 3,
  "high_risk_patients": 1,
  "medium_risk_patients": 1,
  "low_risk_patients": 1,
  "patients": [
    {
      "id": "patient-1",
      "name": "Rajesh Kumar",
      "age": 63,
      "conditions": ["Type 2 Diabetes", "Heart Failure"],
      "current_medications": ["Furosemide", "Metformin"],
      "medication_details": [...],  // Full medication info
      "risk_level": "High",  // AI-updated
      "medication_history": [...],
      "recent_alerts": [...],
      "total_doses_taken": 45,
      "total_doses_skipped": 5,
      "adherence_rate": 90.0
    }
  ]
}
```

**Use Cases:**
- Doctor dashboard on login
- Overview of all patients
- Risk assessment at a glance
- Patient adherence metrics

**Why Important:**
- Shows AI-updated risk levels for each patient
- Includes medication details for context
- Provides adherence metrics for decision-making

---

### 11. `GET /doctor/patient/:doctorId/:patientId` - Get Patient Details
**Where to use:** Doctor viewing specific patient details  
**When to use:** Doctor clicks on a patient from dashboard  
**Why needed:** Detailed patient view with full history

**Response:** Same as dashboard patient object but for single patient

**Use Cases:**
- Patient detail page
- Before responding to alerts
- Reviewing patient medication history

---

### 12. `POST /doctor/respond` - Doctor Response to Alert
**Where to use:** Doctor alert response interface  
**When to use:** Doctor responding to a patient alert  
**Why needed:** Doctor can provide guidance on alerts

**Request Body:**
```json
{
  "alertId": "alert-123",
  "response": "Please take your medication immediately and monitor symptoms."
}
```

**Use Cases:**
- Doctor responding to high-risk alerts
- Providing patient guidance
- Alert acknowledgment with instructions

**Note:** Currently returns mock response. Can be extended to:
- Save response to database
- Send notification to patient
- Create message in conversation

---

## 🚨 Alert Endpoints

### 13. `SSE /alerts/stream` - Real-Time Alert Stream
**Where to use:** Doctor dashboard (real-time alert panel)  
**When to use:** Continuous connection for live alerts  
**Why needed:** Real-time notification of new alerts without polling

**How it works:**
- Establishes Server-Sent Events (SSE) connection
- Streams alerts as they are created
- Automatically triggered when `POST /patient/skip-dose` creates alert

**Use Cases:**
- Real-time alert notifications
- Live dashboard updates
- Immediate doctor notification

**Integration:**
- Automatically emits when `alert.created` event is fired
- No polling needed - push-based updates

---

### 14. `GET /alerts` - Get All Alerts
**Where to use:** Alerts management page  
**When to use:** Viewing all alerts in the system  
**Why needed:** Complete alert history

**Response:** Array of all alerts with AI analysis

**Use Cases:**
- Alert history page
- Admin alert management
- Audit trail

---

### 15. `GET /alerts/patient/:patientId` - Get Patient Alerts
**Where to use:** Patient detail page, alert history  
**When to use:** Viewing alerts for specific patient  
**Why needed:** Patient-specific alert history

**Response:** Array of alerts for the patient

**Use Cases:**
- Patient alert history
- Doctor reviewing patient alerts
- Alert timeline

---

### 16. `POST /alerts/acknowledge` - Acknowledge Alert
**Where to use:** Alert notification interface  
**When to use:** Doctor acknowledges an alert  
**Why needed:** Track which alerts have been reviewed

**Request Body:**
```json
{
  "alertId": "alert-123"
}
```

**Use Cases:**
- Marking alerts as reviewed
- Alert management
- Reducing alert noise

---

## 💬 Message Endpoints

### 17. `POST /messages` - Send Text Message
**Where to use:** Doctor-patient chat interface  
**When to use:** Sending text messages between doctor and patient  
**Why needed:** Communication channel

**Request Body:**
```json
{
  "patient_id": "patient-1",
  "doctor_id": "doctor-1",
  "sender": "doctor",  // or "patient"
  "message": "Please take your medication as prescribed.",
  "language": "en"
}
```

**Use Cases:**
- Doctor-patient communication
- Follow-up messages
- Medication reminders

---

### 18. `POST /messages/voice` - Send Voice Message
**Where to use:** Voice messaging interface  
**When to use:** Sending voice messages (especially for elderly patients)  
**Why needed:** Voice-based communication in Indian languages

**Request:** Multipart form-data with WAV audio file

**Query Parameters:**
- `patient_id`: Patient ID
- `doctor_id`: Doctor ID
- `language` (optional): Language code - default: 'hi'

**What Happens:**
1. Receives WAV audio file
2. **Calls AI service** `/voice/transcribe` (Sarvam STT)
3. Transcribes to text
4. Creates message with transcribed text
5. Stores in database

**Use Cases:**
- Voice messaging for elderly patients
- Multilingual communication
- Natural conversation interface

**AI Integration:**
- Uses Sarvam STT for transcription
- Supports Hindi, Tamil, Telugu, etc.

---

### 19. `GET /messages/conversation/:patientId/:doctorId` - Get Conversation
**Where to use:** Chat interface  
**When to use:** Loading conversation history  
**Why needed:** Display message thread

**Response:** Conversation object with messages array

**Use Cases:**
- Chat interface
- Message history
- Conversation thread

---

### 20. `GET /messages/doctor/:doctorId` - Get Doctor Conversations
**Where to use:** Doctor's message inbox  
**When to use:** Viewing all conversations for a doctor  
**Why needed:** Doctor message management

**Response:** Array of conversations

**Use Cases:**
- Doctor message inbox
- Conversation list
- Message management

---

### 21. `GET /messages/patient/:patientId` - Get Patient Conversations
**Where to use:** Patient's message inbox  
**When to use:** Viewing all conversations for a patient  
**Why needed:** Patient message management

**Response:** Array of conversations

**Use Cases:**
- Patient message inbox
- Conversation list

---

### 22. `POST /messages/:messageId/read` - Mark Message as Read
**Where to use:** Message notification system  
**When to use:** Marking messages as read  
**Why needed:** Read/unread status tracking

**Use Cases:**
- Read receipt
- Unread message count
- Notification management

---

## 🤖 AI Service Integration Points

### AI Endpoints (FastAPI Service - Port 8000)

#### 1. `POST /analyze_skip` - AI Risk Analysis
**Called by:** `POST /patient/skip-dose`  
**Purpose:** Analyze risk of skipped medication  
**Input:**
```json
{
  "drug_name": "Furosemide",
  "skips": 1,
  "patient_age": 63,
  "conditions": ["Type 2 Diabetes", "Heart Failure"]
}
```

**Output:**
```json
{
  "risk_level": "High",
  "message": "Critical: Heart failure medication skipped",
  "ai_explanation": "Furosemide is critical for managing heart failure...",
  "similar_drugs": ["Bumetanide", "Torsemide"]
}
```

**AI Models Used:**
- MedGemma (via Ollama) - Medical knowledge analysis
- BGE (via Ollama) - Drug similarity search
- Drug dataset - Risk justification

**Why Needed:**
- Determines patient risk level
- Provides medical explanation
- Identifies similar drugs for context

---

#### 2. `POST /voice/transcribe` - Speech-to-Text
**Called by:** 
- `POST /patient/voice-query`
- `POST /messages/voice`

**Purpose:** Convert audio to text (Indian languages)  
**Input:** WAV audio file + language code

**Output:**
```json
{
  "text": "मैंने अपनी दवा ली है",
  "language": "hi"
}
```

**AI Service:** Sarvam AI STT  
**Why Needed:** Voice input for elderly patients in native languages

---

#### 3. `POST /voice/synthesize` - Text-to-Speech
**Called by:** `POST /patient/voice-query`  
**Purpose:** Convert text to audio (Indian languages)  
**Input:**
```json
{
  "text": "आपने अपनी दवा छोड़ दी है",
  "language": "hi"
}
```

**Output:**
```json
{
  "audio_url": "/voice/audio/abc123.wav"
}
```

**AI Service:** Sarvam AI TTS  
**Why Needed:** Voice output for elderly patients in native languages

---

#### 4. `GET /drugs` - Get All Drugs
**Purpose:** List all available drugs in dataset  
**Use Cases:** Drug search, autocomplete

---

#### 5. `GET /drugs/{drug_name}` - Get Drug Information
**Purpose:** Get detailed drug information  
**Use Cases:** Drug lookup, risk assessment

---

## 🔄 Complete Flow Examples

### Flow 1: Patient Skips Medication → Doctor Alert
1. **Patient skips medication:**
   - `POST /patient/skip-dose` with drug name and skips count

2. **Backend processes:**
   - Records skipped dose(s)
   - Calls `POST /analyze_skip` (AI service)
   - AI analyzes risk using MedGemma + BGE + drug dataset
   - Updates patient `risk_level` in database
   - Creates alert with AI analysis

3. **Real-time notification:**
   - SSE `/alerts/stream` emits new alert
   - Doctor dashboard receives real-time notification

4. **Doctor views:**
   - `GET /doctor/dashboard/:doctorId` shows updated risk level
   - `GET /alerts/patient/:patientId` shows alert details

5. **Doctor responds:**
   - `POST /doctor/respond` with guidance
   - `POST /messages` to send message to patient

---

### Flow 2: Voice Query from Patient
1. **Patient speaks:**
   - `POST /patient/voice-query` with WAV file (Hindi)

2. **Backend processes:**
   - Calls `POST /voice/transcribe` (Sarvam STT)
   - Transcribes: "मैंने दवा छोड़ दी"
   - Processes query (can use MedGemma for Q&A)
   - Calls `POST /voice/synthesize` (Sarvam TTS)
   - Returns text + audio URL

3. **Patient receives:**
   - Text response
   - Audio file in Hindi

---

### Flow 3: Doctor Dashboard View
1. **Doctor logs in:**
   - `GET /doctor/dashboard/:doctorId`

2. **Response includes:**
   - All patients with medication details
   - AI-updated risk levels
   - Medication history
   - Recent alerts
   - Adherence metrics

3. **Doctor can:**
   - View patient details: `GET /doctor/patient/:doctorId/:patientId`
   - View alerts: `GET /alerts/patient/:patientId`
   - Send message: `POST /messages`

---

## 📊 Data Flow Summary

### Medication Details Flow:
```
POST /patient (with medication_details)
  ↓
Save to medications table
  ↓
GET /patient or /doctor/dashboard
  ↓
Load with relations: ['medications']
  ↓
Return medication_details in response
```

### Risk Level Flow:
```
POST /patient/skip-dose
  ↓
Call AI: POST /analyze_skip
  ↓
AI analyzes (MedGemma + BGE + dataset)
  ↓
Update patient.risk_level
  ↓
Create alert
  ↓
SSE emits alert
  ↓
GET endpoints return updated risk_level
```

### Voice Flow:
```
POST /patient/voice-query (WAV file)
  ↓
AI: POST /voice/transcribe (Sarvam STT)
  ↓
Process query
  ↓
AI: POST /voice/synthesize (Sarvam TTS)
  ↓
Return text + audio URL
```

---

## 🎯 Key Integration Points for AI Implementation

1. **Risk Analysis** (`POST /analyze_skip`):
   - MedGemma for medical reasoning
   - BGE for drug similarity
   - Drug dataset for risk justification

2. **Voice Processing**:
   - Sarvam STT for transcription
   - Sarvam TTS for synthesis
   - MedGemma for intelligent responses (optional)

3. **Data Sources:**
   - Patient medication details (risk levels)
   - Patient age and conditions
   - Drug information from dataset

---

## ✅ Checklist for AI Implementation

- [ ] Set up Ollama with MedGemma model
- [ ] Set up Ollama with BGE model
- [ ] Configure Sarvam AI API keys
- [ ] Load drug dataset
- [ ] Implement `/analyze_skip` endpoint
- [ ] Implement `/voice/transcribe` endpoint
- [ ] Implement `/voice/synthesize` endpoint
- [ ] Test risk analysis with sample data
- [ ] Test voice transcription (Hindi)
- [ ] Test voice synthesis (Hindi)
- [ ] Verify AI updates patient risk_level
- [ ] Verify alerts include AI explanation

---

This guide provides complete context for implementing the AI service. All endpoints are ready and waiting for AI integration!

