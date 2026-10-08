import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';
import { formatAuditActor } from '../../../common/audit/auditHistoryLabels';

const formatAmount = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ViewEventPledge = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canUpdate = useMemo(
    () =>
      permissions?.super_admin === true ||
      permissions?.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'event_pledges', 'update'),
    [permissions],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/dms/event-pledges/${id}`);
        if (!res.data?.success || !res.data?.data) {
          throw new Error(res.data?.message || 'Failed to load');
        }
        if (!cancelled) {
          setRow(res.data.data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Failed to load');
          setRow(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="Event Pledge"
            showBackButton
            backPath="/dms/event-pledges/list"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (error || !row) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="Event Pledge"
            showBackButton
            backPath="/dms/event-pledges/list"
          />
          <div className="error-message">{error || 'Not found'}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader
          title={`Event Pledge #${row.id}`}
          showBackButton
          backPath="/dms/event-pledges/list"
          showEdit={canUpdate}
          editPath={`/dms/event-pledges/edit/${id}`}
        />
        <div className="view-content">
          <section className="view-section">
            <h3>Pledge details</h3>
            <div className="view-grid">
              <div>
                <strong>Donor Name</strong>
                <p>{row.donor_name || '—'}</p>
              </div>
              <div>
                <strong>Contact Number</strong>
                <p>{row.contact_number || '—'}</p>
              </div>
              <div>
                <strong>Care of / Representative</strong>
                <p>{row.care_of_representative || '—'}</p>
              </div>
              <div>
                <strong>Donation Type</strong>
                <p>
                  {row.donation_type === 'zakat'
                    ? 'Zakat'
                    : row.donation_type === 'general'
                      ? 'General'
                      : row.donation_type || '—'}
                </p>
              </div>
              <div>
                <strong>Donation Amount</strong>
                <p>{formatAmount(row.donation_amount)}</p>
              </div>
              <div>
                <strong>Address</strong>
                <p>{row.address || '—'}</p>
              </div>
              <div>
                <strong>Created</strong>
                <p>{formatDate(row.created_at)}</p>
              </div>
              <div>
                <strong>Created by</strong>
                <p>{row.created_by ? formatAuditActor(row.created_by) : '—'}</p>
              </div>
              <div>
                <strong>Updated</strong>
                <p>{formatDate(row.updated_at)}</p>
              </div>
            </div>
          </section>
          {canUpdate && (
            <div className="form-actions" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="primary_btn"
                onClick={() => navigate(`/dms/event-pledges/edit/${id}`)}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ViewEventPledge;
