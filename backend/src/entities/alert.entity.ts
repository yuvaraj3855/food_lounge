import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from './patient.entity';

@Entity('alerts')
export class Alert {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'patient_id' })
  patient_id: string;

  @Column({ name: 'patient_name' })
  patient_name: string;

  @Column({ name: 'drug_name' })
  drug_name: string;

  @Column({ type: 'varchar' })
  risk_level: 'Low' | 'Medium' | 'High';

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'ai_explanation', type: 'text' })
  ai_explanation: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'boolean', default: false })
  acknowledged: boolean;

  @ManyToOne(() => Patient, (patient) => patient.alerts)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}

