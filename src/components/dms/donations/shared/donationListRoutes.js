/**
 * Resolve list/view/update/add base paths from the current donations route.
 * Optional `params.channel`: 'online' | 'offline' | 'csr' | 'in_kind' forces a channel
 * (used when embedding the list outside a donations URL).
 */
export function getDonationListRoutes(location, params = {}) {
  const pathname = location?.pathname || '';
  const csrDonorId = params.csrDonorId != null ? String(params.csrDonorId) : '';
  const forcedChannel = params.channel || null;

  if (forcedChannel === 'offline') {
    return {
      basePath: '/donations/offline_donations',
      listPath: '/donations/offline_donations/list',
      channel: 'offline',
      pageLabel: 'Offline Donation',
      listTitle: 'Offline Donations',
    };
  }

  if (forcedChannel === 'online') {
    return {
      basePath: '/donations/online_donations',
      listPath: '/donations/online_donations/list',
      channel: 'online',
      pageLabel: 'Online Donation',
      listTitle: 'Donations Listing',
    };
  }

  if (forcedChannel === 'in_kind') {
    return {
      basePath: '/dms/in-kind-donations',
      listPath: '/dms/in-kind-donations/list',
      channel: 'in_kind',
      pageLabel: 'In Kind Donation',
      listTitle: 'In Kind Donations',
    };
  }

  if (forcedChannel === 'csr') {
    if (csrDonorId) {
      const basePath = `/dms/csr-donors/${csrDonorId}/donations`;
      return {
        basePath,
        listPath: basePath,
        channel: 'csr',
        pageLabel: 'CSR Donation',
        listTitle: 'CSR Donor Donations',
        csrDonorId,
      };
    }
    return {
      basePath: '/dms/csr-donations',
      listPath: '/dms/csr-donations/list',
      channel: 'csr',
      pageLabel: 'CSR Donation',
      listTitle: 'CSR Donations',
    };
  }

  if (pathname.startsWith('/dms/in-kind-donations')) {
    return {
      basePath: '/dms/in-kind-donations',
      listPath: '/dms/in-kind-donations/list',
      channel: 'in_kind',
      pageLabel: 'In Kind Donation',
      listTitle: 'In Kind Donations',
    };
  }

  if (pathname.startsWith('/dms/csr-donations')) {
    return {
      basePath: '/dms/csr-donations',
      listPath: '/dms/csr-donations/list',
      channel: 'csr',
      pageLabel: 'CSR Donation',
      listTitle: 'CSR Donations',
    };
  }

  if (csrDonorId && pathname.includes('/dms/csr-donors/') && pathname.includes('/donations')) {
    const basePath = `/dms/csr-donors/${csrDonorId}/donations`;
    return {
      basePath,
      listPath: basePath,
      channel: 'csr',
      pageLabel: 'CSR Donation',
      listTitle: 'CSR Donor Donations',
      csrDonorId,
    };
  }

  if (pathname.includes('/donations/offline_donations')) {
    return {
      basePath: '/donations/offline_donations',
      listPath: '/donations/offline_donations/list',
      channel: 'offline',
      pageLabel: 'Offline Donation',
      listTitle: 'Offline Donations',
    };
  }

  return {
    basePath: '/donations/online_donations',
    listPath: '/donations/online_donations/list',
    channel: 'online',
    pageLabel: 'Online Donation',
    listTitle: 'Donations Listing',
  };
}

export function donationViewPath(routes, id) {
  return `${routes.basePath}/view/${id}`;
}

export function donationUpdatePath(routes, id) {
  return `${routes.basePath}/update/${id}`;
}

export function donationAddPath(routes, query = '') {
  const q = query ? (query.startsWith('?') ? query : `?${query}`) : '';
  if (routes.channel === 'csr') {
    return `/dms/csr-donations/add${q}`;
  }
  if (routes.channel === 'in_kind') {
    return `/dms/in-kind-donations/add${q}`;
  }
  return `${routes.basePath}/add${q}`;
}

/** Prefer explicit list return from router state, then resolved list path. */
export function resolveDonationListBackPath(location, routes) {
  if (location?.state?.fromList) {
    return location.state.fromList;
  }
  return routes.listPath;
}
