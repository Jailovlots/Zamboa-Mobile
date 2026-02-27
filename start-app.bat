@echo off
title ZDSPGC - Zamboa Mobile App
echo ==========================================
echo   ZDSPGC Zamboa Mobile App
echo   Starting backend server and Expo...
echo ==========================================

:: Set environment variables
set DATABASE_URL=postgresql://postgres:hadzmie0104@localhost:5432/zamboa

:: Kill any existing instances on port 5000 or 8081
echo Stopping any existing servers...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000"') do taskkill /F /PID %%a 2>NUL
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8081"') do taskkill /F /PID %%a 2>NUL

echo Starting Express API server on port 5000...
start "ZDSPGC - Express Server" /MIN cmd /c "set DATABASE_URL=postgresql://postgres:hadzmie0104@localhost:5432/zamboa && cd /d D:\zdspgc_section_hub\Zamboa-Mobile && npx tsx server/index.ts"

echo Waiting for server to start...
timeout /t 6 /nobreak >NUL

echo Starting Expo Metro on port 8081...
start "ZDSPGC - Expo Metro" cmd /c "cd /d D:\zdspgc_section_hub\Zamboa-Mobile && npx expo start --web"

echo.
echo ==========================================
echo   Both services are starting up!
echo   App: http://localhost:8081
echo   API: http://localhost:5000
echo ==========================================
echo.
echo Close this window to stop watching.
pause
