# Script para subir config.json al VPS
$vps = "root@YOUR_VPS_IP"
$remotePath = "/root"

Write-Host "=== Subiendo config.json al VPS ===" -ForegroundColor Green
Write-Host "VPS IP: YOUR_VPS_IP" -ForegroundColor Cyan

$localPath = "C:\Users\YOURNAME\Desktop\autosecure\config.json"

# Verificar que el archivo existe
if (-not (Test-Path $localPath)) {
    Write-Host "✗ Archivo no encontrado: $localPath" -ForegroundColor Red
    exit 1
}

Write-Host "Subiendo config.json..." -ForegroundColor Yellow

# Subir archivo
scp "$localPath" "$vps`:$remotePath/config.json"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ config.json subido exitosamente a /root/" -ForegroundColor Green
    Write-Host "Ubicación remota: /root/config.json" -ForegroundColor Cyan
} else {
    Write-Host "✗ Error al subir config.json" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Subida completada ===" -ForegroundColor Green
