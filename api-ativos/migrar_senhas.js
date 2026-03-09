const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
require("dotenv").config();

async function migrar() {
  const pool = mysql.createPool({
    host: "172.16.1.230",
    user: "cadastro.ativo",
    password: "JtAm82jshv",
    database: "glpisv_glpi",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const [usuarios] = await pool.query(`
    SELECT USUARIO_ID, SENHA
    FROM glpi_usuarios_sist
    WHERE SENHA IS NOT NULL
      AND SENHA <> ''
  `);

  for (const usuario of usuarios) {
    const senhaAtual = String(usuario.SENHA);

    if (
      senhaAtual.startsWith("$2a$") ||
      senhaAtual.startsWith("$2b$") ||
      senhaAtual.startsWith("$2y$")
    ) {
      continue;
    }

    const hash = await bcrypt.hash(senhaAtual, 12);

    await pool.query(
      `
      UPDATE glpi_usuarios_sist
      SET SENHA = ?
      WHERE USUARIO_ID = ?
      `,
      [hash, usuario.USUARIO_ID]
    );

    console.log(`Usuário ${usuario.USUARIO_ID} migrado`);
  }

  await pool.end();
  console.log("Migração concluída");
}

migrar().catch((err) => {
  console.error("Erro na migração:", err);
});