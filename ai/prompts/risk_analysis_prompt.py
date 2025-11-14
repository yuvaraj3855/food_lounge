from prompts.base_prompt import BasePrompt
from pydantic import Field
from typing import List, Dict, Any, Optional


class RiskAnalysisPrompt(BasePrompt):
    """
    Prompt for analyzing medication skip risk
    Uses structured data with validation
    """
    
    # Input fields with validation
    patient_age: int = Field(..., description="Patient age in years", gt=0, lt=150)
    conditions: List[str] = Field(default_factory=list, description="List of medical conditions")
    drug_name: str = Field(..., description="Name of the medication", min_length=1)
    drug_category: str = Field(default="Unknown", description="Category of the medication")
    skips: int = Field(..., description="Number of skipped doses", ge=0)
    risk_info: str = Field(default="Unknown risk", description="Known risk if medication is skipped")
    
    def get_template(self) -> str:
        """Return the prompt template"""
        return """You are a medical AI assistant. Analyze the risk of a patient skipping their medication.

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
    
    def get_variables(self) -> Dict[str, Any]:
        """Return formatted variables for the template"""
        conditions_str = ", ".join(self.conditions) if self.conditions else "no specific conditions"
        
        return {
            "patient_age": self.patient_age,
            "conditions_str": conditions_str,
            "drug_name": self.drug_name,
            "drug_category": self.drug_category,
            "skips": self.skips,
            "risk_info": self.risk_info
        }
    
    @classmethod
    def from_drug_info(
        cls,
        patient_age: int,
        drug_name: str,
        skips: int,
        conditions: List[str] = None,
        drug_info: Optional[Dict[str, Any]] = None
    ) -> "RiskAnalysisPrompt":
        """
        Convenience method to create prompt from drug info dictionary
        """
        if conditions is None:
            conditions = []
        
        drug_category = "Unknown"
        risk_info = "Unknown risk"
        
        if drug_info:
            drug_category = drug_info.get("category", "Unknown")
            risk_info = drug_info.get("risk_if_skipped", "Unknown risk")
        
        return cls(
            patient_age=patient_age,
            conditions=conditions,
            drug_name=drug_name,
            drug_category=drug_category,
            skips=skips,
            risk_info=risk_info
        )

