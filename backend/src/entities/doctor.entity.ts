import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Patient } from './patient.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  specialization?: string;

  @OneToMany(() => Patient, (patient) => patient.doctor)
  patients: Patient[];
}

