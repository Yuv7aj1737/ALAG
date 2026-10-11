@echo off
REM Script para preparar deployment y crear carpeta comprimida

echo.
echo =====================================
echo   PREPARAR AUTOBUY PARA DEPLOYMENT
echo =====================================
echo.

REM 1. Ejecutar script de preparación
echo Preparando archivos...
node deploy-to-vps.js

if errorlevel 1 (
    echo.
    echo ERROR: Fallo en la preparación
    pause
    exit /b 1
)

echo.
echo =====================================
echo   CARPETA LISTA: autobuy-deploy/
echo =====================================
echo.

REM 2. Crear archivo comprimido (opcional)
echo ¿Deseas comprimir para upload? (s/n)
set /p compress="Respuesta: "

if /i "%compress%"=="s" (
    echo.
    echo Comprimiendo archivos...
    
    REM Usar PowerShell para crear zip
    powershell -Command "Compress-Archive -Path 'autobuy-deploy' -DestinationPath 'autobuy-deploy.zip' -Force"
    
    if exist autobuy-deploy.zip (
        echo.
        echo ✅ Archivo comprimido: autobuy-deploy.zip
        echo.
        echo PROXIMOS PASOS:
        echo 1. Abre autobuy-deploy/DEPLOYMENT_INSTRUCTIONS.md
        echo 2. Sube autobuy-deploy/ (o autobuy-deploy.zip) a tu VPS
        echo 3. Ejecuta: bash install-vps.sh
    ) else (
        echo.
        echo ✅ No se comprimió (ve a autobuy-deploy/ manualmente)
    )
)

echo.
echo Presiona cualquier tecla para salir...
pause > nul
