import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import { DoctorDashboardDto, PatientDetailDto } from '../dto/doctor-dashboard.dto';

@ApiTags('doctor')
@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get('dashboard/:doctorId')
  @ApiOperation({
    summary: 'Get comprehensive doctor dashboard',
    description:
      'Returns all patient details with medications, history, alerts, and adherence metrics',
  })
  @ApiParam({ name: 'doctorId', description: 'Doctor ID', example: 'doctor-1' })
  @ApiResponse({
    status: 200,
    description: 'Doctor dashboard with all patient details',
    type: DoctorDashboardDto,
  })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async getDashboard(@Param('doctorId') doctorId: string) {
    return this.doctorService.getDashboard(doctorId);
  }

  @Get('patient/:doctorId/:patientId')
  @ApiOperation({
    summary: 'Get detailed patient information',
    description:
      'Returns comprehensive patient details including medications, history, and alerts',
  })
  @ApiParam({ name: 'doctorId', description: 'Doctor ID' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiResponse({
    status: 200,
    description: 'Detailed patient information',
    type: PatientDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Patient or doctor not found' })
  async getPatientDetails(
    @Param('doctorId') doctorId: string,
    @Param('patientId') patientId: string,
  ) {
    return this.doctorService.getPatientDetails(doctorId, patientId);
  }

  @Post('respond')
  @ApiOperation({
    summary: 'Doctor response to an alert',
    description: 'Allows doctor to respond to a patient alert',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        alertId: { type: 'string', example: 'alert-123' },
        response: {
          type: 'string',
          example: 'Please take your medication immediately and monitor symptoms.',
        },
      },
      required: ['alertId', 'response'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Response recorded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Response recorded' },
        alertId: { type: 'string', example: 'alert-123' },
        response: { type: 'string' },
      },
    },
  })
  async respondToAlert(@Body() body: { alertId: string; response: string }) {
    // Mock implementation - in production, this would save the response
    return {
      success: true,
      message: 'Response recorded',
      alertId: body.alertId,
      response: body.response,
    };
  }
}

