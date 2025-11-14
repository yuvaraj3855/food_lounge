import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Subject, Observable } from 'rxjs';
import { PatientNotificationDto } from '../dto/patient-notification.dto';
import { StorageService } from './storage.service';
import { AIService } from '../ai/ai.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PatientNotificationsService {
  // Map of patient_id -> Subject for patient-specific streams
  private patientStreams = new Map<string, Subject<PatientNotificationDto>>();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly storage: StorageService,
    private readonly aiService: AIService,
  ) {
    // Listen for patient notification events
    this.eventEmitter.on('patient.notification', (notification: PatientNotificationDto) => {
      const patientId = notification.patient_id;
      const stream = this.patientStreams.get(patientId);
      if (stream) {
        stream.next(notification);
      }
    });
  }

  /**
   * Get SSE stream for a specific patient
   */
  getPatientNotificationStream(patientId: string): Observable<PatientNotificationDto> {
    if (!this.patientStreams.has(patientId)) {
      this.patientStreams.set(patientId, new Subject<PatientNotificationDto>());
    }
    return this.patientStreams.get(patientId)!.asObservable();
  }

  /**
   * Send medication reminder to patient
   */
  async sendMedicationReminder(
    patientId: string,
    drugName: string,
    scheduledTime: Date,
  ): Promise<PatientNotificationDto> {
    const patient = await this.storage.getPatient(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const language = patient.language || 'hi';
    const text = this.generateReminderText(drugName, language);

    const notification: PatientNotificationDto = {
      id: uuidv4(),
      patient_id: patientId,
      type: 'medication_reminder',
      drug_name: drugName,
      text,
      language,
      scheduled_time: scheduledTime,
      timestamp: new Date(),
      acknowledged: false,
    };

    // Emit notification event
    this.eventEmitter.emit('patient.notification', notification);

    return notification;
  }

  /**
   * Send AI warning about potential issues if medication is skipped
   */
  async sendAIWarning(
    patientId: string,
    drugName: string,
    scheduledTime: Date,
  ): Promise<PatientNotificationDto> {
    const patient = await this.storage.getPatient(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Get medication details (optional - use default if not found)
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Medium';
    try {
      const medications = await this.storage.getMedications(patientId);
      const medication = medications.find((m) => m.drug_name === drugName);
      if (medication) {
        riskLevel = medication.risk_level || 'Medium';
      }
    } catch (error) {
      console.warn('Could not fetch medication details, using default risk level');
    }

    // Generate AI warning text
    const language = patient.language || 'hi';
    
    // Get AI explanation for skipping this medication
    let riskAnalysis;
    try {
      riskAnalysis = await this.aiService.analyzeSkipRisk(
        drugName,
        1, // Potential skip
        patient.age,
        patient.conditions,
      );
      // Update risk level from AI analysis if available
      if (riskAnalysis.risk_level) {
        riskLevel = riskAnalysis.risk_level;
      }
    } catch (error) {
      console.error('Error getting AI risk analysis:', error);
      // Use a default message if AI analysis fails
      riskAnalysis = {
        risk_level: riskLevel,
        message: `Skipping ${drugName} may cause health complications. Please take your medication as prescribed.`,
        ai_explanation: '',
      };
    }

    // Translate AI message to patient's language (no hardcoded text)
    let text = riskAnalysis.message;
    if (language !== 'en') {
      try {
        text = await this.translateToPatientLanguage(riskAnalysis.message, language);
      } catch (error) {
        console.error('Translation error, using original message:', error);
        // Keep original AI message if translation fails
      }
    }

    const notification: PatientNotificationDto = {
      id: uuidv4(),
      patient_id: patientId,
      type: 'ai_warning',
      drug_name: drugName,
      text,
      language,
      risk_level: riskLevel,
      scheduled_time: scheduledTime,
      timestamp: new Date(),
      acknowledged: false,
    };

    // Emit notification event
    this.eventEmitter.emit('patient.notification', notification);

    return notification;
  }

  /**
   * Send doctor instruction to patient
   */
  async sendDoctorInstruction(
    patientId: string,
    doctorMessage: string,
    language?: string,
  ): Promise<PatientNotificationDto> {
    const patient = await this.storage.getPatient(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const patientLanguage = language || patient.language || 'hi';
    
    // Translate doctor message to patient language if needed
    const text = await this.translateToPatientLanguage(doctorMessage, patientLanguage);

    const notification: PatientNotificationDto = {
      id: uuidv4(),
      patient_id: patientId,
      type: 'doctor_instruction',
      text,
      language: patientLanguage,
      doctor_message: doctorMessage,
      timestamp: new Date(),
      acknowledged: false,
    };

    // Emit notification event
    this.eventEmitter.emit('patient.notification', notification);

    return notification;
  }

  /**
   * Generate reminder text in patient's language
   */
  private generateReminderText(drugName: string, language: string): string {
    const reminders: Record<string, string> = {
      en: `Please take your ${drugName} medication now. It's time for your scheduled dose.`,
      hi: `कृपया अभी अपनी ${drugName} दवा लें। यह आपकी निर्धारित खुराक का समय है।`,
      ta: `தயவுசெய்து இப்போது உங்கள் ${drugName} மருந்தை எடுத்துக் கொள்ளுங்கள். இது உங்கள் திட்டமிடப்பட்ட மருந்தின் நேரம்.`,
      te: `దయచేసి ఇప్పుడు మీ ${drugName} మందును తీసుకోండి. ఇది మీ షెడ్యూల్ చేసిన మోతాదు సమయం.`,
    };

    return reminders[language] || reminders.en;
  }


  /**
   * Translate text to patient's language
   */
  private async translateToPatientLanguage(
    text: string,
    targetLanguage: string,
  ): Promise<string> {
    // If already in target language, return as is
    if (targetLanguage === 'en') {
      return text;
    }

    try {
      // Call AI service translation endpoint
      const response = await fetch('http://localhost:8000/translate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          text,
          source_language: 'auto',
          target_language: this.mapLanguageCode(targetLanguage),
        }),
      });

      if (response.ok) {
        // Use response.json() directly to ensure proper UTF-8 handling
        const data = await response.json();
        
        // Translation service returns {text, source_language, target_language}
        let translatedText = data.text || data.translated_text;
        
        if (translatedText && translatedText !== text) {
          console.log(`Translation successful: ${targetLanguage}`);
          console.log(`Translated text sample: ${translatedText.substring(0, 50)}...`);
          // Ensure the text is a proper string (not double-encoded)
          if (typeof translatedText === 'string') {
            return translatedText;
          }
        } else {
          console.warn('Translation returned same text or empty, using original');
        }
      } else {
        const errorText = await response.text();
        console.error(`Translation API error (${response.status}):`, errorText);
      }
    } catch (error) {
      console.error('Translation error:', error);
    }

    // Fallback: return original text
    return text;
  }

  /**
   * Map language code to translation API format
   */
  private mapLanguageCode(code: string): string {
    const mapping: Record<string, string> = {
      hi: 'Hindi',
      ta: 'Tamil',
      te: 'Telugu',
      kn: 'Kannada',
      ml: 'Malayalam',
      mr: 'Marathi',
      gu: 'Gujarati',
      bn: 'Bengali',
      pa: 'Punjabi',
      en: 'English',
    };
    return mapping[code] || 'English';
  }
}

