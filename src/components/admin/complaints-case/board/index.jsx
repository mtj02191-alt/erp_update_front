import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLayout, FiList, FiSearch } from 'react-icons/fi';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Loader from '../../../common/loader/Loader';
import { SecondaryButton } from '../../../common/buttons';
import { useAuth } from '../../../../context/AuthContext';
import { getComplaintCasePermissions } from '../../../../utils/permissions';
import useComplaintCaseQuery from '../shared/useComplaintCaseQuery';
import {
  BOARD_COLUMNS,
  getCategoryLabel,
  getStatusLabel,
  getDepartmentLabel,
} from '../shared/complaintCaseConfig';
import '../shared/complaintCase.css';
import './index.css';

export default function ComplaintsCaseBoard({ viewMode, onViewModeChange }) {
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const casePerms = useMemo(
    () => getComplaintCasePermissions(permissions, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );

  const { data, loading, statusCounts, refresh } = useComplaintCaseQuery({
    storagePrefix: 'complaints-case-board',
    defaultPageSize: 200,
  });

  const resolveBoardStatus = (status) => {
    const legacyMap = {
      submitted: 'acknowledged',
      under_investigation: 'investigating',
      dismissed: 'closed_rejected',
      closed: 'closed_rejected',
    };
    return legacyMap[status] || status;
  };

  const grouped = useMemo(() => {
    const map = {};
    BOARD_COLUMNS.forEach((col) => {
      map[col.key] = [];
    });
    data.forEach((item) => {
      const normalizedStatus = resolveBoardStatus(item.complaint_workflow_status);
      const col = BOARD_COLUMNS.find((c) => c.status === normalizedStatus);
      if (col) map[col.key].push(item);
    });
    return map;
  }, [data]);

  return (
    <>
      <Navbar />
      <div className="list-wrapper cc-shell">
        <PageHeader
          title="Complaints Board"
          showBackButton={false}
          showAdd={casePerms.canCreate}
          addPath="/complaints/add"
          addLabel="Submit Complaint"
        />
        <div className="list-content">
          <div className="cc-toolbar">
            <div className="cc-toolbar__filters">
              <SecondaryButton onClick={refresh}>Refresh</SecondaryButton>
              <SecondaryButton onClick={() => navigate('/complaints/track')}>
                <FiSearch style={{ marginRight: 4 }} />
                Track
              </SecondaryButton>
            </div>
            <div className="cc-toolbar__views">
              <div className="cc-view-toggle" role="tablist" aria-label="View mode">
                <button
                  type="button"
                  className={viewMode === 'board' ? 'is-active' : ''}
                  onClick={() => onViewModeChange('board')}
                >
                  <FiLayout style={{ marginRight: 4, verticalAlign: -2 }} />
                  Board
                </button>
                <button
                  type="button"
                  className={viewMode === 'list' ? 'is-active' : ''}
                  onClick={() => onViewModeChange('list')}
                >
                  <FiList style={{ marginRight: 4, verticalAlign: -2 }} />
                  List
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <Loader />
          ) : (
            <div className="complaint-case-board">
              {BOARD_COLUMNS.map((col) => (
                <section
                  key={col.key}
                  className={`complaint-case-board__column complaint-case-board__column--${col.key}`}
                >
                  <header className="complaint-case-board__header">
                    <h3>{col.label}</h3>
                    <span className="complaint-case-board__count">
                      {grouped[col.key]?.length || statusCounts[col.status] || 0}
                    </span>
                  </header>
                  <div className="complaint-case-board__cards">
                    {(grouped[col.key] || []).length === 0 ? (
                      <div className="complaint-case-board__empty">No complaints</div>
                    ) : (
                      (grouped[col.key] || []).map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          className="complaint-case-card"
                          onClick={() => navigate(`/complaints/view/${item.id}`)}
                        >
                          <div className="complaint-case-card__top">
                            <span className="cc-code">{item.complaint_code}</span>
                            <span className={`cc-status cc-status--${item.complaint_workflow_status}`}>
                              {getStatusLabel(item.complaint_workflow_status)}
                            </span>
                          </div>
                          <div className="complaint-case-card__title">{item.title}</div>
                          <div className="complaint-case-card__meta">
                            {getCategoryLabel(item.complaint_category, item.complaint_category_custom)}
                          </div>
                          <div className="complaint-case-card__depts">
                            {(item.nominated_departments || []).slice(0, 3).map((dept) => (
                              <span key={dept} className="cc-pill">
                                {getDepartmentLabel(dept)}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
