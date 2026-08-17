import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Card from '../../../common/Card';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';

const ViewAppeal = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [appeal, setAppeal] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUpdate, setNewUpdate] = useState({ title: '', content: '' });
  const [newMedia, setNewMedia] = useState({ url: '', media_type: 'gallery', caption: '' });
  const [newStatus, setNewStatus] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [appealRes, updatesRes, mediaRes] = await Promise.all([
        axiosInstance.get(`/appeals/${id}`),
        axiosInstance.get('/appeal-updates', { params: { appeal_id: id } }),
        axiosInstance.get('/appeal-media', { params: { appeal_id: id } }),
      ]);
      if (appealRes.data.success) {
        setAppeal(appealRes.data.data);
        setNewStatus(appealRes.data.data.status);
      }
      if (updatesRes.data.success) setUpdates(updatesRes.data.data || []);
      if (mediaRes.data.success) setMedia(mediaRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appeal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  const handleStatusSave = async () => {
    setSavingStatus(true);
    try {
      await axiosInstance.patch(`/appeals/${id}/status`, { status: newStatus });
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAddUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/appeal-updates', {
        appeal_id: Number(id),
        title: newUpdate.title,
        content: newUpdate.content,
        is_published: true,
      });
      setNewUpdate({ title: '', content: '' });
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add update');
    }
  };

  const handleAddMedia = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/appeal-media', {
        appeal_id: Number(id),
        url: newMedia.url,
        media_type: newMedia.media_type,
        caption: newMedia.caption || undefined,
      });
      setNewMedia({ url: '', media_type: 'gallery', caption: '' });
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add media');
    }
  };

  const formatAmount = (amount, currency = 'PKR') => {
    if (amount == null) return '-';
    return `${currency} ${Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content"><p>Loading...</p></div>
      </>
    );
  }

  if (!appeal) {
    return (
      <>
        <Navbar />
        <div className="form-content"><p>{error || 'Appeal not found'}</p></div>
      </>
    );
  }

  const b = appeal.beneficiary || {};

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title={appeal.title}
          onBackClick={() => navigate('/dms/appeals/list')}
          showEdit
          editPath={`/dms/appeals/edit/${id}`}
        />

        {error && <div className="status-message status-message--error">{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card title="Fundraising">
            <p><strong>Raised:</strong> {formatAmount(appeal.raised_amount, appeal.currency)}</p>
            <p><strong>Goal:</strong> {formatAmount(appeal.goal_amount, appeal.currency)}</p>
            <p><strong>Progress:</strong> {appeal.progress_percent ?? 0}%</p>
            <p><strong>Donors:</strong> {appeal.donor_count ?? 0}</p>
            <p><strong>Days left:</strong> {appeal.days_left ?? '—'}</p>
            <p><strong>Slug:</strong> {appeal.slug}</p>
            <p><strong>Category:</strong> {appeal.category}</p>
            <p><strong>Status:</strong> {appeal.status}</p>
          </Card>

          <Card title="Beneficiary">
            <p><strong>Name:</strong> {b.name || '—'}</p>
            <p><strong>Age:</strong> {b.age ?? '—'}</p>
            <p><strong>Location:</strong> {b.location || '—'}</p>
            {b.profile_image_url && (
              <img src={b.profile_image_url} alt={b.name} style={{ maxWidth: '100%', maxHeight: 200, marginTop: 8 }} />
            )}
          </Card>
        </div>

        <Card title="Story" style={{ marginTop: 20 }}>
          <p>{appeal.short_description}</p>
          <p style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{appeal.story}</p>
        </Card>

        <Card title="Change status" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="ended">Ended</option>
              <option value="archived">Archived</option>
            </select>
            <button type="button" className="primary_btn" onClick={handleStatusSave} disabled={savingStatus}>
              {savingStatus ? 'Saving...' : 'Update status'}
            </button>
          </div>
        </Card>

        <Card title="Updates" style={{ marginTop: 20 }}>
          {updates.length === 0 ? <p>No updates yet.</p> : (
            <ul>
              {updates.map((u) => (
                <li key={u.id} style={{ marginBottom: 12 }}>
                  <strong>{u.title}</strong>
                  {u.published_at && <span style={{ color: '#666', marginLeft: 8 }}>{new Date(u.published_at).toLocaleString()}</span>}
                  <p>{u.content}</p>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleAddUpdate} style={{ marginTop: 16 }}>
            <FormInput label="Update title" name="title" value={newUpdate.title} onChange={(e) => setNewUpdate((p) => ({ ...p, title: e.target.value }))} required />
            <FormTextarea label="Update content" name="content" value={newUpdate.content} onChange={(e) => setNewUpdate((p) => ({ ...p, content: e.target.value }))} rows={3} required />
            <button type="submit" className="primary_btn" style={{ marginTop: 8 }}>Add update</button>
          </form>
        </Card>

        <Card title="Media (cloud URLs)" style={{ marginTop: 20 }}>
          {media.length === 0 ? <p>No gallery media yet.</p> : (
            <ul>
              {media.map((m) => (
                <li key={m.id} style={{ marginBottom: 8 }}>
                  <a href={m.url} target="_blank" rel="noreferrer">{m.url}</a>
                  <span style={{ marginLeft: 8, color: '#666' }}>({m.media_type})</span>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleAddMedia} style={{ marginTop: 16 }}>
            <FormInput label="Image URL" name="url" value={newMedia.url} onChange={(e) => setNewMedia((p) => ({ ...p, url: e.target.value }))} required />
            <FormInput label="Type (hero, gallery, update)" name="media_type" value={newMedia.media_type} onChange={(e) => setNewMedia((p) => ({ ...p, media_type: e.target.value }))} />
            <FormInput label="Caption" name="caption" value={newMedia.caption} onChange={(e) => setNewMedia((p) => ({ ...p, caption: e.target.value }))} />
            <button type="submit" className="primary_btn" style={{ marginTop: 8 }}>Add media</button>
          </form>
        </Card>
      </div>
    </>
  );
};

export default ViewAppeal;
