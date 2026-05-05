/**
 * Script para resetear la contraseña de un usuario en la BD.
 * Uso: node reset-password.js
 *
 * Requiere: npm install bcrypt mysql2 (ya están instalados en el proyecto)
 */

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

// ── Configura aquí ──────────────────────────────────────────────────────────
const EMAIL          = 'andres@permoda.com.co';
const PASSWORD_NUEVO = 'Koaj2025!';   // ← cambia esto si quieres otra contraseña
const SALT_ROUNDS    = 12;
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Generar hash bcrypt
  const hash = await bcrypt.hash(PASSWORD_NUEVO, SALT_ROUNDS);
  console.log(`\n✅ Hash generado para "${PASSWORD_NUEVO}":`);
  console.log(hash);

  // 2. Conectar a la BD
  const connection = await mysql.createConnection({
    host:     '127.0.0.1',
    port:     3306,
    user:     'root',
    password: 'vD8Ax09;',
    database: 'koaj2_access',
  });

  // 3. Actualizar la contraseña
  const [result] = await connection.execute(
    `UPDATE usuarios
        SET password_hash         = ?,
            debe_cambiar_password = 0,
            intentos_fallidos     = 0,
            bloqueado_hasta       = NULL,
            updated_at            = NOW()
      WHERE email = ?
        AND deleted_at IS NULL`,
    [hash, EMAIL],
  );

  await connection.end();

  if (result.affectedRows === 0) {
    console.error(`\n❌ No se encontró el usuario con email: ${EMAIL}`);
    process.exit(1);
  }

  console.log(`\n🔑 Contraseña actualizada correctamente para: ${EMAIL}`);
  console.log(`   Nueva contraseña: ${PASSWORD_NUEVO}`);
  console.log(`   debe_cambiar_password: false`);
  console.log(`   intentos_fallidos: 0 (cuenta desbloqueada)\n`);
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
