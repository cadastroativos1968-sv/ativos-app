const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

async function criarUsuario() {

  const pool = mysql.createPool({
    host: "172.16.1.230",
    user: "cadastro.ativo",
    password: "JtAm82jshv",
    database: "glpisv_glpi",
    port: 3306
  });

  const nome = "Teste2";
  const login = "Teste2@svicente.com.br";
  const senha = "pipoca";

  const senhaHash = await bcrypt.hash(senha, 12);

  await pool.query(`
    INSERT INTO glpi_usuarios_sist
    (NOME, LOGIN, SENHA, ATIVO)
    VALUES (?, ?, ?, 1)
  `, [nome, login, senhaHash]);

  console.log("Usuário criado!");

  await pool.end();
}

criarUsuario();