# Prompts Directory

This directory contains class-based prompts using Pydantic BaseModel for type safety and validation.

## Why Class-Based Prompts?

✅ **Type Safety**: Pydantic validates all inputs at runtime  
✅ **IDE Support**: Autocomplete and type hints  
✅ **Validation**: Automatic validation of required fields, ranges, etc.  
✅ **Maintainability**: Easy to refactor and extend  
✅ **Documentation**: Self-documenting with field descriptions  
✅ **Testing**: Easy to unit test prompts  
✅ **Version Control**: Better diff tracking than text files  

## Structure

```
prompts/
├── base_prompt.py          # Base class for all prompts
├── risk_analysis_prompt.py # Risk analysis prompt implementation
└── README.md              # This file
```

## Usage Example

```python
from prompts.risk_analysis_prompt import RiskAnalysisPrompt

# Create prompt with validation
prompt = RiskAnalysisPrompt.from_drug_info(
    patient_age=65,
    drug_name="Furosemide",
    skips=2,
    conditions=["Heart Failure"],
    drug_info={
        "category": "Diuretic",
        "risk_if_skipped": "High risk"
    }
)

# Format the prompt (validates automatically)
formatted_prompt = prompt.format()
# or simply: str(prompt)
```

## Creating New Prompts

1. Create a new class inheriting from `BasePrompt`
2. Define fields with Pydantic Field() for validation
3. Implement `get_template()` method
4. Implement `get_variables()` method
5. Optionally add convenience class methods

Example:

```python
from prompts.base_prompt import BasePrompt
from pydantic import Field

class MyPrompt(BasePrompt):
    name: str = Field(..., min_length=1)
    age: int = Field(..., gt=0, lt=150)
    
    def get_template(self) -> str:
        return "Hello {name}, you are {age} years old."
    
    def get_variables(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "age": self.age
        }
```

## Benefits Over Text Files

- **Validation**: Invalid data caught at creation time
- **Type Safety**: IDE knows what fields are available
- **Refactoring**: Rename fields safely across codebase
- **Documentation**: Field descriptions in code
- **Testing**: Easy to test with different inputs
- **Extensibility**: Can add methods for complex logic

