# 🏗️ MedMentor.AI - High-Level Architecture

## System Overview

MedMentor.AI is an AI-driven medication adherence and risk alert system that detects missed doses, evaluates risk instantly, and alerts doctors with actionable AI suggestions.

---

## 📐 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Patient App (Vite + React)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Missed Dose  │  │ Voice Query  │  │ View History │         │
│  │   Button     │  │   (WAV)      │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼───────────────┘
          │                  │                  │
          │ POST /patient/record-dose
          │ POST /patient/voice-query
          │ GET  /patient/:id/medication-history
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│              NestJS Backend (Fastify + PostgreSQL)              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Patient Service                                         │   │
│  │  - Record dose (taken/skipped)                           │   │
│  │  - Handle voice queries                                   │   │
│  │  - Manage patient data                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  AI Service (HTTP Client)                                │   │
│  │  - Call FastAPI for risk analysis                        │   │
│  │  - Call STT/TTS services                                  │   │
│  │  - Handle translation                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Alert Service (EventEmitter + SSE)                      │   │
│  │  - Generate alerts on skipped doses                       │   │
│  │  - Push to doctor dashboard via SSE                       │   │
│  │  - Push to patient notifications via SSE                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database (TypeORM)                           │   │
│  │  - patients, doctors, medications                         │   │
│  │  - medication_doses, alerts, messages                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────┬───────────────────────────────────────────────────────┘
          │
          │ HTTP Request: POST /analyze_skip
          │ { drug_name, skips, patient_age, conditions }
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│              FastAPI AI Service (Python)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  MedGemma Service (Ollama)                               │   │
│  │  - Risk analysis using Gemma 4b model                    │   │
│  │  - Structured output: risk_level, message, explanation   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  BGE Service (Ollama)                                    │   │
│  │  - Drug similarity using BGE-M3 embeddings              │   │
│  │  - Find similar drugs for recommendations                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Drug Service                                            │   │
│  │  - Load 100 real drugs from drug_data.json              │   │
│  │  - Search by name, salt, or indication                  │   │
│  │  - Determine criticality and category                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  STT Service (Hybrid)                                    │   │
│  │  - Whisper API (English)                                 │   │
│  │  - IndicConformer (22 Indian languages)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  TTS Service                                             │   │
│  │  - Sarvam API (primary)                                  │   │
│  │  - gTTS (fallback)                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Translation Service                                     │   │
│  │  - Sarvam Translation API                                │   │
│  │  - Auto-translate AI responses to patient language       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────┬───────────────────────────────────────────────────────┘
          │
          │ External Services
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External AI Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Ollama     │  │    Sarvam    │  │   Whisper    │         │
│  │  (Local/     │  │     API      │  │     API      │         │
│  │   Remote)    │  │              │  │              │         │
│  │              │  │ - Translation│  │ - English    │         │
│  │ - Gemma 4b   │  │ - TTS        │  │   STT        │         │
│  │ - BGE-M3     │  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
          │
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Doctor Dashboard (React + SSE)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Real-Time Alert Stream                                  │   │
│  │  - Live updates via Server-Sent Events (SSE)             │   │
│  │  - Risk level indicators (High/Medium/Low)                │   │
│  │  - AI explanations and recommendations                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Patient List View                                       │   │
│  │  - All patients with current risk status                 │   │
│  │  - Medication adherence tracking                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. **Patient Misses Dose Flow**

```
Patient App
    │
    │ POST /patient/record-dose
    │ { patient_id, drug_name, status: "skipped" }
    │
    ▼
NestJS Backend
    │
    │ 1. Save dose record to PostgreSQL
    │ 2. Trigger AI analysis
    │
    │ POST http://localhost:8000/analyze_skip
    │ { drug_name, skips: 1, patient_age, conditions }
    │
    ▼
FastAPI AI Service
    │
    │ 1. Lookup drug in dataset (drug_service.get_drug)
    │ 2. Analyze risk (medgemma_service.analyze_skip_risk)
    │ 3. Find similar drugs (bge_service.find_similar_drugs)
    │
    │ Response: { risk_level, message, ai_explanation, similar_drugs }
    │
    ▼
NestJS Backend
    │
    │ 1. Create alert record in database
    │ 2. Emit 'alert.created' event
    │ 3. Push to doctor SSE stream
    │ 4. Push to patient SSE stream (translated)
    │
    ▼
Doctor Dashboard (SSE)
    │
    │ Real-time alert appears:
    │ - Patient name
    │ - Drug name
    │ - Risk level (High/Medium/Low)
    │ - AI explanation
    │
    ▼
Patient App (SSE)
    │
    │ Notification received:
    │ - Translated warning message
    │ - Risk level
    │ - Instructions
```

### 2. **Voice Query Flow**

```
Patient App
    │
    │ POST /patient/voice-query
    │ { file: WAV, language: "hi", patient_id }
    │
    ▼
NestJS Backend
    │
    │ POST http://localhost:8000/voice/transcribe
    │ { file: WAV, language: "hi" }
    │
    ▼
FastAPI AI Service
    │
    │ STT Service:
    │ - If English → Whisper API
    │ - If Indian language → IndicConformer
    │
    │ Response: { text: "मैंने दवा छोड़ दी", language: "hi" }
    │
    ▼
NestJS Backend
    │
    │ 1. Process query text
    │ 2. Generate response (using AI if needed)
    │ 3. Translate to patient language
    │
    │ POST http://localhost:8000/translate
    │ { text: response, target_language: "Hindi" }
    │
    │ Response: { text: "translated text", language: "hi" }
    │
    ▼
Patient App
    │
    │ Display text response
    │ (Frontend handles TTS if needed)
```

