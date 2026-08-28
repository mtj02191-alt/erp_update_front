import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import HeroSlideImageUpload from './HeroSlideImageUpload';

const emptyForm = () => ({
  title: '',
  desktop_image_url: '',
  mobile_image_url: '',
  link: '',
  sort_order: 10,
  is_active: true,
});

const WebsiteHomeHeroForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    if (id) fetchOne();
  }, [id]);

  const fetchOne = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/website-home-hero/${id}`);
      const data = res.data?.data;
      if (!data) return;
      setForm({
        title: data.title || '',
        desktop_image_url: data.desktop_image_url || '',
        mobile_image_url: data.mobile_image_url || '',
        link: data.link || '',
        sort_order: data.sort_order ?? 10,
        is_active: data.is_active !== false,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load hero slide');
    } finally {
      setLoading(false);
    }
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.desktop_image_url?.trim() || !form.mobile_image_url?.trim()) {
      setError('Desktop and mobile images are required');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        title: form.title?.trim() || null,
        desktop_image_url: form.desktop_image_url.trim(),
        mobile_image_url: form.mobile_image_url.trim(),
        link: form.link?.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: !!form.is_active,
      };
      if (id) {
        await axiosInstance.patch(`/website-home-hero/${id}`, payload);
      } else {
        await axiosInstance.post('/website-home-hero', payload);
      }
      navigate('/dms/website_home_hero/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save hero slide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title={id ? 'Edit Home Hero Slide' : 'Add Home Hero Slide'}
          onBackClick={() => navigate('/dms/website_home_hero/list')}
        />
        <div className="list-content">
          <form className="card" style={{ padding: 24, maxWidth: 720 }} onSubmit={handleSubmit}>
            {error && <div className="error-message" style={{ marginBottom: 12 }}>{error}</div>}

            <FormInput
              label="Title (admin only)"
              name="title"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. Apna Ghar"
            />

            <HeroSlideImageUpload
              label="Desktop image"
              value={form.desktop_image_url}
              onChange={(url) => setField('desktop_image_url', url)}
              disabled={loading}
            />

            <HeroSlideImageUpload
              label="Mobile image"
              value={form.mobile_image_url}
              onChange={(url) => setField('mobile_image_url', url)}
              disabled={loading}
            />

            <FormInput
              label="Link"
              name="link"
              value={form.link}
              onChange={(e) => setField('link', e.target.value)}
              placeholder="/donate/apna-ghar"
            />

            <FormInput
              label="Sort order"
              name="sort_order"
              type="number"
              value={form.sort_order}
              onChange={(e) => setField('sort_order', e.target.value)}
            />

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!form.is_active}
                  onChange={(e) => setField('is_active', e.target.checked)}
                />
                Visible on website
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving…' : id ? 'Update slide' : 'Create slide'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/dms/website_home_hero/list')}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default WebsiteHomeHeroForm;
