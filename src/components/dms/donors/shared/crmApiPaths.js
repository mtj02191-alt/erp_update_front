/**
 * Resolves CRM API paths for individual donors vs CSR donors.
 * Individual flows use donorId only; CSR flows use csrDonorId (+ optional csrPocId).
 */
export function resolveCrmApiPaths({ donorId, csrDonorId, csrPocId }) {
  if (csrDonorId) {
    const params = { csr_donor_id: csrDonorId };
    const queryParts = [`csr_donor_id=${csrDonorId}`];
    if (csrPocId) {
      params.csr_poc_id = csrPocId;
      queryParts.push(`csr_poc_id=${csrPocId}`);
    }
    return {
      pipelineHistory: `/csr-donors/${csrDonorId}/pipeline-history`,
      pipelineStage: `/csr-donors/${csrDonorId}/pipeline-stage`,
      auditHistory: `/csr-donors/${csrDonorId}/audit-history`,
      interactionsParams: params,
      followupsParams: params,
      interactionAddQuery: queryParts.join('&'),
      responseEntityKey: 'csr_donor',
    };
  }
  if (donorId) {
    return {
      pipelineHistory: `/donors/${donorId}/pipeline-history`,
      pipelineStage: `/donors/${donorId}/pipeline-stage`,
      auditHistory: `/donors/${donorId}/audit-history`,
      interactionsParams: { donor_id: donorId },
      followupsParams: null,
      interactionAddQuery: `donor_id=${donorId}`,
      responseEntityKey: 'donor',
    };
  }
  return null;
}

export function extractCrmStageChangeEntity(data, responseEntityKey) {
  if (!data) return null;
  return data[responseEntityKey] || data.donor || data.csr_donor || null;
}
