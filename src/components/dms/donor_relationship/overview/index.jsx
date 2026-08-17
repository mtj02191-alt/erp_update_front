import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';
import { formatActivityType, formatDateTime } from '../shared/constants';
import '../donor-relationship.css';

const ManagementOverview = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const canView = useMemo(
    () =>
      permissions?.super_admin === true ||
      permissions?.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'donor_relationship', 'manage_overview'),
    [permissions],
  );

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!canView) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/donor-relationship/overview');
        if (res.data.success) {
          setData(res.data.data);
        } else {
          setError(res.data.message || 'Failed to load overview');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load overview');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [canView]);

  if (!canView) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="Management Overview" backPath="/dms/donor-relationship/follow-ups" />
          <p>You do not have permission to view management overview.</p>
        </div>
      </>
    );
  }

  const summary = data?.summary || {};

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader
          title="Donor Relationship — Management Overview"
          backPath="/dms/donor-relationship/follow-ups"
        />

        <div className="followups-page__overview">
          <button
            type="button"
            className="secondary_btn"
            onClick={() => navigate('/dms/donor-relationship/interactions')}
          >
            My interactions
          </button>
          <button
            type="button"
            className="secondary_btn"
            onClick={() => navigate('/dms/donor-relationship/interactions?scope=team')}
          >
            Team interactions
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {loading && <p>Loading…</p>}

        {!loading && data && (
          <>
            <div className="donor-relationship-summary">
              <div className="donor-relationship-summary__item">
                <strong>{summary.todayActivities ?? 0}</strong>
                <span>Today&apos;s activities</span>
              </div>
              <div className="donor-relationship-summary__item">
                <strong>{summary.pendingFollowups ?? 0}</strong>
                <span>Pending follow-ups</span>
              </div>
              <div className="donor-relationship-summary__item">
                <strong>{summary.overdueFollowups ?? 0}</strong>
                <span>Overdue</span>
              </div>
              <div className="donor-relationship-summary__item">
                <strong>{summary.completedFollowups ?? 0}</strong>
                <span>Completed</span>
              </div>
            </div>

            <h3>Recent team activities</h3>
            {(data.recentInteractions || []).length === 0 ? (
              <p>No recent interactions.</p>
            ) : (
              data.recentInteractions.map((item) => (
                <div key={item.id} className="donor-relationship-card">
                  <div className="donor-relationship-card__header">
                    <div>
                      <div className="donor-relationship-card__title">
                        {item.donor?.name || `Donor #${item.donor_id}`}
                      </div>
                      <div className="donor-relationship-card__meta">
                        {formatDateTime(item.activity_datetime)} ·{' '}
                        {item.created_by?.name || item.created_by?.email || 'Staff'}
                      </div>
                    </div>
                    <span className={`donor-relationship-status ${item.status}`}>
                      {item.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="donor-relationship-card__section">
                    <div className="donor-relationship-card__label">Activity</div>
                    <div>
                      {formatActivityType(item.activity_type)} — {item.user_action_text}
                    </div>
                  </div>
                  {item.donor_response_text && (
                    <div className="donor-relationship-card__section">
                      <div className="donor-relationship-card__label">Donor response</div>
                      <div>{item.donor_response_text}</div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="primary_btn"
                    style={{ marginTop: 8 }}
                    onClick={() => navigate(`/dms/donors/view/${item.donor_id}`)}
                  >
                    View donor
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ManagementOverview;
