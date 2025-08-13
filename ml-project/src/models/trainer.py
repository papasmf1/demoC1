"""Model training pipeline with hyperparameter optimization."""

import numpy as np
import pandas as pd
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostClassifier
import optuna
import logging
from typing import Dict, Any, Tuple, Optional
import joblib
from pathlib import Path

from ..utils.config import config
from ..utils.experiment_tracker import tracker

logger = logging.getLogger(__name__)

class ModelTrainer:
    """Unified model training pipeline with hyperparameter optimization."""
    
    def __init__(self):
        """Initialize model trainer."""
        self.models = {}
        self.best_models = {}
        self.training_config = config.training_config
        self.model_config = config.model_config
        
    def prepare_data(self, X: pd.DataFrame, y: pd.Series, test_size: float = None) -> Tuple:
        """Prepare training and testing data.
        
        Args:
            X: Features
            y: Target variable
            test_size: Test set size (default from config)
            
        Returns:
            X_train, X_test, y_train, y_test
        """
        if test_size is None:
            test_size = config.data_config.get('test_size', 0.2)
        
        random_state = config.data_config.get('random_state', 42)
        
        return train_test_split(
            X, y, 
            test_size=test_size, 
            random_state=random_state, 
            stratify=y
        )
    
    def get_model(self, algorithm: str, **params) -> Any:
        """Get model instance by algorithm name.
        
        Args:
            algorithm: Algorithm name
            **params: Model parameters
            
        Returns:
            Model instance
        """
        random_state = config.data_config.get('random_state', 42)
        
        models_map = {
            'random_forest': RandomForestClassifier(random_state=random_state, **params),
            'xgboost': xgb.XGBClassifier(random_state=random_state, **params),
            'lightgbm': lgb.LGBMClassifier(random_state=random_state, **params),
            'catboost': CatBoostClassifier(random_state=random_state, verbose=False, **params)
        }
        
        if algorithm not in models_map:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        return models_map[algorithm]
    
    def objective(self, trial: optuna.Trial, algorithm: str, X_train: pd.DataFrame, y_train: pd.Series) -> float:
        """Optuna objective function for hyperparameter optimization.
        
        Args:
            trial: Optuna trial object
            algorithm: Algorithm name
            X_train: Training features
            y_train: Training target
            
        Returns:
            Cross-validation score
        """
        # Get hyperparameter suggestions based on algorithm
        hyperparams = self.model_config.get('hyperparameters', {}).get(algorithm, {})
        
        params = {}
        for param, values in hyperparams.items():
            if isinstance(values, list):
                if all(isinstance(v, int) for v in values):
                    params[param] = trial.suggest_int(param, min(values), max(values))
                elif all(isinstance(v, float) for v in values):
                    params[param] = trial.suggest_float(param, min(values), max(values))
                else:
                    params[param] = trial.suggest_categorical(param, values)
        
        # Create and evaluate model
        model = self.get_model(algorithm, **params)
        
        # Cross-validation
        cv_folds = self.training_config.get('cv_folds', 5)
        scoring = self.training_config.get('scoring', 'accuracy')
        
        scores = cross_val_score(model, X_train, y_train, cv=cv_folds, scoring=scoring)
        return scores.mean()
    
    def optimize_hyperparameters(self, algorithm: str, X_train: pd.DataFrame, y_train: pd.Series) -> Dict[str, Any]:
        """Optimize hyperparameters using Optuna.
        
        Args:
            algorithm: Algorithm name
            X_train: Training features
            y_train: Training target
            
        Returns:
            Best parameters
        """
        logger.info(f"Optimizing hyperparameters for {algorithm}")
        
        n_trials = self.training_config.get('n_trials', 100)
        
        study = optuna.create_study(direction='maximize')
        study.optimize(
            lambda trial: self.objective(trial, algorithm, X_train, y_train),
            n_trials=n_trials
        )
        
        logger.info(f"Best parameters for {algorithm}: {study.best_params}")
        logger.info(f"Best CV score for {algorithm}: {study.best_value:.4f}")
        
        return study.best_params
    
    def train_model(self, algorithm: str, X_train: pd.DataFrame, y_train: pd.Series, 
                   X_test: pd.DataFrame, y_test: pd.Series, 
                   optimize: bool = True) -> Dict[str, Any]:
        """Train a single model.
        
        Args:
            algorithm: Algorithm name
            X_train: Training features
            y_train: Training target
            X_test: Test features
            y_test: Test target
            optimize: Whether to optimize hyperparameters
            
        Returns:
            Training results
        """
        logger.info(f"Training {algorithm} model")
        
        # Start experiment run
        tracker.start_run(run_name=f"{algorithm}_training")
        
        try:
            # Optimize hyperparameters if requested
            if optimize:
                best_params = self.optimize_hyperparameters(algorithm, X_train, y_train)
                tracker.log_params(best_params)
            else:
                best_params = {}
            
            # Train final model with best parameters
            model = self.get_model(algorithm, **best_params)
            model.fit(X_train, y_train)
            
            # Predictions
            y_pred_train = model.predict(X_train)
            y_pred_test = model.predict(X_test)
            
            # Probabilities (if available)
            y_pred_proba_test = None
            if hasattr(model, 'predict_proba'):
                y_pred_proba_test = model.predict_proba(X_test)
            
            # Log evaluation metrics
            train_metrics = tracker.log_evaluation_metrics(y_train, y_pred_train, prefix="train_")
            test_metrics = tracker.log_evaluation_metrics(y_test, y_pred_test, y_pred_proba_test, prefix="test_")
            
            # Log model
            tracker.log_model(model, algorithm)
            
            # Save model locally
            model_path = Path(f"models/{algorithm}_model.joblib")
            model_path.parent.mkdir(exist_ok=True)
            joblib.dump(model, model_path)
            
            # Store results
            results = {
                'algorithm': algorithm,
                'model': model,
                'best_params': best_params,
                'train_metrics': train_metrics,
                'test_metrics': test_metrics,
                'model_path': str(model_path)
            }
            
            self.models[algorithm] = results
            
            logger.info(f"Completed training {algorithm}")
            logger.info(f"Test accuracy: {test_metrics['test_accuracy']:.4f}")
            
            return results
            
        finally:
            tracker.end_run()
    
    def train_all_models(self, X_train: pd.DataFrame, y_train: pd.Series, 
                        X_test: pd.DataFrame, y_test: pd.Series, 
                        optimize: bool = True) -> Dict[str, Dict[str, Any]]:
        """Train all configured models.
        
        Args:
            X_train: Training features
            y_train: Training target
            X_test: Test features
            y_test: Test target
            optimize: Whether to optimize hyperparameters
            
        Returns:
            Training results for all models
        """
        algorithms = self.model_config.get('algorithms', ['random_forest'])
        
        logger.info(f"Training {len(algorithms)} models: {algorithms}")
        
        results = {}
        for algorithm in algorithms:
            try:
                result = self.train_model(algorithm, X_train, y_train, X_test, y_test, optimize)
                results[algorithm] = result
            except Exception as e:
                logger.error(f"Failed to train {algorithm}: {str(e)}")
                continue
        
        # Find best model
        if results:
            best_algorithm = max(results.keys(), 
                               key=lambda k: results[k]['test_metrics']['test_accuracy'])
            self.best_models['best_overall'] = results[best_algorithm]
            
            logger.info(f"Best model: {best_algorithm} "
                       f"(accuracy: {results[best_algorithm]['test_metrics']['test_accuracy']:.4f})")
        
        return results
    
    def get_best_model(self) -> Optional[Any]:
        """Get the best trained model.
        
        Returns:
            Best model instance
        """
        if 'best_overall' in self.best_models:
            return self.best_models['best_overall']['model']
        return None
    
    def save_results(self, results: Dict[str, Dict[str, Any]], filepath: str = "experiments/training_results.json"):
        """Save training results to file.
        
        Args:
            results: Training results
            filepath: Output file path
        """
        import json
        
        # Convert results to JSON-serializable format
        serializable_results = {}
        for algorithm, result in results.items():
            serializable_results[algorithm] = {
                'algorithm': result['algorithm'],
                'best_params': result['best_params'],
                'train_metrics': result['train_metrics'],
                'test_metrics': result['test_metrics'],
                'model_path': result['model_path']
            }
        
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, 'w') as f:
            json.dump(serializable_results, f, indent=2)
        
        logger.info(f"Results saved to {filepath}")

# Global trainer instance
trainer = ModelTrainer()