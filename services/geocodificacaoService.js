
const { executarQuery } = require("../db/dbConnect");

const esperar = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

// Mantém as consultas em sequência para evitar várias
// requisições simultâneas ao serviço de geocodificação.
let filaGeocodificacao = Promise.resolve();

async function consultarCoordenadas(idLocalizacao) {
    const locais = await executarQuery(
        `SELECT idLocalizacao, endereco, cidade, estado, latitude, longitude
         FROM LOCALIZACAO
         WHERE idLocalizacao = ?`,
        [idLocalizacao]
    );

    if (locais.length === 0) {
        throw new Error("Localização não encontrada.");
    }

    const local = locais[0];

    // Se já tiver coordenadas, não consulta novamente.
    if (local.latitude != null && local.longitude != null) {
        return;
    }

    const endereco = [
        local.endereco,
        local.cidade,
        local.estado,
        "Brasil"
    ].filter(Boolean).join(", ");

    const url = new URL("https://nominatim.openstreetmap.org/search");

    url.searchParams.set("q", endereco);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const resposta = await fetch(url, {
        headers: {
            "User-Agent": "Nexus-TCC/1.0"
        }
    });

    if (!resposta.ok) {
        throw new Error(`Falha na consulta: HTTP ${resposta.status}`);
    }

    const resultados = await resposta.json();

    if (resultados.length === 0) {
        console.log("Endereço não encontrado:", endereco);
        return;
    }

    const latitude = Number(resultados[0].lat);
    const longitude = Number(resultados[0].lon);

    await executarQuery(
        `UPDATE LOCALIZACAO
         SET latitude = ?, longitude = ?
         WHERE idLocalizacao = ?`,
        [latitude, longitude, idLocalizacao]
    );

    console.log("Coordenadas salvas:", endereco);
}

function geocodificarLocalizacao(idLocalizacao) {
    const tarefa = filaGeocodificacao.then(async () => {
        try {
            await consultarCoordenadas(idLocalizacao);
        } finally {
            // Intervalo entre consultas ao serviço.
            await esperar(1100);
        }
    });

    // Mantém a fila funcionando mesmo se uma consulta falhar.
    filaGeocodificacao = tarefa.catch(() => {});

    return tarefa;
}

module.exports = {
    geocodificarLocalizacao
};
