🧭 MedMentor.AI – 12-Hour Hackathon Roadmap
🧠 AI-Driven Medication Adherence & Risk Alert System
🎯 Core Problem to Solve
Elderly or chronic patients often forget or skip critical medicines (e.g., for heart or diabetes), leading to serious health risks.
MedMentor.AI detects missed doses, evaluates risk instantly, and alerts doctors with actionable AI suggestions.
💡 Deliverables (What You’ll Actually Demo)
Component	Description	Tool
🧑‍⚕️ Doctor Dashboard	Shows patients’ risk levels in real time	React + Vite + Tailwind
💊 Patient Panel	Button to “Skip dose” or “Ask AI what happens”	React
🤖 AI Risk API	Returns risk level + AI explanation	FastAPI + MedGemma + BGE
🔔 Real-Time Alert	SSE pushes alert to doctor dashboard instantly	NestJS
🧠 Drug Intelligence	From your 1.5L dataset (used minimally for risk justification)	CSV + Qdrant
⚡ Execution Timeline (12 Hours)
🕗 Hour 0–1 — Kickstart Setup
✅ Create public GitHub repo (team name = repo name)
✅ Initialize:
frontend/ → Vite + Tailwind + React
backend/ → NestJS
ai_service/ → FastAPI (for MedGemma + BGE)
✅ Prepare 5–10 drug samples from your dataset (CSV or JSON)
🕘 Hour 1–3 — Backend + AI Integration
NestJS Backend
Create /patient/skip-dose (POST)
Create /alerts/stream (SSE for doctor dashboard)
When “skip-dose” called → request AI risk from FastAPI → push SSE alert
FastAPI AI Service
Endpoints:
/analyze_skip → input: {drug_name, skips: 3}
Use MedGemma → “What happens if a 63-year-old diabetic skips Furosemide 3 times?”
Return → {risk_level: 'High', message: 'Fluid may accumulate in lungs — needs doctor attention.'}
🕓 Hour 3–6 — Frontend (2 pages only)
👨‍⚕️ Doctor Dashboard
Real-time updates (via SSE)
List of patients + risk color (green/yellow/red)
Click → view AI explanation
💊 Patient UI
Buttons:
“Took Medicine ✅”
“Missed Dose ❌”
“Ask MedMentor” (voice input → AI reply)
Voice handled with Web Speech API
🕕 Hour 6–8 — AI Enhancement + Dataset
Load 20–50 drugs from your 1.5L dataset (locally or Qdrant)
Use BGE embedding to get semantic similarity
e.g., “Furosemide” → other heart drugs with similar effects
If skipped drug = critical, boost risk score
🕗 Hour 8–10 — Doctor Actions + Notification Polish
Add “Doctor Response” button → sends back advice (mock only)
Add sound or popup when new SSE alert arrives
Add AI suggestion text (“Contact patient immediately”)
🕙 Hour 10–12 — Final Demo Prep
Record short scenario:
Patient clicks “Missed Dose”
AI evaluates (via FastAPI)
Doctor dashboard instantly updates (via SSE)
Doctor sees explanation + AI suggestion
Prepare PPT with:
Problem statement (real case)
Solution (AI-driven adherence)
Demo flow (Patient → AI → Doctor)
Future roadmap (IoT pill sensors, family alerts, etc.)
🧩 Simplified Architecture Diagram
          [ Patient App (Vite + React) ]
                     │
           Missed Dose / Voice Query
                     │
          ┌──────────▼───────────┐
          │ NestJS Backend (SSE) │───► Doctor Dashboard (live alerts)
          └──────────▲───────────┘
                     │
             Request AI Analysis
                     │
          ┌──────────▼──────────┐
          │ FastAPI (MedGemma + │
          │ BGE + Drug Dataset) │
          └──────────┬──────────┘
                     │
             Risk Evaluation + Reason
🧠 Judging Power Points (for Presentation)
Judge Criteria	What You’ll Highlight
Innovation (25%)	Real-world case inspired by family loss; proactive AI risk detection
Impact (25%)	Saves lives by detecting skipped doses early
Feasibility (15%)	Uses open models (MedGemma + BGE), runs on local FastAPI
Design (15%)	Clean dual dashboards (patient + doctor)
Clarity (20%)	Story-driven demo + visual alert dashboard
🏁 Final Tip for Hackathon
Focus on:
✅ 1 Working use case (skip-dose → doctor alert)
✅ 1 Drug (like Furosemide) with realistic AI reasoning
✅ Clean demo flow (2 screens + AI + SSE)
✅ Real emotional storytelling (your dad’s case = strong impact 💙)