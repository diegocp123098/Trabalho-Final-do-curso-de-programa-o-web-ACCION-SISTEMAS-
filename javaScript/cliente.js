// ==========================================================================
// MAPEAMENTO GLOBAL DOS ELEMENTOS E ARMAZENAMENTO DE DADOS
// ==========================================================================
let tabelaClientes, areaEdicao;
let clienteIdInput, tipoClienteInput, cpfCnpjClienteInput, nomeClienteInput;
let nomeClienteCad, cpfCnpjClienteCad, tipoClienteCad;

// Matriz global para reter os dados brutos salvos no banco de dados
let clientesOriginais = [];

// Proteção do DOMContentLoaded para inicialização segura
document.addEventListener("DOMContentLoaded", function() {
    tabelaClientes = document.getElementById("tabelaClientes");
    areaEdicao = document.getElementById("areaEdicao");
    
    // Mapeamento dos inputs da área de edição
    clienteIdInput = document.getElementById("clienteId");
    tipoClienteInput = document.getElementById("tipoCliente");
    cpfCnpjClienteInput = document.getElementById("cpfCnpjCliente");
    nomeClienteInput = document.getElementById("nomeCliente");

    // Mapeamento dos inputs do modal de cadastro
    nomeClienteCad = document.getElementById("nomeClienteCad");
    cpfCnpjClienteCad = document.getElementById("cpfCnpjClienteCad");
    tipoClienteCad = document.getElementById("tipoClienteCad");

    // Máscara automática CPF/CNPJ no cadastro
    if (cpfCnpjClienteCad) {
        cpfCnpjClienteCad.addEventListener("input", function () {
            aplicarMascaraCpfCnpj(this, tipoClienteCad);
        });
    }

    // Máscara automática CPF/CNPJ na edição
    if (cpfCnpjClienteInput) {
        cpfCnpjClienteInput.addEventListener("input", function () {
            aplicarMascaraCpfCnpj(this, tipoClienteInput);
        });
    }

    // Inicializa listando os clientes da tabela
    carregarClientes();
});

// ==========================================================================
// FUNÇÕES DE CONTROLE DA JANELA SOBREPOSTA (MODAL)
// ==========================================================================
function abrirModal() {
    document.getElementById("modalCadastro").style.display = "flex";
}

function fecharModal() {
    document.getElementById("modalCadastro").style.display = "none";
    // Limpa o formulário de cadastro após fechar
    if (nomeClienteCad) nomeClienteCad.value = "";
    if (cpfCnpjClienteCad) cpfCnpjClienteCad.value = "";
    if (tipoClienteCad) tipoClienteCad.value = "";
}

// ==========================================================================
// FUNÇÃO PARA ADICIONAR CLIENTE
// ==========================================================================
async function adicionarCliente() {
    const nome = nomeClienteCad.value.trim();
    const cpfCnpj = cpfCnpjClienteCad.value.replace(/\D/g, "");
    const tipo = tipoClienteCad.value;

    if (!nome || !cpfCnpj || !tipo) {
        alert("Por favor, preencha todos os campos antes de cadastrar.");
        return;
    }

    const novoCliente = {
        nome_cliente: nome, 
        cpf_cnpj_cliente: cpfCnpj,
        tipo_cliente: tipo 
    };

    const { error } = await supabaseClient
        .from("cliente")
        .insert([novoCliente]);

    if (error) {
        alert("Erro ao cadastrar cliente: " + error.message);
        console.error(error);
    } else {
        alert("Cliente cadastrado com sucesso!");
        fecharModal();
        carregarClientes(); // Recarrega do banco para trazer os dados atualizados
    }
}

// ==========================================================================
// FUNÇÃO PRINCIPAL (BUSCA DADOS DO SUPABASE)
// ==========================================================================
async function carregarClientes() {
    const { data, error } = await supabaseClient
        .from("cliente")
        .select("clienteid, tipo_cliente, cpf_cnpj_cliente, nome_cliente")
        .order("clienteid", { ascending: true });

    if (error) {
        if (tabelaClientes) tabelaClientes.innerHTML = `<tr><td colspan="5" class="txt-center">Erro ao carregar clientes.</td></tr>`;
        alert("Erro ao buscar clientes: " + error.message);
        return;
    }

    // Armazena a resposta bruta do servidor na memória local
    clientesOriginais = data || [];

    // Renderiza a tabela inicial passando todos os clientes carregados
    renderizarTabelaClientes(clientesOriginais);
}

