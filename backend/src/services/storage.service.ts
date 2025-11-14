import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  PatientDto,
  MedicationDoseDto,
  MedicationHistoryDto,
  MessageDto,
  ConversationDto,
  AlertDto,
  DoctorDto,
} from '../dto';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { Medication } from '../entities/medication.entity';
import { MedicationDose } from '../entities/medication-dose.entity';
import { Alert } from '../entities/alert.entity';
import { Message } from '../entities/message.entity';
import { MedicationDetailDto } from '../dto/medication-detail.dto';

/**
 * PostgreSQL storage service using TypeORM
 */
@Injectable()
export class StorageService {
  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Medication)
    private medicationRepository: Repository<Medication>,
    @InjectRepository(MedicationDose)
    private medicationDoseRepository: Repository<MedicationDose>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  // Patient Management
  async getPatient(id: string): Promise<PatientDto | null> {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: ['medications'],
    });
    return patient ? this.mapPatientToDto(patient) : null;
  }

  async getAllPatients(): Promise<PatientDto[]> {
    const patients = await this.patientRepository.find({
      relations: ['medications'],
    });
    return patients.map((p) => this.mapPatientToDto(p));
  }

  async getPatientsByDoctor(doctorId: string): Promise<PatientDto[]> {
    const patients = await this.patientRepository.find({
      where: { doctor_id: doctorId },
      relations: ['medications'],
    });
    return patients.map((p) => this.mapPatientToDto(p));
  }

  async savePatient(patient: PatientDto): Promise<void> {
    const entity = this.mapDtoToPatient(patient);
    await this.patientRepository.save(entity);
  }

  // Medication Management
  async saveMedications(patientId: string, medications: MedicationDetailDto[]): Promise<void> {
    // Delete existing medications for this patient
    await this.medicationRepository.delete({ patient_id: patientId });

    // Save new medications
    const medicationEntities = medications.map((med) => {
      const entity = new Medication();
      entity.id = uuidv4();
      entity.patient_id = patientId;
      entity.drug_name = med.drug_name;
      entity.dosage = med.dosage;
      entity.frequency = med.frequency;
      entity.timing = med.timing;
      entity.purpose = med.purpose;
      entity.risk_level = med.risk_level;
      entity.instructions = med.instructions;
      entity.created_at = new Date();
      return entity;
    });

    if (medicationEntities.length > 0) {
      await this.medicationRepository.save(medicationEntities);
    }
  }

  async getMedications(patientId: string): Promise<MedicationDetailDto[]> {
    const medications = await this.medicationRepository.find({
      where: { patient_id: patientId },
      order: { created_at: 'ASC' },
    });
    return medications.map((m) => ({
      drug_name: m.drug_name,
      dosage: m.dosage,
      frequency: m.frequency,
      timing: m.timing,
      purpose: m.purpose,
      risk_level: m.risk_level,
      instructions: m.instructions,
    }));
  }

  // Doctor Management
  async getDoctor(id: string): Promise<DoctorDto | null> {
    const doctor = await this.doctorRepository.findOne({ where: { id } });
    return doctor ? this.mapDoctorToDto(doctor) : null;
  }

  async getAllDoctors(): Promise<DoctorDto[]> {
    const doctors = await this.doctorRepository.find();
    return doctors.map((d) => this.mapDoctorToDto(d));
  }

  async saveDoctor(doctor: DoctorDto): Promise<void> {
    const entity = this.mapDtoToDoctor(doctor);
    await this.doctorRepository.save(entity);
  }

  async assignPatientToDoctor(patientId: string, doctorId: string): Promise<void> {
    await this.patientRepository.update(patientId, { doctor_id: doctorId });
  }

  // Medication Dose History
  async saveMedicationDose(dose: MedicationDoseDto): Promise<void> {
    const entity = this.mapDtoToMedicationDose(dose);
    await this.medicationDoseRepository.save(entity);
  }

  async getMedicationHistory(patientId: string): Promise<MedicationHistoryDto[]> {
    const doses = await this.medicationDoseRepository.find({
      where: { patient_id: patientId },
      order: { created_at: 'DESC' },
    });

    // Group by drug name
    const drugMap = new Map<string, MedicationDose[]>();
    doses.forEach((dose) => {
      if (!drugMap.has(dose.drug_name)) {
        drugMap.set(dose.drug_name, []);
      }
      drugMap.get(dose.drug_name)?.push(dose);
    });

    return Array.from(drugMap.entries()).map(([drugName, drugDoses]) => {
      const taken = drugDoses.filter((d) => d.status === 'taken').length;
      const skipped = drugDoses.filter((d) => d.status === 'skipped').length;
      const total = drugDoses.length;
      const adherenceRate = total > 0 ? (taken / total) * 100 : 0;

      return {
        patient_id: patientId,
        drug_name: drugName,
        doses: drugDoses.map((d) => this.mapMedicationDoseToDto(d)),
        total_taken: taken,
        total_skipped: skipped,
        adherence_rate: Math.round(adherenceRate * 100) / 100,
      };
    });
  }

  async getRecentDoses(patientId: string, limit: number = 10): Promise<MedicationDoseDto[]> {
    const doses = await this.medicationDoseRepository.find({
      where: { patient_id: patientId },
      order: { created_at: 'DESC' },
      take: limit,
    });
    return doses.map((d) => this.mapMedicationDoseToDto(d));
  }

  // Alerts History
  async saveAlert(alert: AlertDto): Promise<void> {
    const entity = this.mapDtoToAlert(alert);
    await this.alertRepository.save(entity);
  }

  async getAlertsByPatient(patientId: string): Promise<AlertDto[]> {
    const alerts = await this.alertRepository.find({
      where: { patient_id: patientId },
      order: { timestamp: 'DESC' },
    });
    return alerts.map((a) => this.mapAlertToDto(a));
  }

  async getAllAlerts(): Promise<AlertDto[]> {
    const alerts = await this.alertRepository.find({
      order: { timestamp: 'DESC' },
    });
    return alerts.map((a) => this.mapAlertToDto(a));
  }

  async updateAlert(alertId: string, updates: Partial<AlertDto>): Promise<void> {
    await this.alertRepository.update(alertId, updates);
  }

  // Messages/Communication
  async saveMessage(message: MessageDto): Promise<void> {
    const entity = this.mapDtoToMessage(message);
    await this.messageRepository.save(entity);
  }

  async getConversation(patientId: string, doctorId: string): Promise<ConversationDto | null> {
    const messages = await this.messageRepository.find({
      where: [
        { patient_id: patientId, doctor_id: doctorId },
      ],
      order: { timestamp: 'ASC' },
    });

    if (messages.length === 0) {
      return null;
    }

    const unreadCount = messages.filter((m) => !m.read).length;

    return {
      patient_id: patientId,
      doctor_id: doctorId,
      messages: messages.map((m) => this.mapMessageToDto(m)),
      last_message_time: messages[messages.length - 1].timestamp,
      unread_count: unreadCount,
    };
  }

  async getConversationsByDoctor(doctorId: string): Promise<ConversationDto[]> {
    const messages = await this.messageRepository.find({
      where: { doctor_id: doctorId },
      order: { timestamp: 'DESC' },
    });

    const conversationMap = new Map<string, Message[]>();
    messages.forEach((msg) => {
      const key = `${msg.patient_id}_${msg.doctor_id}`;
      if (!conversationMap.has(key)) {
        conversationMap.set(key, []);
      }
      conversationMap.get(key)?.push(msg);
    });

    return Array.from(conversationMap.entries()).map(([key, msgs]) => {
      const [patientId, docId] = key.split('_');
      const sorted = msgs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const unreadCount = sorted.filter((m) => !m.read).length;

      return {
        patient_id: patientId,
        doctor_id: docId,
        messages: sorted.map((m) => this.mapMessageToDto(m)),
        last_message_time: sorted[sorted.length - 1].timestamp,
        unread_count: unreadCount,
      };
    });
  }

  async getConversationsByPatient(patientId: string): Promise<ConversationDto[]> {
    const messages = await this.messageRepository.find({
      where: { patient_id: patientId },
      order: { timestamp: 'DESC' },
    });

    const conversationMap = new Map<string, Message[]>();
    messages.forEach((msg) => {
      const key = `${msg.patient_id}_${msg.doctor_id}`;
      if (!conversationMap.has(key)) {
        conversationMap.set(key, []);
      }
      conversationMap.get(key)?.push(msg);
    });

    return Array.from(conversationMap.entries()).map(([key, msgs]) => {
      const [patientId, docId] = key.split('_');
      const sorted = msgs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const unreadCount = sorted.filter((m) => !m.read).length;

      return {
        patient_id: patientId,
        doctor_id: docId,
        messages: sorted.map((m) => this.mapMessageToDto(m)),
        last_message_time: sorted[sorted.length - 1].timestamp,
        unread_count: unreadCount,
      };
    });
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await this.messageRepository.update(messageId, { read: true });
  }

  // Mapper functions
  private mapPatientToDto(patient: Patient): PatientDto {
    return {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      conditions: patient.conditions,
      current_medications: patient.current_medications,
      risk_level: patient.risk_level,
      last_alert: patient.last_alert,
      doctor_id: patient.doctor_id,
      language: patient.language,
      medication_details: patient.medications?.map((m) => ({
        drug_name: m.drug_name,
        dosage: m.dosage,
        frequency: m.frequency,
        timing: m.timing,
        purpose: m.purpose,
        risk_level: m.risk_level,
        instructions: m.instructions,
      })),
    };
  }

  private mapDtoToPatient(dto: PatientDto): Patient {
    const patient = new Patient();
    patient.id = dto.id;
    patient.name = dto.name;
    patient.age = dto.age;
    patient.conditions = dto.conditions;
    patient.current_medications = dto.current_medications;
    patient.risk_level = dto.risk_level;
    patient.last_alert = dto.last_alert;
    patient.doctor_id = dto.doctor_id;
    patient.language = dto.language || 'hi'; // Default to Hindi
    return patient;
  }

  private mapDoctorToDto(doctor: Doctor): DoctorDto {
    return {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization,
      patient_ids: doctor.patients?.map((p) => p.id) || [],
    };
  }

  private mapDtoToDoctor(dto: DoctorDto): Doctor {
    const doctor = new Doctor();
    doctor.id = dto.id;
    doctor.name = dto.name;
    doctor.email = dto.email;
    doctor.specialization = dto.specialization;
    return doctor;
  }

  private mapMedicationDoseToDto(dose: MedicationDose): MedicationDoseDto {
    return {
      id: dose.id,
      patient_id: dose.patient_id,
      drug_name: dose.drug_name,
      status: dose.status,
      scheduled_time: dose.scheduled_time,
      actual_time: dose.actual_time,
      notes: dose.notes,
      created_at: dose.created_at,
    };
  }

  private mapDtoToMedicationDose(dto: MedicationDoseDto): MedicationDose {
    const dose = new MedicationDose();
    dose.id = dto.id;
    dose.patient_id = dto.patient_id;
    dose.drug_name = dto.drug_name;
    dose.status = dto.status;
    dose.scheduled_time = dto.scheduled_time;
    dose.actual_time = dto.actual_time;
    dose.notes = dto.notes;
    dose.created_at = dto.created_at;
    return dose;
  }

  private mapAlertToDto(alert: Alert): AlertDto {
    return {
      id: alert.id,
      patient_id: alert.patient_id,
      patient_name: alert.patient_name,
      drug_name: alert.drug_name,
      risk_level: alert.risk_level,
      message: alert.message,
      ai_explanation: alert.ai_explanation,
      timestamp: alert.timestamp,
      acknowledged: alert.acknowledged,
    };
  }

  private mapDtoToAlert(dto: AlertDto): Alert {
    const alert = new Alert();
    alert.id = dto.id;
    alert.patient_id = dto.patient_id;
    alert.patient_name = dto.patient_name;
    alert.drug_name = dto.drug_name;
    alert.risk_level = dto.risk_level;
    alert.message = dto.message;
    alert.ai_explanation = dto.ai_explanation;
    alert.timestamp = dto.timestamp;
    alert.acknowledged = dto.acknowledged;
    return alert;
  }

  private mapMessageToDto(message: Message): MessageDto {
    return {
      id: message.id,
      patient_id: message.patient_id,
      doctor_id: message.doctor_id,
      sender: message.sender,
      message: message.message,
      audio_url: message.audio_url,
      language: message.language,
      timestamp: message.timestamp,
      read: message.read,
    };
  }

  private mapDtoToMessage(dto: MessageDto): Message {
    const message = new Message();
    message.id = dto.id;
    message.patient_id = dto.patient_id;
    message.doctor_id = dto.doctor_id;
    message.sender = dto.sender;
    message.message = dto.message;
    message.audio_url = dto.audio_url;
    message.language = dto.language;
    message.timestamp = dto.timestamp;
    message.read = dto.read;
    return message;
  }
}
