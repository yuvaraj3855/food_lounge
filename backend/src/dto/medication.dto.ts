export class MedicationDoseDto {
  id: string;
  patient_id: string;
  drug_name: string;
  status: 'taken' | 'skipped';
  scheduled_time: Date;
  actual_time?: Date;
  notes?: string;
  created_at: Date;
}

export class MedicationHistoryDto {
  patient_id: string;
  drug_name: string;
  doses: MedicationDoseDto[];
  total_taken: number;
  total_skipped: number;
  adherence_rate: number; // percentage
}

