@echo off
echo Starting MLflow Tracking Server...
echo.

REM Activate virtual environment
call ml-env\Scripts\activate.bat

REM Start MLflow UI
echo Starting MLflow UI...
echo Open your browser and go to: http://localhost:5000
echo.
mlflow ui --backend-store-uri file:./experiments/mlruns --port 5000

pause