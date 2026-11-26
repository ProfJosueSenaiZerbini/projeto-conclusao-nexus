
const { executarQuery } = require("../db/dbConnect");

const esperar = ms => new Promise(resolve => setTimeout(resolve, ms));

async function geocodificar() {
    const locais = await executarQuery(`
        SELECT idLocalizacao, endereco, bairro, cidade, estado
        FROM LOCALIZACAO
        WHERE latitude IS NULL OR longitude IS NULL
    `);

    console.log(`Localizações para consultar: ${locais.length}`);

    for (const local of locais) {
        try {
            const endereco = [
                local.endereco,
                local.bairro,
                local.cidade,
                local.estado,
                "Brasil"
            ].filter(Boolean).join(", ");

            const url = new URL(
                "https://nominatim.openstreetmap.org/search"
            );

            url.searchParams.set("q", endereco);
            url.searchParams.set("format", "json");
            url.searchParams.set("limit", "1");

            const resposta = await fetch(url, {
                headers: {
                    "User-Agent": "Nexus-TCC/1.0"
                }
            });

            if (!resposta.ok) {
                console.log("Falha na consulta:", endereco);
                continue;
            }

            const resultados = await resposta.json();

            if (resultados.length === 0) {
                console.log("Endereço não encontrado:", endereco);
                continue;
            }

            const latitude = Number(resultados[0].lat);
            const longitude = Number(resultados[0].lon);

            await executarQuery(`
                UPDATE LOCALIZACAO
                SET latitude = ?, longitude = ?
                WHERE idLocalizacao = ?
            `, [latitude, longitude, local.idLocalizacao]);

            console.log("Coordenadas salvas:", endereco);

        } catch (erro) {
            console.error("Erro:", erro.message);
        }

        await esperar(1100);
    }

    console.log("Consulta finalizada!");
    process.exit(0);
}

geocodificar().catch(erro => {
    console.error(erro);
    process.exit(1);
});
