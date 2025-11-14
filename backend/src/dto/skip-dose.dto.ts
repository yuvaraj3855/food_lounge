import { ApiProperty } from '@nestjs/swagger';

export class SkipDoseDto {
  @ApiProperty({
    description: 'Name of the medication',
    example: 'Furosemide',
  })
  drug_name: string;

  @ApiProperty({
    description: 'Number of skipped doses',
    example: 1,
    minimum: 1,
  })
  skips: number;

  @ApiProperty({
    description: 'Patient age',
    example: 63,
  })
  patient_age: number;

  @ApiProperty({
    description: 'Patient medical conditions',
    example: ['Type 2 Diabetes', 'Heart Failure'],
    type: [String],
  })
  conditions: string[];

  @ApiProperty({
    description: 'Patient ID (optional, uses first patient if not provided)',
    required: false,
  })
  patient_id?: string;
}

