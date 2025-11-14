from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
from typing import List

from models.schemas import (
    SkipDoseRequest,
    RiskAnalysisResponse,
    VoiceTranscribeResponse,
    VoiceSynthesizeRequest,
    VoiceSynthesizeResponse
)
from services.medgemma_service import MedGemmaService
from services.bge_service import BGEService
from services.drug_service import DrugService
from services.stt_service import STTService
from services.tts_service import TTSService

app = FastAPI(title="MedMentor AI Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
medgemma_service = MedGemmaService()
bge_service = BGEService()
drug_service = DrugService()
stt_service = STTService()
tts_service = TTSService()


@app.get("/")
async def root():
    return {"message": "MedMentor AI Service", "status": "running"}


@app.post("/analyze_skip", response_model=RiskAnalysisResponse)
async def analyze_skip(request: SkipDoseRequest):
    """
    Analyze risk of skipping medication
    """
    try:
        # Get drug information
        drug_info = drug_service.get_drug(request.drug_name)
        
        if not drug_info:
            raise HTTPException(status_code=404, detail=f"Drug '{request.drug_name}' not found in dataset")
        
        # Analyze risk using MedGemma
        analysis = medgemma_service.analyze_skip_risk(
            drug_name=request.drug_name,
            skips=request.skips,
            patient_age=request.patient_age,
            conditions=request.conditions,
            drug_info=drug_info
        )
        
        # Find similar drugs using BGE
        similar_drugs = bge_service.find_similar_drugs(
            request.drug_name,
            drug_service.drugs,
            top_k=3
        )
        
        return RiskAnalysisResponse(
            risk_level=analysis["risk_level"],
            message=analysis["message"],
            ai_explanation=analysis["ai_explanation"],
            similar_drugs=similar_drugs
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing skip risk: {str(e)}")


@app.post("/voice/transcribe", response_model=VoiceTranscribeResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = "hi"
):
    """
    Transcribe audio file (WAV) to text using Sarvam STT
    """
    try:
        # Read audio file
        audio_data = await file.read()
        
        # Validate file type
        if not file.filename.endswith(('.wav', '.mp3', '.m4a', '.ogg')):
            raise HTTPException(status_code=400, detail="Unsupported audio format. Please upload WAV, MP3, M4A, or OGG")
        
        # Transcribe
        result = stt_service.transcribe_audio(audio_data, language)
        
        if not result["text"]:
            raise HTTPException(status_code=500, detail="Transcription failed or returned empty result")
        
        return VoiceTranscribeResponse(
            text=result["text"],
            language=result["language"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error transcribing audio: {str(e)}")


@app.post("/voice/synthesize", response_model=VoiceSynthesizeResponse)
async def synthesize_speech(request: VoiceSynthesizeRequest):
    """
    Synthesize text to speech in specified language using Sarvam TTS
    """
    try:
        audio_path = tts_service.synthesize_speech(request.text, request.language)
        
        # Return relative path that can be served
        return VoiceSynthesizeResponse(
            audio_url=f"/voice/audio/{os.path.basename(audio_path)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error synthesizing speech: {str(e)}")


@app.get("/voice/audio/{filename}")
async def get_audio_file(filename: str):
    """
    Serve generated audio files
    """
    audio_path = os.path.join(tts_service.output_dir, filename)
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(audio_path)


@app.get("/drugs")
async def list_drugs():
    """
    List all drugs in dataset
    """
    return {"drugs": drug_service.drugs, "count": len(drug_service.drugs)}


@app.get("/drugs/{drug_name}")
async def get_drug(drug_name: str):
    """
    Get specific drug information
    """
    drug = drug_service.get_drug(drug_name)
    if not drug:
        raise HTTPException(status_code=404, detail=f"Drug '{drug_name}' not found")
    return drug


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

