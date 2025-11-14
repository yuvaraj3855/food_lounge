import { ApiProperty } from '@nestjs/swagger';
import { PatientDto } from './patient.dto';
import { MedicationHistoryDto } from './medication.dto';
import { AlertDto } from './alert.dto';

export class PatientDetailDto extends PatientDto {
  @ApiProperty({
    description: 'Medication history for this patient',
    type: [Object],
  })
  medication_history: MedicationHistoryDto[];

  @ApiProperty({
    description: 'Recent alerts for this patient',
    type: [AlertDto],
  })
  recent_alerts: AlertDto[];

  @ApiProperty({
    description: 'Total number of doses taken',
    example: 45,
  })
  total_doses_taken: number;

  @ApiProperty({
    description: 'Total number of doses skipped',
    example: 5,
  })
  total_doses_skipped: number;

  @ApiProperty({
    description: 'Overall medication adherence rate (%)',
    example: 90.0,
  })
  adherence_rate: number;
}

export class DoctorDashboardDto {
  @ApiProperty({ description: 'Doctor ID' })
  doctor_id: string;

  @ApiProperty({ description: 'Doctor name' })
  doctor_name: string;

  @ApiProperty({
    description: 'Total number of patients',
    example: 3,
  })
  total_patients: number;

  @ApiProperty({
    description: 'Patients with high risk alerts',
    example: 1,
  })
  high_risk_patients: number;

  @ApiProperty({
    description: 'Patients with medium risk alerts',
    example: 1,
  })
  medium_risk_patients: number;

  @ApiProperty({
    description: 'Patients with low or no risk',
    example: 1,
  })
  low_risk_patients: number;

  @ApiProperty({
    description: 'Detailed patient information with medications and history',
    type: [PatientDetailDto],
  })
  patients: PatientDetailDto[];
}

