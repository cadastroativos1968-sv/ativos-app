const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
require("dotenv").config();

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

function descreverNomeCampo(campo) {
  switch (campo) {
    case "COD_LOCALIDADE":
      return "LOCALIDADE";
    case "COD_STATUS":
      return "STATUS";
    case "USUARIO":
      return "USUARIO";
    case "PATRIMONIO":
      return "PATRIMONIO";
    case "SERIAL":
      return "SERIAL";
    case "CONTRATO":
      return "CONTRATO";
    default:
      return campo;
  }
}

async function buscarNomeUsuarioAtivo(glpiUserId) {
  if (!glpiUserId) return "";

  const [rows] = await pool.query(
    `
    SELECT 
      COALESCE(
        NULLIF(TRIM(CONCAT(IFNULL(firstname,''), ' ', IFNULL(realname,''))), ''),
        name
      ) AS nome
    FROM glpisv_glpi.glpi_users
    WHERE id = ?
    LIMIT 1
    `,
    [glpiUserId]
  );

  return rows.length ? rows[0].nome : String(glpiUserId);
}

async function buscarDescricaoStatus(statusId) {
  if (!statusId) return "";

  const [rows] = await pool.query(
    `
    SELECT name
    FROM glpisv_glpi.glpi_states
    WHERE id = ?
    LIMIT 1
    `,
    [statusId]
  );

  return rows.length ? rows[0].name : String(statusId);
}

async function buscarDescricaoLocalidade(locationId) {
  if (!locationId) return "";

  const [rows] = await pool.query(
    `
    SELECT COALESCE(completename, name) AS nome
    FROM glpisv_glpi.glpi_locations
    WHERE id = ?
    LIMIT 1
    `,
    [locationId]
  );

  return rows.length ? rows[0].nome : String(locationId);
}

async function descreverValorCampo(campo, valor) {
  if (valor === null || valor === undefined || valor === "") return "";

  switch (campo) {
    case "COD_STATUS":
      return await buscarDescricaoStatus(valor);

    case "COD_LOCALIDADE":
      return await buscarDescricaoLocalidade(valor);

    case "COD_USUARIO":
      return await buscarNomeUsuarioAtivo(valor);

    default:
      return String(valor);
  }
}

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

async function gerarHashSenha(senha) {
  const saltRounds = 12;
  return await bcrypt.hash(senha, saltRounds);
}

async function verificarSenha(senhaDigitada, hashSalvo) {
  return await bcrypt.compare(senhaDigitada, hashSalvo);
}

function montarFiltrosRelatorio(req) {
  const filtros = [];
  const params = [];

  if (req.query.nome) {
    filtros.push("NOME LIKE ?");
    params.push(`%${req.query.nome}%`);
  }

  if (req.query.status && req.query.status !== "Status") {
    filtros.push("STATUS LIKE ?");
    params.push(`%${req.query.status}%`);
  }

  if (req.query.tipo && req.query.tipo !== "Tipo") {
    filtros.push("TIPO LIKE ?");
    params.push(`%${req.query.tipo}%`);
  }

  if (req.query.localidade && req.query.localidade !== "Localidade") {
    filtros.push("LOCALIDADE LIKE ?");
    params.push(`%${req.query.localidade}%`);
  }

  if (req.query.usuario) {
    filtros.push("USUARIO LIKE ?");
    params.push(`%${req.query.usuario}%`);
  }

  if (req.query.patrimonio) {
    filtros.push("PATRIMONIO LIKE ?");
    params.push(`%${req.query.patrimonio}%`);
  }

  if (req.query.contrato) {
    filtros.push("CONTRATO LIKE ?");
    params.push(`%${req.query.contrato}%`);
  }

  if (req.query.serial) {
    filtros.push("SERIAL LIKE ?");
    params.push(`%${req.query.serial}%`);
  }

  const colunasPermitidas = [
    "CODIGO",
    "NOME",
    "STATUS",
    "TIPO",
    "LOCALIDADE",
    "USUARIO",
    "PATRIMONIO",
    "CONTRATO",
    "SERIAL"
  ];

  const ordenarPor = colunasPermitidas.includes(req.query.ordenarPor)
    ? req.query.ordenarPor
    : "NOME";

  const direcao = req.query.direcao === "DESC" ? "DESC" : "ASC";

  return {
    whereExtra: filtros.length ? " AND " + filtros.join(" AND ") : "",
    params,
    orderBy: ` ORDER BY ${ordenarPor} ${direcao}`
  };
}

/* =========================
   LOGIN
========================= */