### 3. **Real-Time Alert Flow**

```
Skipped Dose Event
    │
    ▼
Alert Service (EventEmitter)
    │
    │ Emit: 'alert.created'
    │
    ▼
SSE Stream Handlers
    │
    ├─► Doctor SSE Stream
    │   │
    │   │ GET /alerts/stream
    │   │
    │   ▼
    │   Doctor Dashboard
    │   - Live alert appears
    │   - Risk level indicator
    │   - AI explanation
    │
    └─► Patient SSE Stream
        │
        │ GET /patient-notifications/stream/:patientId
        │
        ▼
        Patient App
        - Warning notification
        - Translated message
        - Instructions
```

---

## 🏛️ Architecture Layers

### **Layer 1: Presentation Layer**
- **Patient App:** React + Vite + Tailwind
- **Doctor Dashboard:** React + SSE for real-time updates
- **Responsibilities:**
  - User interface
  - User interactions
  - Display real-time alerts
  - Voice input/output

### **Layer 2: API Gateway Layer**
- **NestJS Backend:** Fastify adapter
- **Responsibilities:**
  - Request routing
  - Authentication (if needed)
  - Request validation
  - Response formatting
  - SSE stream management

### **Layer 3: Business Logic Layer**
- **NestJS Services:**
  - PatientService
  - AlertsService
  - DoctorService
  - MessagesService
  - PatientNotificationsService
- **Responsibilities:**
  - Business rules
  - Data validation
  - Event generation
  - Service orchestration

### **Layer 4: Data Access Layer**
- **TypeORM Repositories**
- **PostgreSQL Database**
- **Responsibilities:**
  - Data persistence
  - Data retrieval
  - Transaction management
  - Data relationships

### **Layer 5: AI Service Layer**
- **FastAPI Service**
- **Responsibilities:**
  - AI model integration
  - Risk analysis
  - Drug intelligence
  - Voice processing
  - Translation

### **Layer 6: External Services Layer**
- **Ollama:** Local/Remote AI models
- **Sarvam API:** Translation & TTS
- **Whisper API:** English STT
- **Responsibilities:**
  - AI model execution
  - Language processing
  - External API calls

---

## 🔌 Communication Patterns

### **1. Synchronous HTTP (Request-Response)**
- Patient → Backend → AI Service
- Used for: Dose recording, voice queries, data retrieval

### **2. Server-Sent Events (SSE)**
- Backend → Doctor Dashboard (one-way)
- Backend → Patient App (one-way)
- Used for: Real-time alerts, notifications

### **3. Event-Driven (Internal)**
- EventEmitter2 for internal events
- Used for: Alert creation, notification triggers

---

## 📊 Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + Vite + Tailwind | User interface |
| **Backend** | NestJS + Fastify | API gateway, business logic |
| **Database** | PostgreSQL + TypeORM | Data persistence |
| **AI Service** | FastAPI + Python | AI processing |
| **AI Models** | Ollama (Gemma 4b, BGE-M3) | Risk analysis, embeddings |
| **STT** | Whisper API + IndicConformer | Speech-to-text |
| **TTS** | Sarvam API + gTTS | Text-to-speech |
| **Translation** | Sarvam API | Language translation |
| **Real-time** | Server-Sent Events (SSE) | Live updates |

---

## 🔐 Key Design Decisions

### **1. Microservices Architecture**
- **Backend (NestJS)** and **AI Service (FastAPI)** are separate
- Allows independent scaling
- Clear separation of concerns

### **2. Event-Driven Alerts**
- Uses EventEmitter2 for internal events
- SSE for real-time client updates
- Decoupled alert generation and delivery

### **3. Hybrid STT Approach**
- Whisper for English (better accuracy)
- IndicConformer for Indian languages (native support)
- Automatic routing based on language parameter

### **4. Multilingual Support**
- Patient language preference stored in database
- Auto-translation of AI responses
- UTF-8 encoding for proper character display

### **5. Drug Dataset Integration**
- Real pharmaceutical data (100 drugs)
- Automatic format conversion
- Flexible search (name, salt, indication)

---

## 🚀 Scalability Considerations

### **Current Setup:**
- Single backend instance
- Single AI service instance
- PostgreSQL database (remote)
- Ollama (remote)

### **Future Scalability:**
- **Horizontal Scaling:** Multiple backend/AI service instances
- **Load Balancing:** Nginx/HAProxy for request distribution
- **Caching:** Redis for frequently accessed data
- **Message Queue:** RabbitMQ/Kafka for async processing
- **Database:** Read replicas for read-heavy operations

---

## 🔍 Monitoring & Observability

### **Current:**
- Console logging
- Error handling with proper HTTP status codes
- Swagger documentation for API exploration

### **Recommended Additions:**
- Structured logging (Winston/Pino)
- Metrics collection (Prometheus)
- Distributed tracing (Jaeger)
- Health check endpoints
- Performance monitoring

---

## 📝 Summary

This architecture provides:
- ✅ **Real-time alerts** via SSE
- ✅ **AI-powered risk analysis** via FastAPI
- ✅ **Multilingual support** for 23 languages
- ✅ **Scalable design** with clear separation of concerns
- ✅ **Event-driven** alert system
- ✅ **Comprehensive drug intelligence** from real dataset

The system is designed to be:
- **Modular:** Clear separation between layers
- **Scalable:** Can scale components independently
- **Maintainable:** Well-documented and organized
- **Extensible:** Easy to add new features

