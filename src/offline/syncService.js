import axiosInstance from '../utils/axios';
import {
  STORES,
  getPendingQueue,
  updateQueueItem,
  removeSyncedLocalRecord,
} from './db';

const DEVICE_ID_KEY = 'dms_offline_device_id';

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `device_${crypto.randomUUID()}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function storeForType(type) {
  switch (type) {
    case 'CREATE_DONOR':
    case 'UPDATE_DONOR':
      return STORES.donors;
    case 'CREATE_DONATION':
    case 'UPDATE_DONATION':
      return STORES.donations;
    case 'CREATE_DONATION_BOX_DONATION':
      return STORES.boxDonations;
    default:
      return null;
  }
}

export async function syncOfflineQueue() {
  const pending = await getPendingQueue();
  if (!pending.length) {
    return { success: true, synced: 0, failed: 0, message: 'Nothing to sync' };
  }

  const actions = pending.map((q) => ({
    queue_id: q.queueId,
    type: q.type,
    local_id: q.localId,
    depends_on: q.dependsOn || undefined,
    payload: q.payload,
  }));

  const res = await axiosInstance.post('/dms/sync/offline', {
    device_id: getDeviceId(),
    actions,
  });

  const data = res.data?.data;
  const results = data?.results || [];
  let synced = 0;
  let failed = 0;

  for (const r of results) {
    const queueItem = pending.find((q) => q.queueId === r.queue_id);
    if (!queueItem) continue;

    if (r.success) {
      synced += 1;
      const store = storeForType(queueItem.type);
      await removeSyncedLocalRecord(
        queueItem.localId,
        store,
        queueItem.queueId,
      );
    } else {
      queueItem.status = 'failed';
      queueItem.error = r.error || 'Sync failed';
      failed += 1;
      await updateQueueItem(queueItem);
    }
  }

  if (synced > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dms-offline-queue-changed'));
  }

  return {
    success: failed === 0,
    synced,
    failed,
    id_map: data?.id_map || {},
    message: res.data?.message,
  };
}
