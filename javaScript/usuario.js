// Nome da tabela no banco (ajuste se no seu banco estiver no plural, ex: "usuarios")
const NOME_TABELA = "usuarios"; 

// ==========================================================================
// MAPEAMENTO GLOBAL DOS ELEMENTOS E ARMAZENAMENTO DE DADOS
// ==========================================================================
let tabelaUsuarios, areaEdicao;
let usuarioIdInput, loginUserEdicao, nomeUserEdicao, senhaUserEdicao;
let loginUserCad, nomeUserCad, senhaUserCad;

// Matriz global para reter os dados brutos vindos do Supabase
let usuariosOriginais = [];

document.addEventListener("DOMContentLoaded", function() {
    tabelaUsuarios = document.getElementById("tabelaUsuarios");
    areaEdicao = document.getElementById("areaEdicao");
    
    // Inputs da Edição
    usuarioIdInput = document.getElementById("usuarioId");
    loginUserEdicao = document.getElementById("loginUserEdicao");
    nomeUserEdicao = document.getElementById("nomeUserEdicao");
    senhaUserEdicao = document.getElementById("senhaUserEdicao");

    // Inputs do Cadastro
    loginUserCad = document.getElementById("loginUserCad");
    nomeUserCad = document.getElementById("nomeUserCad");
    senhaUserCad = document.getElementById("senhaUserCad");

    carregarUsuarios();
});

// ==========================================================================
// CONTROLE DO MODAL
// ==========================================================================
function abrirModal() {
    document.getElementById("modalUsuario").style.display = "flex";
}

function fecharModal() {
    document.getElementById("modalUsuario").style.display = "none";
    // Limpa os campos
    if (loginUserCad) loginUserCad.value = "";
    if (nomeUserCad) nomeUserCad.value = "";
    if (senhaUserCad) senhaUserCad.value = "";
}

// ==========================================================================
// ADICIONAR (CREATE) - Com validação de duplicados
// ==========================================================================
async function adicionarUsuario() {
    const login = loginUserCad.value.trim().toUpperCase(); // Padroniza para maiúsculo
    const nome = nomeUserCad.value.trim().toUpperCase();
    const senha = senhaUserCad.value.trim();

    if (!login || !nome || !senha) {
        alert("Por favor, preencha todos os campos!");
        return;
    }

    // --- VALIDAÇÃO: Evita duplicados no cadastro ---
    const { data: usuarioExistente, error: erroBusca } = await supabaseClient
        .from(NOME_TABELA)
        .select("id")
        .ilike("usuario", login)
        .maybeSingle();

    if (erroBusca) {
        alert("Erro ao verificar disponibilidade do usuário: " + erroBusca.message);
        return;
    }

    if (usuarioExistente) {
        alert("Desculpe, este nome de usuário já está cadastrado!");
        return; 
    }

    const novoUser = {
        usuario: login,
        nome_completo: nome,
        senha: senha
    };

    const { error } = await supabaseClient
        .from(NOME_TABELA)
        .insert([novoUser]);

    if (error) {
        alert("Erro ao cadastrar: " + error.message);
        console.error(error);
    } else {
        alert("Usuário cadastrado com sucesso!");
        fecharModal();
        carregarUsuarios(); // Atualiza a memória local sincronizando com o banco
    }
}

// ==========================================================================
// LISTAR (READ) - Busca original do Banco de Dados
// ==========================================================================
async function carregarUsuarios() {
    // Trazemos tudo, EXCETO a senha!
    const { data, error } = await supabaseClient
        .from(NOME_TABELA)
        .select("id, usuario, nome_completo")
        .order("id", { ascending: true });

    if (error) {
        if (tabelaUsuarios) tabelaUsuarios.innerHTML = `<tr><td colspan="4" class="txt-center">Erro ao carregar usuários.</td></tr>`;
        console.error(error);
        return;
    }

    // Aloca a resposta do servidor na nossa lista persistente em cache local
    usuariosOriginais = data || [];

    // Renderiza a tabela inicial
    renderizarTabelaUsuarios(usuariosOriginais);
}

