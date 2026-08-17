import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import {
  loadAudienceFilters,
  parseDonorIdsParam,
} from '../communicationAudience';
import CommunicationSendForm from './CommunicationSendForm';

const CommunicationSend = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTemplateId = searchParams.get('template') || '';
  const initialMode = searchParams.get('mode') || 'filters';
  const initialDonorIds = parseDonorIdsParam(searchParams.get('donor_ids'));
  const initialDonorFilters = initialDonorIds.length
    ? null
    : loadAudienceFilters();

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title="Send Communication"
          onBack={() => navigate('/dms/email_templates/list')}
        />

        <div className="form-card card">
          <CommunicationSendForm
            initialAudienceMode={initialDonorIds.length ? 'manual' : initialMode}
            initialDonorIds={initialDonorIds}
            initialDonorFilters={initialDonorFilters}
            initialTemplateId={initialTemplateId}
            lockAudience={false}
            showHistoryLink
            onNavigateHistory={() =>
              navigate('/dms/email_templates/batches?source=communication')
            }
          />
        </div>
      </div>
    </>
  );
};

export default CommunicationSend;
