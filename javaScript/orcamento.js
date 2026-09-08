// ==========================================================================
// MAPEAMENTO GLOBAL DOS ELEMENTOS E ARMAZENAMENTO DE DADOS
// ==========================================================================
let tabelaOrcamentos, areaEdicao;
let orcamentoIdInput, selectClienteInput, dataOrcamentoInput, dataValidadeInput, valorTotalInput, txtOrcamentoIdEdicao;
let selectClienteCad, dataOrcamentoCad, dataValidadeCad, valorTotalCad;
let selectProdutoCad, qtdProdutoCad, vlUnitarioCad, tabelaItensCad;
let selectProdutoEdit, qtdProdutoEdit, vlUnitarioEdit, tabelaItensEdit;

// Matrizes e Objetos de Cache Globais (Evitam múltiplas requisições ao filtrar)
let orcamentosOriginais = [];
let clienteMap = {};
let produtosCache = [];

// Listas em memória para controle de Itens dinamicamente (Cálculos automáticos em JS)
let itensOrcamentoCadastro = [];
let itensOrcamentoEdicao = [];

document.addEventListener("DOMContentLoaded", function() {
    tabelaOrcamentos = document.getElementById("tabelaOrcamentos");
    areaEdicao = document.getElementById("areaEdicao");
    txtOrcamentoIdEdicao = document.getElementById("txtOrcamentoIdEdicao");
    
    // Mapeamento dos inputs da área de edição
    orcamentoIdInput = document.getElementById("orcamentoId");
    selectClienteInput = document.getElementById("selectCliente");
    dataOrcamentoInput = document.getElementById("dataOrcamento");
    dataValidadeInput = document.getElementById("dataValidade");
    valorTotalInput = document.getElementById("valorTotal");
    selectProdutoEdit = document.getElementById("selectProdutoEdit");
    qtdProdutoEdit = document.getElementById("qtdProdutoEdit");
    vlUnitarioEdit = document.getElementById("vlUnitarioEdit");
    tabelaItensEdit = document.getElementById("tabelaItensEdit");

    // Mapeamento dos inputs do modal de cadastro
    selectClienteCad = document.getElementById("selectClienteCad");
    dataOrcamentoCad = document.getElementById("dataOrcamentoCad");
    dataValidadeCad = document.getElementById("dataValidadeCad");
    valorTotalCad = document.getElementById("valorTotalCad");
    selectProdutoCad = document.getElementById("selectProdutoCad");
    qtdProdutoCad = document.getElementById("qtdProdutoCad");
    vlUnitarioCad = document.getElementById("vlUnitarioCad");
    tabelaItensCad = document.getElementById("tabelaItensCad");

    // Inicializa carregando os dados estruturados do banco
    inicializarComponentes();
});

async function inicializarComponentes() {
    await carregarClientesFormularios();
    await carregarProdutosFormularios();
    await carregarOrcamentos();
}

function formatarDataBancoParaBR(dataBanco) {
    if (!dataBanco) return "-";
    
    // Separa apenas o trecho AAAA-MM-DD ignorando horas ou o caractere "T"
    const apenasData = dataBanco.toString().split("T")[0].split(" ")[0];
    const partes = apenasData.split("-");
    
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    
    // Fallback de segurança usando o motor do navegador
    const dataObj = new Date(dataBanco);
    if (!isNaN(dataObj.getTime())) {
        return dataObj.toLocaleDateString("pt-BR");
    }
    
    return "-";
}

function abrirModal() {
  document.getElementById("modalCadastro").style.display = "flex";
  itensOrcamentoCadastro = [];
  renderizarItensCadastro();
  document.body.classList.add('modal-aberto');
}

function fecharModal() {
  document.getElementById("modalCadastro").style.display = "none";
  if (selectClienteCad) selectClienteCad.value = "";
  if (dataOrcamentoCad) dataOrcamentoCad.value = "";
  if (dataValidadeCad) dataValidadeCad.value = "";
  itensOrcamentoCadastro = [];
  renderizarItensCadastro();
}

