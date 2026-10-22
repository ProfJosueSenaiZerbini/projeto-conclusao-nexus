
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa o mapa em Campinas
  const mapa = L.map("mapa").setView(
    [-22.9056, -47.0608],
    13
  );

  // Adiciona o OpenStreetMap
  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19
    }
  ).addTo(mapa);

  // Lê as denúncias enviadas pelo EJS
  const elementoDados = document.getElementById("dados-mapa");

  if (elementoDados) {
    try {
      const geojson = JSON.parse(elementoDados.textContent);

      const camadaDenuncias = L.geoJSON(geojson, {
        onEachFeature: (feature, layer) => {
          const dados = feature.properties || {};

          const popup = document.createElement("div");
          const titulo = document.createElement("strong");
          const status = document.createElement("p");

          titulo.textContent = dados.titulo || "Denúncia";
          status.textContent = `Status: ${dados.status || "Pendente"}`;

          popup.append(titulo, status);
          layer.bindPopup(popup);
        }
      }).addTo(mapa);

      if (camadaDenuncias.getLayers().length > 0) {
        mapa.fitBounds(camadaDenuncias.getBounds(), {
          padding: [30, 30],
          maxZoom: 15
        });
      }
    } catch (erro) {
      console.error("Erro ao carregar denúncias:", erro);
    }
  }

  setTimeout(() => mapa.invalidateSize(), 200);
});
