// ==========================================================================
// MAPEAMENTO GLOBAL DOS ELEMENTOS E ARMAZENAMENTO DE DADOS
// ==========================================================================
let selectCategoriaCadastro, selectCategoriaEdicao, tabelaProdutos, areaEdicao;
let produtoIdInput, descProdutoInput, valorProdutoInput, statusProdutoEdicaoInput;

// Matriz global para reter os dados brutos salvos no banco de dados
let produtosOriginais = [];

// Garante que o mapeamento e as buscas rodem apenas após o HTML estar renderizado
document.addEventListener("DOMContentLoaded", function() {
    selectCategoriaCadastro = document.getElementById("categoriaProduto");
    selectCategoriaEdicao = document.getElementById("categoriaId");
    tabelaProdutos = document.getElementById("tabelaProdutos");
    areaEdicao = document.getElementById("areaEdicao");
    
    produtoIdInput = document.getElementById("produtoId");
    descProdutoInput = document.getElementById("descProduto");
    valorProdutoInput = document.getElementById("valorProduto");
    statusProdutoEdicaoInput = document.getElementById("statusProdutoEdicao");

    // Gatilhos iniciais de carregamento
    carregarCategoriasNosDropdowns();
    carregarProdutos();
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
    document.getElementById("dsProduto").value = "";
    if (selectCategoriaCadastro) selectCategoriaCadastro.value = "";
    document.getElementById("vlVenda").value = "";
    document.getElementById("obsProduto").value = "";
    document.getElementById("statusProduto").value = "ATIVO";
}

// ==========================================================================
// BUSCA E PREENCHE OS DROPDOWNS DE CATEGORIA (CADASTRO E EDIÇÃO)
// ==========================================================================
async function carregarCategoriasNosDropdowns() {
    const { data, error } = await supabaseClient
        .from("categoria_produto")
        .select("categoriaprodutoid, ds_categoria_produto")
        .order("categoriaprodutoid", { ascending: true });

    if (error) {
        console.error("Erro ao buscar categorias:", error);
        if (selectCategoriaCadastro) selectCategoriaCadastro.innerHTML = '<option value="">Erro ao carregar</option>';
        return;
    }

    // Preenche Dropdown do Cadastro
    if (selectCategoriaCadastro) {
        selectCategoriaCadastro.innerHTML = '<option value="">Selecione uma categoria...</option>';
        data.forEach(cat => {
            const opcao = document.createElement("option");
            opcao.value = cat.categoriaprodutoid;
            opcao.textContent = cat.ds_categoria_produto;
            selectCategoriaCadastro.appendChild(opcao);
        });
    }

    // Preenche Dropdown da Edição
    if (selectCategoriaEdicao) {
        selectCategoriaEdicao.innerHTML = '<option value="">Selecione uma categoria...</option>';
        data.forEach(cat => {
            const opcao = document.createElement("option");
            opcao.value = cat.categoriaprodutoid;
            opcao.textContent = cat.ds_categoria_produto;
            selectCategoriaEdicao.appendChild(opcao);
        });
    }
}

// ==========================================================================
// INSERIR PRODUTO (SALVA NO BANCO DE DADOS)
// ==========================================================================
async function adicionarProduto() {
    const inputDescricao = document.getElementById("dsProduto");
    const inputVlVenda = document.getElementById("vlVenda");
    const inputObs = document.getElementById("obsProduto");
    const selectStatus = document.getElementById("statusProduto");

    const descricao = inputDescricao.value.trim();
    const categoriaId = selectCategoriaCadastro.value;
    const valorVenda = inputVlVenda.value.trim();
    const observacao = inputObs.value.trim();
    const status = selectStatus.value;

    if (!descricao || !categoriaId || !valorVenda) {
        alert("Por favor, preencha a Descrição, Categoria e o Valor Unitário!");
        return;
    }

    const novoProduto = {
        ds_produto: descricao.toUpperCase(),
        categoriaprodutoid: parseInt(categoriaId),
        vl_venda_produto: parseFloat(valorVenda),
        obs_produto: observacao ? observacao.toUpperCase() : null,
        status_produto: status,
        dt_cadastro_produto: new Date().toISOString()
    };

    const { error } = await supabaseClient
        .from("produto")
        .insert([novoProduto]);

    if (error) {
        alert("Erro ao cadastrar produto: " + error.message);
        console.error(error);
    } else {
        alert("Produto cadastrado com sucesso!");
        fecharModal();
        carregarProdutos(); // Recarrega a tabela sincronizando com o banco
    }
}

// ==========================================================================
// LISTAR PRODUTOS (BUSCA ORIGINAL NO BANCO DE DADOS)
// ==========================================================================
async function carregarProdutos() {
    const { data, error } = await supabaseClient
        .from("produto") 
        .select(`
            produtoid, 
            categoriaprodutoid, 
            ds_produto,
            obs_produto, 
            vl_venda_produto,
            dt_cadastro_produto, 
            status_produto,
            categoria_produto ( ds_categoria_produto ) 
        `)
        .order("produtoid", { ascending: true });

    if (error) {
        if (tabelaProdutos) tabelaProdutos.innerHTML = `<tr><td colspan="8" class="txt-center">Erro ao carregar produtos.</td></tr>`;
        console.error(error);
        return;
    }

    // Armazena a resposta global do servidor localmente
    produtosOriginais = data || [];

    // Renderiza a listagem inicial
    renderizarTabelaProdutos(produtosOriginais);
}

// ==========================================================================
// FUNÇÃO DE RENDERIZAÇÃO DA TABELA (ISOLADA PARA PERMITIR FILTROS)
// ==========================================================================
function renderizarTabelaProdutos(listaDeProdutos) {
    if (!tabelaProdutos) return;

    tabelaProdutos.innerHTML = "";

    if (listaDeProdutos.length === 0) {
        tabelaProdutos.innerHTML = `<tr><td colspan="8" class="txt-center">Nenhum produto encontrado.</td></tr>`;
        return;
    }

    listaDeProdutos.forEach(function (produto) {
        const linha = document.createElement("tr");
        const nomeCategoria = produto.categoria_produto 
            ? produto.categoria_produto.ds_categoria_produto 
            : "Sem categoria";

        linha.innerHTML = `
            <td>${produto.produtoid}</td>
            <td>${nomeCategoria}</td>
            <td>${produto.ds_produto}</td>
            <td>${produto.obs_produto || ""}</td>
            <td>${formatarMoeda(produto.vl_venda_produto)}</td>
            <td>${formatarData(produto.dt_cadastro_produto)}</td>
            <td>${produto.status_produto}</td>
            <td class="coluna-acoes"></td>
        `;

        const botaoEditar = document.createElement("button");
        botaoEditar.textContent = "Editar";
        botaoEditar.className = "btn-editar";
        botaoEditar.type = "button";
        botaoEditar.addEventListener("click", function () {
            prepararEdicao(produto);
        });

        const botaoExcluir = document.createElement("button");
        botaoExcluir.textContent = "Excluir";
        botaoExcluir.className = "btn-excluir";
        botaoExcluir.type = "button";
        botaoExcluir.addEventListener("click", function () {
            excluirProduto(produto);
        });

        linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
        linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);
        tabelaProdutos.appendChild(linha);
    });
}

