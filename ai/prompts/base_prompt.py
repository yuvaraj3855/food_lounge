from abc import ABC, abstractmethod
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional


class BasePrompt(BaseModel, ABC):
    """
    Base class for all prompts
    Provides structure, validation, and formatting capabilities
    """
    
    @abstractmethod
    def get_template(self) -> str:
        """Return the prompt template string"""
        pass
    
    @abstractmethod
    def get_variables(self) -> Dict[str, Any]:
        """Return dictionary of variables to format into the template"""
        pass
    
    def format(self) -> str:
        """
        Format the prompt template with variables
        Returns the final prompt string
        """
        template = self.get_template()
        variables = self.get_variables()
        return template.format(**variables)
    
    def __str__(self) -> str:
        """String representation returns the formatted prompt"""
        return self.format()
    
    class Config:
        """Pydantic configuration"""
        arbitrary_types_allowed = True

