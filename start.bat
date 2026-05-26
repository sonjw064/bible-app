@echo off
title 성경 PPT 생성기
echo ✝ 성경 PPT 생성기 시작 중...
echo.

:: 서버 시작
cd /d C:\Users\gram16\bible-app\server
start "성경서버" cmd /k "node server.js"

:: 2초 대기 (서버 켜질 때까지)
timeout /t 2 /nobreak > nul

:: 웹 앱 열기
start "" "C:\Users\gram16\bible-app\client\index.html"

echo ✅ 완료! 브라우저가 열렸습니다.
echo 서버를 끄려면 검은 창을 닫으세요.