// ==========================================================================
// FUNÇÃO FILTRADORA (DISPARADA AO DIGITAR NOS INPUTS DE PESQUISA À DIREITA)
// ==========================================================================
function filtrarProdutos() {
    const termoId = document.getElementById("buscaId").value.trim();
    const termoDescricao = document.getElementById("buscaDescricao").value.toLowerCase().trim();

    // Filtra cruzando os dados dos dois inputs simultaneamente
    const produtosFiltrados = produtosOriginais.filter(produto => {
        const bateId = termoId === "" || produto.produtoid.toString() === termoId;
        const bateDescricao = termoDescricao === "" || produto.ds_produto.toLowerCase().includes(termoDescricao);
        
        return bateId && bateDescricao;
    });

    // Atualiza a tabela dinamicamente com o retorno filtrado
    renderizarTabelaProdutos(produtosFiltrados);
}

// ==========================================================================
// FUNÇÕES DE EDIÇÃO E EXCLUSÃO
// ==========================================================================
function prepararEdicao(produto) {
    if (produtoIdInput) produtoIdInput.value = produto.produtoid;
    if (selectCategoriaEdicao) selectCategoriaEdicao.value = produto.categoriaprodutoid;
    if (descProdutoInput) descProdutoInput.value = produto.ds_produto;
    if (valorProdutoInput) valorProdutoInput.value = produto.vl_venda_produto;
    if (statusProdutoEdicaoInput) statusProdutoEdicaoInput.value = produto.status_produto;

    if (areaEdicao) areaEdicao.style.display = "block";
    window.scrollTo(0, document.body.scrollHeight); // Rola a tela até o formulário de edição
}

function cancelarEdicao() {
    if (produtoIdInput) produtoIdInput.value = "";
    if (selectCategoriaEdicao) selectCategoriaEdicao.value = "";
    if (descProdutoInput) descProdutoInput.value = "";
    if (valorProdutoInput) valorProdutoInput.value = "";
    if (statusProdutoEdicaoInput) statusProdutoEdicaoInput.value = "ATIVO";

    if (areaEdicao) areaEdicao.style.display = "none";
}

async function salvarEdicao() {
    const id = produtoIdInput.value;
    if (!id) return;

    const dadosAtualizados = {
        categoriaprodutoid: parseInt(selectCategoriaEdicao.value),
        ds_produto: descProdutoInput.value.toUpperCase(), 
        vl_venda_produto: parseFloat(valorProdutoInput.value),
        status_produto: statusProdutoEdicaoInput.value
    };

    const { error } = await supabaseClient
        .from("produto") 
        .update(dadosAtualizados)
        .eq("produtoid", id); 

    if (error) {
        alert("Erro ao atualizar produto: " + error.message);
    } else {
        alert("Produto updated com sucesso!");
        cancelarEdicao();
        carregarProdutos(); 
    }
}

async function excluirProduto(produto) {
    const confirmacao = confirm(`Tem certeza que deseja excluir o produto: ${produto.ds_produto}?`);
    if (!confirmacao) return;

    const { error } = await supabaseClient
        .from("produto") 
        .delete()
        .eq("produtoid", produto.produtoid); 

    if (error) {
        alert("Erro ao excluir: Esta sendo utilizado no orçamento");
        return;
    }

    alert("Produto excluído com sucesso!");
    carregarProdutos();
}

// ==========================================================================
// FUNÇÕES AUXILIARES DE FORMATAÇÃO
// ==========================================================================
function formatarMoeda(valor) {
    if (!valor) return "R$ 0,00";
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataIso) {
    if (!dataIso) return "";
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR') + " " + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}