async function carregarClientesFormularios() {
    const { data } = await supabaseClient.from("cliente").select("clienteid, nome_cliente").order("nome_cliente");
    if (data) {
        selectClienteCad.innerHTML = '<option value="">Selecione o cliente...</option>';
        selectClienteInput.innerHTML = '<option value="">Selecione o cliente...</option>';
        
        // Alimenta também o mapeador de IDs global para tradução textual imediata
        data.forEach(c => {
            clienteMap[c.clienteid] = c.nome_cliente;
            const html = `<option value="${c.clienteid}">${c.nome_cliente}</option>`;
            selectClienteCad.insertAdjacentHTML('beforeend', html);
            selectClienteInput.insertAdjacentHTML('beforeend', html);
        });
    }
}

async function carregarProdutosFormularios() {
    const { data } = await supabaseClient.from("produto").select("produtoid, ds_produto, vl_venda_produto") .eq("status_produto", "ATIVO");
    if (data) {
        produtosCache = data;
        selectProdutoCad.innerHTML = '<option value="">Selecione...</option>';
        selectProdutoEdit.innerHTML = '<option value="">Selecione...</option>';
        data.forEach(p => {
            const html = `<option value="${p.produtoid}">${p.ds_produto}</option>`;
            selectProdutoCad.insertAdjacentHTML('beforeend', html);
            selectProdutoEdit.insertAdjacentHTML('beforeend', html);
        });
    }
}

function atualizarPrecoUnitarioCad() {
    const prod = produtosCache.find(p => p.produtoid == selectProdutoCad.value);
    vlUnitarioCad.value = prod ? prod.vl_venda_produto : 0;
}

function atualizarPrecoUnitarioEdit() {
    const prod = produtosCache.find(p => p.produtoid == selectProdutoEdit.value);
    vlUnitarioEdit.value = prod ? prod.vl_venda_produto : 0;
}

// ==========================================================================
// GERENCIAMENTO DINÂMICO DE ITENS EM MEMÓRIA (CÁLCULOS AUTOMÁTICOS)
// ==========================================================================
function adicionarItemNaListaCad() {
    const prodId = selectProdutoCad.value;
    const qtd = parseFloat(qtdProdutoCad.value);
    const unitario = parseFloat(vlUnitarioCad.value);

    if(!prodId || isNaN(qtd) || isNaN(unitario) || qtd <= 0) {
        return alert("Preencha as informações do produto com valores válidos!");
    }

    const prod = produtosCache.find(p => p.produtoid == prodId);
    itensOrcamentoCadastro.push({
        produtoid: parseInt(prodId),
        produtodesc: prod.ds_produto,
        qt_produto: qtd,
        vl_unitario: unitario,
        vl_total: qtd * unitario
    });
    renderizarItensCadastro();
}

function removerItemListaCad(index) {
    itensOrcamentoCadastro.splice(index, 1);
    renderizarItensCadastro();
}

