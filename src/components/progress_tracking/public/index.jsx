import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../utils/axios';
import Navbar from '../../Navbar';
import PageHeader from '../../common/PageHeader';

const PublicTrackingPage = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosInstance.get(`/progress/public/${token}`);
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError(res.data?.message || 'Tracking not found');
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Tracking not found');
      } finally {
        setLoading(false);
      }
    };
    if (token) run();
  }, [token]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="Tracking" showBackButton={true} />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="Tracking" showBackButton={true} />
          <div className="view-content">
            <div className="status-message status-message--error">{error}</div>
          </div>
        </div>
      </>
    );
  }

  const steps = data?.steps || [];

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader title="Tracking" showBackButton={true} />
        <div className="view-content">
          <div className="view-section">
            <h3 className="view-section-title">{data?.template?.name || 'Progress'}</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {steps.map((s) => (
                <div key={s.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ fontWeight: 600 }}>{s.step_order}. {s.title}</div>
                    <span className={`status-badge status-${s.status}`}>{s.status}</span>
                  </div>
                  {s.completed_at && (
                    <div style={{ marginTop: '6px', color: '#6b7280', fontSize: '13px' }}>
                      Completed: {new Date(s.completed_at).toLocaleString()}
                    </div>
                  )}
                  {(s.evidence || []).length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(s.evidence || []).map((ev) => (
                        <a key={ev.id} href={ev.file_url} target="_blank" rel="noreferrer" style={{ fontSize: '13px' }}>
                          {ev.title || ev.file_type}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {steps.length === 0 && (
                <div className="empty-state" style={{ padding: '20px' }}>
                  No updates yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublicTrackingPage;

