// data/demos.ts
export type Demo = {
    id: number;
    nome: string;
    codigoProjeto: string;
    horizontal: string;
    nomeComercial: string;
    vertical: string;
    urlFotoComercial: string;
    nomeImagemDocker: string;
};

const LS_KEY = "demos_db_v2";
const LS_SEQ = "demos_seq_v2";

function migrateIfNeeded(): void {
    if (localStorage.getItem(LS_KEY)) return;

    // Se existir uma versão antiga, tenta migrar
    const oldRaw = localStorage.getItem("demos_db_v1");
    if (oldRaw) {
        try {
            const old = JSON.parse(oldRaw) as any[];
            const migrated: Demo[] = old.map((d, idx) => ({
                id: typeof d.id === "number" ? d.id : idx + 1,
                nome: d.nome ?? "",
                codigoProjeto: d.codigoProjeto ?? "",
                horizontal: d.horizontal ?? "",
                nomeComercial: d.nomeComercial ?? "",
                vertical: d.vertical ?? "",
                urlFotoComercial: d.urlFotoComercial ?? d.imagem ?? "",
                nomeImagemDocker: d.nomeImagemDocker ?? "",
            }));
            localStorage.setItem(LS_KEY, JSON.stringify(migrated));
            localStorage.setItem(
                LS_SEQ,
                String(Math.max(0, ...migrated.map((m) => m.id)) || 0)
            );
            return;
        } catch {
            // ignora e cria seed v2
        }
    }

    // Seed inicial v2
    const seed: Demo[] = [
        {
            id: 1,
            nome: "Demo Exemplo",
            codigoProjeto: "LTP-001",
            horizontal: "Marketing",
            nomeComercial: "Ana Silva",
            vertical: "Retalho",
            urlFotoComercial: "",
            nomeImagemDocker: "myorg/demo-exemplo:latest",
        },
    ];
    localStorage.setItem(LS_KEY, JSON.stringify(seed));
    localStorage.setItem(LS_SEQ, "1");
}

function readAll(): Demo[] {
    migrateIfNeeded();
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    try {
        const arr = JSON.parse(raw) as Demo[];
        // “Higieniza” para garantir campos
        return arr.map((d) => ({
            id: d.id,
            nome: d.nome ?? "",
            codigoProjeto: d.codigoProjeto ?? "",
            horizontal: d.horizontal ?? "",
            nomeComercial: d.nomeComercial ?? "",
            vertical: d.vertical ?? "",
            urlFotoComercial: d.urlFotoComercial ?? "",
            nomeImagemDocker: d.nomeImagemDocker ?? "",
        }));
    } catch {
        return [];
    }
}

function writeAll(demos: Demo[]) {
    localStorage.setItem(LS_KEY, JSON.stringify(demos));
}

function nextId(): number {
    const raw = localStorage.getItem(LS_SEQ);
    const current = raw
        ? parseInt(raw, 10)
        : Math.max(0, ...readAll().map((d) => d.id));
    const next = current + 1;
    localStorage.setItem(LS_SEQ, String(next));
    return next;
}

// ===== API pública (localStorage only) =====
export async function fetchDemos(): Promise<Demo[]> {
    return readAll();
}

export async function fetchDemoById(id: number): Promise<Demo | null> {
    const all = readAll();
    return all.find((d) => d.id === id) ?? null;
}

export async function addDemo(data: Omit<Demo, "id">): Promise<Demo> {
    const all = readAll();
    const demo: Demo = { id: nextId(), ...data };
    all.push(demo);
    writeAll(all);
    return demo;
}

export async function removeDemo(id: number): Promise<void> {
    const all = readAll();
    writeAll(all.filter((d) => d.id !== id));
}

export async function updateDemo(
    id: number,
    patch: Partial<Omit<Demo, "id">>
): Promise<Demo | null> {
    const all = readAll();
    const idx = all.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    const updated = { ...all[idx], ...patch };
    all[idx] = updated;
    writeAll(all);
    return updated;
}
