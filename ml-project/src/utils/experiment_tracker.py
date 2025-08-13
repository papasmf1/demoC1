"""Experiment tracking utilities for MLflow and Weights & Biases."""

import mlflow
import mlflow.sklearn
import mlflow.xgboost
import mlflow.lightgbm
import mlflow.catboost
import wandb
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import joblib
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

from .config import config

logger = logging.getLogger(__name__)

class ExperimentTracker:
    """Unified experiment tracking for MLflow and Weights & Biases."""
    
    def __init__(self, use_mlflow: bool = True, use_wandb: bool = False):
        """Initialize experiment tracker.
        
        Args:
            use_mlflow: Whether to use MLflow tracking
            use_wandb: Whether to use Weights & Biases tracking
        """
        self.use_mlflow = use_mlflow
        self.use_wandb = use_wandb
        self.current_run = None
        
        if self.use_mlflow:
            self._setup_mlflow()
        
        if self.use_wandb:
            self._setup_wandb()
    
    def _setup_mlflow(self):
        """Setup MLflow tracking."""
        exp_config = config.experiment_config.get('mlflow', {})
        
        # Set tracking URI
        tracking_uri = exp_config.get('tracking_uri', 'file:./experiments/mlruns')
        mlflow.set_tracking_uri(tracking_uri)
        
        # Create experiments directory
        Path('experiments/mlruns').mkdir(parents=True, exist_ok=True)
        
        # Set experiment
        experiment_name = exp_config.get('experiment_name', 'ml_project_experiments')
        mlflow.set_experiment(experiment_name)
        
        logger.info(f"MLflow tracking URI: {tracking_uri}")
        logger.info(f"MLflow experiment: {experiment_name}")
    
    def _setup_wandb(self):
        """Setup Weights & Biases tracking."""
        exp_config = config.experiment_config.get('wandb', {})
        
        project = exp_config.get('project', 'ml-project')
        entity = exp_config.get('entity', None)
        
        # Initialize wandb (will prompt for login if not authenticated)
        wandb.init(project=project, entity=entity, job_type="experiment")
        
        logger.info(f"W&B project: {project}")
        if entity:
            logger.info(f"W&B entity: {entity}")
    
    def start_run(self, run_name: str = None, tags: Dict[str, str] = None):
        """Start a new experiment run.
        
        Args:
            run_name: Name for the run
            tags: Tags to associate with the run
        """
        if self.use_mlflow:
            self.current_run = mlflow.start_run(run_name=run_name, tags=tags)
            logger.info(f"Started MLflow run: {self.current_run.info.run_id}")
        
        if self.use_wandb:
            wandb.run.name = run_name if run_name else wandb.run.id
            if tags:
                wandb.config.update(tags)
            logger.info(f"Started W&B run: {wandb.run.name}")
    
    def log_params(self, params: Dict[str, Any]):
        """Log parameters.
        
        Args:
            params: Parameters to log
        """
        if self.use_mlflow:
            mlflow.log_params(params)
        
        if self.use_wandb:
            wandb.config.update(params)
        
        logger.info(f"Logged parameters: {list(params.keys())}")
    
    def log_metrics(self, metrics: Dict[str, float], step: int = None):
        """Log metrics.
        
        Args:
            metrics: Metrics to log
            step: Step/epoch number
        """
        if self.use_mlflow:
            if step is not None:
                for key, value in metrics.items():
                    mlflow.log_metric(key, value, step=step)
            else:
                mlflow.log_metrics(metrics)
        
        if self.use_wandb:
            if step is not None:
                wandb.log(metrics, step=step)
            else:
                wandb.log(metrics)
        
        logger.info(f"Logged metrics: {list(metrics.keys())}")
    
    def log_model(self, model, model_name: str = "model", **kwargs):
        """Log trained model.
        
        Args:
            model: Trained model object
            model_name: Name for the model
            **kwargs: Additional arguments for model logging
        """
        if self.use_mlflow:
            # Auto-detect model type and log accordingly
            if hasattr(model, 'predict'):
                if 'xgboost' in str(type(model)):
                    mlflow.xgboost.log_model(model, model_name, **kwargs)
                elif 'lightgbm' in str(type(model)):
                    mlflow.lightgbm.log_model(model, model_name, **kwargs)
                elif 'catboost' in str(type(model)):
                    mlflow.catboost.log_model(model, model_name, **kwargs)
                else:
                    mlflow.sklearn.log_model(model, model_name, **kwargs)
        
        if self.use_wandb:
            # Save model locally and log as artifact
            model_path = f"models/{model_name}.joblib"
            Path("models").mkdir(exist_ok=True)
            joblib.dump(model, model_path)
            wandb.save(model_path)
        
        logger.info(f"Logged model: {model_name}")
    
    def log_artifact(self, file_path: str, artifact_path: str = None):
        """Log artifact file.
        
        Args:
            file_path: Path to the file to log
            artifact_path: Destination path in artifact store
        """
        if self.use_mlflow:
            mlflow.log_artifact(file_path, artifact_path)
        
        if self.use_wandb:
            wandb.save(file_path)
        
        logger.info(f"Logged artifact: {file_path}")
    
    def log_figure(self, figure, figure_name: str):
        """Log matplotlib figure.
        
        Args:
            figure: Matplotlib figure object
            figure_name: Name for the figure
        """
        if self.use_mlflow:
            mlflow.log_figure(figure, f"{figure_name}.png")
        
        if self.use_wandb:
            wandb.log({figure_name: wandb.Image(figure)})
        
        logger.info(f"Logged figure: {figure_name}")
    
    def log_evaluation_metrics(self, y_true, y_pred, y_pred_proba=None, prefix=""):
        """Log common evaluation metrics.
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            y_pred_proba: Predicted probabilities (for binary classification)
            prefix: Prefix for metric names
        """
        metrics = {}
        
        # Basic metrics
        metrics[f"{prefix}accuracy"] = accuracy_score(y_true, y_pred)
        metrics[f"{prefix}precision"] = precision_score(y_true, y_pred, average='weighted')
        metrics[f"{prefix}recall"] = recall_score(y_true, y_pred, average='weighted')
        metrics[f"{prefix}f1"] = f1_score(y_true, y_pred, average='weighted')
        
        # ROC-AUC for binary classification
        if y_pred_proba is not None and len(np.unique(y_true)) == 2:
            if y_pred_proba.ndim > 1:
                y_pred_proba = y_pred_proba[:, 1]  # Use positive class probability
            metrics[f"{prefix}roc_auc"] = roc_auc_score(y_true, y_pred_proba)
        
        self.log_metrics(metrics)
        return metrics
    
    def end_run(self):
        """End the current experiment run."""
        if self.use_mlflow and self.current_run:
            mlflow.end_run()
            logger.info("Ended MLflow run")
        
        if self.use_wandb:
            wandb.finish()
            logger.info("Ended W&B run")

# Global experiment tracker instance
tracker = ExperimentTracker()