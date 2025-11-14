import os
from pathlib import Path
from typing import Dict


class PromptLoader:
    """Utility class to load and format prompts from files"""
    
    def __init__(self, prompts_dir: str = None):
        if prompts_dir is None:
            prompts_dir = os.path.join(Path(__file__).parent)
        self.prompts_dir = Path(prompts_dir)
        self._cache: Dict[str, str] = {}
    
    def load_prompt(self, filename: str) -> str:
        """
        Load a prompt from a file
        
        Args:
            filename: Name of the prompt file (e.g., "risk_analysis.txt")
        
        Returns:
            Prompt text as string
        """
        # Check cache first
        if filename in self._cache:
            return self._cache[filename]
        
        # Load from file
        prompt_path = self.prompts_dir / filename
        if not prompt_path.exists():
            raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
        
        with open(prompt_path, 'r', encoding='utf-8') as f:
            prompt = f.read().strip()
        
        # Cache it
        self._cache[filename] = prompt
        return prompt
    
    def format_prompt(self, filename: str, **kwargs) -> str:
        """
        Load and format a prompt with variables
        
        Args:
            filename: Name of the prompt file
            **kwargs: Variables to format into the prompt
        
        Returns:
            Formatted prompt string
        """
        prompt_template = self.load_prompt(filename)
        return prompt_template.format(**kwargs)
    
    def clear_cache(self):
        """Clear the prompt cache"""
        self._cache.clear()

