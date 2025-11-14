import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { RiskAnalysisResponseDto } from '../dto/risk-analysis.dto';

@Injectable()
export class AIService {
  private readonly aiServiceUrl: string;
  private readonly httpClient: AxiosInstance;

  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.httpClient = axios.create({
      baseURL: this.aiServiceUrl,
      timeout: 60000, // 60 seconds for AI processing
    });
  }

  async analyzeSkipRisk(
    drugName: string,
    skips: number,
    patientAge: number,
    conditions: string[],
  ): Promise<RiskAnalysisResponseDto> {
    try {
      const response = await this.httpClient.post<RiskAnalysisResponseDto>(
        '/analyze_skip',
        {
          drug_name: drugName,
          skips,
          patient_age: patientAge,
          conditions,
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new HttpException(
          `AI service error: ${error.message}`,
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Failed to analyze skip risk',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async transcribeAudio(
    audioFile: { buffer: Buffer; mimetype: string; originalname: string },
    language: string = 'hi',
  ): Promise<{ text: string; language: string }> {
    try {
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', audioFile.buffer, {
        filename: audioFile.originalname,
        contentType: audioFile.mimetype,
      });
      formData.append('language', language);

      const response = await this.httpClient.post<{
        text: string;
        language: string;
      }>('/voice/transcribe', formData, {
        headers: formData.getHeaders(),
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new HttpException(
          `STT service error: ${error.message}`,
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Failed to transcribe audio',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async synthesizeSpeech(
    text: string,
    language: string = 'hi',
  ): Promise<string> {
    try {
      const response = await this.httpClient.post<{ audio_url: string }>(
        '/voice/synthesize',
        {
          text,
          language,
        },
      );

      // Return full URL
      return `${this.aiServiceUrl}${response.data.audio_url}`;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new HttpException(
          `TTS service error: ${error.message}`,
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Failed to synthesize speech',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

