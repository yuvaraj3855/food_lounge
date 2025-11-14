import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from './patient.entity';

@Entity('medications')
export class Medication {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'patient_id' })
  patient_id: string;

  @Column({ name: 'drug_name' })
  drug_name: string;

  @Column()
  dosage: string;

  @Column()
  frequency: string;

  @Column({ type: 'varchar', nullable: true })
  timing?: string;

  @Column({ type: 'text', nullable: true })
  purpose?: string;

  @Column({ type: 'varchar' })
  risk_level: 'Low' | 'Medium' | 'High';

  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => Patient, (patient) => patient.medications)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}

