document.addEventListener("DOMContentLoaded", () => {
  const descricao = document.getElementById("descricao");
  const contador = document.querySelector(".contador");
  const formulario = document.querySelector(".formulario");
  const botaoCancelar = document.querySelector(".btn-cancelar");
  const arquivos = document.getElementById("arquivo");

  function atualizarContador() {
    if (!descricao || !contador) return;
    contador.textContent = `${descricao.value.length}/1000 caracteres`;
  }

  descricao?.addEventListener("input", atualizarContador);
  atualizarContador();

  arquivos?.addEventListener("change", () => {
    const selecionados = Array.from(arquivos.files || []);
    const tamanhoMaximo = 20 * 1024 * 1024;
    if (selecionados.length > 10) {
      alert("Você pode enviar no máximo 10 arquivos.");
      arquivos.value = "";
      return;
    }
    if (selecionados.some(arquivo => arquivo.size > tamanhoMaximo)) {
      alert("Cada arquivo deve ter no máximo 20 MB.");
      arquivos.value = "";
    }
  });

  formulario?.addEventListener("submit", event => {
    if (!formulario.reportValidity()) {
      event.preventDefault();
      return;
    }
    const botaoEnviar = formulario.querySelector(".btn-denunciar");
    if (botaoEnviar) {
      botaoEnviar.disabled = true;
      botaoEnviar.textContent = "Enviando...";
    }
  });

  botaoCancelar?.addEventListener("click", () => {
    window.location.href = "/dashboardUsuario";
  });
});
