import requests
import os
from typing import Dict


class MedGemmaService:
    def __init__(self, ollama_base_url: str = None):
        self.ollama_base_url = ollama_base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model_name = os.getenv("GEMMA_MODEL", "gemma:4b")

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
        # Build prompt for risk analysis
        conditions_str = ", ".join(conditions) if conditions else "no specific conditions"
        drug_category = drug_info.get("category", "Unknown") if drug_info else "Unknown"
        risk_info = drug_info.get("risk_if_skipped", "Unknown risk") if drug_info else "Unknown risk"
        
        prompt = f"""You are a medical AI assistant. Analyze the risk of a patient skipping their medication.

Patient Information:
- Age: {patient_age} years
- Medical Conditions: {conditions_str}
- Medication: {drug_name} ({drug_category})
- Number of skipped doses: {skips}
- Known risk if skipped: {risk_info}

Please provide:
1. Risk Level: "Low", "Medium", or "High"
2. A brief message explaining the immediate concern
3. A detailed AI explanation of what could happen

Format your response as:
RISK_LEVEL: [Low/Medium/High]
MESSAGE: [brief message]
EXPLANATION: [detailed explanation]"""

        try:
            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
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

