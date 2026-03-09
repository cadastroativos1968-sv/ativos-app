import { useState, useEffect, useCallback } from "react";
import "./App.css";


function Login({ onLogin }) {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Sistema de Ativos</h2>

        <input
          placeholder="Usuário"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
        />

        <input
          placeholder="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button onClick={() => onLogin(login, senha)}>Entrar</button>
      </div>
    </div>
  );
}



function Menu({ setTela, setTipoAtual, logout }) {
  return (
    <div className="menu-lateral">
      <button onClick={() => { setTipoAtual("Computadores"); setTela("Computadores"); }}>
        Computadores
      </button>

      <button onClick={() => { setTipoAtual("Impressoras"); setTela("Impressoras"); }}>
        Impressoras
      </button>

      <button onClick={() => { setTipoAtual("Coletores"); setTela("Coletores"); }}>
        Coletores e Celulares
      </button>

    <button onClick={() => setTela("relatorios")}>Relatórios</button> {/* Novo botão */}

      <button onClick={logout}>Sair</button>
    </div>
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

function Controle({ titulo, tipo, setTela, setBuscaInicial, itemSelecionado, dadosInicial, onSalvar }) {
  const [editando, setEditando] = useState(false);
  const [textoBusca, setTextoBusca] = useState(""); // 👈 TEM QUE ESTAR AQUI
  const [dados, setDados] = useState({
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

useEffect(() => {
  if (itemSelecionado) {
    setDados(itemSelecionado);
  }
}, [itemSelecionado]);

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
    <div className="controle-janela">
      <div className="topo">
        <h3>{titulo}</h3>
      </div>

    <div className="barra-busca">
  <input
    placeholder="DIGITE O NOME DO EQUIPAMENTO OU CLIQUE EM BUSCAR"
    value={textoBusca}
    onChange={(e) => setTextoBusca(e.target.value)}
  />
  <button onClick={irBuscar}>🔍</button>
</div>


      <div className="conteudo">
        <div className="formulario">
          <Campo label="Código" name="CODIGO" value={dados.CODIGO} />
<Campo label="Nome" name="NOME" value={dados.NOME} />
<Campo label="Tipo" name="TIPO" value={dados.TIPO} />
<div className="campo">
  <label>Status</label>
  <select
    name="COD_STATUS" value={dados.COD_STATUS || ""} disabled={!editando} onChange={handleChange} className="input" >
    <option value="">Selecione</option>
    <option value="1">Ativo</option>
    <option value="2">Inativo</option>
    <option value="3">Vencido</option>
    <option value="5">Estoque</option>
    <option value="6">Manutenção Externa</option>
    <option value="7">Manutenção Interna</option>
  </select>
</div>


<Campo label="Usuário" name="USUARIO" value={dados.USUARIO} col editando={editando} onChange={handleChange} />

<div className="campo">
  <label>Localidade</label>
  <select
    name="COD_LOCALIDADE" value={dados.COD_LOCALIDADE || ""} disabled={!editando} onChange={handleChange} className="input" >
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
    <option value="34">Fiscal</option>
    <option value="35">Atendimento</option>
    <option value="36">Transferência</option>
    <option value="38">PDV</option>
    <option value="39">RH</option>
    <option value="99">Concerto</option>
  </select>
</div>



<Campo label="Patrimônio" name="PATRIMONIO" value={dados.PATRIMONIO} editando={editando} onChange={handleChange} />

<Campo label="Serial" name="SERIAL" value={dados.SERIAL} editando={editando} onChange={handleChange} />
<Campo label="Fabricante" name="FABRICANTE" value={dados.FABRICANTE} />
<Campo label="Modelo" name="MODELO" value={dados.MODELO} />


        {tipo === "Computadores" && (
  <>
    <Campo label="Processador" name="PROCESSADOR" value={dados.PROCESSADOR} />
    <Campo
      label="Sistema Operacional"
      name="SISTEMA_OPERACIONAL"
      value={dados.SISTEMA_OPERACIONAL}
      col
    />
  </>
)}

         {tipo === "Coletores" && 
  <Campo 
    label="Linha" 
    name="LINHA"
    value={dados.LINHA} 
    col 
  />
}

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
          <button onClick={() => setEditando(true)}>Alterar</button>
          <button onClick={() => setTela("transferir")}>Transferir</button>

          {editando && (
  <>
    <button
  onClick={async () => {
    await onSalvar(dados);
    setEditando(false);
  }}
>
  Salvar
</button>
              <button className="cancelar" onClick={() => setEditando(false)}>
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function Buscar({ setTela, buscaInicial, tipoAtual,setDadosProduto,setDadosImpressora,setDadosColetor }){
  const [linhaSelecionada, setLinhaSelecionada] = useState(null);
  const [filtros, setFiltros] = useState({
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

  if (filtros.nome) filtrosLimpos.nome = filtros.nome;
  if (filtros.usuario) filtrosLimpos.usuario = filtros.usuario;
  if (filtros.serial) filtrosLimpos.serial = filtros.serial;
  if (filtros.modelo) filtrosLimpos.modelo = filtros.modelo;
  if (filtros.fabricante && filtros.fabricante !== "Fabricantes")
    filtrosLimpos.fabricante = filtros.fabricante;
  if (filtros.status && filtros.status !== "Status")
    filtrosLimpos.status = filtros.status;
  if (filtros.tipo && filtros.tipo !== "Tipo")
    filtrosLimpos.tipo = filtros.tipo;
  if (filtros.localidade && filtros.localidade !== "Localidade")
    filtrosLimpos.localidade = filtros.localidade;

  filtrosLimpos.tipoTela = tipoAtual;

  const query = new URLSearchParams(filtrosLimpos).toString();

  const response = await fetch(`/api/ativos?${query}`);
  const result = await response.json();
  setDados(Array.isArray(result) ? result : []);
}

  return (
    <div className="controle-janela">
      <div className="topo">
        <h3>Buscar Ativos</h3>
      </div>

      <div className="buscar-form">
        <input name="nome" placeholder="Nome" value={filtros.nome} onChange={handleChange} />
        <input name="usuario" placeholder="Usuário" value={filtros.usuario} onChange={handleChange} />
<input name="modelo" placeholder="Modelo" value={filtros.modelo} onChange={handleChange} />
<input name="serial" placeholder="Serial" value={filtros.serial} onChange={handleChange} />

         <select name="fabricante" value={filtros.fabricante} onChange={handleChange}>
          <option>Fabricantes</option>
          <option>MOBILEBASE</option>
          <option>motorola</option>
          <option>Apple</option>
          <option>Motorola PCS</option>
          <option>Fanvil</option>
          <option>CHAINWAY</option>
          <option>Motorola Mobility LLC</option>
          <option>Zebra Technologies</option>
          <option>Symbol Technologies</option>
          <option>Zebra Technologies Corporation</option>
          <option>Samsung</option>
          <option>BLUEBIRD</option>
          <option>DSIC</option>
          <option>YEP</option>
          <option>QEMU</option>
        </select>

        <select name="status" value={filtros.status} onChange={handleChange}>
          <option>Status</option>
          <option>Ativo</option>
          <option>Inativo</option>
          <option>Vencido</option>
          <option>Estoque</option>
          <option>Manutenção Externa</option>
          <option>Manutenção Interna</option>         
        </select>

       <select name="tipo" value={filtros.tipo} onChange={handleChange}>
          <option>Tipo</option>
          <option>moto g(9) play</option>
          <option>moto g22</option>
          <option>moto g42</option>
          <option>Iphone 11</option>
          <option>moto g(8) play</option>
          <option>Iphone 15 pro max</option>
          <option>moto g(7) power</option>
          <option>Telefone</option>
          <option>Celular</option>
          <option>Coletor</option>
          <option>G04s (B2B)</option>
          <option>CELULAR</option>
          <option>COLETOR</option>
          <option>DESKTOP</option>
          <option>IMPRESSORA</option>
          <option>NOTEBOOK</option>
        </select>

        <select name="localidade" value={filtros.localidade} onChange={handleChange}>
          <option>Localidade</option>
          <option>Loja 01</option>
          <option>Loja 2</option>
          <option>Loja 03</option>
          <option>Loja 04</option>
          <option>Loja 05</option>
          <option>Loja 06</option>
          <option>Loja 07</option>
          <option>Loja 08</option>
          <option>Loja 09</option>
          <option>Loja 10</option>
          <option>Loja 11</option>
          <option>Loja 12</option>
          <option>Loja 13</option>
          <option>Loja 14</option>
          <option>Loja 15</option>
          <option>Loja 16</option>
          <option>Loja 17</option>
          <option>Loja 18</option>
          <option>Loja 19</option>
          <option>Loja 20</option>
          <option>Loja 22</option>
          <option>Loja 25</option>
          <option>Loja 26</option>
          <option>Loja 27</option>
          <option>Loja 28</option>
          <option>Loja 29</option>
          <option>Loja 30</option>
          <option>Loja 31</option>
          <option>ADM</option>
          <option>CD</option>
          <option>Açougue</option>
          <option>Administrativo</option>
          <option>Atendimento</option>
          <option>Cad1</option>
          <option>Cad2</option>
          <option>CD</option>
          <option>Centro de Distribuição</option>
          <option>Deposito</option>
          <option>E-commerce</option>
          <option>FLV</option>
          <option>Frios</option>
          <option>Gerencia</option>
          <option>LOJA 02 - NF1L2</option>
          <option>Nota Fiscal</option>
          <option>Padaria</option>
          <option>RH</option>
          <option>Televendas</option>
          <option>Tesouraria</option>
          <option>Nota Fiscal</option>
        </select>

        <button onClick={buscarAtivos}>Buscar 🔍</button>
      </div>

      <table className="tabela-busca">
        <thead>
          <tr>
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
      <td colSpan="5">Nenhum resultado</td>
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
    setDadosProduto(completo)
  }

  if (tipoAtual === "Impressoras") {
    setDadosImpressora(completo)
  }

  if (tipoAtual === "Coletores") {
    setDadosColetor(completo)
  }

  setTela(tipoAtual)
}}

        style={{
          backgroundColor:
            linhaSelecionada === index ? "#d3d3d3" : "transparent",
          cursor: "pointer",
        }}
      >
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
  );
}


function Transferir({ setTela, dados, tipoAtual, setDados }) {
  const [novoStatus, setNovoStatus] = useState(dados.STATUS || "");  
  const [novaLocalidade, setNovaLocalidade] = useState(dados.LOCALIDADE || ""); 
  const [comentario, setComentario] = useState("");

  const statusMap = {
    "Ativo": "1",
    "Inativo": "2",
    "Vencido": "3",
    "Estoque": "5",
    "Manutenção Externa": "6",
    "Manutenção Interna": "7"
  };

  const localidadeMap = {
    "Administrativo": "16",
    "CD": "83",
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
    "Fiscal": "34",
    "Atendimento": "35",
    "Transferência": "36",
    "PDV": "38",
    "RH": "39"
  };

  const transferir = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");

      const codigoStatus = statusMap[novoStatus] || novoStatus;
      const codigoLocalidade = localidadeMap[novaLocalidade] || novaLocalidade;

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
            usuarioId: user?.id
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

      // Recarregar os dados do ativo atualizado
      const refreshedResponse = await fetch(
        `/api/ativos/${dados.CODIGO}?tipo=${tipoAtual}`
      );
      const updatedData = await refreshedResponse.json();

      // Atualiza o estado dos dados com os dados atualizados
      setDados(updatedData);

      setTela(tipoAtual);

    } catch (error) {
      console.error(error);
      alert("Erro ao transferir");
    }
  };

  return (
    <div className="controle-janela">
      <div className="topo">
        <h3>Transferir Ativo</h3>
      </div>

      <div className="transferir-form">
        <Campo label="Código" value={dados.CODIGO} />
        <Campo label="Nome" value={dados.NOME} />
        <Campo label="Fabricante" value={dados.FABRICANTE} />
        <Campo label="Modelo" value={dados.MODELO} />
        <Campo label="Serial" value={dados.SERIAL} />
        <Campo label="Status Atual" value={dados.STATUS} />
        <Campo label="Localidade Atual" value={dados.LOCALIDADE} />

        <div className="campo">
          <label>Novo Status</label>
          <select
            value={novoStatus}
            onChange={(e) => setNovoStatus(e.target.value)}
          >
            <option value="">{dados.STATUS}</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
            <option value="Vencido">Vencido</option>
            <option value="Estoque">Estoque</option>
            <option value="Manutenção Externa">Manutenção Externa</option>
            <option value="Manutenção Interna">Manutenção Interna</option>
            
          </select>
        </div>

        <div className="campo">
          <label>Nova Localidade</label>
          <select
            value={novaLocalidade}
            onChange={(e) => setNovaLocalidade(e.target.value)}
          >
            <option value="">{dados.LOCALIDADE}</option>
            <option value="Administrativo">Administrativo</option>
            <option value="CD">CD</option>
            <option value="Loja 01">Loja 01</option>
            <option value="Loja 02">Loja 02</option>
            <option value="Loja 03">Loja 03</option>
            <option value="Loja 04">Loja 04</option>
            <option value="Loja 05">Loja 05</option>
            <option value="Loja 06">Loja 06</option>
            <option value="Loja 07">Loja 07</option>
            <option value="Loja 08">Loja 08</option>
            <option value="Loja 09">Loja 09</option>
            <option value="Loja 10">Loja 10</option>
            <option value="Loja 11">Loja 11</option>
            <option value="Loja 12">Loja 12</option>
            <option value="Loja 13">Loja 13</option>
            <option value="Loja 14">Loja 14</option>
            <option value="Loja 15">Loja 15</option>
            <option value="Loja 16">Loja 16</option>
            <option value="Loja 17">Loja 17</option>
            <option value="Loja 18">Loja 18</option>
            <option value="Loja 19">Loja 19</option>
            <option value="Loja 20">Loja 20</option>
            <option value="Loja 22">Loja 22</option>
            <option value="Loja 25">Loja 25</option>
            <option value="Loja 26">Loja 26</option>
            <option value="Loja 27">Loja 27</option>
            <option value="Loja 28">Loja 28</option>
            <option value="Loja 29">Loja 29</option>
            <option value="Loja 30">Loja 30</option>
            <option value="Loja 31">Loja 31</option>
            <option value="Fiscal">Fiscal</option>
            <option value="Atendimento">Atendimento</option>
            <option value="Transferência">Transferência</option>
            <option value="PDV">PDV</option>
            <option value="RH">RH</option>
          </select>
        </div>

        <textarea
          placeholder="Comentário"
          onChange={(e) => setComentario(e.target.value)}
        ></textarea>

        <div className="botoes-transferir">
          <button onClick={transferir}>Transferir</button>
          <button onClick={() => setTela(tipoAtual)}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function RelatoriosMenu({ setTela, setRelatorioSelecionado, tipoAtual }) {
  const abrir = (slug, titulo) => {
    setRelatorioSelecionado({ slug, titulo, tipoTela: tipoAtual });
    setTela("relatorio_detalhe");
  };

  return (
    <div className="relatorios-container">
      <div className="topo">
        <h3>Relatórios</h3>
        <button onClick={() => setTela(tipoAtual)}>Voltar</button>
      </div>

      <div className="cards-relatorios">
        <button onClick={() => abrir("sem-patrimonio", "Itens sem Patrimônio")}>
          Itens sem Patrimônio
        </button>

        <button onClick={() => abrir("sem-contrato", "Itens sem Contrato")}>
          Itens sem Contrato
        </button>

        <button onClick={() => abrir("com-contrato", "Itens com Contrato")}>
          Itens com Contrato
        </button>

       
        <button onClick={() => setTela("relatorios_logs")}>
          Logs de Alterações
        </button>
      </div>
    </div>
  );
}

function RelatorioDetalhe({ setTela, relatorioSelecionado }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

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

const [filtrosAplicados, setFiltrosAplicados] = useState({
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
      ...Object.fromEntries(
        Object.entries(filtrosAplicados).filter(([_, v]) => v !== "")
      ),
    }).toString();

    const resp = await fetch(`/api/relatorios/${relatorioSelecionado.slug}?${query}`);
    const data = await resp.json();
    setRows(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error(e);
    setRows([]);
  } finally {
    setLoading(false);
  }
}, [relatorioSelecionado, filtrosAplicados]);

useEffect(() => {
  fetchData();
}, [fetchData]);
  return (
    <div className="relatorios-container">
      <div className="topo">
        <h3>{relatorioSelecionado.titulo}</h3>
        <button onClick={() => setTela("relatorios")}>Voltar</button>
      </div>

      <div className="buscar-form">
        <input name="nome" placeholder="Nome" value={filtros.nome} onChange={handleChange} />
        <input name="usuario" placeholder="Usuário" value={filtros.usuario} onChange={handleChange} />
        <input name="patrimonio" placeholder="Patrimônio" value={filtros.patrimonio} onChange={handleChange} />
        <input name="contrato" placeholder="Contrato" value={filtros.contrato} onChange={handleChange} />
        <input name="serial" placeholder="Serial" value={filtros.serial} onChange={handleChange} />

        <select name="status" value={filtros.status} onChange={handleChange}>
          <option value="">Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
          <option value="Vencido">Vencido</option>
          <option value="Estoque">Estoque</option>
          <option value="Manutenção Externa">Manutenção Externa</option>
          <option value="Manutenção Interna">Manutenção Interna</option>
        </select>

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

       <button onClick={() => setFiltrosAplicados({ ...filtros })}>Filtrar 🔍</button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center" }}>Carregando...</p>
      ) : (
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
      )}
    </div>
  );
}

function RelatoriosLogs({ setTela }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

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

const [filtrosAplicados, setFiltrosAplicados] = useState({
  codigo: "",
  tipoAtivo: "",
  campoAlterado: "",
  usuario: "",
  tipoOperacao: "",
  codIdentificacao: "",
  ordenarPor: "COD_IDENTIFICACAO",
  direcao: "DESC",
});

  function handleChange(e) {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  }

const buscarLogs = useCallback(async () => {
  try {
    setLoading(true);

    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filtrosAplicados).filter(([_, v]) => v !== "")
      )
    ).toString();

    const response = await fetch(`/api/relatorios?${query}`);
    const data = await response.json();
    setRows(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Erro ao buscar relatórios", error);
    setRows([]);
  } finally {
    setLoading(false);
  }
}, [filtrosAplicados]);