// ==========================================================================
// FUNÇÃO DE RENDERIZAÇÃO DA TABELA (ISOLADA PARA PERMITIR FILTROS)
// ==========================================================================
function renderizarTabelaUsuarios(listaDeUsuarios) {
    if (!tabelaUsuarios) return;

    tabelaUsuarios.innerHTML = "";

    if (listaDeUsuarios.length === 0) {
        tabelaUsuarios.innerHTML = `<tr><td colspan="4" class="txt-center">Nenhum usuário encontrado.</td></tr>`;
        return;
    }

    listaDeUsuarios.forEach(function (user) {
        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${user.id}</td>
            <td>${user.usuario}</td>
            <td>${user.nome_completo}</td>
            <td class="coluna-acoes"></td>
        `;

        const botaoEditar = document.createElement("button");
        botaoEditar.textContent = "Editar";
        botaoEditar.className = "btn-editar";
        botaoEditar.type = "button";
        botaoEditar.addEventListener("click", function () {
            prepararEdicao(user);
        });

        const botaoExcluir = document.createElement("button");
        botaoExcluir.textContent = "Excluir";
        botaoExcluir.className = "btn-excluir";
        botaoExcluir.type = "button";
        botaoExcluir.addEventListener("click", function () {
            excluirUsuario(user);
        });

        linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
        linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);
        tabelaUsuarios.appendChild(linha);
    });
}

// ==========================================================================
// FUNÇÃO FILTRADORA (DISPARADA AO DIGITAR NOS INPUTS DE PESQUISA À DIREITA)
// ==========================================================================
function filtrarUsuarios() {
    const termoId = document.getElementById("buscaId").value.trim();
    const termoNome = document.getElementById("buscaNome").value.toLowerCase().trim();

    // Filtra cruzando ID e (Login ou Nome Completo) simultaneamente
    const usuariosFiltrados = usuariosOriginais.filter(user => {
        const bateId = termoId === "" || user.id.toString() === termoId;
        
        // Permite buscar tanto digitando o login (Ex: ADMIN) quanto o nome completo
        const bateNome = termoNome === "" || 
                         user.usuario.toLowerCase().includes(termoNome) || 
                         user.nome_completo.toLowerCase().includes(termoNome);
        
        return bateId && bateNome;
    });

    // Atualiza o corpo do HTML apenas com os registros filtrados
    renderizarTabelaUsuarios(usuariosFiltrados);
}

// ==========================================================================
// EDITAR (UPDATE)
// ==========================================================================
function prepararEdicao(user) {
    if (usuarioIdInput) usuarioIdInput.value = user.id;
    if (loginUserEdicao) loginUserEdicao.value = user.usuario;
    if (nomeUserEdicao) nomeUserEdicao.value = user.nome_completo;
    if (senhaUserEdicao) senhaUserEdicao.value = ""; // Senha sempre em branco por segurança

    if (areaEdicao) areaEdicao.style.display = "block";
    window.scrollTo(0, document.body.scrollHeight);
}

function cancelarEdicao() {
    if (usuarioIdInput) usuarioIdInput.value = "";
    if (loginUserEdicao) loginUserEdicao.value = "";
    if (nomeUserEdicao) nomeUserEdicao.value = "";
    if (senhaUserEdicao) senhaUserEdicao.value = "";
    
    if (areaEdicao) areaEdicao.style.display = "none";
}

async function salvarEdicao() {
    const id = usuarioIdInput.value;
    if (!id) return;

    const login = loginUserEdicao.value.trim().toUpperCase();
    const nome = nomeUserEdicao.value.trim().toUpperCase();
    const novaSenha = senhaUserEdicao.value.trim();

    if (!login || !nome) {
        alert("Login e Nome são obrigatórios!");
        return;
    }

    // --- VALIDAÇÃO: Evita duplicados na edição (Ignora o próprio ID) ---
    const { data: usuarioExistente, error: erroBusca } = await supabaseClient
        .from(NOME_TABELA)
        .select("id")
        .ilike("usuario", login)
        .neq("id", id) 
        .maybeSingle();

    if (erroBusca) {
        alert("Erro ao validar dados: " + erroBusca.message);
        return;
    }

    if (usuarioExistente) {
        alert("Este nome de usuário já está sendo utilizado por outro cadastro!");
        return; 
    }

    const dadosAtualizados = {
        usuario: login,
        nome_completo: nome
    };

    // Só atualiza a senha se digitada
    if (novaSenha !== "") {
        dadosAtualizados.senha = novaSenha;
    }

    const { error } = await supabaseClient
        .from(NOME_TABELA)
        .update(dadosAtualizados)
        .eq("id", id); 

    if (error) {
        alert("Erro ao atualizar usuário: " + error.message);
    } else {
        alert("Usuário atualizado com sucesso!");
        cancelarEdicao();
        carregarUsuarios(); 
    }
}

// ==========================================================================
// EXCLUIR (DELETE)
// ==========================================================================
async function excluirUsuario(user) {
    const confirmacao = confirm(`Tem certeza que deseja excluir o usuário: ${user.usuario}?`);
    if (!confirmacao) return;

    const { error } = await supabaseClient
        .from(NOME_TABELA)
        .delete()
        .eq("id", user.id); 

    if (error) {
        alert("Erro ao excluir: " + error.message);
        return;
    }

    alert("Usuário excluído com sucesso!");
    carregarUsuarios();
}