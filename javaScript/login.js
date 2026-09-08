async function fazerLogin(event) {
    event.preventDefault(); 

    const usuarioDigitado = document.getElementById("usuario").value.trim();
    const senhaDigitada = document.getElementById("senha").value;
    const btnEntrar = document.getElementById("btnEntrar");

    btnEntrar.textContent = "Verificando...";
    btnEntrar.disabled = true;


    // verifica se o login é válido
    try {
        const { data: usuarioEncontrado, error } = await supabaseClient
            .from("usuarios")
            .select("*")
            .ilike("usuario", usuarioDigitado)
            .maybeSingle(); 

        if (error) {
            alert("Erro ao conectar no banco de dados: " + error.message);
            console.error(error);
            return;
        }

        if (!usuarioEncontrado) {
            alert("Usuário não cadastrado no banco de dados!");
            return;
        }

        if (usuarioEncontrado.senha !== senhaDigitada) {
            alert("Senha incorreta!");
            return;
        }

        alert(`Bem-vindo, ${usuarioEncontrado.nome_completo}!`);
        window.location.href = "menu.html";

    } catch (err) {
        alert("Erro desconhecido ao tentar logar.");
        console.error(err);
    } finally {
        btnEntrar.textContent = "Entrar";
        btnEntrar.disabled = false;
    }
}

async function recuperarSenha(event) {
    event.preventDefault();

    const usuarioDigitado = document.getElementById("usuario").value.trim();
    const nomeDigitado = document.getElementById("nomeCompleto").value.trim();
    const novaSenhaDigitada = document.getElementById("novaSenha").value;
    const btnSalvar = document.getElementById("btnSalvar");

    btnSalvar.textContent = "Validando dados...";
    btnSalvar.disabled = true;

    try {
        const { data: usuarioEncontrado, error: erroBusca } = await supabaseClient
            .from("usuarios")
            .select("*")
            .eq("usuario", usuarioDigitado)
            .maybeSingle();

        if (erroBusca) {
            alert("Erro ao consultar o banco de dados: " + erroBusca.message);
            return;
        }

        if (!usuarioEncontrado) {
            alert("Usuário não encontrado em nosso sistema!");
            return;
        }

        if (usuarioEncontrado.nome_completo.toLowerCase() !== nomeDigitado.toLowerCase()) {
            alert("O nome completo informado não confere com o usuário digitado!");
            return;
        }

        const { error: erroUpdate } = await supabaseClient
            .from("usuarios")
            .update({ senha: novaSenhaDigitada })
            .eq("id", usuarioEncontrado.id);

        if (erroUpdate) {
            alert("Não foi possível atualizar a senha: " + erroUpdate.message);
            return;
        }

        alert("Senha alterada com sucesso! Você será redirecionado para a tela de login.");
        window.location.href = "login.html";

    } catch (err) {
        console.error(err);
        alert("Erro inesperado ao tentar redefinir a senha.");
    } finally {
        btnSalvar.textContent = "Alterar Senha";
        btnSalvar.disabled = false;
    }
}