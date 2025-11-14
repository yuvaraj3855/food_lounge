import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({ description: 'Message unique identifier' })
  id: string;

  @ApiProperty({ description: 'Patient ID' })
  patient_id: string;

  @ApiProperty({ description: 'Doctor ID' })
  doctor_id: string;

  @ApiProperty({
    description: 'Message sender',
    enum: ['patient', 'doctor'],
    example: 'patient',
  })
  sender: 'patient' | 'doctor';

  @ApiProperty({
    description: 'Message text content',
    example: 'I forgot to take my medication today.',
  })
  message: string;

  @ApiProperty({
    description: 'Audio URL for voice messages',
    required: false,
  })
  audio_url?: string;

  @ApiProperty({
    description: 'Language code',
    example: 'hi',
    required: false,
  })
  language?: string;

  @ApiProperty({ description: 'Message timestamp' })
  timestamp: Date;

  @ApiProperty({
    description: 'Whether message has been read',
    example: false,
  })
  read: boolean;
}

export class ConversationDto {
  @ApiProperty({ description: 'Patient ID' })
  patient_id: string;

  @ApiProperty({ description: 'Doctor ID' })
  doctor_id: string;

  @ApiProperty({
    description: 'List of messages in the conversation',
    type: [MessageDto],
  })
  messages: MessageDto[];

  @ApiProperty({ description: 'Last message timestamp' })
  last_message_time: Date;

  @ApiProperty({
    description: 'Number of unread messages',
    example: 2,
  })
  unread_count: number;
}

