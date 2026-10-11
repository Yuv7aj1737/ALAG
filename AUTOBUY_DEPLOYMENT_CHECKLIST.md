# ✅ Checklist de Deployment - Autobuy LTC

## Fase 1: Preparación (Antes de Ejecutar)

### Criptografía y Seguridad
- [ ] Generar mnemonic de 24 palabras
- [ ] Guardar mnemonic en papel en caja fuerte
- [ ] Crear 2+ copias de respaldo
- [ ] Obtener API Key de Blockchair (https://blockchair.com/api)
- [ ] Crear archivo .env con secrets
- [ ] Agregar .env a .gitignore

### Software
- [ ] Verificar Node.js >= 14.0.0 (`node --version`)
- [ ] Instalar npm packages: `npm install bip32 bip39 sqlite3 axios`
- [ ] (Opcional) Instalar dotenv: `npm install dotenv`
- [ ] Verificar disco disponible (mínimo 100MB)

### Configuración
- [ ] Ejecutar: `node autosecure/utils/autobuy/setup-wizard.js`
- [ ] Verificar autobuy.config.json creado
- [ ] Revisar todos los valores en la config
- [ ] Copiar precios correctos
- [ ] Agregar Discord ID propio
- [ ] Agregar Channel ID para notificaciones

### Pruebas
- [ ] Ejecutar: `node autosecure/utils/autobuy/test-system.js`
- [ ] Verificar: ✅ Todos los tests pasan
- [ ] Verificar: ✅ Dependencias instaladas
- [ ] Verificar: ✅ Base de datos creada
- [ ] Verificar: ✅ Config válida

---

## Fase 2: Validación (Antes de Ir a Producción)

### Wallet Setup
- [ ] Tener wallet Litecoin funcionando (Exodus, Ledger, Kraken, etc.)
- [ ] Conocer tu dirección principal
- [ ] Hacer backup de seed phrase de la wallet
- [ ] Proteger wallet con contraseña fuerte

### Discord Bot
- [ ] Bot tiene permisos en Discord
- [ ] Comando `/autobuy` está disponible
- [ ] Botones están funcionando
- [ ] Canal de notificaciones existe

### Base de Datos
- [ ] DB file existe: `db/autobuy.db`
- [ ] Licenses están registradas
- [ ] Productos tienen precios correctos
- [ ] DB puede escribir sin errores

### Transacciones de Prueba
- [ ] Completar test-autobuy.js (si existe)
- [ ] Ejecutar: `/autobuy buy license_1`
- [ ] Dirección LTC generada correctamente
- [ ] Dirección inicia con: L, M, o ltc1
- [ ] Dirección es única cada vez

---

## Fase 3: Monitor Inicial (Primeras Compras)

### Día 1: Prueba Manual
- [ ] Enviar 0.0001 LTC a dirección generada
- [ ] Esperar confirmación (5-30 minutos)
- [ ] Ver logs: `type logs/autobuy.log`
- [ ] Dashboard muestra pago: `node dashboard.js`
- [ ] Bot notifica en Discord
- [ ] Producto se entrega automáticamente

### Día 2-3: Monitoreo
- [ ] Ejecutar dashboard regularmente
- [ ] Revisar logs para errores
- [ ] Verificar BD: ver transacciones
- [ ] Confirmar dinero en wallet
- [ ] Probar con múltiples compras

### Semana 1: Validación
- [ ] Recibir compras reales
- [ ] Confirmar dinero entra
- [ ] Revisar alertas de seguridad
- [ ] Hacer primer backup manual

---

## Fase 4: Producción (Semanal)

### Mantenimiento
- [ ] Revisar logs diarios
- [ ] Ejecutar dashboard 1x/día
- [ ] Verificar saldo de wallet 2x/semana
- [ ] Hacer backup cada semana
- [ ] Actualizar npm packages mensual

### Seguridad
- [ ] No compartir mnemonic
- [ ] Verificar permisos de archivos
- [ ] Mantener .env privado
- [ ] Revisar acceso de usuario
- [ ] Monitorear API usage

### Respaldo
- [ ] Backup automático BD 1x/semana
- [ ] Verificar integridad de backups
- [ ] Guardar en múltiples ubicaciones
- [ ] Documentar cambios de config

---

## Fase 5: Crecimiento (Mensual+)

### Estadísticas
- [ ] Generar reporte mensual
- [ ] Analizar volumen de compras
- [ ] Calcular ingresos totales
- [ ] Identificar productos populares
- [ ] Planear expansión

### Mejoras
- [ ] Agregar nuevos productos
- [ ] Ajustar precios si es necesario
- [ ] Optimizar tiempo de entrega
- [ ] Mejorar interfaz Discord
- [ ] Expandir a nuevas criptos

### Escalabilidad
- [ ] Monitor performance
- [ ] Optimizar BD si es necesario
- [ ] Aumentar intervalo de monitoreo si es estable
- [ ] Planear migración si crece mucho
- [ ] Documentar cambios

---

## Tabla de Verificación Rápida

```
ANTES DE EMPEZAR:
├─ [ ] Mnemonic guardada seguro
├─ [ ] API Key de Blockchair
├─ [ ] npm install completado
├─ [ ] setup-wizard.js ejecutado
└─ [ ] test-system.js ✅ pasa

ANTES DE PRODUCCIÓN:
├─ [ ] Wallet Litecoin funciona
├─ [ ] Compra de prueba exitosa
├─ [ ] Bot notifica correctamente
├─ [ ] Dinero entra a wallet
└─ [ ] Logs limpios (sin errores)

SEMANALMENTE:
├─ [ ] Revisar logs
├─ [ ] Ejecutar backup.js
├─ [ ] Verificar saldo
├─ [ ] Hacer test de compra
└─ [ ] Documentar cambios

MENSUALMENTE:
├─ [ ] Analizar estadísticas
├─ [ ] Actualizar packages
├─ [ ] Revisar seguridad
├─ [ ] Hacer full backup
└─ [ ] Planear mejoras
```

---

## 🚨 Checklist de Emergencia

### Si algo no funciona
- [ ] Ejecutar: `test-system.js`
- [ ] Revisar: `logs/autobuy.log`
- [ ] Verificar: conectividad internet
- [ ] Verificar: API Key válida
- [ ] Ejecutar: `setup-wizard.js` nuevamente
- [ ] Si nada funciona: restaurar backup

### Si pierdes mnemonic
- [ ] PARAR TODO INMEDIATAMENTE
- [ ] Generar nueva mnemonic
- [ ] Transferir fondos a nueva dirección
- [ ] Actualizar configuración
- [ ] Crear nueva wallet

### Si se compromete API Key
- [ ] Ir a blockchair.com
- [ ] Eliminar API Key comprometida
- [ ] Crear nueva API Key
- [ ] Actualizar en config/.env
- [ ] Monitorear uso

### Si hay error en BD
- [ ] Hacer backup de autobuy.db PRIMERO
- [ ] Eliminar autobuy.db
- [ ] Ejecutar setup-wizard.js
- [ ] Restaurar datos de backup si es posible
- [ ] Verificar integridad

---

## 📋 Documentos para Consultar

| Situación | Documento |
|-----------|-----------|
| "Acabo de empezar" | README_QUICK_START.md |
| "Necesito más detalles" | AUTOBUY_LTC_SETUP_COMPLETO.md |
| "Algo no funciona" | AUTOBUY_ARCHITECTURE.md |
| "Me preocupa seguridad" | AUTOBUY_SECURITY.md |
| "Necesito entender todo" | AUTOBUY_INDEX.md |

---

## 🎯 Objetivos de Cada Fase

**Fase 1: Preparación**
- Objetivo: Sistema listo para recibir pagos
- Duración: 30-60 minutos
- Éxito: Todos los tests pasan ✅

**Fase 2: Validación**
- Objetivo: Confirmar que funciona correctamente
- Duración: 1-2 horas
- Éxito: Primera compra de prueba exitosa

**Fase 3: Monitor**
- Objetivo: Detectar problemas antes de escalar
- Duración: 3 días
- Éxito: Varias compras confirmadas sin errores

**Fase 4: Producción**
- Objetivo: Operación estable y segura
- Duración: Indefinido
- Éxito: Recibir compras reales sin problemas

**Fase 5: Crecimiento**
- Objetivo: Optimizar y expandir
- Duración: Después de 1 mes
- Éxito: Múltiples productos, buen volumen

---

## 💡 Tips de Éxito

```
✅ Sigue CADA paso del checklist
✅ No saltes pasos "por si acaso"
✅ Haz backups aunque "no sea necesario"
✅ Prueba todo antes de en vivo
✅ Mantén logs/documentación
✅ Revisa regularmente
✅ No cambies cosas "un poco"
✅ Documenta TODOS los cambios
```

---

## 📞 Cuando Necesites Ayuda

1. **Revisa el error en logs/** 
2. **Ejecuta test-system.js**
3. **Consulta documentación relevante**
4. **Si persiste: restaura backup y reintenta**

---

## 🎉 Checkpoints Principales

```
✓ CHECKPOINT 1: npm install completado
✓ CHECKPOINT 2: setup-wizard.js completado
✓ CHECKPOINT 3: test-system.js ✅ pasa
✓ CHECKPOINT 4: Primera compra de prueba exitosa
✓ CHECKPOINT 5: Recibir dinero real en wallet
✓ CHECKPOINT 6: Producto entregado automáticamente
✓ CHECKPOINT 7: Sistema en producción
```

---

**Felicidades! Tu sistema de Autobuy está listo para producción.** 🎉

Ahora sólo queda:
1. ✅ Ejecutar el checklist
2. ✅ Recibir compras
3. ✅ ¡Ganar dinero! 💰
