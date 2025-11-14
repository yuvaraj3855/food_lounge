import json
import os
from typing import List, Dict, Optional
from pathlib import Path


class DrugService:
    def __init__(self, data_path: str = None):
        if data_path is None:
            data_path = os.path.join(Path(__file__).parent.parent, "data", "drugs_sample.json")
        self.data_path = data_path
        self.drugs: List[Dict] = []
        self.load_drugs()

    def load_drugs(self):
        """Load drug dataset from JSON file, fallback to sample drugs if not found"""
        try:
            if os.path.exists(self.data_path):
                with open(self.data_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Handle both list and dict formats
                    if isinstance(data, list):
                        self.drugs = data
                    elif isinstance(data, dict) and "drugs" in data:
                        self.drugs = data["drugs"]
                    else:
                        self.drugs = []
                
                if len(self.drugs) > 0:
                    print(f"✅ Loaded {len(self.drugs)} drugs from {self.data_path}")
                    return
            else:
                print(f"Warning: Drug dataset not found at {self.data_path}")
            
            # Fallback to sample drugs if dataset not found or empty
            print("📋 Using sample drug data as fallback")
            self.drugs = self._get_sample_drugs()
            print(f"✅ Loaded {len(self.drugs)} sample drugs")
        except Exception as e:
            print(f"Error loading drugs: {e}")
            # Fallback to sample drugs on error
            print("📋 Using sample drug data as fallback due to error")
            self.drugs = self._get_sample_drugs()
            print(f"✅ Loaded {len(self.drugs)} sample drugs")

    def save_drugs(self):
        """Save drugs to JSON file"""
        os.makedirs(os.path.dirname(self.data_path), exist_ok=True)
        with open(self.data_path, 'w', encoding='utf-8') as f:
            json.dump(self.drugs, f, indent=2, ensure_ascii=False)

    def _get_sample_drugs(self) -> List[Dict]:
        """Return sample drug data for demo"""
        return [
            {
                "name": "Furosemide",
                "category": "Diuretic",
                "critical": True,
                "conditions": ["Heart Failure", "Hypertension", "Edema"],
                "risk_if_skipped": "High - Fluid accumulation, increased blood pressure, heart strain",
                "dosage": "20-80mg daily"
            },
            {
                "name": "Metformin",
                "category": "Antidiabetic",
                "critical": True,
                "conditions": ["Type 2 Diabetes"],
                "risk_if_skipped": "Medium - Elevated blood sugar, long-term complications",
                "dosage": "500-2000mg daily"
            },
            {
                "name": "Lisinopril",
                "category": "ACE Inhibitor",
                "critical": True,
                "conditions": ["Hypertension", "Heart Failure"],
                "risk_if_skipped": "High - Blood pressure spike, increased heart failure risk",
                "dosage": "10-40mg daily"
            },
            {
                "name": "Amlodipine",
                "category": "Calcium Channel Blocker",
                "critical": True,
                "conditions": ["Hypertension", "Angina"],
                "risk_if_skipped": "Medium - Blood pressure elevation, chest pain",
                "dosage": "5-10mg daily"
            },
            {
                "name": "Atorvastatin",
                "category": "Statin",
                "critical": False,
                "conditions": ["High Cholesterol"],
                "risk_if_skipped": "Low - Gradual cholesterol increase",
                "dosage": "10-80mg daily"
            },
            {
                "name": "Warfarin",
                "category": "Anticoagulant",
                "critical": True,
                "conditions": ["Atrial Fibrillation", "Deep Vein Thrombosis"],
                "risk_if_skipped": "High - Blood clot risk, stroke risk",
                "dosage": "2-10mg daily"
            },
            {
                "name": "Insulin Glargine",
                "category": "Insulin",
                "critical": True,
                "conditions": ["Type 1 Diabetes", "Type 2 Diabetes"],
                "risk_if_skipped": "High - Severe hyperglycemia, diabetic ketoacidosis",
                "dosage": "Variable units"
            },
            {
                "name": "Digoxin",
                "category": "Cardiac Glycoside",
                "critical": True,
                "conditions": ["Atrial Fibrillation", "Heart Failure"],
                "risk_if_skipped": "Medium - Irregular heartbeat, heart failure symptoms",
                "dosage": "0.125-0.25mg daily"
            },
            {
                "name": "Levothyroxine",
                "category": "Thyroid Hormone",
                "critical": False,
                "conditions": ["Hypothyroidism"],
                "risk_if_skipped": "Low - Gradual return of hypothyroid symptoms",
                "dosage": "25-200mcg daily"
            },
            {
                "name": "Aspirin",
                "category": "Antiplatelet",
                "critical": True,
                "conditions": ["Cardiovascular Disease"],
                "risk_if_skipped": "Medium - Increased risk of heart attack or stroke",
                "dosage": "75-100mg daily"
            }
        ]

    def get_drug(self, drug_name: str) -> Optional[Dict]:
        """Get drug information by name"""
        drug_name_lower = drug_name.lower()
        for drug in self.drugs:
            if drug["name"].lower() == drug_name_lower:
                return drug
        return None

    def get_critical_drugs(self) -> List[Dict]:
        """Get all critical drugs"""
        return [drug for drug in self.drugs if drug.get("critical", False)]

    def search_drugs_by_condition(self, condition: str) -> List[Dict]:
        """Search drugs by medical condition"""
        condition_lower = condition.lower()
        return [
            drug for drug in self.drugs
            if any(condition_lower in c.lower() for c in drug.get("conditions", []))
        ]

