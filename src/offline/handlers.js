import {
  STORES,
  generateLocalId,
  putRecord,
  getRecord,
  getAllRecords,
  putQueueItem,
} from './db';
import {
  searchDonationsOffline,
  getDonationOffline,
  patchDonationOffline,
  patchDonationNoteOffline,
  deleteDonationOffline,
  createDonationOffline,
  isLocalId,
} from './donationsHandlers';
import {
  listBoxDonationsOffline,
  getBoxDonationOffline,
  createBoxDonationOffline,
  deleteBoxDonationOffline,
} from './boxDonationsHandlers';

function nowIso() {
  return new Date().toISOString();
}

function wrapSuccess(data, message = 'OK') {
  return { success: true, message, data };
}

function donorToApi(row) {
  const d = row.record;
  return {
    ...d,
    id: row.localId,
    local_id: row.localId,
    server_id: row.serverId ?? null,
    _offline: !row.synced,
    _pending_sync: !row.synced,
    created_at: row.createdAt,
    updated_at: row.updatedAt || row.createdAt,
  };
}

async function enqueue({ type, localId, dependsOn, payload }) {
  const queueId = generateLocalId();
  await putQueueItem({
    queueId,
    type,
    localId,
    dependsOn: dependsOn || null,
    payload,
    status: 'pending',
    error: null,
    createdAt: nowIso(),
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dms-offline-queue-changed'));
  }
  return queueId;
}

const LOCAL_DONOR = /^\/donors\/(local_[^/]+)$/;
const LOCAL_DONATION = /^\/donations\/(local_[^/]+)$/;
const LOCAL_DONATION_NOTE = /^\/donations\/(local_[^/]+)\/note$/;
const LOCAL_BOX = /^\/donation-box-donation\/(local_[^/]+)$/;
const BOX_BY_ID = /^\/donation-box-donation\/box\/(\d+)$/;

export function canHandleOffline(config) {
  const method = (config.method || 'get').toLowerCase();
  const url = (config.url || '').split('?')[0];

  if (method === 'post' && url === '/donors/register') return true;
  if (method === 'patch' && LOCAL_DONOR.test(url)) return true;
  if (method === 'get' && (url === '/donors' || url === '/donors/lookup')) return true;
  if (method === 'get' && LOCAL_DONOR.test(url)) return true;

  if (method === 'post' && url === '/donations') return true;
  if (method === 'post' && url === '/donations/search') return true;
  if (method === 'get' && LOCAL_DONATION.test(url)) return true;
  if (method === 'patch' && LOCAL_DONATION.test(url)) return true;
  if (method === 'patch' && LOCAL_DONATION_NOTE.test(url)) return true;
  if (method === 'delete' && LOCAL_DONATION.test(url)) return true;

  if (method === 'post' && url === '/donation-box-donation') return true;
  if (method === 'get' && (url === '/donation-box-donation' || BOX_BY_ID.test(url))) return true;
  if (method === 'get' && LOCAL_BOX.test(url)) return true;
  if (method === 'delete' && LOCAL_BOX.test(url)) return true;

  return false;
}

export async function handleOfflineRequest(config) {
  const method = (config.method || 'get').toLowerCase();
  const url = (config.url || '').split('?')[0];
  const params = config.params || {};
  let body = config.data;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  // ── Donors ──────────────────────────────────────────────────────────
  if (method === 'post' && url === '/donors/register') {
    const localId = generateLocalId();
    const ts = nowIso();
    const record = {
      ...body,
      assigned_to_user_id:
        body.assigned_to_user_id ?? body.assigned_user_id ?? null,
      is_active: true,
      donor_type: body.donor_type || 'individual',
    };
    await putRecord(STORES.donors, {
      localId,
      record,
      synced: false,
      serverId: null,
      createdAt: ts,
      updatedAt: ts,
    });
    await enqueue({ type: 'CREATE_DONOR', localId, payload: record });
    return wrapSuccess(
      donorToApi({ localId, record, synced: false, createdAt: ts }),
      'Donor saved offline',
    );
  }

  if (method === 'patch' && LOCAL_DONOR.test(url)) {
    const localId = url.match(LOCAL_DONOR)[1];
    const existing = await getRecord(STORES.donors, localId);
    if (!existing) throw new Error('Offline donor not found');
    existing.record = { ...existing.record, ...body };
    existing.updatedAt = nowIso();
    await putRecord(STORES.donors, existing);
    await enqueue({
      type: 'UPDATE_DONOR',
      localId,
      payload: { ...existing.record, donor_id: localId },
    });
    return wrapSuccess(donorToApi(existing), 'Donor updated offline');
  }

  if (method === 'get' && url === '/donors/lookup') {
    const email = (params.email || '').trim().toLowerCase();
    const phone = (params.phone || '').trim();
    const rows = await getAllRecords(STORES.donors);
    const match = rows.find((r) => {
      const e = (r.record.email || '').toLowerCase();
      const p = (r.record.phone || '').trim();
      if (email && phone) return e === email || p === phone;
      if (email) return e === email;
      if (phone) return p === phone;
      return false;
    });
    return wrapSuccess(
      match ? donorToApi(match) : null,
      match ? 'Donor found' : 'No donor found',
    );
  }

  if (method === 'get' && url === '/donors') {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const pageSize = parseInt(params.pageSize, 10) || 10;
    let rows = (await getAllRecords(STORES.donors)).map(donorToApi);
    const search = (params.search || '').trim().toLowerCase();
    if (search) {
      rows = rows.filter((d) =>
        [d.name, d.email, d.phone, d.city]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(search)),
      );
    }
    if (params.donor_type) rows = rows.filter((d) => d.donor_type === params.donor_type);
    if (params.source === 'online') rows = rows.filter((d) => d.source === 'website');
    else if (params.source === 'offline') rows = rows.filter((d) => d.source !== 'website');

    const sortField = params.sortField || 'created_at';
    const sortOrder = params.sortOrder === 'ASC' ? 1 : -1;
    rows.sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      if (av < bv) return -1 * sortOrder;
      if (av > bv) return 1 * sortOrder;
      return 0;
    });
    const total = rows.length;
    const paged = pageSize > 0 ? rows.slice((page - 1) * pageSize, page * pageSize) : rows;
    return {
      success: true,
      message: 'Offline donors retrieved',
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

  if (method === 'get' && LOCAL_DONOR.test(url)) {
    const localId = url.match(LOCAL_DONOR)[1];
    const row = await getRecord(STORES.donors, localId);
    if (!row) throw new Error('Offline donor not found');
    const donor = donorToApi(row);
    donor.donations = [];
    return wrapSuccess(donor, 'Donor retrieved offline');
  }

  // ── Donations (manual / offline) ────────────────────────────────────
  if (method === 'post' && url === '/donations') {
    return createDonationOffline(body, enqueue);
  }

  if (method === 'post' && url === '/donations/search') {
    return searchDonationsOffline(body, enqueue);
  }

  if (method === 'get' && LOCAL_DONATION.test(url)) {
    return getDonationOffline(url.match(LOCAL_DONATION)[1]);
  }

  if (method === 'patch' && LOCAL_DONATION_NOTE.test(url)) {
    const localId = url.match(LOCAL_DONATION_NOTE)[1];
    return patchDonationNoteOffline(localId, body?.note ?? '', enqueue);
  }

  if (method === 'patch' && LOCAL_DONATION.test(url)) {
    return patchDonationOffline(url.match(LOCAL_DONATION)[1], body, enqueue);
  }

  if (method === 'delete' && LOCAL_DONATION.test(url)) {
    return deleteDonationOffline(url.match(LOCAL_DONATION)[1]);
  }

  // ── Donation box collections ────────────────────────────────────────
  if (method === 'post' && url === '/donation-box-donation') {
    return createBoxDonationOffline(body, enqueue);
  }

  if (method === 'get' && url === '/donation-box-donation') {
    return listBoxDonationsOffline(config);
  }

  if (method === 'get' && BOX_BY_ID.test(url)) {
    const boxId = url.match(BOX_BY_ID)[1];
    return listBoxDonationsOffline(config, boxId);
  }

  if (method === 'get' && LOCAL_BOX.test(url)) {
    return getBoxDonationOffline(url.match(LOCAL_BOX)[1]);
  }

  if (method === 'delete' && LOCAL_BOX.test(url)) {
    return deleteBoxDonationOffline(url.match(LOCAL_BOX)[1]);
  }

  throw new Error(`Offline handler not implemented for ${method.toUpperCase()} ${url}`);
}

export { isLocalId };
