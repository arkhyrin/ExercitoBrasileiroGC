const shareButton = document.getElementById("share");
const stopButton = document.getElementById("stop");
const connectButton = document.getElementById("connect");

const peerIdElement = document.getElementById("id");
const peerIdInput = document.getElementById("peerId");

const video = document.getElementById("screen");

let peer = null;
let stream = null;
let currentCall = null;

peer = new Peer({
    host: "0.peerjs.com",
    port: 443,
    secure: true,

    config: {
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302"
            },
            {
                urls: "stun:stun.cloudflare.com:3478"
            }
        ]
    },

    debug: 2
});

peer.on("open", (id) => {
    peerIdElement.textContent = id;
    console.log("Peer conectado:", id);
});

peer.on("call", (call) => {
    console.log("Recebendo chamada de:", call.peer);

    call.answer();

    currentCall = call;

    call.on("stream", (remoteStream) => {
        console.log("Stream recebida!");

        video.srcObject = remoteStream;
        video.play().catch(() => {});
    });

    call.on("close", () => {
        console.log("Chamada encerrada");

        video.srcObject = null;

        if (currentCall === call) {
            currentCall = null;
        }
    });

    call.on("error", (error) => {
        console.error("Erro na chamada:", error);
    });
});

shareButton.addEventListener("click", async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
        alert("Seu navegador não suporta compartilhamento de tela.");
        return;
    }

    if (!window.isSecureContext) {
        alert("O compartilhamento de tela exige HTTPS.");
        return;
    }

    try {
        stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
        });

        video.srcObject = stream;
        video.muted = true;

        await video.play();

        console.log("Tela capturada!");

        const videoTrack = stream.getVideoTracks()[0];

        videoTrack.addEventListener("ended", () => {
            console.log("Usuário encerrou o compartilhamento.");
            stopSharing();
        });
    } catch (error) {
        console.error("Erro ao capturar tela:", error);

        alert(`${error.name}: ${error.message}`);
    }
});

connectButton.addEventListener("click", () => {
    if (!stream) {
        alert("Primeiro clique em 'Compartilhar tela'.");
        return;
    }

    const remotePeerId = peerIdInput.value.trim();

    if (!remotePeerId) {
        alert("Digite o ID de quem receberá a tela.");
        return;
    }

    console.log("Conectando ao peer:", remotePeerId);

    const call = peer.call(remotePeerId, stream);

    currentCall = call;

    call.on("close", () => {
        console.log("Chamada encerrada.");

        if (currentCall === call) {
            currentCall = null;
        }
    });

    call.on("error", (error) => {
        console.error("Erro na chamada:", error);
    });
});

stopButton.addEventListener("click", stopSharing);

function stopSharing() {
    if (stream) {
        for (const track of stream.getTracks()) {
            track.stop();
        }

        stream = null;
    }

    if (currentCall) {
        currentCall.close();
        currentCall = null;
    }

    video.srcObject = null;

    console.log("Compartilhamento parado.");
}

peer.on("error", (error) => {
    console.error("Erro do PeerJS:", error);

    if (error.type === "peer-unavailable") {
        alert("O ID informado não está conectado.");
    }
});