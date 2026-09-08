// ==========================================================================
// MAPEAMENTO GLOBAL DOS ELEMENTOS E ARMAZENAMENTO DE DADOS
// ==========================================================================
let tabelaCategorias, areaEdicao;
let categoriaIdInput, idCategoriaVisivel, nomeCategoriaInput;

// Matriz global para reter os dados salvos vindo do Supabase
let categoriasOriginais = [];

// Proteção para inicialização segura do DOM
document.addEventListener("DOMContentLoaded", function() {
    tabelaCategorias = document.getElementById("tabelaCategorias");
    areaEdicao = document.getElementById("areaEdicao");

    categoriaIdInput = document.getElementById("categoriaId");
    idCategoriaVisivel = document.getElementById("idCategoriaVisivel");
    nomeCategoriaInput = document.getElementById("nomeCategoria");

    // Inicializa a listagem trazendo os registros do banco de dados
    carregarCategorias();
});

// ==========================================================================
// FUNÇÕES DE CONTROLE DO MODAL DE CADASTRO
// ==========================================================================
function abrirModal() {
    document.getElementById("modalCadastro").style.display = "flex";
}

function fecharModal() {
    document.getElementById("modalCadastro").style.display = "none";
    const inputDescricao = document.getElementById("descricao");
    if (inputDescricao) inputDescricao.value = "";
}

// ==========================================================================
// FUNÇÃO PARA ADICIONAR NOVA CATEGORIA
// ==========================================================================
async function adicionarCategoria() {
    const inputDescricao = document.getElementById("descricao");
    const textoDescricao = inputDescricao.value.trim();

    if (!textoDescricao) {
        alert("Por favor, digite uma descrição para a categoria!");
        return;
    }

    const { error } = await supabaseClient
        .from("categoria_produto")
        .insert([
            { ds_categoria_produto: textoDescricao.toUpperCase() }
        ]);

    if (error) {
        alert("Erro ao salvar categoria: " + error.message);
        console.error(error);
    } else {
        alert("Categoria cadastrada com sucesso!");
        fecharModal();
        carregarCategorias(); // Recarrega os dados do banco para atualizar a memória global
    }
}

// ==========================================================================
// FUNÇÃO PRINCIPAL (BUSCA ORIGINAL NO BANCO DE DADOS)
// ==========================================================================
async function carregarCategorias() {
    const { data, error } = await supabaseClient
        .from("categoria_produto")
        .select("categoriaprodutoid, ds_categoria_produto")
        .order("categoriaprodutoid", { ascending: true });

    if (error) {
        if (tabelaCategorias) tabelaCategorias.innerHTML = `<tr><td colspan="3" class="txt-center">Erro ao carregar categorias.</td></tr>`;
        console.error(error);
        return;
    }

    // Grava os dados do banco na nossa lista de persistência local
    categoriasOriginais = data || [];

    // Renderiza a lista na tabela
    renderizarTabelaCategorias(categoriasOriginais);
}

// ==========================================================================
// FUNÇÃO DE RENDERIZAÇÃO DA TABELA (ISOLADA PARA PERMITIR FILTRAGEM INSTANTÂNEA)
// ==========================================================================
function renderizarTabelaCategorias(listaDeCategorias) {
    if (!tabelaCategorias) return;

    tabelaCategorias.innerHTML = "";

    if (listaDeCategorias.length === 0) {
        tabelaCategorias.innerHTML = `<tr><td colspan="3" class="txt-center">Nenhuma categoria encontrada.</td></tr>`;
        return;
    }

    listaDeCategorias.forEach(function (categoria) {
        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${categoria.categoriaprodutoid}</td>
            <td>${categoria.ds_categoria_produto}</td>
            <td class="coluna-acoes"></td>
        `;

        const botaoEditar = document.createElement("button");
        botaoEditar.textContent = "Editar";
        botaoEditar.className = "btn-editar";
        botaoEditar.type = "button";
        botaoEditar.addEventListener("click", function () {
            prepararEdicao(categoria);
        });

        const botaoExcluir = document.createElement("button");
        botaoExcluir.textContent = "Excluir";
        botaoExcluir.className = "btn-excluir";
        botaoExcluir.type = "button";
        botaoExcluir.addEventListener("click", function () {
            excluirCategoria(categoria);
        });

        linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
        linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);

        tabelaCategorias.appendChild(linha);
    });
}

// ==========================================================================
// FUNÇÃO COORDENADORA DE FILTRO CRUZA ID E DESCRIÇÃO SIMULTANEAMENTE
// ==========================================================================
function filtrarCategorias() {
    const termoId = document.getElementById("buscaId").value.trim();
    const termoDescricao = document.getElementById("buscaDescricao").value.toLowerCase().trim();

    // Filtra dinamicamente a nossa cópia em memória
    const categoriasFiltradas = categoriasOriginais.filter(categoria => {
        const bateId = termoId === "" || categoria.categoriaprodutoid.toString() === termoId;
        const bateDescricao = termoDescricao === "" || categoria.ds_categoria_produto.toLowerCase().includes(termoDescricao);
        
        return bateId && bateDescricao;
    });

    // Atualiza o corpo do HTML apenas com o resultado filtrado
    renderizarTabelaCategorias(categoriasFiltradas);
}

// ==========================================================================
// FUNÇÕES DE EDIÇÃO E EXCLUSÃO
// ==========================================================================
function prepararEdicao(categoria) {
    if (categoriaIdInput) categoriaIdInput.value = categoria.categoriaprodutoid;
    if (idCategoriaVisivel) idCategoriaVisivel.value = categoria.categoriaprodutoid;
    if (nomeCategoriaInput) nomeCategoriaInput.value = categoria.ds_categoria_produto;

    if (areaEdicao) areaEdicao.style.display = "block";
    window.scrollTo(0, document.body.scrollHeight); 
}

function cancelarEdicao() {
    if (categoriaIdInput) categoriaIdInput.value = "";
    if (idCategoriaVisivel) idCategoriaVisivel.value = "";
    if (nomeCategoriaInput) nomeCategoriaInput.value = "";

    if (areaEdicao) areaEdicao.style.display = "none";
}

async function salvarEdicao() {
    const id = categoriaIdInput.value;

    if (!id) {
        alert("Nenhuma categoria selecionada.");
        return;
    }

    const dadosAtualizados = {
        ds_categoria_produto: nomeCategoriaInput.value
    };

    const { error } = await supabaseClient
        .from("categoria_produto")
        .update(dadosAtualizados)
        .eq("categoriaprodutoid", id);

    if (error) {
        alert("Erro ao atualizar categoria: " + error.message);
    } else {
        alert("Categoria atualizada com sucesso!");
        cancelarEdicao();
        carregarCategorias();
    }
}

async function excluirCategoria(categoria) {
    const confirmacao = confirm(`Tem certeza que deseja excluir a categoria: ${categoria.ds_categoria_produto}?`);
    if (!confirmacao) return;

    const { error } = await supabaseClient
        .from("categoria_produto")
        .delete()
        .eq("categoriaprodutoid", categoria.categoriaprodutoid);

    if (error) {
        alert("Erro ao excluir: Produtos adicionados na categoria");
        return;
    }

    alert("Categoria excluída com sucesso!");
    carregarCategorias();
}