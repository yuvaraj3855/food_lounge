import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { PatientModule } from './patient/patient.module';
import { AlertsModule } from './alerts/alerts.module';
import { DoctorModule } from './doctor/doctor.module';
import { MessagesModule } from './messages/messages.module';
import { Patient } from './entities/patient.entity';
import { Doctor } from './entities/doctor.entity';
import { Medication } from './entities/medication.entity';
import { MedicationDose } from './entities/medication-dose.entity';
import { Alert } from './entities/alert.entity';
import { Message } from './entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://admin:merai4546@10.11.7.65:5433/medmentor',
      entities: [Patient, Doctor, Medication, MedicationDose, Alert, Message],
      synchronize: process.env.NODE_ENV !== 'production', // Auto-create tables in dev
      logging: process.env.NODE_ENV === 'development',
    }),
    EventEmitterModule.forRoot(),
    SharedModule,
    PatientModule,
    AlertsModule,
    DoctorModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
