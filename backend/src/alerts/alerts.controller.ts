import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { AlertsService } from './alerts.service';
import { AlertDto } from '../dto/alert.dto';

@ApiTags('alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Sse('stream')
  @ApiOperation({
    summary: 'Stream real-time alerts via Server-Sent Events',
    description:
      'Establishes an SSE connection that streams alerts as they are created',
  })
  @ApiResponse({
    status: 200,
    description: 'SSE stream of alerts',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          example: 'data: {"id":"alert-123","patient_id":"patient-1",...}',
        },
      },
    },
  })
  stream(): Observable<MessageEvent> {
    return this.alertsService.getAlertStream().pipe(
      map((alert: AlertDto) => ({
        data: JSON.stringify(alert),
      })),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all alerts' })
  @ApiResponse({
    status: 200,
    description: 'List of all alerts',
    type: [AlertDto],
  })
  getAllAlerts() {
    return this.alertsService.getAllAlerts();
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get alerts for a specific patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiResponse({
    status: 200,
    description: 'List of patient alerts',
    type: [AlertDto],
  })
  getAlertsByPatient(@Param('patientId') patientId: string) {
    return this.alertsService.getAlertsByPatient(patientId);
  }

  @Post('acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        alertId: { type: 'string', example: 'alert-123' },
      },
      required: ['alertId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Alert acknowledged successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  acknowledgeAlert(@Body() body: { alertId: string }) {
    this.alertsService.acknowledgeAlert(body.alertId);
    return { success: true };
  }
}

