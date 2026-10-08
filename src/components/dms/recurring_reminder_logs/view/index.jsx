import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiMail } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';

const statusLabel = (value) => {
  if (value === 'sent') return 'Sent';
  if (value === 'not_sent') return 'Not Sent';
  if (value === 'n_a') return 'N/A';
  return value || '—';
};

const RecurringReminderLogView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axiosInstance.get(`/recurring-reminder-logs/${id}`);
        if (response.data?.success) {
          setData(response.data.data);
        } else {
          setError(response.data?.message || 'Failed to load reminder log');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load reminder log');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="Reminder Log"
            showBackButton
            backPath="/dms/recurring-reminder-logs/list"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="Reminder Log"
            showBackButton
            backPath="/dms/recurring-reminder-logs/list"
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
          title={`Reminder Log #${data.id}`}
          showBackButton
          backPath="/dms/recurring-reminder-logs/list"
          icon={<FiMail />}
        />

        <div className="view-content">
          <section className="view-section">
            <h3>Donor</h3>
            <div className="view-grid">
              <div>
                <strong>Donor Name</strong>
                <p>
                  {data.donor_id ? (
                    <Link to={`/dms/donors/view/${data.donor_id}`}>
                      {data.donor_name || `Donor #${data.donor_id}`}
                    </Link>
                  ) : (
                    data.donor_name || '—'
                  )}
                </p>
              </div>
              <div>
                <strong>Email</strong>
                <p>{data.donor_email || '—'}</p>
              </div>
              <div>
                <strong>Phone</strong>
                <p>{data.donor_phone || '—'}</p>
              </div>
            </div>
          </section>

          <section className="view-section">
            <h3>Send Status</h3>
            <div className="view-grid">
              <div>
                <strong>Mail</strong>
                <p>{statusLabel(data.mail_status)}</p>
              </div>
              <div>
                <strong>WA Msg</strong>
                <p>{statusLabel(data.wa_status)}</p>
              </div>
              <div>
                <strong>Action</strong>
                <p>{data.action_type || '—'}</p>
              </div>
              <div>
                <strong>Source</strong>
                <p>
                  {data.source === 'ledger_subscription'
                    ? 'Recurring donation'
                    : 'Campaign pledge'}
                </p>
              </div>
              <div>
                <strong>Period</strong>
                <p>{data.period_key || '—'}</p>
              </div>
              <div>
                <strong>Frequency</strong>
                <p>{data.frequency || '—'}</p>
              </div>
              <div>
                <strong>Sent At</strong>
                <p>
                  {data.created_at
                    ? new Date(data.created_at).toLocaleString()
                    : '—'}
                </p>
              </div>
              <div>
                <strong>Run ID</strong>
                <p style={{ wordBreak: 'break-all' }}>{data.run_id || '—'}</p>
              </div>
            </div>
          </section>

          <section className="view-section">
            <h3>References</h3>
            <div className="view-grid">
              <div>
                <strong>Pledge ID</strong>
                <p>{data.pledge_id || '—'}</p>
              </div>
              <div>
                <strong>Recurring Donation</strong>
                <p>
                  {data.recurring_donation_id ? (
                    <Link
                      to={`/dms/recurring-donations/view/${data.recurring_donation_id}`}
                    >
                      #{data.recurring_donation_id}
                    </Link>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div>
                <strong>Campaign</strong>
                <p>{data.campaign_title || data.campaign_id || '—'}</p>
              </div>
              <div>
                <strong>Donation ID</strong>
                <p>
                  {data.donation_id ? (
                    <Link to={`/donations/online_donations/view/${data.donation_id}`}>
                      #{data.donation_id}
                    </Link>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div>
                <strong>Amount</strong>
                <p>
                  {data.amount != null
                    ? `${data.currency || 'PKR'} ${data.amount}`
                    : '—'}
                </p>
              </div>
              <div>
                <strong>Error</strong>
                <p>{data.error_message || '—'}</p>
              </div>
            </div>
          </section>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/dms/recurring-reminder-logs/list')}
            >
              Back to list
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecurringReminderLogView;
