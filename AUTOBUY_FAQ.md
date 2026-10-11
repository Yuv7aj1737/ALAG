# ❓ FAQ - Preguntas Frecuentes - Autobuy LTC

## Tabla de Contenidos
1. [Antes de Empezar](#antes-de-empezar)
2. [Configuración](#configuración)
3. [Operación](#operación)
4. [Seguridad](#seguridad)
5. [Problemas Técnicos](#problemas-técnicos)

---

## Antes de Empezar

### ¿Necesito experiencia en programación?
**No.** El sistema está diseñado para no-técnicos. Solo ejecuta setup-wizard.js y responde preguntas.

### ¿Cuánto cuesta?
**Gratis.** Except:
- Fees de blockchain de Litecoin (muy bajos, ~0.00001 LTC)
- Blockchair API (free tier)

### ¿En cuánto tiempo puedo empezar?
**15-20 minutos:**
- 5 min lectura inicial
- 10 min setup wizard
- 5 min pruebas

### ¿Puedo usar mi wallet existente?
**Sí.** Si ya tienes Litecoin, puedes importar las palabras (seed phrase).

### ¿Funciona en Windows?
**Sí.** Windows, Mac, Linux - funciona en todos.

---

## Configuración

### ¿Qué es una mnemonic?
Tus **24 palabras mágicas** que controlan TODOS los fondos. Nunca compartir.

### ¿Dónde obtengo mi mnemonic?
**Opción 1:** El script la genera automáticamente  
**Opción 2:** Usa una existente de tu wallet

### ¿Qué es Blockchair API Key?
Acceso a la blockchain de Litecoin para monitorear transacciones. Es gratis.

### ¿Cómo obtengo API Key?
1. Ve a https://blockchair.com/api
2. Click "Sign Up"
3. Verifica email
4. Copia API Key
5. Pega en setup-wizard

### ¿Cuál es mi Discord ID?
En Discord:
1. Click tu nombre (abajo)
2. Copia número que aparece
3. Eso es tu Discord ID

### ¿Cómo obtengo Channel ID?
En Discord:
1. Click derecho en canal
2. "Copy Channel ID"
3. Pégalo en setup-wizard

### ¿Puedo cambiar los precios después?
**Sí.** Edita autobuy.config.json o ejecuta setup-wizard nuevamente.

### ¿Cuáles son los precios recomendados?
```
License: 0.001 LTC (~$0.05)
Slot: 0.002 LTC (~$0.10)
```

Pero ajusta según tu mercado.

---

## Operación

### ¿Cómo mi usuario compra?
```
1. Ejecuta: /autobuy buy license_1
2. Bot genera dirección LTC
3. Usuario envía LTC
4. Bot detecta (1-5 min)
5. Bot entrega producto
```

### ¿Las direcciones son únicas?
**Sí.** Cada compra obtiene dirección diferente. Pero todos van a tu wallet maestra.

### ¿Cuánto tiempo para confirmación?
**Litecoin:** 1-5 minutos (rápido)  
Blockchain necesita ~1 confirmación.

### ¿Qué pasa si envían dinero incorrecto?
El sistema detecta si el monto no coincide y lo marca como "incompleto".

### ¿Puedo recibir múltiples pagos simultáneamente?
**Sí.** El sistema soporta miles de direcciones simultáneamente.

### ¿El dinero es irreversible?
**Sí.** Una vez confirmado en blockchain, es permanente. No hay reembolsos automáticos.

### ¿Puedo refundar dinero?
**Sí, manualmente.** Desde tu wallet, envía LTC de vuelta a la dirección de pago.

### ¿Qué si un usuario dice "no recibió el producto"?
1. Verifica en DB que pago fue confirmado
2. Si confirmado → revisar si se entregó
3. Si no se entregó → entregar manualmente
4. Si no confirmado → esperar más tiempo

---

## Seguridad

### ¿Es seguro guardar mnemonic en config?
**No, no es ideal.** Mejor usar .env o variable de entorno.

### ¿Puedo usar sin mnemonic en el código?
**Sí.** Usa variable de entorno:
```bash
set AUTOBUY_MNEMONIC=tus_24_palabras
```

### ¿Qué si pierdo la mnemonic?
**Pierdes acceso a TODOS los fondos.** Por eso:
- Guárdala en papel en caja fuerte
- Haz 2-3 copias
- NO tomes fotos

### ¿Y si la mnemonic se expone?
**ACCIÓN INMEDIATA:**
1. Para todo
2. Genera nueva mnemonic
3. Transfiere fondos a nueva dirección
4. Cambia configuración

### ¿Puedo usar ledger?
**Sí.** Importa las palabras de Ledger en setup-wizard.

### ¿Qué si alguien accede a mi PC?
Su acceso es al código, no a los fondos (protegidos por mnemonic).

### ¿Debo cambiar API Key regularmente?
No es necesario, pero es buena práctica cada 3-6 meses.

### ¿El bot puede robarse fondos?
**No.** El bot solo genera direcciones y monitorea blockchain. No accede a fondos.

---

## Problemas Técnicos

### "Module not found"
**Causa:** npm no instaló dependencias  
**Solución:**
```bash
npm install bip32 bip39 sqlite3 axios
```

### "Invalid mnemonic"
**Causa:** Palabras mal copiadas  
**Solución:**
- Copia las 24 palabras nuevamente
- Verifica que no haya espacios extra
- Que estén en español o inglés

### "API Key error / Invalid"
**Causa:** Clave incorrecta o vencida  
**Solución:**
1. Ve a blockchair.com/api
2. Regenera API Key
3. Copia correctamente (sin espacios)
4. Actualiza en setup-wizard

### "Database error / Cannot open"
**Causa:** Archivo corrupto o permisos  
**Solución:**
1. Elimina: db/autobuy.db
2. Ejecuta: setup-wizard.js
3. Se recrea automáticamente

### "Dirección no válida"
**Causa:** Configuración corrupta  
**Solución:**
1. Verifica autobuy.config.json
2. Mnemonic debe tener 24 palabras
3. Ejecuta setup-wizard nuevamente

### "Blockchain timeout"
**Causa:** Sin internet o API caída  
**Solución:**
1. Verifica conexión internet
2. Verifica status de Blockchair: https://blockchair.com
3. Intenta después

### "Pago no detectado"
**Causa:** Transacción aún no confirmada  
**Solución:**
- Blockchain tarda 5-30 minutos
- Espera un poco más
- Verifica en: https://blockchair.com/litecoin

### "Bot no responde"
**Causa:** Bot caído o no inicializado  
**Solución:**
1. Revisa logs: type logs/autobuy.log
2. Reinicia bot: npm start
3. Ejecuta test-system.js

### "Dinero no llegó a mi wallet"
**Causas posibles:**
1. Transacción aún pendiente (espera)
2. Dirección generada incorrectamente (revisa logs)
3. Blockchain problema (revisar https://blockchair.com)

### "El producto no se entregó automáticamente"
**Solución:**
1. Verifica pago confirmado en BD
2. Si confirmado → entregar manualmente
3. Revisar logs para error en auto-entrega

---

## Rendimiento

### ¿Cuántas direcciones puedo generar?
**Teóricamente:** 2^32 = 4.3 mil millones  
**Prácticamente:** Ilimitadas para tu caso de uso

### ¿Es lento?
**No.** Generar dirección toma <1ms. Monitoreo toma 1-2s por dirección.

### ¿Puedo monitorear 1000 direcciones?
**Sí.** Sistema está optimizado.

### ¿Si crece mucho, necesito servidor?
**Probablemente no.** Funciona en laptop con:
- Node.js
- 100MB disco
- Conexión internet

---

## Límites y Restricciones

### ¿Límite de dinero por dirección?
**No.** Puedes recibir infinito en una dirección.

### ¿Límite de transacciones?
**No.** Base de datos puede guardar millones.

### ¿Límite de API calls?
**Blockchair free tier:**
- Gratis: 700 llamadas/día
- Premium: Sin límite

Para la mayoría de usuarios es suficiente.

### ¿Puedo vender ilimitados productos?
**Sí.** Agranda la tabla `licenses` en BD.

---

## Mantenimiento

### ¿Cada cuánto hago backup?
**Recomendado:** 1x/semana  
**Mínimo:** 1x/mes

### ¿Qué backupear?
1. Mnemonic (CRÍTICO)
2. autobuy.config.json
3. db/autobuy.db
4. .env (si lo usas)

### ¿Debo actualizar packages?
**npm:** Sí, mensualmente  
**Node.js:** Sí, cuando hay versiones LTS

### ¿Revisar logs para qué?
- Detectar errores
- Auditoría de transacciones
- Debugging de problemas

---

## Escalabilidad

### ¿Funciona en producción?
**Sí.** Sistema está listo para producción desde el inicio.

### ¿Puedo agregar nuevas monedas?
**Sí, pero requiere código.** Actualmente soporta Litecoin.

### ¿Puedo vender en múltiples Discord servers?
**Sí.** Copia el bot a múltiples servidores.

### ¿Puedo usar en website también?
**Sí.** El core es independiente de Discord. Puedes crear tu propia interfaz.

---

## Legalidad

### ¿Es legal?
**En la mayoría de países, sí.** Pero consulta leyes locales sobre:
- Criptomonedas
- Venta de productos
- Impuestos

### ¿Debo pagar impuestos?
**Probablemente sí.** Consulta con contador local.
- Ganancias en criptomonedas frecuentemente son gravables

### ¿Necesito licencia?
Depende del producto que vendas. Para "licenses" virtuales, generalmente no. Pero verifica localmente.

---

## Soporte Técnico

### ¿Dónde pido ayuda?
1. Revisa FAQ (este documento)
2. Revisa documentación técnica
3. Ejecuta test-system.js
4. Revisa logs/

### ¿Hay comunidad?
Actualmente no. Pero documentación es muy completa.

### ¿Puedo reportar bugs?
Guarda: descripción del error + logs + pasos para reproducir.

---

## Ejemplos Reales

### Scenario 1: Usuario compra 1 license
```
10:00 - Usuario: /autobuy buy license_1
10:00 - Bot: Dirección bc1q111 (0.001 LTC)
10:02 - Usuario: Envía 0.001 LTC
10:15 - Bot: ✅ Confirmado, entregando...
10:16 - Usuario: License entregada
       Tú: 0.001 LTC en wallet
```

### Scenario 2: Usuario envía dinero incorrecto
```
10:00 - Bot: Espera 0.001 LTC
10:05 - Usuario: Envía 0.0005 LTC (mitad)
10:20 - Bot: ✅ Pagó 0.0005 (incompleto)
       Espera 0.0005 adicionales
```

### Scenario 3: Validar múltiples pagos
```
10:00 - Usuario A: /autobuy buy
       Bot genera: bc1qa...
10:01 - Usuario B: /autobuy buy
       Bot genera: bc1qb...
10:02 - Usuario C: /autobuy buy
       Bot genera: bc1qc...

Monitoreo detecta los 3 en paralelo
```

---

## Checklist de Troubleshooting

Si algo falla:

```
[ ] 1. Revisar logs: type logs/autobuy.log
[ ] 2. Ejecutar test: node test-system.js
[ ] 3. Revisar config: cat autobuy.config.json
[ ] 4. Testear manualmente: /autobuy buy
[ ] 5. Revisar blockchain: https://blockchair.com
[ ] 6. Reiniciar bot: npm start
[ ] 7. Consultar FAQ
[ ] 8. Revisar documentación
```

---

## Éxito!

Si tu pregunta no está aquí:

1. **Busca en documentos:**
   - README_QUICK_START.md
   - AUTOBUY_LTC_SETUP_COMPLETO.md
   - AUTOBUY_ARCHITECTURE.md

2. **Analiza logs:**
   - logs/autobuy.log

3. **Ejecuta diagnóstico:**
   - test-system.js

4. **Revisa código:**
   - autosecure/utils/autobuy/

99% de problemas se resuelven así! ✨

---

**¿Estás listo para ganar? ¡Vamos!** 🚀💰