// ==========================================================================
// FUNÇÃO DE RENDERIZAÇÃO DA TABELA (ISOLADA PARA PERMITIR FILTROS RÁPIDOS)
// ==========================================================================
function renderizarTabelaClientes(listaDeClientes) {
    if (!tabelaClientes) return;

    tabelaClientes.innerHTML = "";

    if (listaDeClientes.length === 0) {
        tabelaClientes.innerHTML = `<tr><td colspan="5" class="txt-center">Nenhum cliente encontrado.</td></tr>`;
        return;
    }

    listaDeClientes.forEach(function (cliente) {
        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${cliente.clienteid}</td>
            <td>${formatarTipoCliente(cliente.tipo_cliente)}</td>
            <td>${formatarCpfCnpj(cliente.cpf_cnpj_cliente)}</td>
            <td>${cliente.nome_cliente}</td>
            <td class="coluna-acoes"></td>
        `;

        const botaoEditar = document.createElement("button");
        botaoEditar.textContent = "Editar";
        botaoEditar.className = "btn-editar";
        botaoEditar.type = "button";
        botaoEditar.addEventListener("click", function () {
            prepararEdicao(cliente);
        });

        const botaoExcluir = document.createElement("button");
        botaoExcluir.textContent = "Excluir";
        botaoExcluir.className = "btn-excluir";
        botaoExcluir.type = "button";
        botaoExcluir.addEventListener("click", function () {
            excluirCliente(cliente);
        });

        linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
        linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);
        tabelaClientes.appendChild(linha);
    });
}

// ==========================================================================
// FUNÇÃO FILTRADORA (DISPARADA AO DIGITAR NOS INPUTS DE PESQUISA)
// ==========================================================================
function filtrarClientes() {
    const termoId = document.getElementById("buscaId").value.trim();
    const termoNome = document.getElementById("buscaNome").value.toLowerCase().trim();

    // Filtra a matriz base cruzando os valores de ambos os campos
    const clientesFiltrados = clientesOriginais.filter(cliente => {
        const bateId = termoId === "" || cliente.clienteid.toString() === termoId;
        const bateNome = termoNome === "" || cliente.nome_cliente.toLowerCase().includes(termoNome);
        
        return bateId && bateNome;
    });

    // Atualiza a tabela dinamicamente com o resultado refinado
    renderizarTabelaClientes(clientesFiltrados);
}

// ==========================================================================
// FUNÇÕES DE EDIÇÃO E EXCLUSÃO
// ==========================================================================
function prepararEdicao(cliente) {
    if (clienteIdInput) clienteIdInput.value = cliente.clienteid;
    if (tipoClienteInput) tipoClienteInput.value = cliente.tipo_cliente;
    if (cpfCnpjClienteInput) {
        cpfCnpjClienteInput.value = formatarCpfCnpj(cliente.cpf_cnpj_cliente);
    }
    if (nomeClienteInput) nomeClienteInput.value = cliente.nome_cliente;

    if (areaEdicao) areaEdicao.style.display = "block";
    window.scrollTo(0, document.body.scrollHeight); // Desce a rolagem até o painel de edição
}

function cancelarEdicao() {
    if (clienteIdInput) clienteIdInput.value = "";
    if (tipoClienteInput) tipoClienteInput.value = "";
    if (cpfCnpjClienteInput) cpfCnpjClienteInput.value = "";
    if (nomeClienteInput) nomeClienteInput.value = "";

    if (areaEdicao) areaEdicao.style.display = "none";
}

async function salvarEdicao() {
    const id = clienteIdInput.value;
    const tipo = tipoClienteInput.value;
    const cpfCnpj = cpfCnpjClienteInput.value.replace(/\D/g, "");
    const nome = nomeClienteInput.value;

    if (!id) {
        alert("Nenhum cliente selecionado para edição.");
        return;
    }

    const { error } = await supabaseClient
        .from("cliente")
        .update({ 
            tipo_cliente: tipo, 
            cpf_cnpj_cliente: cpfCnpj, 
            nome_cliente: nome 
        })
        .eq("clienteid", id); 

    if (error) {
        alert("Erro ao atualizar: " + error.message);
    } else {
        alert("Cliente atualizado com sucesso!");
        cancelarEdicao();
        carregarClientes(); // Recarrega os dados atualizados para sincronizar
    }
}

async function excluirCliente(cliente) {
    const confirmacao = confirm(`Tem certeza que deseja excluir o cliente ${cliente.nome_cliente}?`);
    if (!confirmacao) return;

    const { error } = await supabaseClient
        .from("cliente")
        .delete()
        .eq("clienteid", cliente.clienteid); 

    if (error) {
        alert("Erro ao excluir: Utilizado em orçamento");
        return;
    }

    alert("Cliente excluído com sucesso!");
    carregarClientes();
}

// ==========================================================================
// FUNÇÕES AUXILIARES DE FORMATAÇÃO
// ==========================================================================
function formatarTipoCliente(tipo) {
    return tipo ? tipo : "Não informado";
}

function aplicarMascaraCpfCnpj(campo, campoTipo) {
    let valor = campo.value.replace(/\D/g, "");

    if (valor.length <= 11) {
        valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
        valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
        valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

        if (campoTipo) campoTipo.value = "F";
    } else {
        valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
        valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");
        valor = valor.replace(/(\d{4})(\d)/, "$1-$2");

        if (campoTipo) campoTipo.value = "J";
    }

    campo.value = valor;
}

function formatarCpfCnpj(valor) {
    if (!valor) return "";

    valor = valor.toString().replace(/\D/g, "");

    if (valor.length === 11) {
        return valor.replace(
            /(\d{3})(\d{3})(\d{3})(\d{2})/,
            "$1.$2.$3-$4"
        );
    }

    if (valor.length === 14) {
        return valor.replace(
            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
            "$1.$2.$3/$4-$5"
        );
    }

    return valor;
}