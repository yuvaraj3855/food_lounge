import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { PatientService } from './patient.service';
import { SkipDoseDto } from '../dto/skip-dose.dto';
import {
  CreatePatientDto,
  CreatePatientWithMedicationsDto,
  PatientDto,
} from '../dto/patient.dto';
import { AlertDto } from '../dto/alert.dto';

@ApiTags('patients')
@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get()
  @ApiOperation({ summary: 'Get all patients' })
  @ApiResponse({
    status: 200,
    description: 'List of all patients',
    type: [PatientDto],
  })
  async getAllPatients() {
    return this.patientService.getAllPatients();
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Get all patients assigned to a doctor' })
  @ApiParam({ name: 'doctorId', description: 'Doctor ID' })
  @ApiResponse({
    status: 200,
    description: 'List of patients',
    type: [PatientDto],
  })
  async getPatientsByDoctor(@Param('doctorId') doctorId: string) {
    return this.patientService.getPatientsByDoctor(doctorId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiBody({
    description: 'Patient creation payload with optional medication details',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'Rajesh Kumar',
          description: 'Patient full name',
        },
        age: {
          type: 'number',
          example: 63,
          description: 'Patient age in years',
        },
        conditions: {
          type: 'array',
          items: { type: 'string' },
          example: ['Type 2 Diabetes', 'Heart Failure'],
          description: 'List of medical conditions',
        },
        current_medications: {
          type: 'array',
          items: { type: 'string' },
          example: ['Furosemide', 'Metformin', 'Lisinopril'],
          description: 'List of medication names',
        },
        doctor_id: {
          type: 'string',
          example: 'doctor-1',
          description: 'Assigned doctor ID (defaults to doctor-1)',
        },
        language: {
          type: 'string',
          example: 'hi',
          description: 'Preferred language code (e.g., hi, en, ta, te)',
        },
        medication_details: {
          type: 'array',
          description: 'Optional detailed medication information',
          items: {
            type: 'object',
            properties: {
              drug_name: { type: 'string', example: 'Furosemide' },
              dosage: { type: 'string', example: '40mg' },
              frequency: {
                type: 'string',
                enum: ['once daily', 'twice daily', 'thrice daily', 'as needed'],
                example: 'twice daily',
              },
              timing: {
                type: 'string',
                example: 'morning and evening',
              },
              purpose: {
                type: 'string',
                example: 'Diuretic for heart failure',
              },
              risk_level: {
                type: 'string',
                enum: ['Low', 'Medium', 'High'],
                example: 'High',
              },
              instructions: {
                type: 'string',
                example: 'Take with food',
              },
            },
            required: ['drug_name', 'dosage', 'frequency', 'risk_level'],
          },
        },
      },
      required: ['name', 'age', 'conditions', 'current_medications'],
      example: {
        name: 'Rajesh Kumar',
        age: 63,
        conditions: ['Type 2 Diabetes', 'Heart Failure'],
        current_medications: ['Furosemide', 'Metformin', 'Lisinopril'],
        doctor_id: 'doctor-1',
        language: 'hi',
        medication_details: [
          {
            drug_name: 'Furosemide',
            dosage: '40mg',
            frequency: 'twice daily',
            timing: 'morning and evening',
            purpose: 'Diuretic for heart failure',
            risk_level: 'High',
            instructions: 'Take with food',
          },
          {
            drug_name: 'Metformin',
            dosage: '500mg',
            frequency: 'twice daily',
            timing: 'with meals',
            purpose: 'Blood sugar control',
            risk_level: 'Medium',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Patient created successfully',
    type: PatientDto,
  })
  async createPatient(
    @Body() createPatientDto: CreatePatientDto | CreatePatientWithMedicationsDto,
  ) {
    // Extract basic patient data
    const basicPatientDto: CreatePatientDto = {
      name: createPatientDto.name,
      age: createPatientDto.age,
      conditions: createPatientDto.conditions,
      current_medications: createPatientDto.current_medications,
      doctor_id: createPatientDto.doctor_id,
      language: createPatientDto.language || 'hi', // Default to Hindi
    };
    
    // Get medication_details if provided
    const medicationDetails = 
      'medication_details' in createPatientDto && createPatientDto.medication_details
        ? createPatientDto.medication_details
        : undefined;
    
    return this.patientService.createPatient(basicPatientDto, medicationDetails);
  }

  @Post('skip-dose')
  @ApiOperation({
    summary: 'Record skipped medication dose',
    description: 'Records a skipped dose and triggers AI risk analysis',
  })
  @ApiResponse({
    status: 201,
    description: 'Skipped dose recorded and alert created',
    type: AlertDto,
  })
  @ApiResponse({ status: 400, description: 'No patient found' })
  async skipDose(@Body() skipDoseDto: SkipDoseDto) {
    const patients = await this.patientService.getAllPatients();
    const patientId = skipDoseDto.patient_id || patients[0]?.id;

    if (!patientId) {
      throw new BadRequestException('No patient found');
    }

    return this.patientService.recordSkipDose(
      patientId,
      skipDoseDto.drug_name,
      skipDoseDto.skips,
    );
  }

  @Post('record-dose')
  @ApiOperation({
    summary: 'Record medication dose (taken or skipped)',
    description:
      'Records if patient took medication or skipped it. If skipped, AI analyzes risk and sends alert to doctor via SSE stream.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', example: 'patient-uuid' },
        drug_name: { type: 'string', example: 'Furosemide' },
        status: {
          type: 'string',
          enum: ['taken', 'skipped'],
          example: 'taken',
          description: 'If "skipped", AI will analyze risk and alert doctor',
        },
        scheduled_time: {
          type: 'string',
          format: 'date-time',
        },
      },
      required: ['patient_id', 'drug_name', 'status'],
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Dose recorded. If skipped, returns alert (also sent to doctor via SSE). If taken, returns dose record.',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            id: { type: 'string' },
            patient_id: { type: 'string' },
            drug_name: { type: 'string' },
            status: { type: 'string', enum: ['taken', 'skipped'] },
            scheduled_time: { type: 'string' },
            actual_time: { type: 'string' },
            created_at: { type: 'string' },
          },
          description: 'Dose record (when status="taken")',
        },
        {
          type: 'object',
          properties: {
            id: { type: 'string' },
            patient_id: { type: 'string' },
            patient_name: { type: 'string' },
            drug_name: { type: 'string' },
            risk_level: { type: 'string', enum: ['Low', 'Medium', 'High'] },
            message: { type: 'string' },
            ai_explanation: { type: 'string' },
            timestamp: { type: 'string' },
            acknowledged: { type: 'boolean' },
          },
          description: 'Alert (when status="skipped") - Also sent to doctor via SSE',
        },
      ],
    },
  })
  async recordDose(
    @Body()
    body: {
      patient_id: string;
      drug_name: string;
      status: 'taken' | 'skipped';
      scheduled_time?: string;
    },
  ) {
    return this.patientService.recordDose(
      body.patient_id,
      body.drug_name,
      body.status,
      body.scheduled_time ? new Date(body.scheduled_time) : undefined,
    );
  }

  @Get(':id/medication-history')
  @ApiOperation({ summary: 'Get medication history for a patient' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({
    status: 200,
    description: 'Medication history grouped by drug',
  })
  async getMedicationHistory(@Param('id') id: string) {
    return this.patientService.getMedicationHistory(id);
  }

  @Get(':id/recent-doses')
  @ApiOperation({ summary: 'Get recent medication doses for a patient' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of recent doses to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Recent medication doses',
  })
  async getRecentDoses(
    @Param('id') id: string,
    @Query('limit') limit: string = '10',
  ) {
    return this.patientService.getRecentDoses(id, parseInt(limit, 10));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update patient information' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiBody({
    description: 'Partial patient update payload (can include medication_details)',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Rajesh Kumar' },
        age: { type: 'number', example: 63 },
        conditions: {
          type: 'array',
          items: { type: 'string' },
          example: ['Type 2 Diabetes', 'Heart Failure'],
        },
        current_medications: {
          type: 'array',
          items: { type: 'string' },
          example: ['Furosemide', 'Metformin'],
        },
        doctor_id: { type: 'string', example: 'doctor-1' },
        language: { type: 'string', example: 'hi' },
        medication_details: {
          type: 'array',
          description: 'Detailed medication information (replaces existing medications)',
          items: {
            type: 'object',
            properties: {
              drug_name: { type: 'string', example: 'Furosemide' },
              dosage: { type: 'string', example: '40mg' },
              frequency: {
                type: 'string',
                enum: ['once daily', 'twice daily', 'thrice daily', 'as needed'],
                example: 'twice daily',
              },
              timing: { type: 'string', example: 'morning and evening' },
              purpose: { type: 'string', example: 'Diuretic for heart failure' },
              risk_level: {
                type: 'string',
                enum: ['Low', 'Medium', 'High'],
                example: 'High',
              },
              instructions: { type: 'string', example: 'Take with food' },
            },
            required: ['drug_name', 'dosage', 'frequency', 'risk_level'],
          },
        },
      },
      example: {
        name: 'Rajesh Kumar',
        language: 'ta',
        medication_details: [
          {
            drug_name: 'Furosemide',
            dosage: '40mg',
            frequency: 'twice daily',
            timing: 'morning and evening',
            purpose: 'Diuretic for heart failure',
            risk_level: 'High',
            instructions: 'Take with food',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Patient updated successfully',
    type: PatientDto,
  })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async updatePatient(
    @Param('id') id: string,
    @Body()
    updateDto: Partial<{
      name: string;
      age: number;
      conditions: string[];
      current_medications: string[];
      doctor_id: string;
      language: string;
      medication_details?: Array<{
        drug_name: string;
        dosage: string;
        frequency: string;
        timing?: string;
        purpose?: string;
        risk_level: 'Low' | 'Medium' | 'High';
        instructions?: string;
      }>;
    }>,
  ) {
    return this.patientService.updatePatient(id, updateDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Patient details', type: PatientDto })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async getPatient(@Param('id') id: string) {
    return this.patientService.getPatientById(id);
  }

  @Post('voice-query')
  @ApiOperation({
    summary: 'Process voice query from patient',
    description: 'Accepts WAV audio file, transcribes it, and returns TTS response',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Audio file upload',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'WAV audio file to transcribe',
        },
      },
    },
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description: 'Language code (hi, en, ta, etc.)',
    example: 'hi',
  })
  @ApiQuery({
    name: 'patient_id',
    required: false,
    description: 'Patient ID (uses first patient if not provided)',
  })
  @ApiResponse({
    status: 200,
    description: 'Voice query processed successfully. Returns text response and language code for frontend TTS.',
    schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          example: 'आपने अपनी दवा छोड़ दी है। कृपया अपने डॉक्टर से संपर्क करें।',
          description: 'Response text in patient\'s preferred language',
        },
        language: {
          type: 'string',
          example: 'hi',
          description: 'Language code for frontend TTS (patient\'s preferred language)',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Audio file is required' })
  async voiceQuery(
    @Req() request: FastifyRequest,
    @Query('language') language: string = 'hi',
    @Query('patient_id') patientId?: string,
  ) {
    const data = await request.file();
    
    if (!data) {
      throw new BadRequestException('Audio file is required');
    }

    if (!patientId) {
      const patients = await this.patientService.getAllPatients();
      patientId = patients[0]?.id;
    }

    if (!patientId) {
      throw new BadRequestException('No patient found');
    }

    // Convert Fastify multipart file to compatible format
    const fileBuffer = await data.toBuffer();
    const file = {
      buffer: fileBuffer,
      mimetype: data.mimetype || 'audio/wav',
      originalname: data.filename || 'audio.wav',
      size: fileBuffer.length,
    };

    // language parameter is for STT (must match audio language)
    // Response will be in patient's preferred language
    return this.patientService.handleVoiceQuery(file, language, patientId);
  }
}

