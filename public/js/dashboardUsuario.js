document.addEventListener("DOMContentLoaded", () => {

    const progressSteps = document.querySelectorAll(".progress-step");
    const progressLineActive = document.querySelector(".progress-line-active");

    /*
        status da barra:

        0 = Recebida
        1 = Em Análise
        2 = Concluída
    */

    let statusAtual = 1;

    atualizarProgresso(statusAtual);

    //aqui é onde atualiza a barra de progresso (não esquece!!!)

    function atualizarProgresso(status) {

        if (!progressSteps.length || !progressLineActive) {
            return;
        }

        progressSteps.forEach((step, index) => {

            step.classList.remove("completed");
            step.classList.remove("current");

            // etapas anteriores
            if (index < status) {
                step.classList.add("completed");
            }

            // etapa atual
            if (index === status) {
                step.classList.add("current");
            }

        });

        // aqui coloquei o tamanho da linha verde

        switch (status) {

            case 0:
                progressLineActive.style.width = "0";
                break;

            case 1:
                progressLineActive.style.width = "calc(50% - 20px)";
                break;

            case 2:
                progressLineActive.style.width = "calc(100% - 40px)";
                break;

            default:
                progressLineActive.style.width = "0";

        }

    }


    
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