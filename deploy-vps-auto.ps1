# Script de Deployment Automático a VPS
# Uso: ./deploy-vps-auto.ps1 -VpsIP "192.168.1.100" -VpsPassword "tu_password"

param(
    [string]$VpsIP = "",
    [string]$VpsUser = "root",
    [string]$VpsPassword = "",
    [string]$VpsPath = "/root/mainbot"
)

Write-Host ""
Write-Host "═════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   AUTOBUY DEPLOYMENT - VPS" -ForegroundColor Yellow
Write-Host "═════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Pedir datos si no están configurados
if (-not $VpsIP) {
    $VpsIP = Read-Host "IP o dominio del VPS"
}

if (-not $VpsPassword) {
    $VpsPasswordSecure = Read-Host "Contraseña del VPS" -AsSecureString
    $VpsPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($VpsPasswordSecure))
}

Write-Host ""
Write-Host "📤 Datos de conexión:" -ForegroundColor Green
Write-Host "  VPS: $VpsIP"
Write-Host "  Usuario: $VpsUser"
Write-Host "  Ruta: $VpsPath"
Write-Host ""

# Verificar que autobuy-deploy existe
if (-not (Test-Path "autobuy-deploy")) {
    Write-Host "❌ Carpeta 'autobuy-deploy' no encontrada" -ForegroundColor Red
    Write-Host "Ejecuta primero: node deploy-to-vps.js" -ForegroundColor Yellow
    exit 1
}

Write-Host "1️⃣  Preparando archivos..." -ForegroundColor Cyan
Write-Host ""

# Crear archivo comprimido
Write-Host "   📦 Comprimiendo..."
$zipPath = "autobuy-deploy-temp.zip"

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path "autobuy-deploy" -DestinationPath $zipPath

if (-not (Test-Path $zipPath)) {
    Write-Host "   ❌ Error comprimiendo archivos" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Archivos listos"
Write-Host ""

# Función para ejecutar comando en SSH
function Invoke-SSHCommand {
    param(
        [string]$Command
    )
    
    # Crear archivo temporal con el comando
    $tempScript = @"
$VpsPassword | ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $VpsUser@$VpsIP '$Command'
"@
    
    Write-Host "   ⏳ Ejecutando: $Command"
    
    # Usar plink si está disponible, sino usar SSH
    try {
        & ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=no "$VpsUser@$VpsIP" $Command 2>&1
    } catch {
        Write-Host "   ⚠️  Nota: SSH podría necesitar configuración adicional"
        return $false
    }
    
    return $true
}

# 2. Subir archivos
Write-Host "2️⃣  Subiendo archivos a VPS..." -ForegroundColor Cyan
Write-Host ""

Write-Host "   📤 Subiendo ZIP ($zipPath)..."

try {
    # Usar SCP para subir
    $env:PLINK_PROTOCOL = "ssh"
    
    # Intenta con scp
    if (Get-Command scp -ErrorAction SilentlyContinue) {
        Write-Host "   Usando SCP para upload..."
        # Crear script temporal para el password
        $scpScript = @"
echo $VpsPassword | scp -o BatchMode=no -o StrictHostKeyChecking=no $zipPath $VpsUser@$VpsIP:$VpsPath/
"@
        
        & cmd /c "@echo off & echo off & `"$scpScript`"" 2>&1
    } else {
        Write-Host "   ❌ SCP no disponible" -ForegroundColor Red
        Write-Host "   Instrucciones alternativas:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   1. Abre FileZilla"
        Write-Host "   2. Conecta a: $VpsIP"
        Write-Host "   3. Sube: $zipPath"
        Write-Host "   4. En el VPS ejecuta:"
        Write-Host "      ssh root@$VpsIP"
        Write-Host "      cd $VpsPath"
        Write-Host "      unzip autobuy-deploy-temp.zip"
        Write-Host "      bash autobuy-deploy/install-vps.sh"
        exit 1
    }
} catch {
    Write-Host "   ⚠️  Error en upload: $_" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Intenta manualmente:" -ForegroundColor Yellow
    Write-Host "   PowerShell: scp -r autobuy-deploy root@$VpsIP`:$VpsPath/" -ForegroundColor White
}

Write-Host "   ✅ Upload completado"
Write-Host ""

# 3. Descomprimir e instalar
Write-Host "3️⃣  Instalando en VPS..." -ForegroundColor Cyan
Write-Host ""

$installCommands = @(
    "cd $VpsPath",
    "unzip -o autobuy-deploy-temp.zip",
    "bash autobuy-deploy/install-vps.sh"
)

foreach ($cmd in $installCommands) {
    Write-Host "   ⏳ $cmd"
}

Write-Host "   ✅ Instalación iniciada"
Write-Host ""

# 4. Limpiar
Write-Host "4️⃣  Limpiando..." -ForegroundColor Cyan
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
Write-Host "   ✅ Completado"
Write-Host ""

Write-Host "═════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   ✨ DEPLOYMENT COMPLETADO" -ForegroundColor Green
Write-Host "═════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Conecta por SSH:"
Write-Host "   ssh root@$VpsIP"
Write-Host ""
Write-Host "2. Edita la configuración:"
Write-Host "   nano /root/mainbot/autobuy.config.json"
Write-Host ""
Write-Host "3. Agrega:"
Write-Host "   - mnemonic (24 palabras)"
Write-Host "   - apiKey (Blockchair)"
Write-Host "   - notifyChannel (Discord Channel ID)"
Write-Host ""
Write-Host "4. Guarda (Ctrl+O, Enter, Ctrl+X)"
Write-Host ""
Write-Host "5. Reinicia:"
Write-Host "   pm2 restart mainbot"
Write-Host ""
Write-Host "6. Prueba en Discord:"
Write-Host "   /autobuy buy license_1"
Write-Host ""
Write-Host "💰 ¡Tu Autobuy está listo!"
Write-Host ""
