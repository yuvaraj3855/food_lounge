import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AIService } from '../ai/ai.service';
import { StorageService } from '../services/storage.service';
import {
  PatientDto,
  CreatePatientDto,
  AlertDto,
  MedicationDoseDto,
} from '../dto';
import { MedicationDetailDto } from '../dto/medication-detail.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PatientService {
  constructor(
    private readonly aiService: AIService,
    private readonly eventEmitter: EventEmitter2,
    private readonly storage: StorageService,
  ) {
    // Initialize with sample patients for demo (async, but don't await in constructor)
    this.initializeSamplePatients().catch((err) => {
      console.error('Error initializing sample patients:', err);
    });
  }

  private async initializeSamplePatients() {
    // Check if doctor already exists
    const existingDoctor = await this.storage.getDoctor('doctor-1');
    if (!existingDoctor) {
      // Create default doctor
      const defaultDoctor = {
        id: 'doctor-1',
        name: 'Dr. Anjali Mehta',
        email: 'dr.mehta@medmentor.ai',
        specialization: 'Cardiologist',
        patient_ids: [],
      };
      await this.storage.saveDoctor(defaultDoctor);
    }

    // Check if patients already exist
    const existingPatients = await this.storage.getAllPatients();
    if (existingPatients.length > 0) {
      return; // Already initialized
    }

    const samplePatients: CreatePatientDto[] = [
      {
        name: 'Rajesh Kumar',
        age: 63,
        conditions: ['Type 2 Diabetes', 'Heart Failure'],
        current_medications: ['Furosemide', 'Metformin', 'Lisinopril'],
        doctor_id: 'doctor-1',
      },
      {
        name: 'Priya Sharma',
        age: 58,
        conditions: ['Hypertension'],
        current_medications: ['Amlodipine', 'Atorvastatin'],
        doctor_id: 'doctor-1',
      },
      {
        name: 'Suresh Patel',
        age: 71,
        conditions: ['Atrial Fibrillation'],
        current_medications: ['Warfarin', 'Digoxin'],
        doctor_id: 'doctor-1',
      },
    ];

    for (const patient of samplePatients) {
      const id = uuidv4();
      const patientDto: PatientDto = {
        id,
        ...patient,
        risk_level: undefined,
      };
      await this.storage.savePatient(patientDto);
      if (patient.doctor_id) {
        await this.storage.assignPatientToDoctor(id, patient.doctor_id);
      }
    }
  }

  async getAllPatients(): Promise<PatientDto[]> {
    return this.storage.getAllPatients();
  }

  async getPatientsByDoctor(doctorId: string): Promise<PatientDto[]> {
    return this.storage.getPatientsByDoctor(doctorId);
  }

  async getPatientById(id: string): Promise<PatientDto | null> {
    return this.storage.getPatient(id);
  }

  async createPatient(
    createPatientDto: CreatePatientDto,
    medicationDetails?: MedicationDetailDto[],
  ): Promise<PatientDto> {
    const id = uuidv4();
    const patient: PatientDto = {
      id,
      ...createPatientDto,
      risk_level: undefined,
    };
    await this.storage.savePatient(patient);
    
    // Save medication details if provided
    if (medicationDetails && medicationDetails.length > 0) {
      await this.storage.saveMedications(id, medicationDetails);
    }
    
    if (createPatientDto.doctor_id) {
      await this.storage.assignPatientToDoctor(id, createPatientDto.doctor_id);
    }
    
    // Return patient with medication details
    const savedPatient = await this.storage.getPatient(id);
    return savedPatient || patient;
  }

  async recordDose(
    patientId: string,
    drugName: string,
    status: 'taken' | 'skipped',
    scheduledTime?: Date,
  ): Promise<MedicationDoseDto> {
    const patient = await this.storage.getPatient(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const dose: MedicationDoseDto = {
      id: uuidv4(),
      patient_id: patientId,
      drug_name: drugName,
      status,
      scheduled_time: scheduledTime || new Date(),
      actual_time: status === 'taken' ? new Date() : undefined,
      created_at: new Date(),
    };

    await this.storage.saveMedicationDose(dose);

    // If skipped, create alert
    if (status === 'skipped') {
      await this.createSkipAlert(patientId, drugName, 1);
    }

    return dose;
  }

  async recordSkipDose(
    patientId: string,
    drugName: string,
    skips: number,
  ): Promise<AlertDto> {
    const patient = await this.storage.getPatient(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Record the skipped doses
    for (let i = 0; i < skips; i++) {
      await this.recordDose(patientId, drugName, 'skipped');
    }

    return this.createSkipAlert(patientId, drugName, skips);
  }

  private async createSkipAlert(
    patientId: string,
    drugName: string,
    skips: number,
  ): Promise<AlertDto> {
    const patient = await this.storage.getPatient(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Call AI service for risk analysis
    const riskAnalysis = await this.aiService.analyzeSkipRisk(
      drugName,
      skips,
      patient.age,
      patient.conditions,
    );

    // Update patient risk level
    patient.risk_level = riskAnalysis.risk_level;
    patient.last_alert = new Date();
    await this.storage.savePatient(patient);

    // Create and save alert
    const alert: AlertDto = {
      id: uuidv4(),
      patient_id: patientId,
      patient_name: patient.name,
      drug_name: drugName,
      risk_level: riskAnalysis.risk_level,
      message: riskAnalysis.message,
      ai_explanation: riskAnalysis.ai_explanation,
      timestamp: new Date(),
      acknowledged: false,
    };

    // Save alert to storage
    await this.storage.saveAlert(alert);

    // Emit alert event for SSE
    this.eventEmitter.emit('alert.created', alert);

    return alert;
  }

  async getMedicationHistory(patientId: string) {
    return this.storage.getMedicationHistory(patientId);
  }

  async getRecentDoses(patientId: string, limit: number = 10) {
    return this.storage.getRecentDoses(patientId, limit);
  }

  async handleVoiceQuery(
    audioFile: { buffer: Buffer; mimetype: string; originalname: string },
    language: string = 'hi',
    patientId: string,
  ): Promise<{ text: string; audio_url: string }> {
    const patient = await this.storage.getPatient(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Transcribe audio
    const transcription = await this.aiService.transcribeAudio(
      audioFile,
      language,
    );

    // For demo: Simple query handling
    // In production, this would use AI to understand the query and generate response
    let responseText = '';
    const query = transcription.text.toLowerCase();

    if (query.includes('miss') || query.includes('skip') || query.includes('forgot')) {
      responseText = `आपने अपनी दवा छोड़ दी है। कृपया अपने डॉक्टर से संपर्क करें।`;
    } else if (query.includes('side effect') || query.includes('नुकसान')) {
      responseText = `कृपया अपने डॉक्टर से दवा के दुष्प्रभावों के बारे में पूछें।`;
    } else {
      responseText = `मैं आपकी मदद करने के लिए यहाँ हूँ। कृपया अपने डॉक्टर से परामर्श करें।`;
    }

    // Synthesize response
    const audioUrl = await this.aiService.synthesizeSpeech(
      responseText,
      language,
    );

    return {
      text: responseText,
      audio_url: audioUrl,
    };
  }
}

