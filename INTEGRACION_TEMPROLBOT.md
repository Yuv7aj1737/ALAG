# 🔗 Integración con Tu Proyecto Principal

Si quieres usar las funciones del Temporal Role Bot desde tu proyecto principal (autosecure), aquí está cómo:

## Opción 1: Bot Completamente Independiente (Recomendado)

El bot funciona de forma completamente independiente:
- Token separado
- Base de datos separada
- Procesos separados
- Se inicia por separado

```bash
# Terminal 1 - Tu proyecto principal
npm start

# Terminal 2 - Bot de roles temporales
cd temprolbot
npm start
```

---

## Opción 2: Importar Funciones en Tu Proyecto

Si quieres usar las funciones de asignación de roles desde tu código principal:

### Paso 1: Asegúrate de que SQLite3 esté instalado

```bash
npm install sqlite3
```

### Paso 2: Importa las funciones

En cualquier archivo de tu proyecto:

```javascript
// Importar funciones de base de datos
const tempRoleDB = require('./temprolbot/utils/tempRoleDB.js');
const roleManager = require('./temprolbot/handlers/roleManager.js');

// Importar cliente Discord (si lo necesitas)
const { Client } = require('discord.js');
```

### Paso 3: Usa las funciones

```javascript
// Asignar un rol temporal
const result = await roleManager.assignTemporaryRole(
    client,           // Tu cliente de Discord
    guildId,          // ID del servidor
    userId,           // ID del usuario
    roleId,           // ID del rol
    30                // Duración en días
);

console.log(result); // { success: true, message: "..." }
```

---

## Ejemplo Práctico: Integrar en un Comando Existente

Si tienes un comando en `mainbot` que quiera asignar un rol temporal:

```javascript
// En tu comando principal
const tempRoleDB = require('../../temprolbot/utils/tempRoleDB.js');

module.exports = {
    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        const role = interaction.options.getRole('rol');
        const days = 30;

        // Asignar rol
        await role.guild.members.cache
            .get(user.id)
            .roles.add(role.id);

        // Guardar en base de datos de roles temporales
        await tempRoleDB.addTemporaryRole(
            interaction.guildId,
            user.id,
            role.id,
            days
        );

        interaction.reply(`✅ Rol asignado por ${days} días`);
    }
};
```

---

## Funciones Disponibles

```javascript
// ✅ Agregar rol temporal
await tempRoleDB.addTemporaryRole(guildId, userId, roleId, durationDays);

// ✅ Obtener roles de un usuario
const roles = await tempRoleDB.getUserTemporaryRoles(guildId, userId);

// ✅ Obtener todos los roles activos
const allRoles = await tempRoleDB.getAllActiveTemporaryRoles();

// ✅ Decrementar todos los roles en 1 día
await tempRoleDB.decrementAllRoles();

// ✅ Obtener roles que vencieron (remaining_days <= 0)
const expired = await tempRoleDB.getRolesToRemove();

// ✅ Remover rol por ID
await tempRoleDB.removeTemporaryRole(roleId);

// ✅ Remover rol específico de un usuario
await tempRoleDB.removeUserRole(guildId, userId, roleId);

// ✅ Obtener días restantes
const days = await tempRoleDB.getRemainingDays(guildId, userId, roleId);
```

---

## Configuración de PM2 con Múltiples Bots

Si usas PM2 para manejar ambos bots, crea un archivo `ecosystem.config.js`:

```javascript
module.exports = {
    apps: [
        {
            name: 'mainbot',
            script: './autosecure.js',
            watch: false,
            env: {
                NODE_ENV: 'production'
            }
        },
        {
            name: 'temprolbot',
            script: './temprolbot/temprolbot.js',
            watch: false,
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};
```

Luego ejecuta:
```bash
pm2 start ecosystem.config.js
```

---

## Notas Importantes

⚠️ **Dos tokens diferentes** - Cada bot necesita su propio token de Discord
⚠️ **Dos bases de datos** - La de roles temporales es separada (tempRoles.db)
⚠️ **Procesos independientes** - Se inician y se detienen de forma separada
⚠️ **No hay conflictos** - Los bots no interfieren entre sí

---

## Estructura Final

```
autosecure/
├── autosecure.js              # Tu bot principal
├── mainbot/                   # Comandos principales
├── temprolbot/                # 👈 Bot de roles temporales
│   ├── temprolbot.js          # Archivo principal
│   ├── commands/
│   ├── handlers/
│   └── utils/
├── package.json
└── ...
```

---

Cualquier pregunta, revisa los archivos de documentación en la carpeta `temprolbot/`.
