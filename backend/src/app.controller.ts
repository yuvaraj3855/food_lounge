import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('languages')
  @ApiTags('common')
  @ApiOperation({
    summary: 'Get list of supported languages',
    description: 'Returns list of language codes and names supported by the system for STT/TTS',
  })
  @ApiResponse({
    status: 200,
    description: 'List of supported languages',
    schema: {
      type: 'object',
      properties: {
        languages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'hi' },
              name: { type: 'string', example: 'Hindi' },
              native_name: { type: 'string', example: 'हिन्दी' },
            },
          },
        },
      },
    },
  })
  getLanguages() {
    return {
      languages: [
        { code: 'en', name: 'English', native_name: 'English' },
        { code: 'hi', name: 'Hindi', native_name: 'हिन्दी' },
        { code: 'ta', name: 'Tamil', native_name: 'தமிழ்' },
        { code: 'te', name: 'Telugu', native_name: 'తెలుగు' },
        { code: 'kn', name: 'Kannada', native_name: 'ಕನ್ನಡ' },
        { code: 'ml', name: 'Malayalam', native_name: 'മലയാളം' },
        { code: 'mr', name: 'Marathi', native_name: 'मराठी' },
        { code: 'gu', name: 'Gujarati', native_name: 'ગુજરાતી' },
        { code: 'bn', name: 'Bengali', native_name: 'বাংলা' },
        { code: 'pa', name: 'Punjabi', native_name: 'ਪੰਜਾਬੀ' },
        { code: 'as', name: 'Assamese', native_name: 'অসমীয়া' },
        { code: 'or', name: 'Odia', native_name: 'ଓଡ଼ିଆ' },
        { code: 'ur', name: 'Urdu', native_name: 'اردو' },
        { code: 'ne', name: 'Nepali', native_name: 'नेपाली' },
      ],
    };
  }
}