function renderizarItensCadastro() {
    tabelaItensCad.innerHTML = "";
    let totalGeral = 0;
    itensOrcamentoCadastro.forEach((item, index) => {
        totalGeral += item.vl_total;
        tabelaItensCad.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${item.produtodesc}</td>
                <td>${item.qt_produto}</td>
                <td>R$ ${item.vl_unitario.toFixed(2)}</td>
                <td>R$ ${item.vl_total.toFixed(2)}</td>
                <td><button type="button" style="background:#dc3545; color:white; border:none; padding:3px 8px; cursor:pointer;" onclick="removerItemListaCad(${index})">X</button></td>
            </tr>
        `);
    });
    valorTotalCad.value = totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function adicionarItemNaListaEdit() {
    const prodId = selectProdutoEdit.value;
    const qtd = parseFloat(qtdProdutoEdit.value);
    const unitario = parseFloat(vlUnitarioEdit.value);

    if(!prodId || isNaN(qtd) || isNaN(unitario) || qtd <= 0) {
        return alert("Preencha as informações do produto com valores válidos!");
    }

    const prod = produtosCache.find(p => p.produtoid == prodId);
    
    itensOrcamentoEdicao.push({
        produtoid: parseInt(prodId),
        produtodesc: prod.ds_produto,
        qt_produto: qtd,
        vl_unitario: unitario,
        vl_total: qtd * unitario
    });
    
    selectProdutoEdit.value = "";
    qtdProdutoEdit.value = "1";
    vlUnitarioEdit.value = "";
    
    renderizarItensEdicao();
}

// ==========================================================================
// FUNÇÃO DE RENDERIZAÇÃO DA TABELA PRINCIPAL E SEU FILTRO LOCAL (IN-MEMORY)
// ==========================================================================
async function carregarOrcamentos() {
    const { data, error } = await supabaseClient.from("orcamento").select("*").order("orcamentoid", { ascending: true });

    if (error) {
        if (tabelaOrcamentos) tabelaOrcamentos.innerHTML = `<tr><td colspan="6" class="txt-center">Erro ao buscar orçamentos.</td></tr>`;
        return;
    }

    // Salva os dados originais brutos na nossa variável de memória
    orcamentosOriginais = data || [];

    // Renderiza inicialmente com tudo carregado
    renderizarTabelaOrcamentos(orcamentosOriginais);
}

function renderizarTabelaOrcamentos(listaDeOrcamentos) {
    if (!tabelaOrcamentos) return;

    tabelaOrcamentos.innerHTML = "";

    if (listaDeOrcamentos.length === 0) {
        tabelaOrcamentos.innerHTML = `<tr><td colspan="6" class="txt-center">Nenhum orçamento encontrado.</td></tr>`;
        return;
    }

    listaDeOrcamentos.forEach(function (orc) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${orc.orcamentoid}</td>
            <td>${clienteMap[orc.clienteid] || "Não Identificado"}</td>
            <td>${formatarDataBancoParaBR(orc.dt_orcamento)}</td>
            <td>${formatarDataBancoParaBR(orc.dt_validade_orcamento)}</td>
            <td>${parseFloat(orc.vl_total_orcamento).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
            <td class="coluna-acoes"></td>
        `;

        const btnImprimir = document.createElement("button");
        btnImprimir.textContent = "Imprimir";
        btnImprimir.className = "btn-imprimir";
        btnImprimir.type = "button";
        btnImprimir.addEventListener("click", () => prepararImpressao(orc));

        const btnEdit = document.createElement("button");
        btnEdit.textContent = "Editar";
        btnEdit.className = "btn-editar";
        btnEdit.type = "button";
        btnEdit.addEventListener("click", () => prepararEdicao(orc));

        const btnDel = document.createElement("button");
        btnDel.textContent = "Excluir";
        btnDel.className = "btn-excluir";
        btnDel.type = "button";
        btnDel.addEventListener("click", () => excluirOrcamento(orc));

        tr.querySelector(".coluna-acoes").appendChild(btnImprimir);
        tr.querySelector(".coluna-acoes").appendChild(btnEdit);
        tr.querySelector(".coluna-acoes").appendChild(btnDel);
        tabelaOrcamentos.appendChild(tr);
    });
}

function filtrarOrcamentos() {
    const termoId = document.getElementById("buscaId").value.trim();
    const termoCliente = document.getElementById("buscaCliente").value.toLowerCase().trim();

    // Filtra cruzando Código e Nome do Cliente de maneira combinada
    const orcamentosFiltrados = orcamentosOriginais.filter(orc => {
        const bateId = termoId === "" || orc.orcamentoid.toString() === termoId;
        
        // Traduz o ID do cliente usando o mapa populado na inicialização
        const nomeDoCliente = (clienteMap[orc.clienteid] || "").toLowerCase();
        const bateCliente = termoCliente === "" || nomeDoCliente.includes(termoCliente);
        
        return bateId && bateCliente;
    });

    // Renderiza de volta os elementos calculados localmente
    renderizarTabelaOrcamentos(orcamentosFiltrados);
}

// ==========================================================================
// CONTINUAÇÃO: MÓDULOS DE EDICAO E SUB-TABELAS
// ==========================================================================
function removerItemListaEdit(index) {
    itensOrcamentoEdicao.splice(index, 1);
    renderizarItensEdicao();
}

