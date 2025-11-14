import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from './patient.entity';

@Entity('messages')
export class Message {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'patient_id' })
  patient_id: string;

  @Column({ name: 'doctor_id' })
  doctor_id: string;

  @Column({ type: 'varchar' })
  sender: 'patient' | 'doctor';

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'audio_url', nullable: true })
  audio_url?: string;

  @Column({ nullable: true })
  language?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @ManyToOne(() => Patient, (patient) => patient.messages)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}

