import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { AIModule } from '../ai/ai.module';
import { PatientModule } from '../patient/patient.module';

@Module({
  imports: [AIModule, PatientModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}

