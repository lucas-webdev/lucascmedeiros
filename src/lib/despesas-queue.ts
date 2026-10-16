import type { LancamentoPendente, NovoLancamento } from "./despesas-types";

const DB_NAME = "despesas";
const STORE = "pendentes";

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "idLocal" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function transacao<T>(
  modo: IDBTransactionMode,
  executar: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await abrir();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = executar(db.transaction(STORE, modo).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export function gerarIdLocal(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function listarPendentes(): Promise<LancamentoPendente[]> {
  try {
    const todos = await transacao("readonly", (s) => s.getAll());
    return (todos as LancamentoPendente[]).sort((a, b) => a.criadoEm - b.criadoEm);
  } catch {
    return [];
  }
}

export async function enfileirar(
  lancamento: NovoLancamento,
  idLocal: string
): Promise<LancamentoPendente> {
  const item: LancamentoPendente = { idLocal, criadoEm: Date.now(), lancamento };
  await transacao("readwrite", (s) => s.put(item));
  return item;
}

export async function marcarErro(
  item: LancamentoPendente,
  erro: string
): Promise<void> {
  await transacao("readwrite", (s) => s.put({ ...item, erro }));
}

export async function remover(idLocal: string): Promise<void> {
  await transacao("readwrite", (s) => s.delete(idLocal));
}
