# ✅ Checklist de Deployment

## Antes de Subir

- [ ] Tienes acceso SSH/SFTP al VPS
- [ ] Conoces tu contraseña de root
- [ ] Tienes la IP o dominio del VPS
- [ ] Node.js está instalado en el VPS
- [ ] npm está instalado en el VPS

## Proceso de Upload

- [ ] Comprimiste autobuy-deploy/
- [ ] Subiste archivos al VPS
- [ ] Ejecutaste install-vps.sh
- [ ] Sin errores en la instalación

## Post-Instalación

- [ ] Editaste autobuy.config.json con:
  - [ ] Mnemonic (24 palabras)
  - [ ] API Key Blockchair
  - [ ] Discord Channel ID
- [ ] Guardaste el archivo
- [ ] Reiniciaste el bot

## Verificación

- [ ] Bot está online en Discord
- [ ] Comando /autobuy funciona
- [ ] Genera dirección correctamente
- [ ] Sistema monitorea transacciones
- [ ] Logs sin errores

## En Caso de Problema

- [ ] Revisar logs: tail -f /root/mainbot/logs/autobuy.log
- [ ] Ejecutar: node /root/mainbot/utils/autobuy/test-system.js
- [ ] Verificar config: cat /root/mainbot/autobuy.config.json
- [ ] Revisar permisos: ls -la /root/mainbot/utils/autobuy/

## ¡Listo!

Tu Autobuy está en producción. 🚀💰
