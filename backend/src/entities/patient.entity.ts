import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Doctor } from './doctor.entity';
import { MedicationDose } from './medication-dose.entity';
import { Medication } from './medication.entity';
import { Alert } from './alert.entity';
import { Message } from './message.entity';

@Entity('patients')
export class Patient {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('int')
  age: number;

  @Column('simple-array')
  conditions: string[];

  @Column('simple-array')
  current_medications: string[];

  @Column({ type: 'varchar', nullable: true })
  risk_level?: 'Low' | 'Medium' | 'High';

  @Column({ type: 'timestamp', nullable: true })
  last_alert?: Date;

  @Column({ name: 'doctor_id', nullable: true })
  doctor_id?: string;

  @Column({ type: 'varchar', length: 10, nullable: true, default: 'hi' })
  language?: string; // Language code (e.g., 'hi', 'en', 'ta', 'te')

  @ManyToOne(() => Doctor, (doctor) => doctor.patients)
  @JoinColumn({ name: 'doctor_id' })
  doctor?: Doctor;

  @OneToMany(() => Medication, (medication) => medication.patient)
  medications: Medication[];

  @OneToMany(() => MedicationDose, (dose) => dose.patient)
  medication_doses: MedicationDose[];

  @OneToMany(() => Alert, (alert) => alert.patient)
  alerts: Alert[];

  @OneToMany(() => Message, (message) => message.patient)
  messages: Message[];
}

