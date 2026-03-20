const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const path = require("path");
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

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.office365.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* =========================
   FUNÇÕES AUXILIARES
========================= */

function gerarSenhaProvisoria(tamanho = 8) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#";
  let senha = "";

  for (let i = 0; i < tamanho; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return senha;
}

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
  const t = String(tipo || "").toLowerCase();

  if (t === "impressoras") return "V_IMPRESSORAS_GSV";
  if (t === "coletores") return "V_COLETORES_GSV";
  return "V_COMPUTADORES_GSV";
}

function getTableByTipo(tipo) {
  const t = String(tipo || "").toLowerCase();

  if (t === "impressoras") return "glpi_printers";
  if (t === "coletores") return "glpi_phones";
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
    filtros.push("UPPER(COALESCE(NOME, '')) LIKE ?");
    params.push(`%${String(req.query.nome).toUpperCase()}%`);
  }

  if (req.query.status) {
    filtros.push("UPPER(COALESCE(STATUS, '')) LIKE ?");
    params.push(`%${String(req.query.status).toUpperCase()}%`);
  }

  if (req.query.tipo) {
    filtros.push("UPPER(COALESCE(TIPO, '')) LIKE ?");
    params.push(`%${String(req.query.tipo).toUpperCase()}%`);
  }

  if (req.query.localidade) {
    filtros.push("UPPER(COALESCE(LOCALIDADE, '')) LIKE ?");
    params.push(`%${String(req.query.localidade).toUpperCase()}%`);
  }

  if (req.query.usuario) {
    filtros.push("UPPER(COALESCE(USUARIO, '')) LIKE ?");
    params.push(`%${String(req.query.usuario).toUpperCase()}%`);
  }

  if (req.query.patrimonio) {
    filtros.push("UPPER(COALESCE(PATRIMONIO, '')) LIKE ?");
    params.push(`%${String(req.query.patrimonio).toUpperCase()}%`);
  }

  if (req.query.contrato) {
    filtros.push("UPPER(COALESCE(CONTRATO, '')) LIKE ?");
    params.push(`%${String(req.query.contrato).toUpperCase()}%`);
  }

  if (req.query.serial) {
    filtros.push("UPPER(COALESCE(SERIAL, '')) LIKE ?");
    params.push(`%${String(req.query.serial).toUpperCase()}%`);
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
    "SERIAL",
  ];

  const ordenarPor = colunasPermitidas.includes(req.query.ordenarPor)
    ? req.query.ordenarPor
    : "NOME";

  const direcao = req.query.direcao === "DESC" ? "DESC" : "ASC";

  return {
    whereExtra: filtros.length ? " AND " + filtros.join(" AND ") : "",
    params,
    orderBy: ` ORDER BY ${ordenarPor} ${direcao}`,
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
   CRIAÇÃO DE USUÁRIO
========================= */

app.post("/api/usuarios", async (req, res) => {
  try {
    const { nome, login, senha } = req.body;

    if (!nome || !login || !senha) {
      return res
        .status(400)
        .json({ erro: "nome, login e senha são obrigatórios" });
    }

    const [existe] = await pool.query(
      `
      SELECT USUARIO_ID
      FROM glpi_usuarios_sist
      WHERE LOGIN = ?
      LIMIT 1
      `,
      [login]
    );

    if (existe.length > 0) {
      return res
        .status(400)
        .json({ erro: "Já existe um usuário com esse login" });
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
   ESQUECI MINHA SENHA
========================= */

app.post("/api/esqueci-senha", async (req, res) => {
  try {
    const { loginOuEmail } = req.body;

    if (!loginOuEmail) {
      return res.status(400).json({ erro: "Informe seu e-mail" });
    }

    const [rows] = await pool.query(
      `
      SELECT USUARIO_ID, NOME, LOGIN, ATIVO
      FROM glpi_usuarios_sist
      WHERE LOGIN = ?
      LIMIT 1
      `,
      [loginOuEmail]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const usuario = rows[0];

    if (Number(usuario.ATIVO) !== 1) {
      return res.status(400).json({ erro: "Usuário inativo" });
    }

    const senhaProvisoria = gerarSenhaProvisoria(8);
    const senhaHash = await gerarHashSenha(senhaProvisoria);

    await pool.query(
      `
      UPDATE glpi_usuarios_sist
      SET SENHA = ?
      WHERE USUARIO_ID = ?
      `,
      [senhaHash, usuario.USUARIO_ID]
    );

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: usuario.LOGIN,
      subject: "Nova senha provisória - Sistema de Ativos",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
          <p>Olá, ${usuario.NOME || "usuário"}.</p>
          <p>Foi solicitada a redefinição da sua senha no <strong>Sistema de Ativos</strong>.</p>
          <p>Sua nova senha provisória é:</p>
          <p style="font-size: 18px; font-weight: bold;">${senhaProvisoria}</p>
          <p>Entre no sistema com essa senha e altere em seguida na opção <strong>Alterar Senha</strong>.</p>
          <p>Se você não solicitou essa alteração, entre em contato com o suporte.</p>
        </div>
      `,
    });

    return res.json({
      mensagem: "Senha provisória enviada com sucesso por e-mail",
    });
  } catch (err) {
    console.error("Erro ao recuperar senha:", err);
    return res.status(500).json({
      erro: "Erro ao enviar senha provisória",
      detalhe: err.message,
    });
  }
});

/* =========================
   ALTERAR MINHA SENHA
========================= */

app.put("/api/minha-senha", async (req, res) => {
  try {
    const { usuarioId, senhaAtual, novaSenha, confirmarNovaSenha } = req.body;

    if (!usuarioId || !senhaAtual || !novaSenha || !confirmarNovaSenha) {
      return res.status(400).json({
        erro:
          "usuarioId, senhaAtual, novaSenha e confirmarNovaSenha são obrigatórios",
      });
    }

    if (novaSenha !== confirmarNovaSenha) {
      return res
        .status(400)
        .json({ erro: "A confirmação da nova senha não confere" });
    }

    if (String(novaSenha).length < 6) {
      return res
        .status(400)
        .json({ erro: "A nova senha deve ter pelo menos 6 caracteres" });
    }

    const [rows] = await pool.query(
      `
      SELECT USUARIO_ID, SENHA
      FROM glpi_usuarios_sist
      WHERE USUARIO_ID = ? AND ATIVO = 1
      LIMIT 1
      `,
      [usuarioId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const usuario = rows[0];
    const senhaValida = await verificarSenha(senhaAtual, usuario.SENHA);

    if (!senhaValida) {
      return res.status(401).json({ erro: "Senha atual inválida" });
    }

    const novoHash = await gerarHashSenha(novaSenha);

    await pool.query(
      `
      UPDATE glpi_usuarios_sist
      SET SENHA = ?
      WHERE USUARIO_ID = ?
      `,
      [novoHash, usuarioId]
    );

    return res.json({ mensagem: "Senha alterada com sucesso" });
  } catch (err) {
    console.error("Erro ao alterar senha:", err);
    return res.status(500).json({ erro: "Erro ao alterar senha" });
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

    if (req.query.codigo) {
      sql += " AND CAST(CODIGO AS CHAR) LIKE ?";
      params.push(`%${req.query.codigo}%`);
    }

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

    if (req.query.fabricante) {
      sql += " AND FABRICANTE LIKE ?";
      params.push(`%${req.query.fabricante}%`);
    }

    if (req.query.status) {
      sql += " AND STATUS LIKE ?";
      params.push(`%${req.query.status}%`);
    }

    if (req.query.tipo) {
      sql += " AND TIPO LIKE ?";
      params.push(`%${req.query.tipo}%`);
    }

    if (req.query.localidade) {
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
      return res.status(400).json({ erro: "usuarioId é obrigatório" });
    }

    const tipoNormalizado = String(tipoTela).toLowerCase();
    const tabela = getTableByTipo(tipoTela);

    let dadosAtuais;

    if (tipoNormalizado === "computadores") {
      [dadosAtuais] = await pool.query(
        `
        SELECT
          gc.states_id,
          gc.locations_id,
          gc.otherserial,
          gci.contracts_id
        FROM glpi_computers gc
        LEFT JOIN glpi_contracts_items gci
          ON gci.items_id = gc.id
         AND gci.itemtype = 'Computer'
        WHERE gc.id = ?
        LIMIT 1
        `,
        [codigo]
      );
    } else {
      [dadosAtuais] = await pool.query(
        `
        SELECT
          states_id,
          locations_id,
          otherserial
        FROM ${tabela}
        WHERE id = ?
        LIMIT 1
        `,
        [codigo]
      );
    }

    if (dadosAtuais.length === 0) {
      return res.status(404).json({ erro: "Ativo não encontrado" });
    }

    const statusAntigo = dadosAtuais[0].states_id;
    const localAntigo = dadosAtuais[0].locations_id;
    const patrimonioAtual = dadosAtuais[0].otherserial;
    const contratoAtual = dadosAtuais[0].contracts_id;

    const semPatrimonio =
      !patrimonioAtual || String(patrimonioAtual).trim() === "";

    const semContrato =
      !contratoAtual || String(contratoAtual).trim() === "";

    if (tipoNormalizado === "computadores") {
      if (semPatrimonio && semContrato) {
        return res.status(400).json({
          erro: "Item precisa ter patrimônio ou contrato para ser transferido",
        });
      }
    } else {
      if (semPatrimonio) {
        return res.status(400).json({
          erro: "Não é permitido transferir item sem patrimônio preenchido",
        });
      }
    }

    const camposAlterados = [];

    if (novoStatus && Number(novoStatus) !== Number(statusAntigo)) {
      camposAlterados.push({
        campoOriginal: "COD_STATUS",
        campoBanco: "states_id",
        antigo: statusAntigo,
        novo: novoStatus,
      });
    }

    if (novaLocalidade && Number(novaLocalidade) !== Number(localAntigo)) {
      camposAlterados.push({
        campoOriginal: "COD_LOCALIDADE",
        campoBanco: "locations_id",
        antigo: localAntigo,
        novo: novaLocalidade,
      });
    }

    if (camposAlterados.length === 0) {
      return res.json({ mensagem: "Nenhuma alteração detectada" });
    }

    const sqlUpdate = `
      UPDATE ${tabela}
      SET ${camposAlterados.map((c) => `${c.campoBanco} = ?`).join(", ")}
      WHERE id = ?
    `;

    const valores = camposAlterados.map((c) => c.novo);
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

    const [rows] = await pool.query(`SELECT * FROM ${view} WHERE CODIGO = ?`, [codigo]);

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

    const [rows] = await pool.query(`SELECT * FROM ${view} WHERE CODIGO = ?`, [codigo]);

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
      return res
        .status(404)
        .json({ erro: "Registro não encontrado na tabela real" });
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
            novoValorBanco: novoId,
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
            novoValorBanco: novoId,
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
          novoValorBanco: valorNovo,
        });
      }
    }

    if (camposAlterados.length === 0) {
      return res.json({ mensagem: "Nenhuma alteração detectada" });
    }

    const sqlUpdate = `
      UPDATE ${tabela}
      SET ${camposAlterados.map((c) => `${c.campoBanco} = ?`).join(", ")}
      WHERE id = ?
    `;

    await pool.query(
      sqlUpdate,
      [...camposAlterados.map((c) => c.novoValorBanco), codigo]
    );

    const { usuarioId } = req.body;

    if (!usuarioId) {
      return res.status(400).json({ erro: "usuarioId é obrigatório" });
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
          null,
        ]
      );
    }

    res.json({
      mensagem: "Atualizado com sucesso e log registrado",
    });
  } catch (err) {
    console.error("Erro na alteração:", err);
    res.status(500).json({ erro: err.message });
  }
});

/* =========================
   RELATÓRIO DE LOGS / TRANSFERÊNCIAS
========================= */

app.get("/api/relatorios", async (req, res) => {
  try {
    let sql = `
      SELECT
        UPPER(COALESCE(CAST(l.CODIGO AS CHAR), '')) AS CODIGO,
        l.DATA_ALTERACAO,
        UPPER(COALESCE(l.TIPO_ATIVO, '')) AS TIPO_ATIVO,
        UPPER(COALESCE(l.CAMPO_ALTERADO, '')) AS CAMPO_ALTERADO,
        UPPER(COALESCE(l.VALOR_ANTIGO, '')) AS VALOR_ANTIGO,
        UPPER(COALESCE(l.VALOR_NOVO, '')) AS VALOR_NOVO,
        UPPER(COALESCE(l.USUARIO_NOME, '')) AS USUARIO_NOME,
        UPPER(COALESCE(l.TIPO_OPERACAO, '')) AS TIPO_OPERACAO,
        UPPER(COALESCE(l.COMENTARIO, '')) AS COMENTARIO,
        UPPER(COALESCE(CAST(l.COD_IDENTIFICACAO AS CHAR), '')) AS COD_IDENTIFICACAO,
        UPPER(COALESCE(vc.FABRICANTE, vi.FABRICANTE, vco.FABRICANTE, '')) AS FABRICANTE,
        UPPER(COALESCE(vc.SERIAL, vi.SERIAL, vco.SERIAL, '')) AS SERIAL,
        UPPER(COALESCE(vc.PATRIMONIO, vi.PATRIMONIO, vco.PATRIMONIO, '')) AS PATRIMONIO
      FROM glpisv_glpi.glpi_log_alteracoes_sist l
      LEFT JOIN V_COMPUTADORES_GSV vc
        ON LOWER(l.TIPO_ATIVO) = 'computadores'
       AND vc.CODIGO = l.CODIGO
      LEFT JOIN V_IMPRESSORAS_GSV vi
        ON LOWER(l.TIPO_ATIVO) = 'impressoras'
       AND vi.CODIGO = l.CODIGO
      LEFT JOIN V_COLETORES_GSV vco
        ON LOWER(l.TIPO_ATIVO) = 'coletores'
       AND vco.CODIGO = l.CODIGO
      WHERE 1=1
    `;

    const params = [];

    if (req.query.codigo) {
      sql += " AND UPPER(CAST(l.CODIGO AS CHAR)) LIKE ?";
      params.push(`%${String(req.query.codigo).toUpperCase()}%`);
    }

    if (req.query.tipoAtivo) {
      sql += " AND UPPER(COALESCE(l.TIPO_ATIVO, '')) LIKE ?";
      params.push(`%${String(req.query.tipoAtivo).toUpperCase()}%`);
    }

    if (req.query.campoAlterado) {
      sql += " AND UPPER(COALESCE(l.CAMPO_ALTERADO, '')) LIKE ?";
      params.push(`%${String(req.query.campoAlterado).toUpperCase()}%`);
    }

    if (req.query.usuario) {
      sql += " AND UPPER(COALESCE(l.USUARIO_NOME, '')) LIKE ?";
      params.push(`%${String(req.query.usuario).toUpperCase()}%`);
    }

    if (req.query.tipoOperacao) {
      sql += " AND UPPER(COALESCE(l.TIPO_OPERACAO, '')) LIKE ?";
      params.push(`%${String(req.query.tipoOperacao).toUpperCase()}%`);
    }

    if (req.query.codIdentificacao) {
      sql += " AND UPPER(CAST(l.COD_IDENTIFICACAO AS CHAR)) LIKE ?";
      params.push(`%${String(req.query.codIdentificacao).toUpperCase()}%`);
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
      SERIAL: "SERIAL",
      DATA_ALTERACAO: "l.DATA_ALTERACAO",
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
      SELECT
        UPPER(COALESCE(CAST(CODIGO AS CHAR), '')) AS CODIGO,
        UPPER(COALESCE(NOME, '')) AS NOME,
        UPPER(COALESCE(STATUS, '')) AS STATUS,
        UPPER(COALESCE(TIPO, '')) AS TIPO,
        UPPER(COALESCE(LOCALIDADE, '')) AS LOCALIDADE,
        UPPER(COALESCE(USUARIO, '')) AS USUARIO,
        UPPER(COALESCE(PATRIMONIO, '')) AS PATRIMONIO,
        UPPER(COALESCE(CONTRATO, '')) AS CONTRATO,
        UPPER(COALESCE(SERIAL, '')) AS SERIAL
      FROM ${view}
      WHERE (PATRIMONIO IS NULL OR TRIM(PATRIMONIO) = '')
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
      SELECT
        UPPER(COALESCE(CAST(CODIGO AS CHAR), '')) AS CODIGO,
        UPPER(COALESCE(NOME, '')) AS NOME,
        UPPER(COALESCE(STATUS, '')) AS STATUS,
        UPPER(COALESCE(TIPO, '')) AS TIPO,
        UPPER(COALESCE(LOCALIDADE, '')) AS LOCALIDADE,
        UPPER(COALESCE(USUARIO, '')) AS USUARIO,
        UPPER(COALESCE(PATRIMONIO, '')) AS PATRIMONIO,
        UPPER(COALESCE(CONTRATO, '')) AS CONTRATO,
        UPPER(COALESCE(SERIAL, '')) AS SERIAL
      FROM ${view}
      WHERE (CONTRATO IS NULL OR TRIM(CONTRATO) = '')
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
      SELECT
        UPPER(COALESCE(CAST(CODIGO AS CHAR), '')) AS CODIGO,
        UPPER(COALESCE(NOME, '')) AS NOME,
        UPPER(COALESCE(STATUS, '')) AS STATUS,
        UPPER(COALESCE(TIPO, '')) AS TIPO,
        UPPER(COALESCE(LOCALIDADE, '')) AS LOCALIDADE,
        UPPER(COALESCE(USUARIO, '')) AS USUARIO,
        UPPER(COALESCE(PATRIMONIO, '')) AS PATRIMONIO,
        UPPER(COALESCE(CONTRATO, '')) AS CONTRATO,
        UPPER(COALESCE(SERIAL, '')) AS SERIAL
      FROM ${view}
      WHERE (CONTRATO IS NOT NULL AND TRIM(CONTRATO) <> '')
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

/* =========================
   SERVIR FRONTEND REACT
========================= */

app.use(express.static(path.join(__dirname, "build")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(3001, () => {
  console.log("API MySQL rodando na porta 3001");
});