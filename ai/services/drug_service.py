import json
import os
from typing import List, Dict, Optional
from pathlib import Path


class DrugService:
    def __init__(self, data_path: str = None):
        if data_path is None:
            # Try drug_data.json first, then fallback to drugs_sample.json
            default_path = os.path.join(Path(__file__).parent.parent, "data", "drug_data.json")
            if not os.path.exists(default_path):
                default_path = os.path.join(Path(__file__).parent.parent, "data", "drugs_sample.json")
            data_path = default_path
        self.data_path = data_path
        self.drugs: List[Dict] = []
        self.raw_drugs: List[Dict] = []  # Store original format for reference
        self.load_drugs()

    def load_drugs(self):
        """Load drug dataset from JSON file, convert to standard format, fallback to sample drugs if not found"""
        try:
            if os.path.exists(self.data_path):
                with open(self.data_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Handle both list and dict formats
                    if isinstance(data, list):
                        self.raw_drugs = data
                    elif isinstance(data, dict) and "drugs" in data:
                        self.raw_drugs = data["drugs"]
                    else:
                        self.raw_drugs = []
                
                if len(self.raw_drugs) > 0:
                    # Convert to standard format
                    self.drugs = [self._convert_to_standard_format(drug) for drug in self.raw_drugs]
                    print(f"✅ Loaded {len(self.drugs)} drugs from {self.data_path}")
                    return
            else:
                print(f"Warning: Drug dataset not found at {self.data_path}")
            
            # Fallback to sample drugs if dataset not found or empty
            print("📋 Using sample drug data as fallback")
            self.drugs = self._get_sample_drugs()
            self.raw_drugs = self.drugs
            print(f"✅ Loaded {len(self.drugs)} sample drugs")
        except Exception as e:
            print(f"Error loading drugs: {e}")
            # Fallback to sample drugs on error
            print("📋 Using sample drug data as fallback due to error")
            self.drugs = self._get_sample_drugs()
            self.raw_drugs = self.drugs
            print(f"✅ Loaded {len(self.drugs)} sample drugs")

    def _convert_to_standard_format(self, raw_drug: Dict) -> Dict:
        """
        Convert drug_data.json format to standard format expected by the system
        Maps: product_name -> name, uses -> conditions, determines criticality, etc.
        """
        # Extract drug name (prefer product_name, fallback to salt_composition)
        drug_name = raw_drug.get("product_name", "")
        if not drug_name:
            # Try to extract from salt_composition
            salt = raw_drug.get("salt_composition", "")
            if salt:
                # Extract main drug name from salt (e.g., "Epalrestat (50mg)" -> "Epalrestat")
                drug_name = salt.split("(")[0].strip()
        
        # Extract conditions from uses
        uses = raw_drug.get("uses", [])
        conditions = uses.copy() if isinstance(uses, list) else []
        
        # Determine category from therapeutic class or uses
        fact = raw_drug.get("fact", {})
        category = fact.get("Therapeutic Class", "")
        if not category:
            # Infer from uses
            if any("diabetic" in use.lower() for use in conditions):
                category = "Antidiabetic"
            elif any("heart" in use.lower() or "cardiac" in use.lower() or "hypertension" in use.lower() for use in conditions):
                category = "Cardiac"
            elif any("cholesterol" in use.lower() or "lipid" in use.lower() for use in conditions):
                category = "Statin"
            else:
                category = "General"
        
        # Determine criticality based on uses and side effects
        # High-risk conditions: heart failure, diabetes (insulin-dependent), anticoagulants, etc.
        critical_keywords = [
            "heart failure", "heart attack", "stroke", "diabetes", "insulin",
            "warfarin", "anticoagulant", "arrhythmia", "angina", "hypertension"
        ]
        is_critical = any(
            keyword in " ".join(conditions).lower() or 
            keyword in drug_name.lower() or
            keyword in raw_drug.get("Drug_working", "").lower()
            for keyword in critical_keywords
        )
        
        # Extract dosage from salt_composition if available
        dosage = raw_drug.get("salt_composition", "")
        
        # Build risk description from side effects and expert advice
        side_effects = raw_drug.get("side_effect", [])
        expert_advice = raw_drug.get("Expert_advice", [])
        
        risk_description = ""
        if side_effects:
            risk_description += f"Side effects: {', '.join(side_effects[:3])}. "
        if expert_advice:
            risk_description += expert_advice[0] if isinstance(expert_advice, list) else str(expert_advice)
        
        # Build standard format
        standard_drug = {
            "name": drug_name,
            "category": category,
            "critical": is_critical,
            "conditions": conditions,
            "risk_if_skipped": risk_description or f"Consult doctor if {drug_name} is skipped",
            "dosage": dosage,
            # Keep original data for reference
            "original_data": {
                "product_name": raw_drug.get("product_name"),
                "salt_composition": raw_drug.get("salt_composition"),
                "uses": raw_drug.get("uses", []),
                "side_effect": raw_drug.get("side_effect", []),
                "Drug_working": raw_drug.get("Drug_working", ""),
                "Expert_advice": raw_drug.get("Expert_advice", []),
                "safety_advice": raw_drug.get("safety_advice", []),
            }
        }
        
        return standard_drug

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
        """
        Get drug information by name
        Searches in: name, product_name, salt_composition
        """
        drug_name_lower = drug_name.lower()
        
        # First, try exact match on name
        for drug in self.drugs:
            if drug["name"].lower() == drug_name_lower:
                return drug
        
        # Try partial match on name
        for drug in self.drugs:
            if drug_name_lower in drug["name"].lower() or drug["name"].lower() in drug_name_lower:
                return drug
        
        # Try searching in original data (product_name, salt_composition)
        for drug in self.drugs:
            original = drug.get("original_data", {})
            product_name = original.get("product_name", "").lower()
            salt = original.get("salt_composition", "").lower()
            
            if (drug_name_lower in product_name or 
                drug_name_lower in salt or
                any(drug_name_lower in use.lower() for use in original.get("uses", []))):
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

