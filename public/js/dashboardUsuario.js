document.addEventListener("DOMContentLoaded", () => {
    
    // botão realizar denúncia 

    const reportButton = document.querySelector(".report-button");

    if (reportButton) {

        reportButton.addEventListener("click", () => {

            console.log(
                "Redirecionando para realizar uma nova denúncia, aguarde..."
            );

        });

    }

    // animação do banner 

    const banner = document.querySelector(".report-banner");

    if (banner) {

        banner.addEventListener("mouseenter", () => {

            banner.style.transform = "translateY(-3px)";

        });


        banner.addEventListener("mouseleave", () => {

            banner.style.transform = "translateY(0)";

        });

    }


   // animação suave

    if (banner) {

        banner.style.transition =
            "transform 0.25s ease, box-shadow 0.25s ease";

    }

});