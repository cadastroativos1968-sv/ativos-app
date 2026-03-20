import { useState, useEffect, useCallback } from "react";
import "./App.css";
import * as XLSX from "xlsx";

const DADOS_INICIAIS = {
  CODIGO: "",
  NOME: "",
  STATUS: "",
  COD_STATUS: "",
  COD_TIPO: "",
  COD_LOCALIDADE: "",
  TIPO: "",
  USUARIO: "",
  LOCALIDADE: "",
  PATRIMONIO: "",
  SERIAL: "",
  FABRICANTE: "",
  MODELO: "",
  PROCESSADOR: "",
  SISTEMA_OPERACIONAL: "",
  CONTRATO: "",
  INCLUSAO_GLPI: "",
  ULTIMA_CONEXAO: "",
  LINHA: "",
};

function gerarTimestampArquivo() {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, "0");
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const ano = String(agora.getFullYear()).slice(-2);
  const hora = String(agora.getHours()).padStart(2, "0");
  const minuto = String(agora.getMinutes()).padStart(2, "0");
  const segundo = String(agora.getSeconds()).padStart(2, "0");
  return `${dia}${mes}${ano}${hora}${minuto}${segundo}`;
}

function Login({ onLogin }) {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");

  const [modoCadastro, setModoCadastro] = useState(false);
  const [nomeCadastro, setNomeCadastro] = useState("");
  const [loginCadastro, setLoginCadastro] = useState("");
  const [senhaCadastro, setSenhaCadastro] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [modoEsqueciSenha, setModoEsqueciSenha] = useState(false);
  const [loginOuEmail, setLoginOuEmail] = useState("");

  async function criarUsuario() {
    try {
      if (!nomeCadastro || !loginCadastro || !senhaCadastro || !confirmarSenha) {
        alert("Preencha todos os campos");
        return;
      }

      if (senhaCadastro !== confirmarSenha) {
        alert("As senhas não conferem");
        return;
      }

      const resp = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nomeCadastro,
          login: loginCadastro,
          senha: senhaCadastro,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        alert(data.erro || "Erro ao criar usuário");
        return;
      }

      alert("Usuário criado com sucesso!");
      setModoCadastro(false);
      setNomeCadastro("");
      setLoginCadastro("");
      setSenhaCadastro("");
      setConfirmarSenha("");
    } catch (error) {
      console.error(error);
      alert("Erro ao criar usuário");
    }
  }

  async function recuperarSenha() {
    try {
      if (!loginOuEmail) {
        alert("Informe seu e-mail");
        return;
      }

      const resp = await fetch("/api/esqueci-senha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ loginOuEmail }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        alert(data.detalhe || data.erro || "Erro ao recuperar senha");
        return;
      }

      alert("Uma senha provisória foi enviada para seu e-mail.");
      setModoEsqueciSenha(false);
      setLoginOuEmail("");
    } catch (error) {
      console.error(error);
      alert("Erro ao recuperar senha");
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-shape login-bg-shape-1"></div>
      <div className="login-bg-shape login-bg-shape-2"></div>

      <div className="login-card">
        <div className="login-brand">
          <div>
            <h1>Sistema de Ativos</h1>
            <p>Controle, movimentação e rastreabilidade dos equipamentos</p>
          </div>
        </div>

        {!modoCadastro && !modoEsqueciSenha ? (
          <>
            <div className="campo-login">
              <label>E-mail</label>
              <input
                placeholder="Digite seu e-mail"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </div>

            <div className="campo-login">
              <label>Senha</label>
              <input
                placeholder="Digite sua senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={() => onLogin(login, senha)}
            >
              Entrar
            </button>

            <div className="login-actions-stack">
              <button
                className="btn btn-secondary btn-block"
                onClick={() => setModoCadastro(true)}
              >
                Criar usuário
              </button>

              <button
                className="btn btn-ghost btn-block"
                onClick={() => setModoEsqueciSenha(true)}
              >
                Esqueci minha senha
              </button>
            </div>
          </>
        ) : modoCadastro ? (
          <>
            <div className="login-section-header">
              <h2>Criar usuário</h2>
              <span>Cadastre um novo acesso ao sistema</span>
            </div>

            <div className="campo-login">
              <label>Nome</label>
              <input
                placeholder="Nome completo"
                value={nomeCadastro}
                onChange={(e) => setNomeCadastro(e.target.value)}
              />
            </div>

            <div className="campo-login">
              <label>E-mail</label>
              <input
                placeholder="Digite o e-mail"
                value={loginCadastro}
                onChange={(e) => setLoginCadastro(e.target.value)}
              />
            </div>

            <div className="campo-login">
              <label>Senha</label>
              <input
                placeholder="Defina uma senha"
                type="password"
                value={senhaCadastro}
                onChange={(e) => setSenhaCadastro(e.target.value)}
              />
            </div>

            <div className="campo-login">
              <label>Confirmar senha</label>
              <input
                placeholder="Repita a senha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />
            </div>

            <button className="btn btn-primary btn-block" onClick={criarUsuario}>
              Cadastrar
            </button>

            <button
              className="btn btn-secondary btn-block"
              onClick={() => setModoCadastro(false)}
            >
              Voltar para login
            </button>
          </>
        ) : (
          <>
            <div className="login-section-header">
              <h2>Recuperar senha</h2>
              <span>Enviaremos uma senha provisória para o e-mail informado</span>
            </div>

            <div className="campo-login">
              <label>E-mail</label>
              <input
                placeholder="Informe seu e-mail"
                value={loginOuEmail}
                onChange={(e) => setLoginOuEmail(e.target.value)}
              />
            </div>

            <button className="btn btn-primary btn-block" onClick={recuperarSenha}>
              Enviar senha provisória
            </button>

            <button
              className="btn btn-secondary btn-block"
              onClick={() => setModoEsqueciSenha(false)}
            >
              Voltar para login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Menu({ setTela, setTipoAtual, logout, limparDadosAtivos }) {
  function trocarTela(tipo) {
    limparDadosAtivos();
    setTipoAtual(tipo);
    setTela(tipo);
  }

  return (
    <aside className="menu-lateral">
      <div className="menu-topo">
        <div className="menu-titulos">
          <strong>Controle de Ativos</strong>
          <span>Painel operacional</span>
        </div>
      </div>

      <div className="menu-grupo">
        <button className="menu-botao" onClick={() => trocarTela("Computadores")}>
          <span className="menu-icone">💻</span>
          <span>Computadores</span>
        </button>

        <button className="menu-botao" onClick={() => trocarTela("Impressoras")}>
          <span className="menu-icone">🖨️</span>
          <span>Impressoras</span>
        </button>

        <button className="menu-botao" onClick={() => trocarTela("Coletores")}>
          <span className="menu-icone">📱</span>
          <span>Coletores e Celulares</span>
        </button>

        <button className="menu-botao" onClick={() => setTela("relatorios")}>
          <span className="menu-icone">📊</span>
          <span>Relatórios</span>
        </button>

        <button className="menu-botao" onClick={() => setTela("alterar_senha")}>
          <span className="menu-icone">🔒</span>
          <span>Alterar Senha</span>
        </button>
      </div>

      <div className="menu-rodape">
        <button className="menu-botao menu-botao-sair" onClick={logout}>
          <span className="menu-icone">↩</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

function Campo({ label, name, value, col, editando, onChange }) {
  return (
    <div className={`campo ${col ? "col" : ""}`}>
      <label>{label}</label>
      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={!editando}
      />
    </div>
  );
}

function CampoComBusca({
  name,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}) {
  const listId = `${name}-lista`;

  return (
    <>
      <input
        list={listId}
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="input"
      />
      <datalist id={listId}>
        {options.map((op, index) => (
          <option key={index} value={op} />
        ))}
      </datalist>
    </>
  );
}

function Controle({
  titulo,
  tipo,
  setTela,
  setBuscaInicial,
  itemSelecionado,
  onSalvar,
}) {
  const [editando, setEditando] = useState(false);
  const [textoBusca, setTextoBusca] = useState("");
  const [dados, setDados] = useState(DADOS_INICIAIS);

  const itemCarregado = Boolean(dados?.CODIGO);

  function formatarData(data) {
    if (!data) return "";

    const d = new Date(data);

    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();

    const hora = String(d.getHours()).padStart(2, "0");
    const minuto = String(d.getMinutes()).padStart(2, "0");
    const segundo = String(d.getSeconds()).padStart(2, "0");

    return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
  }

  useEffect(() => {
    if (itemSelecionado && itemSelecionado.CODIGO) {
      setDados({ ...DADOS_INICIAIS, ...itemSelecionado });
      setEditando(false);
    } else {
      setDados(DADOS_INICIAIS);
      setEditando(false);
      setTextoBusca("");
    }
  }, [itemSelecionado, tipo]);

  function handleChange(e) {
    const { name, value } = e.target;

    setDados({
      ...dados,
      [name]: name.startsWith("COD_") ? Number(value) : value,
    });
  }

  function irBuscar() {
    setBuscaInicial(textoBusca);
    setTela("buscar");
  }

  return (
    <main className="app-main">
      <div className="controle-janela">
        <div className="topo">
          <div>
            <h3>{titulo}</h3>
            <p>Visualização, edição e movimentação do ativo selecionado</p>
          </div>
        </div>

        <div className="barra-busca">
          <input
            placeholder="Digite o nome do equipamento e clique em buscar"
            value={textoBusca}
            onChange={(e) => setTextoBusca(e.target.value)}
          />
          <button className="btn-icon" onClick={irBuscar}>
            🔍
          </button>
        </div>

        <div className="conteudo">
          <div className="formulario">
            <Campo label="Código" name="CODIGO" value={dados.CODIGO} />
            <Campo label="Nome" name="NOME" value={dados.NOME} />
            <Campo label="Tipo" name="TIPO" value={dados.TIPO} />

            <div className="campo">
              <label>Status</label>
              <select
                name="COD_STATUS"
                value={dados.COD_STATUS || ""}
                disabled={!editando}
                onChange={handleChange}
                className="input"
              >
                <option value="">Selecione</option>
                <option value="1">Ativo</option>
                <option value="2">Inativo</option>
                <option value="3">Vencido</option>
                <option value="5">Estoque</option>
                <option value="6">Manutenção Externa</option>
                <option value="7">Manutenção Interna</option>
              </select>
            </div>

            <Campo
              label="Usuário"
              name="USUARIO"
              value={dados.USUARIO}
              col
              editando={editando}
              onChange={handleChange}
            />

            <div className="campo">
              <label>Localidade</label>
              <select
                name="COD_LOCALIDADE"
                value={dados.COD_LOCALIDADE || ""}
                disabled={!editando}
                onChange={handleChange}
                className="input"
              >
                <option value="">Selecione</option>
                <option value="16">Administrativo</option>
                <option value="83">CD</option>
                <option value="291">Loja 01</option>
                <option value="23">Loja 02</option>
                <option value="24">Loja 03</option>
                <option value="25">Loja 04</option>
                <option value="26">Loja 05</option>
                <option value="27">Loja 06</option>
                <option value="28">Loja 07</option>
                <option value="67">Loja 08</option>
                <option value="68">Loja 09</option>
                <option value="69">Loja 10</option>
                <option value="70">Loja 11</option>
                <option value="71">Loja 12</option>
                <option value="72">Loja 13</option>
                <option value="73">Loja 14</option>
                <option value="74">Loja 15</option>
                <option value="75">Loja 16</option>
                <option value="76">Loja 17</option>
                <option value="77">Loja 18</option>
                <option value="78">Loja 19</option>
                <option value="79">Loja 20</option>
                <option value="80">Loja 22</option>
                <option value="50">Loja 25</option>
                <option value="82">Loja 26</option>
                <option value="319">Loja 27</option>
                <option value="320">Loja 28</option>
                <option value="321">Loja 29</option>
                <option value="322">Loja 30</option>
                <option value="370">Loja 31</option>
                <option value="99">Concerto</option>
              </select>
            </div>

            <Campo
              label="Patrimônio"
              name="PATRIMONIO"
              value={dados.PATRIMONIO}
              editando={editando}
              onChange={handleChange}
            />

            <Campo
              label="Serial"
              name="SERIAL"
              value={dados.SERIAL}
              editando={editando}
              onChange={handleChange}
            />

            <Campo label="Fabricante" name="FABRICANTE" value={dados.FABRICANTE} />
            <Campo label="Modelo" name="MODELO" value={dados.MODELO} />

            {tipo === "Computadores" && (
              <>
                <Campo
                  label="Processador"
                  name="PROCESSADOR"
                  value={dados.PROCESSADOR}
                />
                <Campo
                  label="Sistema Operacional"
                  name="SISTEMA_OPERACIONAL"
                  value={dados.SISTEMA_OPERACIONAL}
                  col
                />
              </>
            )}

            {tipo === "Coletores" && (
              <Campo label="Linha" name="LINHA" value={dados.LINHA} col />
            )}

            <Campo label="Contrato" name="CONTRATO" value={dados.CONTRATO} col />
            <Campo
              label="Inclusão GLPI"
              name="INCLUSAO_GLPI"
              value={formatarData(dados.INCLUSAO_GLPI)}
            />

            <Campo
              label="Última Conexão"
              name="ULTIMA_CONEXAO"
              value={formatarData(dados.ULTIMA_CONEXAO)}
            />
          </div>

          <div className="acoes">
            <button
              className="btn btn-secondary"
              disabled={!itemCarregado}
              onClick={() => {
                if (!itemCarregado) {
                  alert("Busque um item antes de alterar.");
                  return;
                }
                setEditando(true);
              }}
            >
              Alterar
            </button>

            <button
              className="btn btn-primary"
              disabled={!itemCarregado}
              onClick={() => {
                if (!itemCarregado) {
                  alert("Busque um item antes de transferir.");
                  return;
                }
                setTela("transferir");
              }}
            >
              Transferir
            </button>

            {editando && (
              <>
                <button
                  className="btn btn-success"
                  onClick={async () => {
                    await onSalvar(dados);
                    setEditando(false);
                  }}
                >
                  Salvar
                </button>
                <button className="btn btn-neutral" onClick={() => setEditando(false)}>
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Buscar({
  setTela,
  buscaInicial,
  tipoAtual,
  setDadosProduto,
  setDadosImpressora,
  setDadosColetor,
}) {
  const [linhaSelecionada, setLinhaSelecionada] = useState(null);
  const [filtros, setFiltros] = useState({
    codigo: "",
    nome: buscaInicial || "",
    usuario: "",
    fabricante: "",
    modelo: "",
    serial: "",
    status: "",
    linha: "",
    tipo: "",
    localidade: "",
  });

  const [dados, setDados] = useState([]);

  useEffect(() => {
    if (buscaInicial) {
      setFiltros((prev) => ({
        ...prev,
        nome: buscaInicial,
      }));
    }
  }, [buscaInicial]);

  function handleChange(e) {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  }

  async function buscarAtivos() {
    const filtrosLimpos = {};

    if (filtros.codigo) filtrosLimpos.codigo = filtros.codigo;
    if (filtros.nome) filtrosLimpos.nome = filtros.nome;
    if (filtros.usuario) filtrosLimpos.usuario = filtros.usuario;
    if (filtros.serial) filtrosLimpos.serial = filtros.serial;
    if (filtros.modelo) filtrosLimpos.modelo = filtros.modelo;
    if (filtros.fabricante) filtrosLimpos.fabricante = filtros.fabricante;
    if (filtros.status) filtrosLimpos.status = filtros.status;
    if (filtros.tipo) filtrosLimpos.tipo = filtros.tipo;
    if (filtros.localidade) filtrosLimpos.localidade = filtros.localidade;

    filtrosLimpos.tipoTela = tipoAtual;

    const query = new URLSearchParams(filtrosLimpos).toString();

    const response = await fetch(`/api/ativos?${query}`);
    const result = await response.json();
    setDados(Array.isArray(result) ? result : []);
  }

  return (
    <main className="app-main">
      <div className="controle-janela">
        <div className="topo">
          <div>
            <h3>Buscar Ativos</h3>
            <p>Localize rapidamente um item por código, nome, modelo, usuário, serial e mais</p>
          </div>

          <button className="btn btn-neutral" onClick={() => setTela(tipoAtual)}>
            Voltar
          </button>
        </div>

        <div className="buscar-form">
          <input
            name="codigo"
            placeholder="Código"
            value={filtros.codigo}
            onChange={handleChange}
          />

          <input
            name="nome"
            placeholder="Nome"
            value={filtros.nome}
            onChange={handleChange}
          />

          <input
            name="usuario"
            placeholder="Usuário"
            value={filtros.usuario}
            onChange={handleChange}
          />

          <input
            name="modelo"
            placeholder="Modelo"
            value={filtros.modelo}
            onChange={handleChange}
          />

          <input
            name="serial"
            placeholder="Serial"
            value={filtros.serial}
            onChange={handleChange}
          />

          <CampoComBusca
            name="fabricante"
            value={filtros.fabricante}
            onChange={handleChange}
            placeholder="Fabricante"
            options={[
              "MOBILEBASE",
              "motorola",
              "Apple",
              "Motorola PCS",
              "Fanvil",
              "CHAINWAY",
              "Motorola Mobility LLC",
              "Zebra Technologies",
              "Symbol Technologies",
              "Zebra Technologies Corporation",
              "Samsung",
              "BLUEBIRD",
              "DSIC",
              "YEP",
              "QEMU",
              "Brother",
              "Hewlett-Packard",
              "Konica",
              "Epson",
              "Ricoh",
              "Canon",
              "Lexmark",
              "LENOVO",
              "VMware, Inc.",
              "PCWARE",
              "American Megatrends Inc.",
              "O.E.M.",
              "ASUS",
              "ASUSTeK COMPUTER INC.",
              "Microsoft Corporation",
              "Gertec",
              "innotek GmbH",
              "Dell",
            ]}
          />

          <CampoComBusca
            name="status"
            value={filtros.status}
            onChange={handleChange}
            placeholder="Status"
            options={[
              "Ativo",
              "Inativo",
              "Vencido",
              "Estoque",
              "Manutenção Externa",
              "Manutenção Interna",
            ]}
          />

          <CampoComBusca
            name="tipo"
            value={filtros.tipo}
            onChange={handleChange}
            placeholder="Tipo"
            options={["CELULAR", "COLETOR", "DESKTOP", "IMPRESSORA", "NOTEBOOK"]}
          />

          <CampoComBusca
            name="localidade"
            value={filtros.localidade}
            onChange={handleChange}
            placeholder="Localidade"
            options={[
              "CD",
              "Administrativo",
              "Loja 01",
              "Loja 02",
              "Loja 03",
              "Loja 04",
              "Loja 05",
              "Loja 06",
              "Loja 07",
              "Loja 08",
              "Loja 09",
              "Loja 10",
              "Loja 11",
              "Loja 12",
              "Loja 13",
              "Loja 14",
              "Loja 15",
              "Loja 16",
              "Loja 17",
              "Loja 18",
              "Loja 19",
              "Loja 20",
              "Loja 22",
              "Loja 25",
              "Loja 26",
              "Loja 27",
              "Loja 28",
              "Loja 29",
              "Loja 30",
              "Loja 31",
            ]}
          />

          <button className="btn btn-primary" onClick={buscarAtivos}>
            Filtrar
          </button>
        </div>

        <div className="table-wrap">
          <table className="tabela-busca">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Status</th>
                <th>Tipo</th>
                <th>Localidade</th>
                <th>Usuário</th>
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr>
                  <td colSpan="6">Nenhum resultado</td>
                </tr>
              ) : (
                dados.map((item, index) => (
                  <tr
                    key={index}
                    onClick={() => setLinhaSelecionada(index)}
                    onDoubleClick={async () => {
                      const response = await fetch(
                        `/api/ativos/${item.CODIGO}?tipo=${tipoAtual}`
                      );

                      const completo = await response.json();

                      if (tipoAtual === "Computadores") {
                        setDadosProduto(completo);
                      }

                      if (tipoAtual === "Impressoras") {
                        setDadosImpressora(completo);
                      }

                      if (tipoAtual === "Coletores") {
                        setDadosColetor(completo);
                      }

                      setTela(tipoAtual);
                    }}
                    className={linhaSelecionada === index ? "linha-selecionada" : ""}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{item.CODIGO}</td>
                    <td>{item.NOME}</td>
                    <td>{item.STATUS}</td>
                    <td>{item.TIPO}</td>
                    <td>{item.LOCALIDADE}</td>
                    <td>{item.USUARIO}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Transferir({ setTela, dados, tipoAtual, setDados }) {
  const [novoStatus, setNovoStatus] = useState("");
  const [novaLocalidade, setNovaLocalidade] = useState("");
  const [comentario, setComentario] = useState("");

  const statusMap = {
    Ativo: "1",
    Inativo: "2",
    Vencido: "3",
    Estoque: "5",
    "Manutenção Externa": "6",
    "Manutenção Interna": "7",
  };

  const localidadeMap = {
    Administrativo: "16",
    CD: "83",
    "Loja 01": "291",
    "Loja 02": "23",
    "Loja 03": "24",
    "Loja 04": "25",
    "Loja 05": "26",
    "Loja 06": "27",
    "Loja 07": "28",
    "Loja 08": "67",
    "Loja 09": "68",
    "Loja 10": "69",
    "Loja 11": "70",
    "Loja 12": "71",
    "Loja 13": "72",
    "Loja 14": "73",
    "Loja 15": "74",
    "Loja 16": "75",
    "Loja 17": "76",
    "Loja 18": "77",
    "Loja 19": "78",
    "Loja 20": "79",
    "Loja 22": "80",
    "Loja 25": "50",
    "Loja 26": "82",
    "Loja 27": "319",
    "Loja 28": "320",
    "Loja 29": "321",
    "Loja 30": "322",
    "Loja 31": "370",
    Fiscal: "34",
    Atendimento: "35",
    Transferência: "36",
    PDV: "38",
    RH: "39",
  };

  const transferir = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (!dados?.CODIGO) {
        alert("Busque um item antes de transferir.");
        return;
      }

      const semPatrimonio =
        !dados?.PATRIMONIO || String(dados.PATRIMONIO).trim() === "";

      const semContrato =
        !dados?.CONTRATO || String(dados.CONTRATO).trim() === "";

      if (tipoAtual === "Computadores" && semPatrimonio && semContrato) {
        alert("Item precisa ter patrimônio ou contrato para ser transferido.");
        return;
      }

      if (tipoAtual !== "Computadores" && semPatrimonio) {
        alert("Não é permitido transferir item sem patrimônio preenchido.");
        return;
      }

      const codigoStatus = statusMap[novoStatus] || "";
      const codigoLocalidade = localidadeMap[novaLocalidade] || "";

      const response = await fetch(
        `/api/ativos/${dados.CODIGO}/transferir?tipoTela=${tipoAtual}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            novoStatus: codigoStatus,
            novaLocalidade: codigoLocalidade,
            comentario,
            usuarioId: user?.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result.erro);
        return;
      }

      alert(
        `Transferência realizada com sucesso!\n\nID da Transferência: ${result.codigoTransferencia}`
      );

      const refreshedResponse = await fetch(
        `/api/ativos/${dados.CODIGO}?tipo=${tipoAtual}`
      );
      const updatedData = await refreshedResponse.json();

      setDados(updatedData);
      setTela(tipoAtual);
    } catch (error) {
      console.error(error);
      alert("Erro ao transferir");
    }
  };

  return (
    <main className="app-main">
      <div className="controle-janela">
        <div className="topo">
          <div>
            <h3>Transferir Ativo</h3>
            <p>Movimente o item mantendo rastreabilidade e regras do processo</p>
          </div>
        </div>

        <div className="transferir-form">
          <Campo label="Código" value={dados.CODIGO} />
          <Campo label="Nome" value={dados.NOME} />
          <Campo label="Fabricante" value={dados.FABRICANTE} />
          <Campo label="Modelo" value={dados.MODELO} />
          <Campo label="Serial" value={dados.SERIAL} />
          <Campo label="Patrimônio" value={dados.PATRIMONIO} />
          <Campo label="Status Atual" value={dados.STATUS} />
          <Campo label="Localidade Atual" value={dados.LOCALIDADE} />

          <div className="campo">
            <label>Novo Status</label>
            <CampoComBusca
              name="novoStatus"
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value)}
              placeholder="Novo Status"
              options={[
                "Ativo",
                "Inativo",
                "Vencido",
                "Estoque",
                "Manutenção Externa",
                "Manutenção Interna",
              ]}
            />
          </div>

          <div className="campo">
            <label>Nova Localidade</label>
            <CampoComBusca
              name="novaLocalidade"
              value={novaLocalidade}
              onChange={(e) => setNovaLocalidade(e.target.value)}
              placeholder="Nova Localidade"
              options={[
                "Administrativo",
                "CD",
                "Loja 01",
                "Loja 02",
                "Loja 03",
                "Loja 04",
                "Loja 05",
                "Loja 06",
                "Loja 07",
                "Loja 08",
                "Loja 09",
                "Loja 10",
                "Loja 11",
                "Loja 12",
                "Loja 13",
                "Loja 14",
                "Loja 15",
                "Loja 16",
                "Loja 17",
                "Loja 18",
                "Loja 19",
                "Loja 20",
                "Loja 22",
                "Loja 25",
                "Loja 26",
                "Loja 27",
                "Loja 28",
                "Loja 29",
                "Loja 30",
                "Loja 31",
              ]}
            />
          </div>

          <textarea
            placeholder="Comentário"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          ></textarea>

          <div className="botoes-transferir">
            <button className="btn btn-primary" onClick={transferir}>
              Transferir
            </button>
            <button className="btn btn-neutral" onClick={() => setTela(tipoAtual)}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function RelatoriosMenu({ setTela, setRelatorioSelecionado, tipoAtual }) {
  const abrir = (slug, titulo) => {
    setRelatorioSelecionado({ slug, titulo, tipoTela: tipoAtual });
    setTela("relatorio_detalhe");
  };

  return (
    <main className="app-main">
      <div className="relatorios-container">
        <div className="topo">
          <div>
            <h3>Relatórios</h3>
            <p>Acesse rapidamente visões operacionais e históricos do sistema</p>
          </div>
          <button className="btn btn-neutral" onClick={() => setTela(tipoAtual)}>
            Voltar
          </button>
        </div>

        <div className="cards-relatorios">
          <button
            className="card-relatorio"
            onClick={() => abrir("sem-patrimonio", "Itens sem Patrimônio")}
          >
            <strong>Itens sem Patrimônio</strong>
            <span>Localize ativos pendentes de identificação patrimonial</span>
          </button>

          <button
            className="card-relatorio"
            onClick={() => abrir("sem-contrato", "Itens sem Contrato")}
          >
            <strong>Itens sem Contrato</strong>
            <span>Veja itens que não possuem vínculo contratual informado</span>
          </button>

          <button
            className="card-relatorio"
            onClick={() => abrir("com-contrato", "Itens com Contrato")}
          >
            <strong>Itens com Contrato</strong>
            <span>Consulte rapidamente os ativos com contrato preenchido</span>
          </button>

          <button className="card-relatorio" onClick={() => setTela("relatorios_logs")}>
            <strong>Transferências Realizadas</strong>
            <span>Audite movimentações e alterações executadas no sistema</span>
          </button>
        </div>
      </div>
    </main>
  );
}

function RelatorioDetalhe({ setTela, relatorioSelecionado }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [consultou, setConsultou] = useState(false);

  const [filtros, setFiltros] = useState({
    nome: "",
    status: "",
    tipo: "",
    localidade: "",
    usuario: "",
    patrimonio: "",
    contrato: "",
    serial: "",
    ordenarPor: "NOME",
    direcao: "ASC",
  });

  function handleChange(e) {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams({
        tipoTela: relatorioSelecionado.tipoTela,
        ...Object.fromEntries(Object.entries(filtros).filter(([_, v]) => v !== "")),
      }).toString();

      const resp = await fetch(`/api/relatorios/${relatorioSelecionado.slug}?${query}`);
      const data = await resp.json();
      setRows(Array.isArray(data) ? data : []);
      setConsultou(true);
    } catch (e) {
      console.error(e);
      setRows([]);
      setConsultou(true);
    } finally {
      setLoading(false);
    }
  }, [relatorioSelecionado, filtros]);

  useEffect(() => {
    setRows([]);
    setLoading(false);
    setConsultou(false);
    setFiltros({
      nome: "",
      status: "",
      tipo: "",
      localidade: "",
      usuario: "",
      patrimonio: "",
      contrato: "",
      serial: "",
      ordenarPor: "NOME",
      direcao: "ASC",
    });
  }, [relatorioSelecionado]);

  function exportarExcel() {
    if (!rows.length) {
      alert("Não há dados para exportar");
      return;
    }

    const dadosExportacao = rows.map((r) => ({
      Código: r.CODIGO,
      Nome: r.NOME,
      Status: r.STATUS,
      Tipo: r.TIPO,
      Localidade: r.LOCALIDADE,
      Usuário: r.USUARIO,
      Patrimônio: r.PATRIMONIO,
      Contrato: r.CONTRATO,
      Serial: r.SERIAL,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosExportacao);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio");

    const nomeArquivo = `${relatorioSelecionado.titulo
      .replace(/\s+/g, "_")
      .toLowerCase()}_${gerarTimestampArquivo()}.xlsx`;

    XLSX.writeFile(workbook, nomeArquivo);
  }

  return (
    <main className="app-main">
      <div className="relatorios-container">
        <div className="topo">
          <div>
            <h3>{relatorioSelecionado.titulo}</h3>
            <p>Consulte, filtre e exporte os dados com visual limpo e organizado</p>
          </div>
          <div className="topo-acoes">
            <button className="btn btn-primary" onClick={exportarExcel}>
              Exportar Excel
            </button>
            <button className="btn btn-neutral" onClick={() => setTela("relatorios")}>
              Voltar
            </button>
          </div>
        </div>

        <div className="buscar-form no-print filtros-relatorio">
          <input
            name="nome"
            placeholder="Nome"
            value={filtros.nome}
            onChange={handleChange}
          />

          <input
            name="usuario"
            placeholder="Usuário"
            value={filtros.usuario}
            onChange={handleChange}
          />

          <input
            name="patrimonio"
            placeholder="Patrimônio"
            value={filtros.patrimonio}
            onChange={handleChange}
          />

          <input
            name="contrato"
            placeholder="Contrato"
            value={filtros.contrato}
            onChange={handleChange}
          />

          <input
            name="serial"
            placeholder="Serial"
            value={filtros.serial}
            onChange={handleChange}
          />

          <CampoComBusca
            name="status"
            value={filtros.status}
            onChange={handleChange}
            placeholder="Status"
            options={[
              "Ativo",
              "Inativo",
              "Vencido",
              "Estoque",
              "Manutenção Externa",
              "Manutenção Interna",
            ]}
          />

          <CampoComBusca
            name="tipo"
            value={filtros.tipo}
            onChange={handleChange}
            placeholder="Tipo"
            options={["CELULAR", "COLETOR", "DESKTOP", "IMPRESSORA", "NOTEBOOK"]}
          />

          <CampoComBusca
            name="localidade"
            value={filtros.localidade}
            onChange={handleChange}
            placeholder="Localidade"
            options={[
              "CD",
              "Administrativo",
              "Loja 01",
              "Loja 02",
              "Loja 03",
              "Loja 04",
              "Loja 05",
              "Loja 06",
              "Loja 07",
              "Loja 08",
              "Loja 09",
              "Loja 10",
              "Loja 11",
              "Loja 12",
              "Loja 13",
              "Loja 14",
              "Loja 15",
              "Loja 16",
              "Loja 17",
              "Loja 18",
              "Loja 19",
              "Loja 20",
              "Loja 22",
              "Loja 25",
              "Loja 26",
              "Loja 27",
              "Loja 28",
              "Loja 29",
              "Loja 30",
              "Loja 31",
            ]}
          />

          <select name="ordenarPor" value={filtros.ordenarPor} onChange={handleChange}>
            <option value="NOME">Ordenar por Nome</option>
            <option value="CODIGO">Ordenar por Código</option>
            <option value="STATUS">Ordenar por Status</option>
            <option value="TIPO">Ordenar por Tipo</option>
            <option value="LOCALIDADE">Ordenar por Localidade</option>
            <option value="USUARIO">Ordenar por Usuário</option>
            <option value="PATRIMONIO">Ordenar por Patrimônio</option>
            <option value="CONTRATO">Ordenar por Contrato</option>
            <option value="SERIAL">Ordenar por Serial</option>
          </select>

          <select name="direcao" value={filtros.direcao} onChange={handleChange}>
            <option value="ASC">Crescente</option>
            <option value="DESC">Decrescente</option>
          </select>

          <button className="btn btn-primary" onClick={fetchData}>
            Filtrar
          </button>
        </div>

        {loading ? (
          <p className="estado-vazio">Carregando...</p>
        ) : !consultou ? (
          <p className="estado-vazio">Preencha os filtros e clique em Filtrar.</p>
        ) : (
          <div className="table-wrap tabela-relatorio">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome</th>
                  <th>Status</th>
                  <th>Tipo</th>
                  <th>Localidade</th>
                  <th>Usuário</th>
                  <th>Patrimônio</th>
                  <th>Contrato</th>
                  <th>Serial</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="9">Nenhum resultado</td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.CODIGO}</td>
                      <td>{r.NOME}</td>
                      <td>{r.STATUS}</td>
                      <td>{r.TIPO}</td>
                      <td>{r.LOCALIDADE}</td>
                      <td>{r.USUARIO}</td>
                      <td>{r.PATRIMONIO}</td>
                      <td>{r.CONTRATO}</td>
                      <td>{r.SERIAL}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function RelatoriosLogs({ setTela }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [consultou, setConsultou] = useState(false);

  const [filtros, setFiltros] = useState({
    codigo: "",
    tipoAtivo: "",
    campoAlterado: "",
    usuario: "",
    tipoOperacao: "",
    codIdentificacao: "",
    ordenarPor: "COD_IDENTIFICACAO",
    direcao: "DESC",
  });

  function formatarData(data) {
    if (!data) return "";

    const d = new Date(data);

    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, "0");
    const minuto = String(d.getMinutes()).padStart(2, "0");
    const segundo = String(d.getSeconds()).padStart(2, "0");

    return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
  }

  function handleChange(e) {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  }

  const buscarLogs = useCallback(async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(filtros).filter(([_, v]) => v !== ""))
      ).toString();

      const response = await fetch(`/api/relatorios?${query}`);
      const data = await response.json();
      setRows(Array.isArray(data) ? data : []);
      setConsultou(true);
    } catch (error) {
      console.error("Erro ao buscar relatórios", error);
      setRows([]);
      setConsultou(true);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  function exportarExcel() {
    if (!rows.length) {
      alert("Não há dados para exportar");
      return;
    }

    const dadosExportacao = rows.map((log) => ({
      Código: log.CODIGO,
      Patrimônio: log.PATRIMONIO,
      Data_Alteração: formatarData(log.DATA_ALTERACAO),
      Marca: log.FABRICANTE,
      Serial: log.SERIAL,
      Tipo: log.TIPO_ATIVO,
      Campo_Alterado: log.CAMPO_ALTERADO,
      Valor_Antigo: log.VALOR_ANTIGO,
      Valor_Novo: log.VALOR_NOVO,
      Usuário: log.USUARIO_NOME,
      Operação: log.TIPO_OPERACAO,
      Comentário: log.COMENTARIO,
      ID_Transferência: log.COD_IDENTIFICACAO,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosExportacao);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transferencias");

    XLSX.writeFile(workbook, `transferencias_realizadas_${gerarTimestampArquivo()}.xlsx`);
  }

  return (
    <main className="app-main">
      <div className="relatorios-container">
        <div className="topo">
          <div>
            <h3>Transferências Realizadas</h3>
            <p>Histórico completo de movimentações e alterações registradas</p>
          </div>
          <div className="topo-acoes">
            <button className="btn btn-primary" onClick={exportarExcel}>
              Exportar Excel
            </button>
            <button className="btn btn-neutral" onClick={() => setTela("relatorios")}>
              Voltar
            </button>
          </div>
        </div>

        <div className="buscar-form no-print filtros-relatorio">
          <input
            name="codigo"
            placeholder="Código"
            value={filtros.codigo}
            onChange={handleChange}
          />

          <input
            name="campoAlterado"
            placeholder="Campo alterado"
            value={filtros.campoAlterado}
            onChange={handleChange}
          />

          <input
            name="usuario"
            placeholder="Usuário"
            value={filtros.usuario}
            onChange={handleChange}
          />

          <input
            name="codIdentificacao"
            placeholder="ID transferência"
            value={filtros.codIdentificacao}
            onChange={handleChange}
          />

          <CampoComBusca
            name="tipoAtivo"
            value={filtros.tipoAtivo}
            onChange={handleChange}
            placeholder="Tipo ativo"
            options={["Computadores", "Impressoras", "Coletores"]}
          />

          <CampoComBusca
            name="tipoOperacao"
            value={filtros.tipoOperacao}
            onChange={handleChange}
            placeholder="Operação"
            options={["ALTERACAO", "TRANSFERENCIA"]}
          />

          <select name="ordenarPor" value={filtros.ordenarPor} onChange={handleChange}>
            <option value="COD_IDENTIFICACAO">Ordenar por ID</option>
            <option value="CODIGO">Ordenar por Código</option>
            <option value="TIPO_ATIVO">Ordenar por Tipo</option>
            <option value="CAMPO_ALTERADO">Ordenar por Campo</option>
            <option value="USUARIO_NOME">Ordenar por Usuário</option>
            <option value="TIPO_OPERACAO">Ordenar por Operação</option>
            <option value="DATA_ALTERACAO">Ordenar por Data Alteração</option>
          </select>

          <select name="direcao" value={filtros.direcao} onChange={handleChange}>
            <option value="DESC">Decrescente</option>
            <option value="ASC">Crescente</option>
          </select>

          <button className="btn btn-primary" onClick={buscarLogs}>
            Filtrar
          </button>
        </div>

        {loading ? (
          <p className="estado-vazio">Carregando...</p>
        ) : !consultou ? (
          <p className="estado-vazio">Preencha os filtros e clique em Filtrar.</p>
        ) : (
          <div className="table-wrap tabela-relatorio">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Marca</th>
                  <th>Serial</th>
                  <th>Patrimônio</th>
                  <th>Tipo</th>
                  <th>Campo Alterado</th>
                  <th>Valor Antigo</th>
                  <th>Valor Novo</th>
                  <th>Usuário</th>
                  <th>Operação</th>
                  <th>Data Alteração</th>
                  <th>Comentário</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="13">Nenhum relatório encontrado</td>
                  </tr>
                ) : (
                  rows.map((log, index) => (
                    <tr key={index}>
                      <td>{log.CODIGO}</td>
                      <td>{log.FABRICANTE}</td>
                      <td>{log.SERIAL}</td>
                      <td>{log.PATRIMONIO}</td>
                      <td>{log.TIPO_ATIVO}</td>
                      <td>{log.CAMPO_ALTERADO}</td>
                      <td>{log.VALOR_ANTIGO}</td>
                      <td>{log.VALOR_NOVO}</td>
                      <td>{log.USUARIO_NOME}</td>
                      <td>{log.TIPO_OPERACAO}</td>
                      <td>{formatarData(log.DATA_ALTERACAO)}</td>
                      <td>{log.COMENTARIO}</td>
                      <td>{log.COD_IDENTIFICACAO}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function AlterarSenha({ setTela, tipoAtual }) {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");

  async function salvarNovaSenha() {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (!user?.id) {
        alert("Usuário não identificado");
        return;
      }

      if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
        alert("Preencha todos os campos");
        return;
      }

      const resp = await fetch("/api/minha-senha", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: user.id,
          senhaAtual,
          novaSenha,
          confirmarNovaSenha,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        alert(data.erro || "Erro ao alterar senha");
        return;
      }

      alert("Senha alterada com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
      setTela(tipoAtual);
    } catch (error) {
      console.error(error);
      alert("Erro ao alterar senha");
    }
  }

  return (
    <main className="app-main">
      <div className="controle-janela senha-janela">
        <div className="topo">
          <div>
            <h3>Alterar Minha Senha</h3>
            <p>Mantenha sua conta segura atualizando sua senha de acesso</p>
          </div>
        </div>

        <div className="alterar-senha-form">
          <div className="campo">
            <label>Senha atual</label>
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
            />
          </div>

          <div className="campo">
            <label>Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
          </div>

          <div className="campo">
            <label>Confirmar nova senha</label>
            <input
              type="password"
              value={confirmarNovaSenha}
              onChange={(e) => setConfirmarNovaSenha(e.target.value)}
            />
          </div>

          <div className="botoes-transferir">
            <button className="btn btn-primary" onClick={salvarNovaSenha}>
              Salvar
            </button>
            <button className="btn btn-neutral" onClick={() => setTela(tipoAtual)}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const [tipoAtual, setTipoAtual] = useState("Computadores");
  const [dadosProduto, setDadosProduto] = useState({});
  const [dadosImpressora, setDadosImpressora] = useState({});
  const [dadosColetor, setDadosColetor] = useState({});
  const [tela, setTela] = useState("login");
  const [buscaInicial, setBuscaInicial] = useState("");
  const [relatorioSelecionado, setRelatorioSelecionado] = useState(null);

  const limparDadosAtivos = () => {
    setDadosProduto({});
    setDadosImpressora({});
    setDadosColetor({});
    setBuscaInicial("");
  };

  const handleLogin = async (login, senha) => {
    const resp = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, senha }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      alert(data.erro || "Erro no login");
      return;
    }

    localStorage.setItem("user", JSON.stringify(data.user));
    limparDadosAtivos();
    setTipoAtual("Computadores");
    setTela("Computadores");
  };

  const logout = () => {
    localStorage.removeItem("user");
    limparDadosAtivos();
    setTipoAtual("Computadores");
    setTela("login");
  };

  const salvar = async (dados) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (!dados?.CODIGO) {
        alert("Busque um item antes de alterar.");
        return;
      }

      const resp = await fetch(`/api/ativos/${dados.CODIGO}?tipoTela=${tela}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...dados, usuarioId: user?.id }),
      });

      const result = await resp.json();

      if (!resp.ok) {
        alert(result.erro || "Erro ao salvar");
        return;
      }

      const refreshedResponse = await fetch(`/api/ativos/${dados.CODIGO}?tipo=${tela}`);
      const updatedData = await refreshedResponse.json();

      if (tela === "Computadores") {
        setDadosProduto(updatedData);
      }

      if (tela === "Impressoras") {
        setDadosImpressora(updatedData);
      }

      if (tela === "Coletores") {
        setDadosColetor(updatedData);
      }

      alert("Atualizado com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar");
    }
  };

  if (tela === "login") return <Login onLogin={handleLogin} />;

  return (
    <>
      <Menu
        setTela={setTela}
        setTipoAtual={setTipoAtual}
        logout={logout}
        limparDadosAtivos={limparDadosAtivos}
      />

      {tela === "Computadores" && (
        <Controle
          titulo="Controle de Notebooks e Desktops"
          onSalvar={salvar}
          tipo="Computadores"
          setTela={setTela}
          setBuscaInicial={setBuscaInicial}
          itemSelecionado={dadosProduto}
        />
      )}

      {tela === "Impressoras" && (
        <Controle
          titulo="Controle de Impressoras"
          tipo="Impressoras"
          onSalvar={salvar}
          setTela={setTela}
          setBuscaInicial={setBuscaInicial}
          itemSelecionado={dadosImpressora}
        />
      )}

      {tela === "Coletores" && (
        <Controle
          titulo="Controle de Coletores e Celulares"
          tipo="Coletores"
          onSalvar={salvar}
          setTela={setTela}
          setBuscaInicial={setBuscaInicial}
          itemSelecionado={dadosColetor}
        />
      )}

      {tela === "buscar" && (
        <Buscar
          tipoAtual={tipoAtual}
          setTela={setTela}
          buscaInicial={buscaInicial}
          setDadosProduto={setDadosProduto}
          setDadosImpressora={setDadosImpressora}
          setDadosColetor={setDadosColetor}
        />
      )}

      {tela === "transferir" && (
        <Transferir
          setTela={setTela}
          tipoAtual={tipoAtual}
          dados={
            tipoAtual === "Computadores"
              ? dadosProduto
              : tipoAtual === "Impressoras"
              ? dadosImpressora
              : dadosColetor
          }
          setDados={
            tipoAtual === "Computadores"
              ? setDadosProduto
              : tipoAtual === "Impressoras"
              ? setDadosImpressora
              : setDadosColetor
          }
        />
      )}

      {tela === "relatorios" && (
        <RelatoriosMenu
          setTela={setTela}
          setRelatorioSelecionado={setRelatorioSelecionado}
          tipoAtual={tipoAtual}
        />
      )}

      {tela === "relatorios_logs" && <RelatoriosLogs setTela={setTela} />}

      {tela === "relatorio_detalhe" && relatorioSelecionado && (
        <RelatorioDetalhe
          setTela={setTela}
          relatorioSelecionado={relatorioSelecionado}
        />
      )}

      {tela === "alterar_senha" && (
        <AlterarSenha setTela={setTela} tipoAtual={tipoAtual} />
      )}
    </>
  );
}