useEffect(() => {
  buscarLogs();
}, [buscarLogs]);

  return (
    <div className="relatorios-container">
      <div className="topo">
        <h3>Logs de Alterações</h3>
        <button onClick={() => setTela("relatorios")}>Voltar</button>
      </div>

      <div className="buscar-form">
        <input name="codigo" placeholder="Código" value={filtros.codigo} onChange={handleChange} />
        <input name="campoAlterado" placeholder="Campo alterado" value={filtros.campoAlterado} onChange={handleChange} />
        <input name="usuario" placeholder="Usuário" value={filtros.usuario} onChange={handleChange} />
        <input name="codIdentificacao" placeholder="ID transferência" value={filtros.codIdentificacao} onChange={handleChange} />

        <select name="tipoAtivo" value={filtros.tipoAtivo} onChange={handleChange}>
          <option value="">Tipo ativo</option>
          <option value="Computadores">Computadores</option>
          <option value="Impressoras">Impressoras</option>
          <option value="Coletores">Coletores</option>
        </select>

        <select name="tipoOperacao" value={filtros.tipoOperacao} onChange={handleChange}>
          <option value="">Operação</option>
          <option value="ALTERACAO">ALTERACAO</option>
          <option value="TRANSFERENCIA">TRANSFERENCIA</option>
        </select>

        <select name="ordenarPor" value={filtros.ordenarPor} onChange={handleChange}>
          <option value="COD_IDENTIFICACAO">Ordenar por ID</option>
          <option value="CODIGO">Ordenar por Código</option>
          <option value="TIPO_ATIVO">Ordenar por Tipo</option>
          <option value="CAMPO_ALTERADO">Ordenar por Campo</option>
          <option value="USUARIO_NOME">Ordenar por Usuário</option>
          <option value="TIPO_OPERACAO">Ordenar por Operação</option>
        </select>

        <select name="direcao" value={filtros.direcao} onChange={handleChange}>
          <option value="DESC">Decrescente</option>
          <option value="ASC">Crescente</option>
        </select>

        <button onClick={() => setFiltrosAplicados({ ...filtros })}>Filtrar 🔍</button>
      </div>
 


      {loading ? (
        <p style={{ textAlign: "center" }}>Carregando...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Marca</th>
              <th>Serial</th>
              <th>Tipo</th>
              <th>Campo Alterado</th>
              <th>Valor Antigo</th>
              <th>Valor Novo</th>
              <th>Usuário</th>
              <th>Operação</th>
              <th>Comentário</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="9">Nenhum relatório encontrado</td>
              </tr>
            ) : (
              rows.map((log, index) => (
                <tr key={index}>
                  <td>{log.CODIGO}</td>
                  <td>{log.FABRICANTE}</td>
                  <td>{log.SERIAL}</td>
                  <td>{log.TIPO_ATIVO}</td>
                  <td>{log.CAMPO_ALTERADO}</td>
                  <td>{log.VALOR_ANTIGO}</td>
                  <td>{log.VALOR_NOVO}</td>
                  <td>{log.USUARIO_NOME}</td>
                  <td>{log.TIPO_OPERACAO}</td>
                  <td>{log.COMENTARIO}</td>
                  <td>{log.COD_IDENTIFICACAO}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}


export default function App() {
  // controla qual tipo está sendo usado na busca
  const [tipoAtual, setTipoAtual] = useState("Computadores");
  const [dadosProduto, setDadosProduto] = useState({});
  const [dadosImpressora, setDadosImpressora] = useState({});
  const [dadosColetor, setDadosColetor] = useState({});
  const [tela, setTela] = useState("login");
  const [buscaInicial, setBuscaInicial] = useState("");
  const [relatorioSelecionado, setRelatorioSelecionado] = useState(null);

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

    // salva usuário logado
    localStorage.setItem("user", JSON.stringify(data.user));

    setTela("Computadores");
  };

  const logout = () => {
    localStorage.removeItem("user"); // apaga usuário logado
    setDadosProduto({});
    setDadosImpressora({});
    setDadosColetor({});
    setBuscaInicial("");
    setTipoAtual("Computadores");
    setTela("login");
  };

  const salvar = async (dados) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");

      const resp = await fetch(
        `/api/ativos/${dados.CODIGO}?tipoTela=${tela}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...dados, usuarioId: user?.id }),
        }
      );

      const result = await resp.json();

      if (!resp.ok) {
        alert(result.erro || "Erro ao salvar");
        return;
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
      <Menu setTela={setTela} setTipoAtual={setTipoAtual} logout={logout} />

      {tela === "Computadores" && (
        <Controle
          titulo="Controle de Notebooks e Desktops"
          dadosInicial={dadosProduto}
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
          dadosInicial={dadosImpressora}
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
          dadosInicial={dadosColetor}
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
  dados={tipoAtual === "Computadores" ? dadosProduto : tipoAtual === "Impressoras" ? dadosImpressora : dadosColetor}
  setDados={tipoAtual === "Computadores" ? setDadosProduto : tipoAtual === "Impressoras" ? setDadosImpressora : setDadosColetor} // Passando setDados como prop
/>
      )}

{tela === "relatorios" && (
  <RelatoriosMenu
    setTela={setTela}
    setRelatorioSelecionado={setRelatorioSelecionado}
    tipoAtual={tipoAtual}
  />
)}

{tela === "relatorios_logs" && (
  <RelatoriosLogs setTela={setTela} />
)}

{tela === "relatorio_detalhe" && relatorioSelecionado && (
  <RelatorioDetalhe
    setTela={setTela}
    relatorioSelecionado={relatorioSelecionado}
  />
)}
    </>
  );
}