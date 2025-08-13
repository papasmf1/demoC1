@echo off
echo Starting ML Project Jupyter Environment...
echo.

REM Activate virtual environment
call ml-env\Scripts\activate.bat

REM Start Jupyter Lab
echo Starting Jupyter Lab...
jupyter lab --notebook-dir=notebooks --port=8888

pause