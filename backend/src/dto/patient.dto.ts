import { ApiProperty } from '@nestjs/swagger';
import { MedicationDetailDto } from './medication-detail.dto';

export class PatientDto {
  @ApiProperty({ description: 'Patient unique identifier' })
  id: string;

  @ApiProperty({ description: 'Patient name' })
  name: string;

  @ApiProperty({ description: 'Patient age', example: 63 })
  age: number;

  @ApiProperty({
    description: 'Medical conditions',
    example: ['Type 2 Diabetes', 'Heart Failure'],
    type: [String],
  })
  conditions: string[];

  @ApiProperty({
    description: 'Current medications',
    example: ['Furosemide', 'Metformin'],
    type: [String],
  })
  current_medications: string[];

  @ApiProperty({
    description: 'Current risk level',
    enum: ['Low', 'Medium', 'High'],
    required: false,
  })
  risk_level?: 'Low' | 'Medium' | 'High';

  @ApiProperty({
    description: 'Last alert timestamp',
    required: false,
  })
  last_alert?: Date;

  @ApiProperty({
    description: 'Assigned doctor ID',
    required: false,
  })
  doctor_id?: string;

  @ApiProperty({
    description: 'Detailed medication information',
    type: [MedicationDetailDto],
    required: false,
  })
  medication_details?: MedicationDetailDto[];
}

export class CreatePatientDto {
  @ApiProperty({ description: 'Patient name', example: 'Rajesh Kumar' })
  name: string;

  @ApiProperty({ description: 'Patient age', example: 63 })
  age: number;

  @ApiProperty({
    description: 'Medical conditions',
    example: ['Type 2 Diabetes', 'Heart Failure'],
    type: [String],
  })
  conditions: string[];

  @ApiProperty({
    description: 'Current medications (list of drug names)',
    example: ['Furosemide', 'Metformin'],
    type: [String],
  })
  current_medications: string[];

  @ApiProperty({
    description: 'Assigned doctor ID',
    required: false,
  })
  doctor_id?: string;
}

export class CreatePatientWithMedicationsDto extends CreatePatientDto {
  @ApiProperty({
    description: 'Detailed medication information',
    type: 'array',
    items: { type: 'object' },
    required: false,
  })
  medication_details?: Array<{
    drug_name: string;
    dosage: string;
    frequency: string;
    timing?: string;
    purpose?: string;
    risk_level: 'Low' | 'Medium' | 'High';
    instructions?: string;
  }>;
}

