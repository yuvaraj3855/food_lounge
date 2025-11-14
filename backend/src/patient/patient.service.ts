import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AIService } from '../ai/ai.service';
import { StorageService } from '../services/storage.service';
import { PatientNotificationsService } from '../services/patient-notifications.service';
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
    @Optional() private readonly patientNotificationsService?: PatientNotificationsService,
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
      language: createPatientDto.language || 'hi', // Default to Hindi
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

  async updatePatient(
    id: string,
    updateDto: Partial<{
      name: string;
      age: number;
      conditions: string[];
      current_medications: string[];
      doctor_id: string;
      language: string;
      medication_details?: MedicationDetailDto[];
    }>,
  ): Promise<PatientDto> {
    const existingPatient = await this.storage.getPatient(id);
    if (!existingPatient) {
      throw new NotFoundException('Patient not found');
    }

    // Extract medication_details if provided
    const medicationDetails = updateDto.medication_details;
    const { medication_details, ...patientUpdateFields } = updateDto;

    // Merge updates with existing patient data (excluding medication_details)
    const updatedPatient: PatientDto = {
      ...existingPatient,
      ...patientUpdateFields,
    };

    await this.storage.savePatient(updatedPatient);

    // Update medications if provided
    if (medicationDetails !== undefined) {
      await this.storage.saveMedications(id, medicationDetails);
    }

    // Update doctor assignment if doctor_id changed
    if (updateDto.doctor_id && updateDto.doctor_id !== existingPatient.doctor_id) {
      await this.storage.assignPatientToDoctor(id, updateDto.doctor_id);
    }

    const savedPatient = await this.storage.getPatient(id);
    return savedPatient || updatedPatient;
  }

  async recordDose(
    patientId: string,
    drugName: string,
    status: 'taken' | 'skipped',
    scheduledTime?: Date,
  ): Promise<MedicationDoseDto | AlertDto> {
    const patient = await this.storage.getPatient(patientId);
    if (!patient) {
      throw new NotFoundException('Patient not found');
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

    // If skipped, trigger AI analysis and create alert (sent to doctor via SSE)
    // Also send AI warning notification to patient via SSE
    if (status === 'skipped') {
      const alert = await this.createSkipAlert(patientId, drugName, 1);
      
      // Send AI warning notification to patient via SSE
      if (this.patientNotificationsService) {
        try {
          await this.patientNotificationsService.sendAIWarning(
            patientId,
            drugName,
            scheduledTime || new Date(),
          );
        } catch (error) {
          console.error('Error sending patient notification:', error);
          // Don't fail the request if notification fails
        }
      }
      
      // Return alert so frontend knows an alert was created
      return alert as any;
    }

    // If taken, just return the dose record
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
  ): Promise<{ text: string; language: string }> {
    const patient = await this.storage.getPatient(patientId);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Use patient's preferred language if available, otherwise use provided language
    const preferredLanguage = patient.language || language;

    // Transcribe audio using the language parameter (should match audio language)
    const transcription = await this.aiService.transcribeAudio(
      audioFile,
      language, // Use provided language for STT (must match audio)
    );

    // Generate response in patient's preferred language
    const responseText = this.generateVoiceResponse(
      transcription.text,
      preferredLanguage,
    );

    // Return text and language for frontend TTS
    return {
      text: responseText,
      language: preferredLanguage,
    };
  }

  private generateVoiceResponse(query: string, language: string): string {
    const queryLower = query.toLowerCase();

    // Language-specific responses
    const responses: Record<string, Record<string, string>> = {
      hi: {
        missed: 'आपने अपनी दवा छोड़ दी है। कृपया अपने डॉक्टर से संपर्क करें।',
        sideEffect: 'कृपया अपने डॉक्टर से दवा के दुष्प्रभावों के बारे में पूछें।',
        default: 'मैं आपकी मदद करने के लिए यहाँ हूँ। कृपया अपने डॉक्टर से परामर्श करें।',
      },
      en: {
        missed: 'You have missed your medication. Please contact your doctor.',
        sideEffect: 'Please ask your doctor about the side effects of your medication.',
        default: 'I am here to help you. Please consult your doctor.',
      },
      ta: {
        missed: 'நீங்கள் உங்கள் மருந்தை தவறவிட்டீர்கள். தயவுசெய்து உங்கள் மருத்துவரைத் தொடர்பு கொள்ளுங்கள்.',
        sideEffect: 'தயவுசெய்து உங்கள் மருந்தின் பக்க விளைவுகள் பற்றி உங்கள் மருத்துவரிடம் கேளுங்கள்.',
        default: 'நான் உங்களுக்கு உதவ இங்கே இருக்கிறேன். தயவுசெய்து உங்கள் மருத்துவரிடம் ஆலோசனை பெறுங்கள்.',
      },
      te: {
        missed: 'మీరు మీ మందును మిస్ చేసారు. దయచేసి మీ వైద్యుడిని సంప్రదించండి.',
        sideEffect: 'దయచేసి మీ మందు యొక్క దుష్ప్రభావాల గురించి మీ వైద్యుడిని అడగండి.',
        default: 'నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను. దయచేసి మీ వైద్యుడిని సంప్రదించండి.',
      },
    };

    // Get responses for the language, fallback to English if not available
    const langResponses = responses[language] || responses.en;

    // Determine response type based on query
    if (
      queryLower.includes('miss') ||
      queryLower.includes('skip') ||
      queryLower.includes('forgot') ||
      queryLower.includes('छोड़') ||
      queryLower.includes('மறந்து') ||
      queryLower.includes('మిస్')
    ) {
      return langResponses.missed || langResponses.default;
    } else if (
      queryLower.includes('side effect') ||
      queryLower.includes('नुकसान') ||
      queryLower.includes('பக்க விளைவு') ||
      queryLower.includes('దుష్ప్రభావం')
    ) {
      return langResponses.sideEffect || langResponses.default;
    } else {
      return langResponses.default;
    }
  }
}

