import type { ReportDraft } from "../types";

const DB_NAME = "e-izvestaj-db";
const DB_VERSION = 1;
const DRAFT_STORE = "drafts";
const META_STORE = "meta";
const ACTIVE_DRAFT_KEY = "activeDraftId";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  executor: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = executor(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveReport(report: ReportDraft) {
  await withStore(DRAFT_STORE, "readwrite", (store) => store.put(report));
}

export async function getReport(reportId: string) {
  return withStore<ReportDraft | undefined>(DRAFT_STORE, "readonly", (store) =>
    store.get(reportId)
  );
}

export async function getAllReports() {
  const reports = (await withStore<ReportDraft[]>(DRAFT_STORE, "readonly", (store) =>
    store.getAll()
  )) || [];

  return reports.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function setActiveDraftId(reportId: string | null) {
  await withStore(META_STORE, "readwrite", (store) =>
    store.put(reportId, ACTIVE_DRAFT_KEY)
  );
}

export async function getActiveDraftId() {
  return withStore<string | null>(META_STORE, "readonly", (store) =>
    store.get(ACTIVE_DRAFT_KEY)
  );
}
