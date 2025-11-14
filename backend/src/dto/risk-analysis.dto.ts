export class RiskAnalysisResponseDto {
  risk_level: 'Low' | 'Medium' | 'High';
  message: string;
  ai_explanation: string;
  similar_drugs?: string[];
}

