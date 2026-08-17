const DB_NAME = 'mtjf_dms_offline';
const DB_VERSION = 1;

const STORES = {
  donors: 'donors',
  donations: 'donations',
  boxDonations: 'box_donations',
  syncQueue: 'sync_queue',
};

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORES.donors)) {
        db.createObjectStore(STORES.donors, { keyPath: 'localId' });
      }
      if (!db.objectStoreNames.contains(STORES.donations)) {
        db.createObjectStore(STORES.donations, { keyPath: 'localId' });
      }
      if (!db.objectStoreNames.contains(STORES.boxDonations)) {
        db.createObjectStore(STORES.boxDonations, { keyPath: 'localId' });
      }
      if (!db.objectStoreNames.contains(STORES.syncQueue)) {
        const q = db.createObjectStore(STORES.syncQueue, { keyPath: 'queueId' });
        q.createIndex('status', 'status', { unique: false });
      }
    };
  });
  return dbPromise;
}

function idbRequest(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function generateLocalId() {
  return `local_${crypto.randomUUID()}`;
}

export async function putRecord(store, record) {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  const s = tx.objectStore(store);
  await idbRequest(s.put(record));
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getRecord(store, localId) {
  const db = await openDb();
  const tx = db.transaction(store, 'readonly');
  const s = tx.objectStore(store);
  const result = await idbRequest(s.get(localId));
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return result || null;
}

export async function getAllRecords(store) {
  const db = await openDb();
  const tx = db.transaction(store, 'readonly');
  const s = tx.objectStore(store);
  const result = await idbRequest(s.getAll());
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return result || [];
}

export async function putQueueItem(item) {
  return putRecord(STORES.syncQueue, item);
}

export async function getPendingQueue() {
  const all = await getAllRecords(STORES.syncQueue);
  return all
    .filter((q) => q.status === 'pending' || q.status === 'failed')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export async function updateQueueItem(item) {
  return putRecord(STORES.syncQueue, item);
}

export async function countPendingQueue() {
  const pending = await getPendingQueue();
  return pending.length;
}

/** Remove a successfully synced entity and its queue entry from local storage. */
export async function removeSyncedLocalRecord(localId, entityStore, queueId) {
  if (entityStore) {
    await deleteRecord(entityStore, localId);
  }
  if (queueId) {
    await deleteRecord(STORES.syncQueue, queueId);
  }
}

export async function deleteRecord(store, key) {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  const s = tx.objectStore(store);
  await idbRequest(s.delete(key));
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearStore(store) {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  const s = tx.objectStore(store);
  await idbRequest(s.clear());
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Remove all locally stored DMS data (donors, donations, box collections, sync queue). */
export async function clearAllOfflineData() {
  await Promise.all([
    clearStore(STORES.donors),
    clearStore(STORES.donations),
    clearStore(STORES.boxDonations),
    clearStore(STORES.syncQueue),
  ]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dms-offline-queue-changed'));
    window.dispatchEvent(new CustomEvent('dms-offline-data-cleared'));
  }
}

export async function countAllOfflineRecords() {
  const [donors, donations, boxDonations, queue] = await Promise.all([
    getAllRecords(STORES.donors),
    getAllRecords(STORES.donations),
    getAllRecords(STORES.boxDonations),
    getAllRecords(STORES.syncQueue),
  ]);
  return (
    donors.length + donations.length + boxDonations.length + queue.length
  );
}

export { STORES };
