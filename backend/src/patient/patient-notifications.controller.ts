import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PatientNotificationsService } from '../services/patient-notifications.service';
import { PatientNotificationDto } from '../dto/patient-notification.dto';

@ApiTags('patient-notifications')
@Controller('patient-notifications')
export class PatientNotificationsController {
  constructor(
    private readonly notificationsService: PatientNotificationsService,
  ) {}

  @Sse('stream/:patientId')
  @ApiOperation({
    summary: 'Stream real-time notifications for a specific patient via SSE',
    description:
      'Establishes an SSE connection that streams notifications (medication reminders, AI warnings, doctor instructions) to the patient. Frontend should use the text and language fields for TTS.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'Patient ID',
    example: '9eedabb8-a5e5-4a60-b8d7-3146f545495b',
  })
  @ApiResponse({
    status: 200,
    description: 'SSE stream of patient notifications',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          example:
            'data: {"id":"notif-123","patient_id":"patient-1","type":"medication_reminder","text":"कृपया अपनी दवा लें","language":"hi",...}',
        },
      },
    },
  })
  stream(@Param('patientId') patientId: string): Observable<MessageEvent> {
    return this.notificationsService
      .getPatientNotificationStream(patientId)
      .pipe(
        map((notification: PatientNotificationDto) => ({
          data: JSON.stringify(notification),
        })),
      );
  }

  @Post('reminder/:patientId')
  @ApiOperation({
    summary: 'Send medication reminder to patient',
    description:
      'Manually trigger a medication reminder notification for a patient',
  })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        drug_name: { type: 'string', example: 'Furosemide' },
        scheduled_time: { type: 'string', format: 'date-time' },
      },
      required: ['drug_name', 'scheduled_time'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Reminder sent successfully',
    type: PatientNotificationDto,
  })
  async sendReminder(
    @Param('patientId') patientId: string,
    @Body()
    body: {
      drug_name: string;
      scheduled_time: string;
    },
  ) {
    return this.notificationsService.sendMedicationReminder(
      patientId,
      body.drug_name,
      new Date(body.scheduled_time),
    );
  }

  @Post('warning/:patientId')
  @ApiOperation({
    summary: 'Send AI warning to patient about skipping medication',
    description:
      'Sends an AI-generated warning about potential health issues if medication is skipped',
  })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        drug_name: { type: 'string', example: 'Furosemide' },
        scheduled_time: { type: 'string', format: 'date-time' },
      },
      required: ['drug_name', 'scheduled_time'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Warning sent successfully',
    type: PatientNotificationDto,
  })
  async sendWarning(
    @Param('patientId') patientId: string,
    @Body()
    body: {
      drug_name: string;
      scheduled_time: string;
    },
  ) {
    return this.notificationsService.sendAIWarning(
      patientId,
      body.drug_name,
      new Date(body.scheduled_time),
    );
  }

  @Post('doctor-instruction/:patientId')
  @ApiOperation({
    summary: 'Send doctor instruction to patient',
    description:
      'Sends a doctor message to patient, automatically translated to patient language',
  })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Please take your medication on time' },
        language: { type: 'string', example: 'en' },
      },
      required: ['message'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Instruction sent successfully',
    type: PatientNotificationDto,
  })
  async sendDoctorInstruction(
    @Param('patientId') patientId: string,
    @Body()
    body: {
      message: string;
      language?: string;
    },
  ) {
    return this.notificationsService.sendDoctorInstruction(
      patientId,
      body.message,
      body.language,
    );
  }
}

