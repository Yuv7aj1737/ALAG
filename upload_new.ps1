# Script para subir archivos al VPS
$vps = "root@YOUR_VPS_IP"
$remotePath = "/root/autosecure"

Write-Host "=== Subiendo archivos al VPS ===" -ForegroundColor Green

$files = @(
    "autosecure\utils\secure\recodesecure.js",
    "autosecure\utils\accounts\listAccount.js",
    "autosecure\utils\responses\getembedsautosec.js"
)

foreach ($file in $files) {
    $localPath = "C:\Users\YOURNAME\Desktop\autosecure\$file"
    $remoteFile = "$remotePath/" + ($file -replace '\\', '/')
    
    Write-Host "Subiendo: $file" -ForegroundColor Yellow
    
    scp "$localPath" "$vps`:$remoteFile"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $file subido exitosamente" -ForegroundColor Green
    } else {
        Write-Host "✗ Error al subir $file" -ForegroundColor Red
    }
}

Write-Host "`n=== Subida completada ===" -ForegroundColor Green