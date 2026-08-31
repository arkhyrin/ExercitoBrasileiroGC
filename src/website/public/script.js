const shareButton = document.getElementById("share");
const stopButton = document.getElementById("stop");
const connectButton = document.getElementById("connect");

const peerIdElement = document.getElementById("id");
const peerIdInput = document.getElementById("peerId");

const video = document.getElementById("screen");

let peer;
let stream = null;
let currentCall = null;

peer = new Peer();

peer.on("open", (id) => {
    console.log("Peer conectado:", id);
    peerIdElement.textContent = id;
});

peer.on("call", (call) => {
    console.log("Chamada recebida:", call.peer);

    call.answer();

    currentCall = call;

    call.on("stream", (remoteStream) => {
        video.srcObject = remoteStream;
        video.muted = false;
        video.play().catch(console.error);
    });

    call.on("close", () => {
        video.srcObject = null;

        if (currentCall === call) {
            currentCall = null;
        }
    });

    call.on("error", (error) => {
        console.error("Erro na chamada:", error);
    });
});

peer.on("error", (error) => {
    console.error("Erro do PeerJS:", error);

    peerIdElement.textContent = "Erro";

    alert(`Erro do PeerJS: ${error.type}`);
});

shareButton.addEventListener("click", async () => {
    try {
        stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
        });

        video.srcObject = stream;
        video.muted = true;

        await video.play();

        const videoTrack = stream.getVideoTracks()[0];

        videoTrack.addEventListener("ended", () => {
            stopSharing();
        });
    } catch (error) {
        console.error("Erro ao compartilhar:", error);
        alert(`${error.name}: ${error.message}`);
    }
});

connectButton.addEventListener("click", () => {
    if (!stream) {
        alert("Compartilhe sua tela primeiro.");
        return;
    }

    const remotePeerId = peerIdInput.value.trim();

    if (!remotePeerId) {
        alert("Digite o ID do outro usuário.");
        return;
    }

    const call = peer.call(remotePeerId, stream);

    currentCall = call;

    call.on("close", () => {
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
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
    }

    if (currentCall) {
        currentCall.close();
        currentCall = null;
    }

    video.srcObject = null;
}