import requests
import os
from typing import Dict
from prompts.risk_analysis_prompt import RiskAnalysisPrompt


class MedGemmaService:
    def __init__(self, ollama_base_url: str = None):
        self.ollama_base_url = ollama_base_url or os.getenv("OLLAMA_BASE_URL", "http://10.11.7.65:11434")
        self.model_name = os.getenv("GEMMA_MODEL", "gemma3:4b")

    def analyze_skip_risk(
        self,
        drug_name: str,
        skips: int,
        patient_age: int,
        conditions: list,
        drug_info: Dict = None
    ) -> Dict[str, str]:
        """
        Analyze risk of skipping medication using Ollama Gemma model
        Returns: {risk_level, message, ai_explanation}
        """
        # Create prompt using class-based approach with validation
        prompt_obj = RiskAnalysisPrompt.from_drug_info(
            patient_age=patient_age,
            drug_name=drug_name,
            skips=skips,
            conditions=conditions,
            drug_info=drug_info
        )
        
        # Format the prompt (validates and formats automatically)
        prompt = prompt_obj.format()

        try:
            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "top_p": 0.9
                    }
                },
                timeout=60
            )
            response.raise_for_status()
            data = response.json()
            ai_response = data.get("response", "")

            # Parse the response
            risk_level = "Medium"  # Default
            message = "Please consult your doctor about missed doses."
            explanation = ai_response

            # Extract structured information from response
            lines = ai_response.split("\n")
            for line in lines:
                if "RISK_LEVEL:" in line:
                    risk_part = line.split("RISK_LEVEL:")[1].strip()
                    if "High" in risk_part:
                        risk_level = "High"
                    elif "Low" in risk_part:
                        risk_level = "Low"
                    else:
                        risk_level = "Medium"
                elif "MESSAGE:" in line:
                    message = line.split("MESSAGE:")[1].strip()
                elif "EXPLANATION:" in line:
                    explanation = line.split("EXPLANATION:")[1].strip()

            # If drug is critical, boost risk level
            if drug_info and drug_info.get("critical", False) and risk_level == "Low":
                risk_level = "Medium"
            if drug_info and drug_info.get("critical", False) and skips >= 2:
                risk_level = "High"

            return {
                "risk_level": risk_level,
                "message": message if message else "Please consult your doctor about missed doses.",
                "ai_explanation": explanation if explanation else ai_response
            }
        except Exception as e:
            print(f"Error in MedGemma analysis: {e}")
            # Fallback response
            return {
                "risk_level": "Medium",
                "message": "Unable to analyze risk. Please consult your doctor immediately.",
                "ai_explanation": f"Skipping {drug_name} {skips} time(s) may have health implications. Please contact your healthcare provider."
            }

