"""S&P 500 데이터 전처리 모듈"""

import pandas as pd
import numpy as np
from scipy import stats
from typing import Dict, Tuple, List
import warnings

warnings.filterwarnings('ignore')

class SP500Preprocessor:
    """S&P 500 데이터 전처리 클래스"""
    
    def __init__(self):
        """전처리기 초기화"""
        self.scaler = None
        self.outlier_bounds = {}
        
    def load_data(self, file_path: str) -> pd.DataFrame:
        """CSV 파일에서 S&P 500 데이터 로드
        
        Args:
            file_path: CSV 파일 경로
            
        Returns:
            로드된 DataFrame
        """
        df = pd.read_csv(file_path, encoding='utf-8-sig')
        return df
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """기본 데이터 정제
        
        Args:
            df: 원본 DataFrame
            
        Returns:
            정제된 DataFrame
        """
        df_clean = df.copy()
        
        # 컬럼명 영어로 변경
        column_mapping = {
            '날짜': 'Date',
            '종가': 'Close',
            '시가': 'Open',
            '고가': 'High',
            '저가': 'Low',
            '거래량': 'Volume',
            '변동 %': 'Change_Pct'
        }
        
        df_clean = df_clean.rename(columns=column_mapping)
        
        # 날짜 처리
        df_clean['Date'] = df_clean['Date'].str.replace(' ', '').str.replace('-', '-')
        df_clean['Date'] = pd.to_datetime(df_clean['Date'], format='%Y-%m-%d')
        
        # 수치 컬럼 처리
        numeric_columns = ['Open', 'High', 'Low', 'Close']
        for col in numeric_columns:
            df_clean[col] = df_clean[col].str.replace(',', '').astype(float)
        
        # 변동률 처리
        df_clean['Change_Pct'] = df_clean['Change_Pct'].str.replace('%', '').astype(float)
        
        # Volume 처리 (빈 문자열을 NaN으로)
        df_clean['Volume'] = df_clean['Volume'].replace('', np.nan)
        
        # 날짜순 정렬
        df_clean = df_clean.sort_values('Date').reset_index(drop=True)
        
        return df_clean
    
    def handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """결측치 처리
        
        Args:
            df: DataFrame
            
        Returns:
            결측치 처리된 DataFrame
        """
        df_filled = df.copy()
        
        # Volume이 모두 결측치인 경우 컬럼 제거
        if df_filled['Volume'].isnull().all():
            df_filled = df_filled.drop('Volume', axis=1)
        else:
            # 부분적 결측치는 보간법 사용
            df_filled['Volume'] = df_filled['Volume'].interpolate()
        
        return df_filled
    
    def detect_outliers_iqr(self, data: pd.Series, multiplier: float = 1.5) -> Tuple[pd.Index, float, float]:
        """IQR 방법으로 이상치 탐지
        
        Args:
            data: 데이터 시리즈
            multiplier: IQR 배수
            
        Returns:
            이상치 인덱스, 하한값, 상한값
        """
        Q1 = data.quantile(0.25)
        Q3 = data.quantile(0.75)
        IQR = Q3 - Q1
        
        lower_bound = Q1 - multiplier * IQR
        upper_bound = Q3 + multiplier * IQR
        
        outliers_mask = (data < lower_bound) | (data > upper_bound)
        outliers_idx = data[outliers_mask].index
        
        return outliers_idx, lower_bound, upper_bound
    
    def detect_outliers_zscore(self, data: pd.Series, threshold: float = 3) -> pd.Index:
        """Z-score 방법으로 이상치 탐지
        
        Args:
            data: 데이터 시리즈
            threshold: Z-score 임계값
            
        Returns:
            이상치 인덱스
        """
        z_scores = np.abs(stats.zscore(data.dropna()))
        outliers_mask = z_scores > threshold
        outliers_idx = data.dropna().index[outliers_mask]
        
        return outliers_idx
    
    def calculate_rsi(self, prices: pd.Series, window: int = 14) -> pd.Series:
        """RSI 계산
        
        Args:
            prices: 가격 시리즈
            window: 계산 윈도우
            
        Returns:
            RSI 시리즈
        """
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def add_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """기술적 지표 추가
        
        Args:
            df: DataFrame
            
        Returns:
            기술적 지표가 추가된 DataFrame
        """
        df_tech = df.copy()
        
        # 기본 계산
        df_tech['Daily_Return'] = df_tech['Close'].pct_change() * 100
        df_tech['Price_Range'] = df_tech['High'] - df_tech['Low']
        df_tech['Price_Range_Pct'] = (df_tech['Price_Range'] / df_tech['Close']) * 100
        
        # 이동평균
        df_tech['SMA_5'] = df_tech['Close'].rolling(window=5).mean()
        df_tech['SMA_10'] = df_tech['Close'].rolling(window=10).mean()
        df_tech['SMA_20'] = df_tech['Close'].rolling(window=20).mean()
        
        # 지수이동평균
        df_tech['EMA_12'] = df_tech['Close'].ewm(span=12).mean()
        df_tech['EMA_26'] = df_tech['Close'].ewm(span=26).mean()
        
        # MACD
        df_tech['MACD'] = df_tech['EMA_12'] - df_tech['EMA_26']
        df_tech['MACD_Signal'] = df_tech['MACD'].ewm(span=9).mean()
        df_tech['MACD_Histogram'] = df_tech['MACD'] - df_tech['MACD_Signal']
        
        # RSI
        df_tech['RSI'] = self.calculate_rsi(df_tech['Close'])
        
        # 볼린저 밴드
        df_tech['BB_Middle'] = df_tech['Close'].rolling(window=20).mean()
        bb_std = df_tech['Close'].rolling(window=20).std()
        df_tech['BB_Upper'] = df_tech['BB_Middle'] + (bb_std * 2)
        df_tech['BB_Lower'] = df_tech['BB_Middle'] - (bb_std * 2)
        df_tech['BB_Width'] = df_tech['BB_Upper'] - df_tech['BB_Lower']
        df_tech['BB_Position'] = (df_tech['Close'] - df_tech['BB_Lower']) / (df_tech['BB_Upper'] - df_tech['BB_Lower'])
        
        # 변동성
        df_tech['Volatility_10'] = df_tech['Daily_Return'].rolling(window=10).std()
        df_tech['Volatility_20'] = df_tech['Daily_Return'].rolling(window=20).std()
        
        # 모멘텀
        df_tech['Momentum_5'] = df_tech['Close'] / df_tech['Close'].shift(5) - 1
        df_tech['Momentum_10'] = df_tech['Close'] / df_tech['Close'].shift(10) - 1
        
        # 지지/저항
        df_tech['Support'] = df_tech['Low'].rolling(window=20).min()
        df_tech['Resistance'] = df_tech['High'].rolling(window=20).max()
        
        # 시간 특성
        df_tech['Day_of_Week'] = df_tech['Date'].dt.dayofweek
        df_tech['Month'] = df_tech['Date'].dt.month
        df_tech['Quarter'] = df_tech['Date'].dt.quarter
        
        return df_tech
    
    def get_feature_groups(self) -> Dict[str, List[str]]:
        """특성 그룹 정의
        
        Returns:
            특성 그룹 딕셔너리
        """
        return {
            'price_features': ['Open', 'High', 'Low', 'Close'],
            'return_features': ['Daily_Return', 'Change_Pct'],
            'sma_features': ['SMA_5', 'SMA_10', 'SMA_20'],
            'ema_features': ['EMA_12', 'EMA_26'],
            'technical_features': ['RSI', 'MACD', 'MACD_Signal', 'MACD_Histogram'],
            'bollinger_features': ['BB_Upper', 'BB_Middle', 'BB_Lower', 'BB_Width', 'BB_Position'],
            'volatility_features': ['Volatility_10', 'Volatility_20', 'Price_Range', 'Price_Range_Pct'],
            'momentum_features': ['Momentum_5', 'Momentum_10'],
            'support_resistance': ['Support', 'Resistance'],
            'time_features': ['Day_of_Week', 'Month', 'Quarter']
        }
    
    def preprocess_pipeline(self, file_path: str, save_path: str = None) -> pd.DataFrame:
        """전체 전처리 파이프라인 실행
        
        Args:
            file_path: 입력 CSV 파일 경로
            save_path: 저장할 경로 (선택사항)
            
        Returns:
            전처리된 DataFrame
        """
        print("🔄 S&P 500 데이터 전처리 시작...")
        
        # 1. 데이터 로드
        print("1️⃣ 데이터 로드 중...")
        df = self.load_data(file_path)
        print(f"   원본 데이터: {df.shape}")
        
        # 2. 데이터 정제
        print("2️⃣ 데이터 정제 중...")
        df_clean = self.clean_data(df)
        
        # 3. 결측치 처리
        print("3️⃣ 결측치 처리 중...")
        df_filled = self.handle_missing_values(df_clean)
        
        # 4. 기술적 지표 추가
        print("4️⃣ 기술적 지표 생성 중...")
        df_final = self.add_technical_indicators(df_filled)
        print(f"   최종 데이터: {df_final.shape}")
        
        # 5. 이상치 탐지 및 기록
        print("5️⃣ 이상치 탐지 중...")
        outliers_idx, lower_bound, upper_bound = self.detect_outliers_iqr(df_final['Daily_Return'])
        self.outlier_bounds['Daily_Return'] = (lower_bound, upper_bound)
        print(f"   일일 수익률 이상치: {len(outliers_idx)}개 ({len(outliers_idx)/len(df_final)*100:.1f}%)")
        
        # 6. 저장
        if save_path:
            print("6️⃣ 데이터 저장 중...")
            df_final.to_csv(save_path, index=False, encoding='utf-8-sig')
            print(f"   저장 완료: {save_path}")
        
        print("✅ 전처리 완료!")
        return df_final
    
    def get_analysis_summary(self, df: pd.DataFrame) -> Dict:
        """데이터 분석 요약 정보 생성
        
        Args:
            df: 분석할 DataFrame
            
        Returns:
            분석 요약 딕셔너리
        """
        summary = {
            'data_info': {
                'shape': df.shape,
                'date_range': {
                    'start': df['Date'].min(),
                    'end': df['Date'].max(),
                    'days': (df['Date'].max() - df['Date'].min()).days,
                    'trading_days': len(df)
                }
            },
            'price_stats': {
                'min_price': df['Close'].min(),
                'max_price': df['Close'].max(),
                'avg_price': df['Close'].mean(),
                'current_price': df['Close'].iloc[-1]
            },
            'return_stats': {
                'avg_daily_return': df['Daily_Return'].mean(),
                'volatility': df['Daily_Return'].std(),
                'max_gain': df['Daily_Return'].max(),
                'max_loss': df['Daily_Return'].min(),
                'sharpe_ratio': (df['Daily_Return'].mean() * 252) / (df['Daily_Return'].std() * np.sqrt(252))
            },
            'technical_status': {
                'current_rsi': df['RSI'].iloc[-1],
                'current_bb_position': df['BB_Position'].iloc[-1],
                'current_volatility': df['Volatility_10'].iloc[-1],
                'trend_vs_sma20': 'up' if df['Close'].iloc[-1] > df['SMA_20'].iloc[-1] else 'down',
                'macd_signal': 'bullish' if df['MACD'].iloc[-1] > df['MACD_Signal'].iloc[-1] else 'bearish'
            }
        }
        
        return summary

# 전역 전처리기 인스턴스
preprocessor = SP500Preprocessor()