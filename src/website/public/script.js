const shareButton = document.getElementById("share");
const stopButton = document.getElementById("stop");
const video = document.getElementById("screen");

let stream = null;

shareButton.addEventListener("click", async () => {
    console.log("Botão clicado");

    if (!navigator.mediaDevices?.getDisplayMedia) {
        alert("Seu navegador não disponibiliza compartilhamento de tela neste contexto.");
        console.error("getDisplayMedia não disponível");
        return;
    }

    if (!window.isSecureContext) {
        alert("O compartilhamento de tela exige HTTPS.");
        console.error("Contexto não seguro:", location.href);
        return;
    }

    try {
        stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
        });

        video.srcObject = stream;

        console.log("Tela compartilhada!");

        const videoTrack = stream.getVideoTracks()[0];

        videoTrack.addEventListener("ended", () => {
            console.log("Compartilhamento encerrado pelo usuário");
            stopSharing();
        });

    } catch (error) {
        console.error("Erro ao compartilhar tela:", error);

        alert(
            `Não foi possível compartilhar a tela.\n\n` +
            `${error.name}: ${error.message}`
        );
    }
});

stopButton.addEventListener("click", stopSharing);

function stopSharing() {
    if (!stream) {
        return;
    }

    for (const track of stream.getTracks()) {
        track.stop();
    }

    stream = null;
    video.srcObject = null;

    console.log("Compartilhamento parado");
}