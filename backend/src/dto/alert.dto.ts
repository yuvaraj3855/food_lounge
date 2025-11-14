import { ApiProperty } from '@nestjs/swagger';

export class AlertDto {
  @ApiProperty({ description: 'Alert unique identifier' })
  id: string;

  @ApiProperty({ description: 'Patient ID' })
  patient_id: string;

  @ApiProperty({ description: 'Patient name', example: 'Rajesh Kumar' })
  patient_name: string;

  @ApiProperty({ description: 'Medication name', example: 'Furosemide' })
  drug_name: string;

  @ApiProperty({
    description: 'Risk level',
    enum: ['Low', 'Medium', 'High'],
    example: 'High',
  })
  risk_level: 'Low' | 'Medium' | 'High';

  @ApiProperty({
    description: 'Alert message',
    example: 'Fluid may accumulate in lungs — needs doctor attention.',
  })
  message: string;

  @ApiProperty({
    description: 'AI-generated explanation',
    example:
      'Skipping Furosemide 3 times may lead to fluid retention, increased blood pressure, and heart strain.',
  })
  ai_explanation: string;

  @ApiProperty({ description: 'Alert timestamp' })
  timestamp: Date;

  @ApiProperty({
    description: 'Whether alert has been acknowledged',
    example: false,
  })
  acknowledged: boolean;
}

