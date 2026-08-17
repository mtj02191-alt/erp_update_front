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

export function isLocalId(id) {
  return id != null && String(id).startsWith('local_');
}

export function donationToApi(row, donorRow = null) {
  const d = row.record;
  const donor = donorRow?.record;
  return {
    ...d,
    id: row.localId,
    local_id: row.localId,
    server_id: row.serverId ?? null,
    donor_id: d.local_donor_id || d.donor_id || null,
    donation_source: d.donation_source || d.source || null,
    orderId: d.orderId || null,
    paid_amount: d.paid_amount ?? null,
    note: d.note ?? null,
    created_at: row.createdAt,
    updated_at: row.updatedAt || row.createdAt,
    _offline: !row.synced,
    _pending_sync: !row.synced,
    donor: donor
      ? {
          id: donorRow.localId || d.donor_id,
          name: donor.name,
          email: donor.email,
          phone: donor.phone,
          city: donor.city,
        }
      : d.donor || null,
  };
}

async function resolveDonorRow(donorRef) {
  if (!donorRef) return null;
  const key = String(donorRef);
  if (key.startsWith('local_')) {
    return getRecord(STORES.donors, key);
  }
  return null;
}

export async function searchDonationsOffline(body, enqueue) {
  const pagination = body?.pagination || {};
  const filters = body?.filters || {};
  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const pageSize = parseInt(pagination.pageSize, 10) ?? 10;
  const sortField = pagination.sortField || 'created_at';
  const sortOrder = pagination.sortOrder === 'ASC' ? 1 : -1;

  const rows = await getAllRecords(STORES.donations);
  let items = [];
  for (const row of rows) {
    const donorRow = await resolveDonorRow(
      row.record.local_donor_id || row.record.donor_id,
    );
    items.push(donationToApi(row, donorRow));
  }

  const search = (filters.search || '').trim().toLowerCase();
  if (search) {
    items = items.filter((d) =>
      [
        d.project_name,
        d.ref,
        d.donation_method,
        d.donation_type,
        d.transaction_id,
        d.donor?.name,
        d.donor?.email,
        String(d.amount),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(search)),
    );
  }

  if (filters.status) {
    items = items.filter((d) => d.status === filters.status);
  }
  if (filters.donation_type) {
    items = items.filter((d) => d.donation_type === filters.donation_type);
  }
  if (filters.donation_method) {
    items = items.filter((d) => d.donation_method === filters.donation_method);
  }

  const recordDate = (d) =>
    String(d.date || d.created_at || '').slice(0, 10);
  if (filters.date) {
    items = items.filter((d) => recordDate(d) === filters.date);
  }
  if (filters.start_date) {
    items = items.filter((d) => recordDate(d) >= filters.start_date);
  }
  if (filters.end_date) {
    items = items.filter((d) => recordDate(d) <= filters.end_date);
  }

  if (filters.donor_id) {
    const did = String(filters.donor_id);
    items = items.filter(
      (d) =>
        String(d.donor_id) === did ||
        String(d.local_donor_id) === did ||
        String(d.donor?.id) === did,
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
  const totalDonationAmount = items.reduce(
    (sum, d) => sum + (Number(d.amount) || 0),
    0,
  );

  return {
    success: true,
    message: 'Offline donations retrieved',
    data: paged,
    totalDonationAmount,
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

export async function getDonationOffline(localId) {
  const row = await getRecord(STORES.donations, localId);
  if (!row) throw new Error('Offline donation not found');
  const donorRow = await resolveDonorRow(
    row.record.local_donor_id || row.record.donor_id,
  );
  return {
    success: true,
    message: 'Donation retrieved offline',
    data: donationToApi(row, donorRow),
  };
}

export async function patchDonationOffline(localId, body, enqueue) {
  const existing = await getRecord(STORES.donations, localId);
  if (!existing) throw new Error('Offline donation not found');
  existing.record = { ...existing.record, ...body };
  existing.updatedAt = nowIso();
  await putRecord(STORES.donations, existing);
  await enqueue({
    type: 'UPDATE_DONATION',
    localId,
    dependsOn: existing.record.local_donor_id || null,
    payload: { ...existing.record, donation_id: localId },
  });
  const donorRow = await resolveDonorRow(
    existing.record.local_donor_id || existing.record.donor_id,
  );
  return {
    success: true,
    message: 'Donation updated offline',
    data: donationToApi(existing, donorRow),
  };
}

export async function patchDonationNoteOffline(localId, note, enqueue) {
  return patchDonationOffline(localId, { note }, enqueue);
}

export async function deleteDonationOffline(localId) {
  await deleteRecord(STORES.donations, localId);
  const queue = await getAllRecords(STORES.syncQueue);
  for (const q of queue) {
    if (q.localId === localId && q.status === 'pending') {
      await deleteRecord(STORES.syncQueue, q.queueId);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dms-offline-queue-changed'));
  }
  return { success: true, message: 'Offline donation removed', data: null };
}

export async function createDonationOffline(body, enqueue) {
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount < 50) {
    throw new Error('Donation amount must be at least 50 PKR');
  }
  const localId = generateLocalId();
  const ts = nowIso();
  const record = { ...body };
  if (record.donor_id && String(record.donor_id).startsWith('local_')) {
    record.local_donor_id = record.donor_id;
  }
  if (!record.donation_source) {
    record.donation_source = record.source || 'manual';
  }
  if (!record.status) record.status = 'pending';
  if (!record.currency) record.currency = 'PKR';
  if (!record.date) record.date = ts.slice(0, 10);

  await putRecord(STORES.donations, {
    localId,
    record,
    synced: false,
    serverId: null,
    createdAt: ts,
  });
  await enqueue({
    type: 'CREATE_DONATION',
    localId,
    dependsOn: record.local_donor_id || null,
    payload: record,
  });

  const donorRow = await resolveDonorRow(record.local_donor_id || record.donor_id);
  return {
    success: true,
    message: 'Donation saved offline',
    data: donationToApi({ localId, record, synced: false, createdAt: ts }, donorRow),
  };
}
