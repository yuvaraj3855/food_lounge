import { ApiProperty } from '@nestjs/swagger';

export class MedicationDetailDto {
  @ApiProperty({ description: 'Name of the medication', example: 'Furosemide' })
  drug_name: string;

  @ApiProperty({ description: 'Dosage amount', example: '40mg' })
  dosage: string;

  @ApiProperty({
    description: 'Frequency of administration',
    example: 'twice daily',
    enum: ['once daily', 'twice daily', 'thrice daily', 'as needed'],
  })
  frequency: string;

  @ApiProperty({
    description: 'When to take the medication',
    example: 'morning and evening',
  })
  timing?: string;

  @ApiProperty({
    description: 'Purpose of the medication',
    example: 'Diuretic for heart failure',
  })
  purpose?: string;

  @ApiProperty({
    description: 'Risk level if this medication is skipped',
    enum: ['Low', 'Medium', 'High'],
    example: 'High',
  })
  risk_level: 'Low' | 'Medium' | 'High';

  @ApiProperty({
    description: 'Additional instructions',
    example: 'Take with food to reduce stomach upset',
    required: false,
  })
  instructions?: string;
}

