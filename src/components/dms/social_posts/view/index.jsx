import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';

import { FiRepeat, FiRefreshCw, FiTrash2, FiImage, FiFileText } from 'react-icons/fi';

const SocialPostView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get(`/social-posts/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError(res.data.message || 'Failed to load social post');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load social post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePublish = async () => {
    try {
      setError('');
      setInfoMessage('');
      await axiosInstance.post(`/social-posts/${id}/publish`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish to Buffer');
    }
  };

  const handleSyncStatus = async () => {
    try {
      setSyncing(true);
      setError('');
      setInfoMessage('');
      const res = await axiosInstance.post(`/social-posts/${id}/sync-buffer-status`);
      if (res.data.success) {
        setInfoMessage(res.data.message || 'Status synced from Buffer');
        if (res.data.data?.post) {
          setData(res.data.data.post);
        } else {
          await load();
        }
      } else {
        setError(res.data.message || 'Failed to sync status from Buffer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sync status from Buffer');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    try {
      setError('');
      await axiosInstance.delete(`/social-posts/${id}`);
      navigate('/dms/social-posts/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to archive post');
    }
  };

  const status = data?.status || '';
  const scheduledAt = data?.scheduled_at
    ? new Date(data.scheduled_at).toLocaleString()
    : '-';

  const getActions = () => [
    {
      icon: <FiRefreshCw />,
      label: 'Check Buffer Status',
      color: '#8b5cf6',
      visible: !!data?.buffer_post_id,
      disabled: syncing,
      onClick: handleSyncStatus,
    },
    {
      icon: <FiRepeat />,
      label: 'Publish to Buffer',
      color: '#10b981',
      visible: status !== 'published' && status !== 'cancelled',
      onClick: handlePublish,
    },
    {
      icon: <FiTrash2 />,
      label: 'Archive',
      color: '#f44336',
      visible: true,
      onClick: () => setShowDeleteModal(true),
    },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="Social Post"
            showBackButton
            backPath="/dms/social-posts/list"
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
            title="Social Post"
            showBackButton
            backPath="/dms/social-posts/list"
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
          title={`Social Post #${data.id}`}
          showBackButton
          backPath="/dms/social-posts/list"
          icon={<FiFileText />}
          showEdit={true}
          editPath={`/dms/social-posts/edit/${data.id}`}
        />

        {error && <div className="error-message">{error}</div>}
        {infoMessage && (
          <div
            className="error-message"
            style={{ backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
          >
            {infoMessage}
          </div>
        )}

        <div className="view-content">
          <div className="view-section">
            <h3 style={{ marginBottom: 10 }}>Details</h3>

            <div className="view-grid">
              <div>
                <strong>Status</strong>
                <p>{data.status || '-'}</p>
              </div>
              <div>
                <strong>Channel</strong>
                <p>{data.buffer_channel_name || '-'}</p>
              </div>
              <div>
                <strong>Scheduled</strong>
                <p>{scheduledAt}</p>
              </div>
              <div>
                <strong>Buffer Post ID</strong>
                <p>{data.buffer_post_id || '-'}</p>
              </div>
              {data.last_error && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Last error</strong>
                  <p style={{ color: '#b91c1c' }}>{data.last_error}</p>
                </div>
              )}
              <div>
                <strong>Campaign ID</strong>
                <p>{data.campaign_id || '-'}</p>
              </div>
              <div>
                <strong>Appeal ID</strong>
                <p>{data.appeal_id || '-'}</p>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <ActionMenu actions={getActions()} />
            </div>
          </div>

          <div className="view-section">
            <h3 style={{ marginBottom: 10 }}>Post Text</h3>
            <div className="card" style={{ padding: 16 }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {data.post_text || '-'}
              </pre>
            </div>
          </div>

          <div className="view-section">
            <h3 style={{ marginBottom: 10 }}>
              <FiImage style={{ marginRight: 8 }} />
              Image
            </h3>

            {data.image_url ? (
              <div style={{ marginTop: 8 }}>
                <img
                  src={data.image_url}
                  alt="Social post"
                  style={{ maxWidth: '100%', borderRadius: 10 }}
                />
              </div>
            ) : (
              <div style={{ color: '#6b7280' }}>No image attached</div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        text="Archive social post?"
        delete
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default SocialPostView;

