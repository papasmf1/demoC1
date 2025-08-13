"""Configuration management utilities."""

import yaml
import os
from pathlib import Path
from typing import Dict, Any

class Config:
    """Configuration manager for ML project."""
    
    def __init__(self, config_path: str = "config/config.yaml"):
        """Initialize configuration from YAML file.
        
        Args:
            config_path: Path to configuration file
        """
        self.config_path = Path(config_path)
        self.config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file.
        
        Returns:
            Configuration dictionary
        """
        if not self.config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
        
        with open(self.config_path, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value by key.
        
        Args:
            key: Configuration key (supports dot notation, e.g., 'data.test_size')
            default: Default value if key not found
            
        Returns:
            Configuration value
        """
        keys = key.split('.')
        value = self.config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value
    
    def update(self, key: str, value: Any) -> None:
        """Update configuration value.
        
        Args:
            key: Configuration key (supports dot notation)
            value: New value
        """
        keys = key.split('.')
        config = self.config
        
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        
        config[keys[-1]] = value
    
    def save(self, path: str = None) -> None:
        """Save configuration to YAML file.
        
        Args:
            path: Output path (default: original config path)
        """
        save_path = Path(path) if path else self.config_path
        
        with open(save_path, 'w', encoding='utf-8') as file:
            yaml.dump(self.config, file, default_flow_style=False, allow_unicode=True)
    
    @property
    def data_config(self) -> Dict[str, Any]:
        """Get data configuration."""
        return self.get('data', {})
    
    @property
    def model_config(self) -> Dict[str, Any]:
        """Get model configuration."""
        return self.get('model', {})
    
    @property
    def training_config(self) -> Dict[str, Any]:
        """Get training configuration."""
        return self.get('training', {})
    
    @property
    def experiment_config(self) -> Dict[str, Any]:
        """Get experiment configuration."""
        return self.get('experiment', {})

# Global configuration instance
config = Config()