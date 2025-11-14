import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from './patient.entity';

@Entity('medication_doses')
export class MedicationDose {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'patient_id' })
  patient_id: string;

  @Column({ name: 'drug_name' })
  drug_name: string;

  @Column({ type: 'varchar' })
  status: 'taken' | 'skipped';

  @Column({ name: 'scheduled_time', type: 'timestamp' })
  scheduled_time: Date;

  @Column({ name: 'actual_time', type: 'timestamp', nullable: true })
  actual_time?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => Patient, (patient) => patient.medication_doses)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}

