import { Injectable } from '@nestjs/common';
import { StorageService } from '../services/storage.service';
import { DoctorDashboardDto, PatientDetailDto } from '../dto/doctor-dashboard.dto';
import { PatientDto } from '../dto/patient.dto';

@Injectable()
export class DoctorService {
  constructor(private readonly storage: StorageService) {}

  async getDashboard(doctorId: string): Promise<DoctorDashboardDto> {
    const doctor = await this.storage.getDoctor(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Get all patients for this doctor
    const patients = await this.storage.getPatientsByDoctor(doctorId);

    // Build detailed patient information
    const patientDetails: PatientDetailDto[] = await Promise.all(
      patients.map(async (patient) => {
        // Get medication history
        const medicationHistory = await this.storage.getMedicationHistory(patient.id);

        // Get recent alerts (last 10)
        const allAlerts = await this.storage.getAlertsByPatient(patient.id);
        const recentAlerts = allAlerts.slice(0, 10);

      // Calculate adherence metrics
      let totalTaken = 0;
      let totalSkipped = 0;

      medicationHistory.forEach((history) => {
        totalTaken += history.total_taken;
        totalSkipped += history.total_skipped;
      });

        const totalDoses = totalTaken + totalSkipped;
        const adherenceRate = totalDoses > 0 
          ? Math.round((totalTaken / totalDoses) * 100 * 100) / 100 
          : 0;

        return {
          ...patient,
          medication_history: medicationHistory,
          recent_alerts: recentAlerts,
          total_doses_taken: totalTaken,
          total_doses_skipped: totalSkipped,
          adherence_rate: adherenceRate,
        };
      }),
    );

    // Calculate risk statistics
    const highRisk = patientDetails.filter((p) => p.risk_level === 'High').length;
    const mediumRisk = patientDetails.filter((p) => p.risk_level === 'Medium').length;
    const lowRisk = patientDetails.filter(
      (p) => !p.risk_level || p.risk_level === 'Low',
    ).length;

    return {
      doctor_id: doctor.id,
      doctor_name: doctor.name,
      total_patients: patientDetails.length,
      high_risk_patients: highRisk,
      medium_risk_patients: mediumRisk,
      low_risk_patients: lowRisk,
      patients: patientDetails,
    };
  }

  async getPatientDetails(doctorId: string, patientId: string): Promise<PatientDetailDto | null> {
    const doctor = await this.storage.getDoctor(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    const patient = await this.storage.getPatient(patientId);
    if (!patient || patient.doctor_id !== doctorId) {
      return null;
    }

    // Get medication history
    const medicationHistory = await this.storage.getMedicationHistory(patientId);

    // Get recent alerts
    const allAlerts = await this.storage.getAlertsByPatient(patientId);
    const recentAlerts = allAlerts.slice(0, 10);

    // Calculate adherence metrics
    let totalTaken = 0;
    let totalSkipped = 0;

    medicationHistory.forEach((history) => {
      totalTaken += history.total_taken;
      totalSkipped += history.total_skipped;
    });

    const totalDoses = totalTaken + totalSkipped;
    const adherenceRate = totalDoses > 0 
      ? Math.round((totalTaken / totalDoses) * 100 * 100) / 100 
      : 0;

    return {
      ...patient,
      medication_history: medicationHistory,
      recent_alerts: recentAlerts,
      total_doses_taken: totalTaken,
      total_doses_skipped: totalSkipped,
      adherence_rate: adherenceRate,
    };
  }
}

