import { ApiProperty } from '@nestjs/swagger';

export class PatientNotificationDto {
  @ApiProperty({ description: 'Notification unique identifier' })
  id: string;

  @ApiProperty({ description: 'Patient ID' })
  patient_id: string;

  @ApiProperty({
    description: 'Notification type',
    enum: ['medication_reminder', 'ai_warning', 'doctor_instruction'],
    example: 'medication_reminder',
  })
  type: 'medication_reminder' | 'ai_warning' | 'doctor_instruction';

  @ApiProperty({
    description: 'Medication name (if applicable)',
    example: 'Furosemide',
    required: false,
  })
  drug_name?: string;

  @ApiProperty({
    description: 'Notification text in patient language (for TTS)',
    example: 'कृपया अपनी दवा Furosemide लें। इसे छोड़ने से हृदय समस्याएं हो सकती हैं।',
  })
  text: string;

  @ApiProperty({
    description: 'Language code for TTS',
    example: 'hi',
  })
  language: string;

  @ApiProperty({
    description: 'Risk level (for AI warnings)',
    enum: ['Low', 'Medium', 'High'],
    required: false,
  })
  risk_level?: 'Low' | 'Medium' | 'High';

  @ApiProperty({
    description: 'Scheduled medication time (for reminders)',
    required: false,
  })
  scheduled_time?: Date;

  @ApiProperty({
    description: 'Doctor instruction (if from doctor)',
    required: false,
  })
  doctor_message?: string;

  @ApiProperty({ description: 'Notification timestamp' })
  timestamp: Date;

  @ApiProperty({
    description: 'Whether notification has been read/acknowledged',
    example: false,
  })
  acknowledged: boolean;
}

