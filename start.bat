@echo off

REM Navigate to the project root
cd /d "%~dp0"

REM Define Python executable path from the virtual environment
set PYTHON_VENV="%~dp0\.venv\Scripts\python.exe"

REM Start the Python backend in a new command prompt window
echo Starting Python Backend...
start "Health AI Backend" cmd /c "%PYTHON_VENV% app/app.py"

REM Give the backend a moment to start up
timeout /t 15 /nobreak

REM Start the frontend in a new command prompt window
echo Starting Frontend...
start "Health AI Frontend" cmd /c "cd app\ai-health-risk-assistant && npm run dev"

REM Give the frontend a moment to start up
timeout /t 15 /nobreak

REM Open the application in Chrome
echo Opening application in Chrome...
start chrome "http://localhost:3000"

echo All components launched.
