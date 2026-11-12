@echo off
chcp 65001 >nul
title Start Backend Services - Do An CNPM

set ROOT=%~dp0

echo Starting API Gateway, Auth service and Content service...
echo.

start "API Gateway - Do An CNPM" /D "%ROOT%backend\api-gateway" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

start "Auth Service - Do An CNPM" /D "%ROOT%backend\auth-service" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

start "Content Service - Do An CNPM" /D "%ROOT%backend\content-service" cmd /k "npm run dev"

echo.
echo Started backend services:
echo   API Gateway     (localhost:5000)
echo   Auth service    (localhost:3001)
echo   Content service (localhost:3002)
echo.
pause
