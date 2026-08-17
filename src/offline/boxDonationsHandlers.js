import {
  STORES,
  generateLocalId,
  putRecord,
  getRecord,
  getAllRecords,
  deleteRecord,
} from './db';

function nowIso() {
  return new Date().toISOString();
}

export function boxDonationToApi(row) {
  const d = row.record;
  return {
    ...d,
    id: row.localId,
    local_id: row.localId,
    server_id: row.serverId ?? null,
    donation_box_id: d.donation_box_id,
    collection_amount: d.collection_amount,
    collection_date: d.collection_date,
    status: d.status || 'pending',
    created_at: row.createdAt,
    _offline: !row.synced,
    _pending_sync: !row.synced,
  };
}

export async function listBoxDonationsOffline(config, boxId = null) {
  const pagination =
    config?.pagination || config?.params?.pagination || {};
  const filters = config?.filters || config?.params?.filters || {};
  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const pageSize = parseInt(pagination.pageSize, 10) ?? 10;
  const sortField = pagination.sortField || 'created_at';
  const sortOrder = pagination.sortOrder === 'ASC' ? 1 : -1;

  let items = (await getAllRecords(STORES.boxDonations)).map(boxDonationToApi);

  if (boxId) {
    items = items.filter((d) => String(d.donation_box_id) === String(boxId));
  }

  const search = (filters.search || '').trim().toLowerCase();
  if (search) {
    items = items.filter((d) =>
      String(d.collection_amount).includes(search),
    );
  }

  items.sort((a, b) => {
    const av = a[sortField] ?? '';
    const bv = b[sortField] ?? '';
    if (av < bv) return -1 * sortOrder;
    if (av > bv) return 1 * sortOrder;
    return 0;
  });

  const total = items.length;
  const paged =
    pageSize > 0 ? items.slice((page - 1) * pageSize, page * pageSize) : items;

  return {
    success: true,
    message: 'Offline box collections retrieved',
    data: paged,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 1,
      hasNext: pageSize > 0 ? page < Math.ceil(total / pageSize) : false,
      hasPrev: page > 1,
    },
    _offline_list: true,
  };
}

export async function getBoxDonationOffline(localId) {
  const row = await getRecord(STORES.boxDonations, localId);
  if (!row) throw new Error('Offline collection not found');
  return {
    success: true,
    message: 'Collection retrieved offline',
    data: boxDonationToApi(row),
  };
}

export async function createBoxDonationOffline(body, enqueue) {
  const amount = Number(body?.collection_amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Collection amount must be greater than 0');
  }
  if (!body?.donation_box_id) {
    throw new Error('Donation box is required');
  }

  const localId = generateLocalId();
  const ts = nowIso();
  const record = { ...body, status: body.status || 'pending' };

  await putRecord(STORES.boxDonations, {
    localId,
    record,
    synced: false,
    serverId: null,
    createdAt: ts,
  });
  await enqueue({
    type: 'CREATE_DONATION_BOX_DONATION',
    localId,
    payload: record,
  });

  return {
    success: true,
    message: 'Collection saved offline',
    data: boxDonationToApi({ localId, record, synced: false, createdAt: ts }),
  };
}

export async function deleteBoxDonationOffline(localId) {
  await deleteRecord(STORES.boxDonations, localId);
  const queue = await getAllRecords(STORES.syncQueue);
  for (const q of queue) {
    if (q.localId === localId && q.status === 'pending') {
      await deleteRecord(STORES.syncQueue, q.queueId);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dms-offline-queue-changed'));
  }
  return { success: true, message: 'Offline collection removed', data: null };
}
