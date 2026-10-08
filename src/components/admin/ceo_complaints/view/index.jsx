import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission, isSuperAdmin } from '../../../../utils/permissions';
import {
  ORGANIZATION_OPTIONS,
  COMPLAINANT_TYPE_OPTIONS,
  DEPARTMENT_OPTIONS,
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  ASLAB_BRANCH_OPTIONS,
  labelFor,
} from '../shared/ceoComplaintConfig';

const Detail = ({ label, children }) => (
  <div className="detail-item">
    <label className="detail-label">{label}</label>
    <div className="detail-value">{children ?? '-'}</div>
  </div>
);

const CeoComplaintView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canView = useMemo(
    () =>
      isSuperAdmin(permissions) ||
      hasPermission(permissions, 'ceo_office', 'ceo_complaints', 'view') ||
      hasPermission(permissions, 'ceo_office', 'ceo_complaints', 'list_view'),
    [permissions],
  );

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axiosInstance.get(`/ceo-complaints/${id}`);
        setRow(res.data?.data || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load complaint');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, canView]);

  if (!canView) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="CEO Complaint"
            showBackButton
            backPath="/ceo-office/ceo-complaints/list"
          />
          <div className="status-message status-message--error">
            You do not have permission to view this complaint.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <div className="view-content">
          <PageHeader
            title="CEO Complaint"
            subtitle={row?.complaint_number || ''}
            showBackButton
            backPath="/ceo-office/ceo-complaints/list"
          />

          {loading && <div className="empty-state">Loading...</div>}
          {error && (
            <div className="status-message status-message--error">{error}</div>
          )}
          {!loading && !error && !row && (
            <div className="empty-state">Complaint not found</div>
          )}

          {row && (
            <div className="detail-section">
              <div className="detail-grid">
                <Detail label="Complaint number">{row.complaint_number}</Detail>
                <Detail label="Status">
                  {labelFor(STATUS_OPTIONS, row.status)}
                </Detail>
                <Detail label="Organization">
                  {labelFor(ORGANIZATION_OPTIONS, row.organization)}
                </Detail>
                <Detail label="Branch">
                  {row.branch
                    ? labelFor(ASLAB_BRANCH_OPTIONS, row.branch)
                    : '-'}
                </Detail>
                <Detail label="Complainant type">
                  {labelFor(COMPLAINANT_TYPE_OPTIONS, row.complainant_type)}
                </Detail>
                <Detail label="Name">{row.complainant_name || '-'}</Detail>
                <Detail label="Contact">{row.contact_number || '-'}</Detail>
                <Detail label="Department">
                  {labelFor(DEPARTMENT_OPTIONS, row.department)}
                </Detail>
                <Detail label="Complaint type">
                  {labelFor(CATEGORY_OPTIONS, row.category)}
                </Detail>
                <Detail label="Priority / ترجیح">
                  {labelFor(PRIORITY_OPTIONS, row.priority)}
                </Detail>
                <Detail label="Channel">{row.submission_channel || '-'}</Detail>
                <Detail label="Created">
                  {row.created_at
                    ? new Date(row.created_at).toLocaleString()
                    : '-'}
                </Detail>
              </div>
              <div style={{ marginTop: 20 }}>
                <Detail label="Details">
                  <div className="text-content">{row.details}</div>
                </Detail>
              </div>
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="secondary_btn"
                  onClick={() => navigate('/ceo-office/ceo-complaints/list')}
                >
                  Back to list
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CeoComplaintView;
