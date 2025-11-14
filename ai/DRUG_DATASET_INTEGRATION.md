# Drug Dataset Integration Guide

## 📋 Overview

The `drug_data.json` file contains 100 real-world medications with comprehensive information including:
- Product names and salt compositions
- Medical uses/indications
- Side effects
- Drug working mechanisms
- Expert advice
- Safety information

## 🔄 How It's Used in MedMentor.AI

### 1. **Automatic Loading**
The `DrugService` automatically loads `drug_data.json` when the AI service starts:

```python
# In ai/services/drug_service.py
drug_service = DrugService()  # Automatically loads drug_data.json
```

**Priority:**
1. First tries: `ai/data/drug_data.json`
2. Fallback: `ai/data/drugs_sample.json`
3. Final fallback: Hardcoded sample drugs

### 2. **Data Format Conversion**

The service converts the raw dataset format to a standard format expected by the system:

**Raw Format (drug_data.json):**
```json
{
  "product_name": "Aldonil Tablet",
  "salt_composition": "Epalrestat (50mg)",
  "uses": ["Diabetic nerve pain"],
  "side_effect": ["Nausea", "Vomiting"],
  "Drug_working": "...",
  "Expert_advice": ["..."]
}
```

**Converted Format (for system use):**
```json
{
  "name": "Aldonil Tablet",
  "category": "Antidiabetic",
  "critical": true,
  "conditions": ["Diabetic nerve pain"],
  "risk_if_skipped": "Side effects: Nausea, Vomiting. Expert advice...",
  "dosage": "Epalrestat (50mg)",
  "original_data": { /* full original data */ }
}
```

### 3. **Integration Points**

#### A. Risk Analysis (`/analyze_skip` endpoint)

When a patient skips medication:

```python
# 1. Get drug information
drug_info = drug_service.get_drug("Furosemide")

# 2. Pass to AI for risk analysis
analysis = medgemma_service.analyze_skip_risk(
    drug_name="Furosemide",
    skips=1,
    patient_age=65,
    conditions=["Heart Failure"],
    drug_info=drug_info  # ← Uses dataset info
)
```

**What the AI uses:**
- `drug_info["critical"]` - Determines if risk should be boosted
- `drug_info["conditions"]` - Context for patient conditions
- `drug_info["risk_if_skipped"]` - Additional context for analysis

#### B. Drug Search (`get_drug` method)

The service searches drugs by:
1. Exact name match
2. Partial name match
3. Product name match
4. Salt composition match
5. Uses/indications match

**Example:**
```python
# All these will find the drug:
drug_service.get_drug("Aldonil")
drug_service.get_drug("Epalrestat")
drug_service.get_drug("Diabetic nerve pain")
```

#### C. Similar Drug Finding (BGE Service)

When finding similar drugs for recommendations:

```python
similar_drugs = bge_service.find_similar_drugs(
    "Furosemide",
    drug_service.drugs,  # ← Uses all drugs from dataset
    top_k=3
)
```

### 4. **Criticality Determination**

Drugs are automatically marked as `critical: true` if they match:
- Heart failure, heart attack, stroke
- Diabetes, insulin
- Warfarin, anticoagulants
- Arrhythmia, angina, hypertension

This affects risk level calculation in AI analysis.

### 5. **Category Classification**

Drugs are categorized based on:
1. `fact.Therapeutic Class` (if available)
2. Inferred from uses:
   - "diabetic" → `Antidiabetic`
   - "heart", "cardiac", "hypertension" → `Cardiac`
   - "cholesterol", "lipid" → `Statin`
   - Otherwise → `General`

## 📊 Dataset Statistics

- **Total Drugs:** 100
- **Cardiac Drugs:** 50 (50%)
- **Diabetes Drugs:** 63 (63%)
- **Both Conditions:** 14 (14%)
- **Data Completeness:** 100% (all fields present)

## 🔍 Example Usage Flow

### Scenario: Patient skips Furosemide

1. **Backend receives skip notification:**
   ```typescript
   POST /patient/record-dose
   { patient_id: "...", drug_name: "Furosemide", status: "skipped" }
   ```

2. **Backend calls AI service:**
   ```python
   POST /analyze_skip
   {
     "drug_name": "Furosemide",
     "skips": 1,
     "patient_age": 65,
     "conditions": ["Heart Failure"]
   }
   ```

3. **AI service looks up drug:**
   ```python
   drug_info = drug_service.get_drug("Furosemide")
   # Returns: { name: "Aldactone Tablet", critical: true, ... }
   ```

4. **AI analyzes risk:**
   - Uses `drug_info["critical"]` → Boosts risk level
   - Uses `drug_info["conditions"]` → Matches with patient conditions
   - Uses `drug_info["risk_if_skipped"]` → Provides context

5. **Result sent to doctor via SSE:**
   ```json
   {
     "risk_level": "High",
     "message": "Skipping Furosemide poses significant risk...",
     "ai_explanation": "..."
   }
   ```

## 🎯 Benefits

1. **Real-world Data:** Uses actual Indian pharmaceutical data
2. **Comprehensive:** Includes side effects, expert advice, safety info
3. **Flexible Search:** Finds drugs by name, salt, or indication
4. **Automatic Classification:** Determines criticality and category
5. **Backward Compatible:** Falls back to sample data if needed

## 🔧 Customization

To use a different dataset:

```python
# In ai/main.py or custom initialization
drug_service = DrugService(data_path="/path/to/your/drugs.json")
```

The dataset should be:
- JSON format (list or dict with "drugs" key)
- Each drug should have at least: `product_name` or `salt_composition`
- Optional but recommended: `uses`, `side_effect`, `Expert_advice`

## 📝 Notes

- Original data is preserved in `original_data` field
- Drug search is case-insensitive
- Partial matching helps find drugs even with typos
- Criticality is automatically determined but can be overridden

