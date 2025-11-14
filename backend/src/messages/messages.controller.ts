import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
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
import { MessagesService } from './messages.service';
import { MessageDto } from '../dto/message.dto';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a text message' })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    type: MessageDto,
  })
  async sendMessage(@Body() body: MessageDto) {
    return this.messagesService.sendMessage(body);
  }

  @Get('conversation/:patientId/:doctorId')
  @ApiOperation({ summary: 'Get conversation between patient and doctor' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiParam({ name: 'doctorId', description: 'Doctor ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversation messages',
  })
  async getConversation(
    @Param('patientId') patientId: string,
    @Param('doctorId') doctorId: string,
  ) {
    return this.messagesService.getConversation(patientId, doctorId);
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Get all conversations for a doctor' })
  @ApiParam({ name: 'doctorId', description: 'Doctor ID' })
  @ApiResponse({
    status: 200,
    description: 'List of conversations',
  })
  async getDoctorConversations(@Param('doctorId') doctorId: string) {
    return this.messagesService.getConversationsByDoctor(doctorId);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all conversations for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiResponse({
    status: 200,
    description: 'List of conversations',
  })
  async getPatientConversations(@Param('patientId') patientId: string) {
    return this.messagesService.getConversationsByPatient(patientId);
  }

  @Post('voice')
  @ApiOperation({
    summary: 'Send a voice message',
    description: 'Accepts WAV audio file, transcribes it, and creates a message',
  })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'patient_id', description: 'Patient ID' })
  @ApiQuery({ name: 'doctor_id', description: 'Doctor ID' })
  @ApiQuery({
    name: 'language',
    required: false,
    description: 'Language code (hi, en, ta, etc.)',
    example: 'hi',
  })
  @ApiResponse({
    status: 201,
    description: 'Voice message sent successfully',
    type: MessageDto,
  })
  @ApiResponse({ status: 400, description: 'Audio file is required' })
  async sendVoiceMessage(
    @Req() request: FastifyRequest,
    @Query('patient_id') patientId: string,
    @Query('doctor_id') doctorId: string,
    @Query('language') language: string = 'hi',
  ) {
    const data = await request.file();
    
    if (!data) {
      throw new BadRequestException('Audio file is required');
    }

    const fileBuffer = await data.toBuffer();
    const file = {
      buffer: fileBuffer,
      mimetype: data.mimetype || 'audio/wav',
      originalname: data.filename || 'audio.wav',
      size: fileBuffer.length,
    };

    return this.messagesService.sendVoiceMessage(
      patientId,
      doctorId,
      file,
      language,
    );
  }

  @Post(':messageId/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({
    status: 200,
    description: 'Message marked as read',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  async markAsRead(@Param('messageId') messageId: string) {
    this.messagesService.markAsRead(messageId);
    return { success: true };
  }
}

