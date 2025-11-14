export class DoctorDto {
  id: string;
  name: string;
  email?: string;
  specialization?: string;
  patient_ids: string[]; // List of assigned patient IDs
}

