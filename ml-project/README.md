# Machine Learning Project Environment

완전한 머신러닝 프로젝트를 위한 Jupyter 환경입니다.

## 🚀 빠른 시작

### 1. 가상환경 활성화
```bash
# Windows
ml-env\Scripts\activate

# Linux/Mac
source ml-env/bin/activate
```

### 2. Jupyter Lab 실행
```bash
jupyter lab
```

### 3. 실험 추적 서버 시작 (선택)
```bash
# MLflow
mlflow ui

# Weights & Biases
wandb login
```

## 📁 프로젝트 구조

```
ml-project/
├── notebooks/           # Jupyter 노트북
│   ├── 01_exploratory_data_analysis.ipynb
│   ├── 02_data_preprocessing.ipynb
│   ├── 03_feature_engineering.ipynb
│   ├── 04_model_training.ipynb
│   └── 05_model_evaluation.ipynb
├── data/               # 데이터 저장소
│   ├── raw/           # 원본 데이터
│   ├── processed/     # 전처리된 데이터
│   └── features/      # 피처 데이터
├── models/            # 훈련된 모델
├── src/               # 소스 코드
│   ├── data/          # 데이터 처리
│   ├── features/      # 피처 엔지니어링
│   ├── models/        # 모델 정의
│   └── utils/         # 유틸리티
├── config/            # 설정 파일
├── experiments/       # 실험 기록
└── requirements.txt   # 패키지 목록
```

## 📦 설치된 패키지

### 데이터 분석
- **pandas**: 데이터 조작 및 분석
- **numpy**: 수치 계산
- **polars**: 고성능 데이터프레임

### 시각화
- **matplotlib**: 기본 플롯팅
- **seaborn**: 통계적 시각화
- **plotly**: 인터랙티브 시각화
- **bokeh**: 웹 기반 시각화

### 머신러닝
- **scikit-learn**: 전통적 ML 알고리즘
- **xgboost**: 그래디언트 부스팅
- **lightgbm**: 빠른 그래디언트 부스팅
- **catboost**: 범주형 데이터 처리

### 딥러닝
- **pytorch**: 딥러닝 프레임워크
- **tensorflow**: 구글 딥러닝 프레임워크
- **transformers**: 트랜스포머 모델

### 실험 추적
- **mlflow**: 실험 관리 및 모델 버전 관리
- **wandb**: 실험 추적 및 시각화
- **optuna**: 하이퍼파라미터 최적화

## 🔧 사용법

### 1. 데이터 분석 시작
```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# 데이터 로드
df = pd.read_csv('data/raw/dataset.csv')
```

### 2. 모델 훈련
```python
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import mlflow

# MLflow 실험 시작
mlflow.start_run()
# 모델 훈련 코드
mlflow.end_run()
```

### 3. 실험 추적
- MLflow UI: `http://localhost:5000`
- Weights & Biases: `https://wandb.ai`

## 🏗️ 개발 워크플로우

1. **EDA**: `01_exploratory_data_analysis.ipynb`
2. **전처리**: `02_data_preprocessing.ipynb`
3. **피처 엔지니어링**: `03_feature_engineering.ipynb`
4. **모델 훈련**: `04_model_training.ipynb`
5. **평가**: `05_model_evaluation.ipynb`

## 📊 지원 기능

- ✅ Jupyter Lab 환경
- ✅ 실험 추적 (MLflow, W&B)
- ✅ 하이퍼파라미터 최적화
- ✅ 모델 버전 관리
- ✅ 자동화된 파이프라인
- ✅ 코드 포맷팅 (Black, Flake8)