function renderizarItensEdicao() {
    tabelaItensEdit.innerHTML = "";
    let totalGeral = 0;
    
    itensOrcamentoEdicao.forEach((item, index) => {
        const qtd = parseFloat(item.qt_produto) || 0;
        const unitario = parseFloat(item.vl_unitario) || 0;
        const totalItem = qtd * unitario;
        
        item.vl_total = totalItem;
        totalGeral += totalItem;
        
        tabelaItensEdit.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${item.produtodesc}</td>
                <td>${item.qt_produto}</td>
                <td>R$ ${unitario.toFixed(2)}</td>
                <td>R$ ${totalItem.toFixed(2)}</td>
                <td><button type="button" style="background:#dc3545; color:white; border:none; padding:3px 8px; cursor:pointer;" onclick="removerItemListaEdit(${index})">X</button></td>
            </tr>
        `);
    });
    
    valorTotalInput.value = totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ==========================================================================
// PERSISTÊNCIA DOS DADOS - CRUD MESTRE-DETALHE
// ==========================================================================
async function salvarNovoOrcamentoComItens() {
    const clienteId = selectClienteCad.value;
    const dtO = dataOrcamentoCad.value;
    const dtV = dataValidadeCad.value;
    
    if(!clienteId || !dtO || !dtV || itensOrcamentoCadastro.length === 0) {
        return alert("Por favor preencha o cabeçalho e insira ao menos 1 produto!");
    }

    const totalGeral = itensOrcamentoCadastro.reduce((acc, current) => acc + current.vl_total, 0);

    // 1. Grava o Cabeçalho na tabela 'orcamento'
    const { data: novoOrc, error: errOrc } = await supabaseClient.from("orcamento").insert([{
        clienteid: parseInt(clienteId),
        dt_orcamento: dtO,
        dt_validade_orcamento: dtV,
        vl_total_orcamento: totalGeral
    }]).select().single();

    if(errOrc) return alert("Erro ao gerar cabeçalho: " + errOrc.message);

    // 2. Grava os itens na tabela 'orcamento_item' gerando sequencial numérico
    const itensProntosParaBanco = itensOrcamentoCadastro.map((item, index) => ({
        orcamentoid: novoOrc.orcamentoid,
        orcamentoitemid: index + 1,
        produtoid: item.produtoid,
        produtodesc: item.produtodesc,
        qt_produto: item.qt_produto,
        vl_unitario: item.vl_unitario,
        vl_total: item.vl_total
    }));

    const { error: errItens } = await supabaseClient.from("orcamento_item").insert(itensProntosParaBanco);

    if(errItens) {
        alert("Orçamento gerado, mas houve falha ao salvar produtos: " + errItens.message);
    } else {
        alert("Orçamento completo salvo com sucesso!");
        fecharModal();
        carregarOrcamentos();
    }
}

async function prepararEdicao(orc) {
    orcamentoIdInput.value = orc.orcamentoid;
    txtOrcamentoIdEdicao.textContent = orc.orcamentoid;
    selectClienteInput.value = orc.clienteid;
    dataOrcamentoInput.value = orc.dt_orcamento ? orc.dt_orcamento.substring(0, 10) : "";
    dataValidadeInput.value = orc.dt_validade_orcamento ? orc.dt_validade_orcamento.substring(0, 10) : "";
    
    // Busca os produtos pertencentes a este orçamento da tabela 'orcamento_item'
    const { data: itensDoBanco } = await supabaseClient.from("orcamento_item").select("*").eq("orcamentoid", orc.orcamentoid);
    
    // Converte os tipos numéricos (numeric do banco -> float do JS)
    itensOrcamentoEdicao = (itensDoBanco || []).map(item => ({
        produtoid: parseInt(item.produtoid),
        produtodesc: item.produtodesc,
        qt_produto: parseFloat(item.qt_produto),
        vl_unitario: parseFloat(item.vl_unitario),
        vl_total: parseFloat(item.vl_total)
    }));
    
    // Renderiza a tabela e calcula o valor total na tela
    renderizarItensEdicao();
    
    areaEdicao.style.display = "block";
    window.scrollTo(0, document.body.scrollHeight);
}

function cancelarEdicao() {
    areaEdicao.style.display = "none";
    itensOrcamentoEdicao = [];
}

async function salvarEdicaoOrcamentoComItens() {
    const id = orcamentoIdInput.value;
    const totalGeral = itensOrcamentoEdicao.reduce((acc, curr) => acc + curr.vl_total, 0);

    // 1. Atualiza cabeçalho com novo valor total recalculado
    await supabaseClient.from("orcamento").update({
        clienteid: parseInt(selectClienteInput.value),
        dt_orcamento: dataOrcamentoInput.value,
        dt_validade_orcamento: dataValidadeInput.value,
        vl_total_orcamento: totalGeral
    }).eq("orcamentoid", id);

    // 2. Remove os itens antigos da tabela 'orcamento_item'
    await supabaseClient.from("orcamento_item").delete().eq("orcamentoid", id);

    // 3. Insere a nova lista atualizada e sequenciada
    const itensNovos = itensOrcamentoEdicao.map((item, index) => ({
        orcamentoid: parseInt(id),
        orcamentoitemid: index + 1,
        produtoid: item.produtoid,
        produtodesc: item.produtodesc,
        qt_produto: item.qt_produto,
        vl_unitario: item.vl_unitario,
        vl_total: item.vl_total
    }));

    await supabaseClient.from("orcamento_item").insert(itensNovos);

    alert("Orçamento atualizado e recalculado com sucesso!");
    cancelarEdicao();
    carregarOrcamentos();
}

async function excluirOrcamento(orc) {
    if (!confirm(`Deseja deletar o orçamento nº ${orc.orcamentoid}? Todos os itens sumirão.`)) return;

    // Remove itens antes da tabela 'orcamento_item' por conta do vínculo de chave estrangeira
    await supabaseClient.from("orcamento_item").delete().eq("orcamentoid", orc.orcamentoid);
    await supabaseClient.from("orcamento").delete().eq("orcamentoid", orc.orcamentoid);

    alert("Excluído com sucesso!");
    carregarOrcamentos();
}

// ==========================================================================
// MÓDULO DE IMPRESSÃO DE ORÇAMENTO
// ==========================================================================
async function prepararImpressao(orc) {
    // 1. Preenche o cabeçalho do documento utilizando a função segura de formatação
    document.getElementById("printOrcamentoId").textContent = orc.orcamentoid.toString().padStart(4, '0');
    document.getElementById("printCliente").textContent = clienteMap[orc.clienteid] || "Cliente Não Identificado";
    document.getElementById("printData").textContent = formatarDataBancoParaBR(orc.dt_orcamento);
    document.getElementById("printValidade").textContent = formatarDataBancoParaBR(orc.dt_validade_orcamento);

    // 2. Busca os produtos deste orçamento no banco
    const printItens = document.getElementById("printItens");
    printItens.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 10px;">Carregando produtos...</td></tr>`;
    
    const { data: itens, error } = await supabaseClient.from("orcamento_item").select("*").eq("orcamentoid", orc.orcamentoid);

    if (error) {
        alert("Erro ao buscar os itens do orçamento para impressão.");
        return;
    }

    // 3. Preenche a tabela de itens do documento
    printItens.innerHTML = "";
    let totalGeral = 0;

    if (itens && itens.length > 0) {
        itens.forEach(item => {
            const qtd = parseFloat(item.qt_produto) || 0;
            const unitario = parseFloat(item.vl_unitario) || 0;
            const totalItem = parseFloat(item.vl_total) || (qtd * unitario);
            totalGeral += totalItem;

            printItens.innerHTML += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #cbd5e1;">${item.produtodesc}</td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1;">${qtd}</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">R$ ${unitario.toFixed(2)}</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">R$ ${totalItem.toFixed(2)}</td>
                </tr>
            `;
        });
    } else {
        printItens.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 10px; border: 1px solid #cbd5e1;">Nenhum produto registrado.</td></tr>`;
    }

    // 4. Preenche o total geral e aciona a tela de impressão do navegador
    document.getElementById("printTotalGeral").textContent = totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    
    // Pequeno delay para garantir que o DOM foi renderizado com os dados antes de imprimir
    setTimeout(() => {
        window.print();
    }, 100);
}