app.post("/api/login", async (req, res) => {
  try {
    const { login, senha } = req.body;

    if (!login || !senha) {
      return res.status(400).json({ erro: "login e senha são obrigatórios" });
    }

    const [rows] = await pool.query(
      `
      SELECT USUARIO_ID, NOME, LOGIN, SENHA
      FROM glpi_usuarios_sist
      WHERE LOGIN = ? AND ATIVO = 1
      LIMIT 1
      `,
      [login]
    );

    if (rows.length === 0) {
      return res.status(401).json({ erro: "Usuário ou senha inválidos" });
    }

    const usuario = rows[0];
    const senhaValida = await verificarSenha(senha, usuario.SENHA);

    if (!senhaValida) {
      return res.status(401).json({ erro: "Usuário ou senha inválidos" });
    }

    return res.json({
      mensagem: "Login OK",
      user: {
        id: usuario.USUARIO_ID,
        nome: usuario.NOME,
        login: usuario.LOGIN,
      },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({ erro: "Erro no login" });
  }
});

/* =========================
   EXEMPLO DE CRIAÇÃO DE USUÁRIO
   (use se precisar cadastrar)
========================= */

app.post("/api/usuarios", async (req, res) => {
  try {
    const { nome, login, senha } = req.body;

    if (!nome || !login || !senha) {
      return res.status(400).json({ erro: "nome, login e senha são obrigatórios" });
    }

    const senhaHash = await gerarHashSenha(senha);

    await pool.query(
      `
      INSERT INTO glpi_usuarios_sist (NOME, LOGIN, SENHA, ATIVO)
      VALUES (?, ?, ?, 1)
      `,
      [nome, login, senhaHash]
    );

    res.json({ mensagem: "Usuário criado com sucesso" });
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    res.status(500).json({ erro: "Erro ao criar usuário" });
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
      SELECT CODIGO, NOME, STATUS, TIPO, LOCALIDADE, USUARIO, MODELO, SERIAL, FABRICANTE
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

    if (req.query.modelo) {
      sql += " AND MODELO LIKE ?";
      params.push(`%${req.query.modelo}%`);
    }

    if (req.query.serial) {
      sql += " AND SERIAL LIKE ?";
      params.push(`%${req.query.serial}%`);
    }

    if (req.query.fabricante && req.query.fabricante !== "Fabricantes") {
      sql += " AND FABRICANTE LIKE ?";
      params.push(`%${req.query.fabricante}%`);
    }

    if (req.query.status && req.query.status !== "Status") {
      sql += " AND STATUS LIKE ?";
      params.push(`%${req.query.status}%`);
    }

    if (req.query.tipo && req.query.tipo !== "Tipo") {
      sql += " AND TIPO LIKE ?";
      params.push(`%${req.query.tipo}%`);
    }

    if (req.query.localidade && req.query.localidade !== "Localidade") {
      sql += " AND LOCALIDADE LIKE ?";
      params.push(`%${req.query.localidade}%`);
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
    const { novoStatus, novaLocalidade, comentario, usuarioId } = req.body;

    if (!tipoTela) {
      return res.status(400).json({ erro: "tipoTela é obrigatório" });
    }

    if (!usuarioId) {
      return res.status(400).json({ erro: "usuarioId é obrigatório (login)" });
    }

    const tabela = getTableByTipo(tipoTela);

    const [dadosAtuais] = await pool.query(
      `SELECT states_id, locations_id FROM ${tabela} WHERE id = ?`,
      [codigo]
    );

    if (dadosAtuais.length === 0) {
      return res.status(404).json({ erro: "Ativo não encontrado" });
    }

    const statusAntigo = dadosAtuais[0].states_id;
    const localAntigo = dadosAtuais[0].locations_id;

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

    const sqlUpdate = `
      UPDATE ${tabela}
      SET ${camposAlterados.map(c => `${c.campoBanco} = ?`).join(", ")}
      WHERE id = ?
    `;

    const valores = camposAlterados.map(c => c.novo);
    await pool.query(sqlUpdate, [...valores, codigo]);

    const usuarioNome = await buscarUsuario(usuarioId);
    const codigoTransferencia = await gerarCodigoIdentificacao();

    for (const campo of camposAlterados) {
      const comentarioFinal =
        `${comentario || ""} Código de transferência ${codigoTransferencia}`.trim();

      const valorAntigoDescricao = await descreverValorCampo(
        campo.campoOriginal,
        campo.antigo
      );

      const valorNovoDescricao = await descreverValorCampo(
        campo.campoOriginal,
        campo.novo
      );

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
          descreverNomeCampo(campo.campoOriginal),
          valorAntigoDescricao,
          valorNovoDescricao,
          usuarioId,
          usuarioNome,
          "TRANSFERENCIA",
          comentarioFinal,
          codigoTransferencia,
        ]
      );
    }

    res.json({
      mensagem: "Transferência realizada com sucesso",
      codigoTransferencia,
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

    const mapaCampos = {
      COD_STATUS: "states_id",
      COD_LOCALIDADE: "locations_id",
      USUARIO: "contact",
      SERIAL: "serial",
      PATRIMONIO: "otherserial",
    };

    const [rows] = await pool.query(
      `SELECT * FROM ${view} WHERE CODIGO = ?`,
      [codigo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Registro não encontrado" });
    }

    const dadosAtuais = rows[0];

    const [dadosTabelaReal] = await pool.query(
      `SELECT id, states_id, locations_id, contact, serial, otherserial
       FROM ${tabela}
       WHERE id = ?`,
      [codigo]
    );

    if (dadosTabelaReal.length === 0) {
      return res.status(404).json({ erro: "Registro não encontrado na tabela real" });
    }

    const atualReal = dadosTabelaReal[0];

    const camposAlterados = [];

    const camposIgnorados = [
      "STATUS",
      "TIPO",
      "LOCALIDADE",
      "INCLUSAO_GLPI",
      "ULTIMA_CONEXAO",
    ];

    for (const campo in dadosNovos) {
      if (
        campo === "CODIGO" ||
        campo === "usuarioId" ||
        camposIgnorados.includes(campo)
      ) {
        continue;
      }

      if (campo === "COD_STATUS") {
        const antigoId = atualReal.states_id;
        const novoId = dadosNovos[campo];

        if (Number(antigoId) !== Number(novoId)) {
          camposAlterados.push({
            campoOriginal: "COD_STATUS",
            campoBanco: "states_id",
            antigo: await descreverValorCampo("COD_STATUS", antigoId),
            novo: await descreverValorCampo("COD_STATUS", novoId),
            novoValorBanco: novoId
          });
        }

        continue;
      }

      if (campo === "COD_LOCALIDADE") {
        const antigoId = atualReal.locations_id;
        const novoId = dadosNovos[campo];

        if (Number(antigoId) !== Number(novoId)) {
          camposAlterados.push({
            campoOriginal: "COD_LOCALIDADE",
            campoBanco: "locations_id",
            antigo: await descreverValorCampo("COD_LOCALIDADE", antigoId),
            novo: await descreverValorCampo("COD_LOCALIDADE", novoId),
            novoValorBanco: novoId
          });
        }

        continue;
      }

      const campoReal = mapaCampos[campo] || campo;
      const valorAtual = atualReal[campoReal] ?? dadosAtuais[campo];
      const valorNovo = dadosNovos[campo];

      if (String(valorAtual ?? "") !== String(valorNovo ?? "")) {
        camposAlterados.push({
          campoOriginal: campo,
          campoBanco: campoReal,
          antigo: valorAtual ?? "",
          novo: valorNovo ?? "",
          novoValorBanco: valorNovo
        });
      }
    }

    if (camposAlterados.length === 0) {
      return res.json({ mensagem: "Nenhuma alteração detectada" });
    }

    const sqlUpdate = `
      UPDATE ${tabela}
      SET ${camposAlterados.map(c => `${c.campoBanco} = ?`).join(", ")}
      WHERE id = ?
    `;

    await pool.query(
      sqlUpdate,
      [...camposAlterados.map(c => c.novoValorBanco), codigo]
    );

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
          descreverNomeCampo(campo.campoOriginal),
          campo.antigo,
          campo.novo,
          usuarioId,
          usuarioNome,
          "ALTERACAO",
          "Alteração via sistema",
          null
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

/* =========================
   RELATÓRIO DE LOGS
========================= */

app.get("/api/relatorios", async (req, res) => {
  try {
    let sql = `
      SELECT 
        l.CODIGO,
        l.TIPO_ATIVO,
        l.CAMPO_ALTERADO,
        l.VALOR_ANTIGO,
        l.VALOR_NOVO,
        l.USUARIO_NOME,
        l.TIPO_OPERACAO,
        l.COMENTARIO,
        l.COD_IDENTIFICACAO,

        COALESCE(vc.FABRICANTE, vi.FABRICANTE, vco.FABRICANTE) AS FABRICANTE,
        COALESCE(vc.SERIAL, vi.SERIAL, vco.SERIAL) AS SERIAL

      FROM glpisv_glpi.glpi_log_alteracoes_sist l

      LEFT JOIN V_COMPUTADORES_GSV vc
        ON l.TIPO_ATIVO = 'produtos'
       AND vc.CODIGO = l.CODIGO

      LEFT JOIN V_IMPRESSORAS_GSV vi
        ON l.TIPO_ATIVO = 'impressoras'
       AND vi.CODIGO = l.CODIGO

      LEFT JOIN V_COLETORES_GSV vco
        ON l.TIPO_ATIVO = 'coletores'
       AND vco.CODIGO = l.CODIGO

      WHERE 1=1
    `;

    const params = [];

    if (req.query.codigo) {
      sql += " AND CAST(l.CODIGO AS CHAR) LIKE ?";
      params.push(`%${req.query.codigo}%`);
    }

    if (req.query.tipoAtivo) {
      sql += " AND l.TIPO_ATIVO LIKE ?";
      params.push(`%${req.query.tipoAtivo}%`);
    }

    if (req.query.campoAlterado) {
      sql += " AND l.CAMPO_ALTERADO LIKE ?";
      params.push(`%${req.query.campoAlterado}%`);
    }

    if (req.query.usuario) {
      sql += " AND l.USUARIO_NOME LIKE ?";
      params.push(`%${req.query.usuario}%`);
    }

    if (req.query.tipoOperacao) {
      sql += " AND l.TIPO_OPERACAO LIKE ?";
      params.push(`%${req.query.tipoOperacao}%`);
    }

    if (req.query.codIdentificacao) {
      sql += " AND CAST(l.COD_IDENTIFICACAO AS CHAR) LIKE ?";
      params.push(`%${req.query.codIdentificacao}%`);
    }

    const mapaOrdenacao = {
      CODIGO: "l.CODIGO",
      TIPO_ATIVO: "l.TIPO_ATIVO",
      CAMPO_ALTERADO: "l.CAMPO_ALTERADO",
      VALOR_ANTIGO: "l.VALOR_ANTIGO",
      VALOR_NOVO: "l.VALOR_NOVO",
      USUARIO_NOME: "l.USUARIO_NOME",
      TIPO_OPERACAO: "l.TIPO_OPERACAO",
      COD_IDENTIFICACAO: "l.COD_IDENTIFICACAO",
      FABRICANTE: "FABRICANTE",
      SERIAL: "SERIAL"
    };

    const ordenarPor = mapaOrdenacao[req.query.ordenarPor] || "l.COD_IDENTIFICACAO";
    const direcao = req.query.direcao === "ASC" ? "ASC" : "DESC";

    sql += ` ORDER BY ${ordenarPor} ${direcao}`;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar relatórios:", err);
    res.status(500).json({ erro: "Erro ao buscar relatórios" });
  }
});

/* =========================
   RELATÓRIOS (ATIVOS)
========================= */

app.get("/api/relatorios/sem-patrimonio", async (req, res) => {
  try {
    const { tipoTela } = req.query;
    if (!tipoTela) {
      return res.status(400).json({ erro: "tipoTela é obrigatório" });
    }

    const view = getViewByTipo(tipoTela);
    const { whereExtra, params, orderBy } = montarFiltrosRelatorio(req);

    const [rows] = await pool.query(
      `
      SELECT CODIGO, NOME, STATUS, TIPO, LOCALIDADE, USUARIO, PATRIMONIO, CONTRATO, SERIAL
      FROM ${view}
      WHERE (PATRIMONIO IS NULL OR TRIM(PATRIMONIO) = "")
      ${whereExtra}
      ${orderBy}
      `,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: err.message });
  }
});

app.get("/api/relatorios/sem-contrato", async (req, res) => {
  try {
    const { tipoTela } = req.query;
    if (!tipoTela) {
      return res.status(400).json({ erro: "tipoTela é obrigatório" });
    }

    const view = getViewByTipo(tipoTela);
    const { whereExtra, params, orderBy } = montarFiltrosRelatorio(req);

    const [rows] = await pool.query(
      `
      SELECT CODIGO, NOME, STATUS, TIPO, LOCALIDADE, USUARIO, PATRIMONIO, CONTRATO, SERIAL
      FROM ${view}
      WHERE (CONTRATO IS NULL OR TRIM(CONTRATO) = "")
      ${whereExtra}
      ${orderBy}
      `,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: err.message });
  }
});

app.get("/api/relatorios/com-contrato", async (req, res) => {
  try {
    const { tipoTela } = req.query;
    if (!tipoTela) {
      return res.status(400).json({ erro: "tipoTela é obrigatório" });
    }

    const view = getViewByTipo(tipoTela);
    const { whereExtra, params, orderBy } = montarFiltrosRelatorio(req);

    const [rows] = await pool.query(
      `
      SELECT CODIGO, NOME, STATUS, TIPO, LOCALIDADE, USUARIO, PATRIMONIO, CONTRATO, SERIAL
      FROM ${view}
      WHERE (CONTRATO IS NOT NULL AND TRIM(CONTRATO) <> "")
      ${whereExtra}
      ${orderBy}
      `,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: err.message });
  }
});

app.listen(3001, () => {
  console.log("API MySQL rodando na porta 3001");
});