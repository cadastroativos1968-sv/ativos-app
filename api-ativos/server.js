const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

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

/* =========================
   FUNÇÕES AUXILIARES
========================= */

function getViewByTipo(tipo) {
  if (tipo === "impressoras") return "V_IMPRESSORAS_GSV";
  if (tipo === "coletores") return "V_COLETORES_GSV";
  return "V_COMPUTADORES_GSV";
}

function getTableByTipo(tipo) {
  if (tipo === "impressoras") return "glpi_printers";
  if (tipo === "coletores") return "glpi_phones";
  return "glpi_computers";
}

async function gerarCodigoIdentificacao() {
  const [ultimo] = await pool.query(`
    SELECT MAX(COD_IDENTIFICACAO) AS ultimo_codigo
    FROM glpisv_glpi.glpi_log_alteracoes_sist
  `);

  return ultimo[0].ultimo_codigo
    ? Number(ultimo[0].ultimo_codigo) + 1
    : 1000;
}

async function buscarUsuario(usuarioId) {
  const [usuario] = await pool.query(
    "SELECT NOME FROM glpi_usuarios_sist WHERE USUARIO_ID = ?",
    [usuarioId]
  );

  return usuario.length > 0 ? usuario[0].NOME : "Desconhecido";
}

app.post("/api/login", async (req, res) => {
  try {
    const { login, senha } = req.body;

    if (!login || !senha) {
      return res.status(400).json({ erro: "login e senha são obrigatórios" });
    }

    const [rows] = await pool.query(
      `
      SELECT USUARIO_ID, NOME, LOGIN
      FROM glpi_usuarios_sist
      WHERE LOGIN = ? AND SENHA = ? AND ATIVO = 1
      LIMIT 1
      `,
      [login, senha]
    );

    if (rows.length === 0) {
      return res.status(401).json({ erro: "Usuário ou senha inválidos" });
    }

    // ✅ login ok
    return res.json({
      mensagem: "Login OK",
      user: {
        id: rows[0].USUARIO_ID,
        nome: rows[0].NOME,
        login: rows[0].LOGIN,
      },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({ erro: "Erro no login" });
  }
});

/* =========================
   LISTAR ATIVOS
========================= */

app.get("/api/ativos", async (req, res) => {
  try {
    const { tipoTela } = req.query;

    if (!tipoTela) {
      return res.status(400).json({ erro: "tipoTela é obrigatório" });
    }

    const view = getViewByTipo(tipoTela);

    let sql = `
      SELECT CODIGO, NOME, STATUS, TIPO, LOCALIDADE, USUARIO
      FROM ${view}
      WHERE 1=1
    `;

    const params = [];

    if (req.query.nome) {
      sql += " AND NOME LIKE ?";
      params.push(`%${req.query.nome}%`);
    }

    if (req.query.usuario) {
      sql += " AND USUARIO LIKE ?";
      params.push(`%${req.query.usuario}%`);
    }

    if (req.query.status && req.query.status !== "Status") {
      sql += " AND STATUS = ?";
      params.push(req.query.status);
    }

    if (req.query.tipo && req.query.tipo !== "Tipo") {
      sql += " AND TIPO = ?";
      params.push(req.query.tipo);
    }

    if (req.query.localidade && req.query.localidade !== "Localidade") {
      sql += " AND LOCALIDADE = ?";
      params.push(req.query.localidade);
    }

    sql += " ORDER BY NOME";

    const [rows] = await pool.query(sql, params);
    res.json(rows);

  } catch (err) {
    console.error("Erro ao listar ativos:", err);
    res.status(500).json({ erro: err.message });
  }
});

/* =========================
   TRANSFERÊNCIA
========================= */

app.put("/api/ativos/:codigo/transferir", async (req, res) => {
  try {
    const { codigo } = req.params;
    const { tipoTela } = req.query;
    const { novoStatus, novaLocalidade, comentario } = req.body;

    if (!tipoTela) {
      return res.status(400).json({ erro: "tipoTela é obrigatório" });
    }

    const tabela = getTableByTipo(tipoTela);

    // 1️⃣ Buscar dados atuais da tabela real
    const [dadosAtuais] = await pool.query(
      `SELECT states_id, locations_id FROM ${tabela} WHERE id = ?`,
      [codigo]
    );

    if (dadosAtuais.length === 0) {
      return res.status(404).json({ erro: "Ativo não encontrado" });
    }

    const statusAntigo = dadosAtuais[0].states_id;
    const localAntigo = dadosAtuais[0].locations_id;

    // 2️⃣ Identificar alterações
    const camposAlterados = [];

    if (Number(novoStatus) !== Number(statusAntigo)) {
      camposAlterados.push({
        campoOriginal: "COD_STATUS",
        campoBanco: "states_id",
        antigo: statusAntigo,
        novo: novoStatus
      });
    }

    if (Number(novaLocalidade) !== Number(localAntigo)) {
      camposAlterados.push({
        campoOriginal: "COD_LOCALIDADE",
        campoBanco: "locations_id",
        antigo: localAntigo,
        novo: novaLocalidade
      });
    }

    if (camposAlterados.length === 0) {
      return res.json({ mensagem: "Nenhuma alteração detectada" });
    }

    // 3️⃣ Executar UPDATE dinâmico
    const sqlUpdate = `
      UPDATE ${tabela}
      SET ${camposAlterados.map(c => `${c.campoBanco} = ?`).join(", ")}
      WHERE id = ?
    `;

    const valores = camposAlterados.map(c => c.novo);

    await pool.query(sqlUpdate, [...valores, codigo]);

    // 4️⃣ Gerar código sequencial
    const proximoCodigoBase = await gerarCodigoIdentificacao();

const { usuarioId } = req.body;

if (!usuarioId) {
  return res.status(400).json({ erro: "usuarioId é obrigatório (login)" });
}

const usuarioNome = await buscarUsuario(usuarioId);

if (!usuarioId) {
  return res.status(400).json({ erro: "usuarioId é obrigatório (login)" });
}

 const codigoTransferencia = await gerarCodigoIdentificacao(); // 1 código único

for (const campo of camposAlterados) {
  const comentarioFinal =
    `${comentario || ""} Código de transferência ${codigoTransferencia}`;

  await pool.query(
    `
    INSERT INTO glpisv_glpi.glpi_log_alteracoes_sist
    (
      CODIGO,
      TIPO_ATIVO,
      CAMPO_ALTERADO,
      VALOR_ANTIGO,
      VALOR_NOVO,
      USUARIO_ID,
      USUARIO_NOME,
      TIPO_OPERACAO,
      COMENTARIO,
      COD_IDENTIFICACAO
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      codigo,
      tipoTela,
      campo.campoOriginal,
      campo.antigo,
      campo.novo,
      usuarioId,
      usuarioNome,
      "TRANSFERENCIA",
      comentarioFinal,
      codigoTransferencia, // ✅ mesmo código para todas as linhas
    ]
  );
}

res.json({
  mensagem: "Transferência realizada com sucesso",
  codigoTransferencia: codigoTransferencia,
});

  } catch (err) {
    console.error("Erro na transferência:", err);
    res.status(500).json({ erro: err.message });
  }
});
/* =========================
   BUSCAR ATIVO POR CÓDIGO
========================= */

app.get("/api/ativos/:codigo", async (req, res) => {
  try {
    const { codigo } = req.params;
    const { tipo } = req.query;

    if (!tipo) {
      return res.status(400).json({ erro: "tipo é obrigatório" });
    }

    const view = getViewByTipo(tipo);

    const [rows] = await pool.query(
      `SELECT * FROM ${view} WHERE CODIGO = ?`,
      [codigo]
    );

    res.json(rows[0] || null);

  } catch (err) {
    console.error("Erro ao buscar ativo:", err);
    res.status(500).json({ erro: err.message });
  }
});

/* =========================
   ALTERAÇÃO DE CAMPOS
========================= */

app.put("/api/ativos/:codigo", async (req, res) => {
  try {
    const { codigo } = req.params;
    const { tipoTela } = req.query;
    const dadosNovos = req.body;

    if (!tipoTela) {
      return res.status(400).json({ erro: "tipoTela é obrigatório" });
    }

    const tabela = getTableByTipo(tipoTela);
    const view = getViewByTipo(tipoTela);

    // 🔁 MAPEAMENTO VIEW → TABELA REAL
    const mapaCampos = {
      COD_STATUS: "states_id",
      COD_LOCALIDADE: "locations_id"
    };

    // 1️⃣ Buscar dados atuais
    const [rows] = await pool.query(
      `SELECT * FROM ${view} WHERE CODIGO = ?`,
      [codigo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Registro não encontrado" });
    }

    const dadosAtuais = rows[0];

    const camposAlterados = [];
    const valores = [];

    const camposIgnorados = [
      "STATUS",
      "TIPO",
      "LOCALIDADE",
      "INCLUSAO_GLPI",
      "ULTIMA_CONEXAO"
    ];

for (const campo in dadosNovos) {
  if (
    campo !== "CODIGO" &&
    campo !== "usuarioId" &&       // ✅ ignora isso
    !camposIgnorados.includes(campo) &&
    dadosNovos[campo] != dadosAtuais[campo]
  ) {
    const campoReal = mapaCampos[campo] || campo;

    camposAlterados.push({
      campoOriginal: campo,
      campoBanco: campoReal,
      antigo: dadosAtuais[campo],
      novo: dadosNovos[campo],
    });

    valores.push(dadosNovos[campo]);
  }
}

    if (camposAlterados.length === 0) {
      return res.json({ mensagem: "Nenhuma alteração detectada" });
    }

    // 2️⃣ Update na tabela real
    const sqlUpdate = `
      UPDATE ${tabela}
      SET ${camposAlterados.map(c => `${c.campoBanco} = ?`).join(", ")}
      WHERE id = ?
    `;

    await pool.query(sqlUpdate, [...valores, codigo]);

    // 3️⃣ Gerar código sequencial
 
const { usuarioId } = req.body;

if (!usuarioId) {
  return res.status(400).json({ erro: "usuarioId é obrigatório (login)" });
}

const usuarioNome = await buscarUsuario(usuarioId);


   for (const campo of camposAlterados) {
  await pool.query(
    `
    INSERT INTO glpisv_glpi.glpi_log_alteracoes_sist
    (
      CODIGO,
      TIPO_ATIVO,
      CAMPO_ALTERADO,
      VALOR_ANTIGO,
      VALOR_NOVO,
      USUARIO_ID,
      USUARIO_NOME,
      TIPO_OPERACAO,
      COMENTARIO,
      COD_IDENTIFICACAO
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      codigo,
      tipoTela,
      campo.campoOriginal,
      campo.antigo,
      campo.novo,
      usuarioId,
      usuarioNome,
      "ALTERACAO",
      "Alteração via sistema",
      null   // 👈 NÃO GERA IDENTIFICAÇÃO
    ]
  );
}

    res.json({
      mensagem: "Atualizado com sucesso e log registrado"
    });

  } catch (err) {
    console.error("Erro na alteração:", err);
    res.status(500).json({ erro: err.message });
  }
});


app.get("/api/relatorios", async (req, res) => {
  try {
    // Selecionando todos os registros da tabela de logs de alterações
    const [rows] = await pool.query(`
      SELECT CODIGO, TIPO_ATIVO, CAMPO_ALTERADO, VALOR_ANTIGO, VALOR_NOVO, USUARIO_NOME, TIPO_OPERACAO, COMENTARIO, COD_IDENTIFICACAO
      FROM glpisv_glpi.glpi_log_alteracoes_sist
      ORDER BY COD_IDENTIFICACAO DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar relatórios:", err);
    res.status(500).json({ erro: "Erro ao buscar relatórios" });
  }
});
/* ========================= */

app.listen(3001, () => {
  console.log("API MySQL rodando na porta 3001");
});