import { Injectable } from '@nestjs/common';
import { StorageService } from '../services/storage.service';
import { AIService } from '../ai/ai.service';
import { MessageDto, ConversationDto } from '../dto/message.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MessagesService {
  constructor(
    private readonly storage: StorageService,
    private readonly aiService: AIService,
  ) {}

  async sendMessage(message: Omit<MessageDto, 'id' | 'timestamp'>): Promise<MessageDto> {
    const fullMessage: MessageDto = {
      id: uuidv4(),
      ...message,
      timestamp: new Date(),
      read: false,
    };

    await this.storage.saveMessage(fullMessage);
    return fullMessage;
  }

  async sendVoiceMessage(
    patientId: string,
    doctorId: string,
    audioFile: { buffer: Buffer; mimetype: string; originalname: string },
    language: string = 'hi',
  ): Promise<MessageDto> {
    // Transcribe audio
    const transcription = await this.aiService.transcribeAudio(
      audioFile,
      language,
    );

    // Create message from patient
    const message: MessageDto = {
      id: uuidv4(),
      patient_id: patientId,
      doctor_id: doctorId,
      sender: 'patient',
      message: transcription.text,
      audio_url: undefined, // Could store audio URL if needed
      language,
      timestamp: new Date(),
      read: false,
    };

    await this.storage.saveMessage(message);
    return message;
  }

  async getConversation(patientId: string, doctorId: string): Promise<ConversationDto | null> {
    return this.storage.getConversation(patientId, doctorId);
  }

  async getConversationsByDoctor(doctorId: string): Promise<ConversationDto[]> {
    return this.storage.getConversationsByDoctor(doctorId);
  }

  async getConversationsByPatient(patientId: string): Promise<ConversationDto[]> {
    return this.storage.getConversationsByPatient(patientId);
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.storage.markMessageAsRead(messageId);
  }
}

