const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usedLicenses (
    license TEXT PRIMARY KEY,
    userId TEXT,
    expiry TEXT,
    one_day_warning_sent INTEGER DEFAULT 0,
    seven_day_warning_sent INTEGER DEFAULT 0,
    istrial INTEGER DEFAULT 0
  )`, (err) => {
    if (err) console.error("Error creando usedLicenses:", err.message);
    else console.log("Tabla usedLicenses creada correctamente (o ya existía).");
  });
});

db.close();
