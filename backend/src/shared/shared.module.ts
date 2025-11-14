import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageService } from '../services/storage.service';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { Medication } from '../entities/medication.entity';
import { MedicationDose } from '../entities/medication-dose.entity';
import { Alert } from '../entities/alert.entity';
import { Message } from '../entities/message.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, Doctor, Medication, MedicationDose, Alert, Message]),
  ],
  providers: [StorageService],
  exports: [StorageService],
})
export class SharedModule {}

