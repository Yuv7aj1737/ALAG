@echo off
REM Script para subir temprolbot al VPS (Windows PowerShell)

setlocal enabledelayedexpansion

set VPS_IP=YOUR_VPS_IP
set VPS_USER=root
set VPS_PATH=/root/autosecure/temprolbot
set LOCAL_PATH=%cd%\temprolbot

echo ==================================
echo ^🚀 Subiendo Temporal Role Bot al VPS
echo ==================================
echo.
echo VPS: %VPS_USER%@%VPS_IP%
echo Ruta Local: %LOCAL_PATH%
echo Ruta VPS: %VPS_PATH%
echo.

REM Crear la carpeta en el VPS si no existe
echo ^📁 Creando directorio en el VPS...
ssh root@%VPS_IP% "mkdir -p %VPS_PATH%"

if errorlevel 1 (
    echo ^❌ Error creando directorio en VPS
    exit /b 1
)

echo ^✅ Directorio creado
echo.

REM Subir todos los archivos
echo ^📤 Subiendo archivos con SCP...
for /r "%LOCAL_PATH%" %%F in (*) do (
    set "FILE=%%F"
    set "REL_PATH=!FILE:%LOCAL_PATH%=!"
    echo Enviando: !REL_PATH!
)

REM Usar SCP con recursión
scp -r "%LOCAL_PATH%" root@%VPS_IP%:%VPS_PATH%\

if errorlevel 1 (
    echo ^❌ Error subiendo archivos
    exit /b 1
)

echo ^✅ Archivos subidos exitosamente
echo.

REM Instalar dependencias en el VPS
echo ^📦 Instalando dependencias en el VPS...
ssh root@%VPS_IP% "cd %VPS_PATH% && npm install"

if errorlevel 1 (
    echo ^⚠️ Error instalando dependencias (esto puede ser normal)
)

echo.
echo ==================================
echo ^✅ Temporal Role Bot subido al VPS
echo ==================================
echo.
echo ^📝 Próximos pasos:
echo 1. Conecta al VPS: ssh root@%VPS_IP%
echo 2. Navega a: cd %VPS_PATH%
echo 3. Verifica: ls -la
echo 4. Inicia el bot: npm start
echo.
echo Alternativamente, usa PM2 para ejecutar en segundo plano:
echo pm2 start temprolbot.js --name temprolbot
echo pm2 save
echo.
pause
