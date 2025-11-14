import { Module } from '@nestjs/common';
import { PatientController } from './patient.controller';
import { PatientNotificationsController } from './patient-notifications.controller';
import { PatientService } from './patient.service';
import { PatientNotificationsService } from '../services/patient-notifications.service';
import { AIModule } from '../ai/ai.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [AIModule, SharedModule],
  controllers: [PatientController, PatientNotificationsController],
  providers: [PatientService, PatientNotificationsService],
  exports: [PatientService, PatientNotificationsService],
})
export class PatientModule {}

