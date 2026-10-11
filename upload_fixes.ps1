#!/usr/bin/env pwsh

# Script para subir los archivos corregidos al VPS
$vps = "root@YOUR_VPS_IP"
$remotePath = "/root/autosecure"

Write-Host "=== Subiendo archivos corregidos al VPS ===" -ForegroundColor Green

# Lista de archivos a subir
$files = @(
    "autosecure\utils\utils\messager.js",
    "autosecure\modals\Fisher\submit.js",
    "autosecure\modals\Fisher\VerificationSplit.js",
    "autosecure\modals\Fisher\userDetails.js",
    "autosecure\Buttons\stats\donut.js",
    "autosecure\utils\secure\recodesecure.js",
    "autosecure\utils\accounts\listAccount.js",
    "autosecure\utils\responses\getembedsautosec.js"
)

foreach ($file in $files) {
    $localPath = "C:\Users\YOURNAME\Desktop\autosecure\$file"
    $remoteFile = $remotePath + "/" + ($file -replace '\\', '/')
    
    Write-Host "Subiendo: $file" -ForegroundColor Yellow
    
    scp -r "$localPath" "$vps`:$remoteFile" 2>&1 | Out-Host
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $file subido exitosamente" -ForegroundColor Green
    } else {
        Write-Host "✗ Error al subir $file" -ForegroundColor Red
    }
}

Write-Host "`n=== Subida completada ===" -ForegroundColor Green
