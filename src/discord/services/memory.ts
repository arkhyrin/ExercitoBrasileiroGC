const MEMORIA_LIMITE = 6;

const memoria = new Map<string, {
    role: "user" | "assistant";
    content: string;
}[]>();

export function obterMemoria(usuarioId: string) {
    if (!memoria.has(usuarioId)) {
        memoria.set(usuarioId, []);
    }

    return memoria.get(usuarioId)!;
}

export function adicionarMemoria(
    usuarioId: string,
    role: "user" | "assistant",
    content: string
) {
    const historico = obterMemoria(usuarioId);

    historico.push({
        role,
        content
    });

    while (historico.length > MEMORIA_LIMITE) {
        historico.shift();
    }
}