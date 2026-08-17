import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';

const ViewReceiptTemplate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/receipt-templates/${id}`);
      if (response.data.success) {
        setTemplate(response.data.data);
        setError('');
      } else {
        setError('Failed to fetch receipt template');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch receipt template');
      console.error('Error fetching receipt template:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="View Receipt Template"
            showBackButton
            backPath="/dms/receipt_templates/list"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (error || !template) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="View Receipt Template"
            showBackButton
            backPath="/dms/receipt_templates/list"
          />
          <div className="view-content">
            <div className="status-message status-message--error">
              {error || 'Receipt template not found'}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader
          title="View Receipt Template"
          showBackButton
          backPath="/dms/receipt_templates/list"
        />
        <div className="view-content">
          <div className="view-section">
            <h3 className="view-section-title">Template Details</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Name</span>
                <span className="view-item-value">{template.name}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Created</span>
                <span className="view-item-value">{formatDate(template.created_at)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Last updated</span>
                <span className="view-item-value">{formatDate(template.updated_at)}</span>
              </div>
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">HTML Preview</h3>
            <iframe
              title={`Receipt template preview: ${template.name}`}
              srcDoc={template.raw_html || ''}
              sandbox=""
              className="theme-preview-frame"
            />
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Raw HTML</h3>
            <pre className="theme-code-pre">
              {template.raw_html}
            </pre>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="primary_btn"
              onClick={() => navigate(`/dms/receipt_templates/edit/${template.id}`)}
            >
              Edit Template
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewReceiptTemplate;
