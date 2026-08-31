const shareButton = document.getElementById("share");
const stopButton = document.getElementById("stop");
const video = document.getElementById("screen");

const socket = new WebSocket(
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`
);

let stream = null;
let peer = null;

const configuration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

function send(data) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
    }
}

function createPeer() {
    peer = new RTCPeerConnection(configuration);

    peer.onicecandidate = (event) => {
        if (event.candidate) {
            send({
                type: "candidate",
                candidate: event.candidate
            });
        }
    };

    peer.ontrack = (event) => {
        video.srcObject = event.streams[0];
    };

    return peer;
}

shareButton.addEventListener("click", async () => {
    try {
        stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
        });

        video.srcObject = stream;

        createPeer();

        for (const track of stream.getTracks()) {
            peer.addTrack(track, stream);
        }

        const offer = await peer.createOffer();

        await peer.setLocalDescription(offer);

        send({
            type: "offer",
            offer: peer.localDescription
        });

        stream.getVideoTracks()[0].addEventListener("ended", stopSharing);

    } catch (error) {
        console.error("Erro ao compartilhar:", error);
    }
});

stopButton.addEventListener("click", stopSharing);

function stopSharing() {
    if (stream) {
        for (const track of stream.getTracks()) {
            track.stop();
        }

        stream = null;
    }

    if (peer) {
        peer.close();
        peer = null;
    }

    video.srcObject = null;

    send({
        type: "stop"
    });
}

socket.addEventListener("message", async (event) => {
    const message = JSON.parse(event.data);

    if (message.type === "offer") {

        if (stream) {
            return;
        }

        createPeer();

        await peer.setRemoteDescription(
            new RTCSessionDescription(message.offer)
        );

        const answer = await peer.createAnswer();

        await peer.setLocalDescription(answer);

        send({
            type: "answer",
            answer: peer.localDescription
        });
    }

    else if (message.type === "answer") {

        if (!peer) {
            return;
        }

        await peer.setRemoteDescription(
            new RTCSessionDescription(message.answer)
        );
    }

    else if (message.type === "candidate") {

        if (!peer) {
            return;
        }

        try {
            await peer.addIceCandidate(
                new RTCIceCandidate(message.candidate)
            );
        } catch (error) {
            console.error("Erro ICE:", error);
        }
    }

    else if (message.type === "stop") {
        if (peer) {
            peer.close();
            peer = null;
        }

        video.srcObject = null;
    }
});