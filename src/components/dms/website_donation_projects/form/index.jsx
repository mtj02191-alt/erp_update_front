import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import PageContentEditor from './PageContentEditor';
import PageContentPreview from './PageContentPreview';
import PageContentImageUpload from './PageContentImageUpload';
import {
  emptyInitiative,
  emptyPageContent,
  pageContentFromApi,
  pageContentToApi,
} from './pageContentUtils';
import './WebsiteDonationProjectForm.css';

const CATEGORIES = ['General', 'Zakat', 'Sadqa'];
const ICON_KEYS = [
  { value: 'health', label: 'Health' },
  { value: 'education', label: 'Education' },
  { value: 'clean_water', label: 'Clean Water' },
  { value: 'apnaghar', label: 'Apna Ghar' },
  { value: 'disaster_relief', label: 'Gaza / Disaster Relief' },
  { value: 'kasb', label: 'KASB' },
  { value: 'seeds', label: 'Seeds of Change' },
  { value: 'qurbani', label: 'Qurbani' },
  { value: 'aaslab', label: 'Aaslab' },
  { value: 'community', label: 'Community Service' },
];

const TABS = [
  { id: 'catalog', label: 'Donation catalog' },
  { id: 'page', label: 'Page content' },
  { id: 'preview', label: 'Live preview' },
];

const WebsiteDonationProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('catalog');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState({
    slug: '',
    title: '',
    category: 'General',
    icon_key: 'health',
    price: '',
    is_new: false,
    is_default: false,
    template_code: '',
    sort_order: 10,
    is_active: true,
    listing_image_url: '',
    initiatives: [],
  });
  const [pageContent, setPageContent] = useState(emptyPageContent());

  useEffect(() => {
    if (id) fetchOne();
  }, [id]);

  const fetchOne = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/website-donation-projects/${id}`);
      const data = res.data?.data;
      if (!data) return;
      setCatalog({
        slug: data.slug || '',
        title: data.title || '',
        category: data.category || 'General',
        icon_key: data.icon_key || '',
        price: data.price ?? '',
        is_new: !!data.is_new,
        is_default: !!data.is_default,
        template_code: data.template_code || '',
        sort_order: data.sort_order ?? 10,
        is_active: data.is_active !== false,
        listing_image_url: data.listing_image_url || '',
        initiatives: (data.initiatives || []).map((i) => ({
          id: i.id,
          slug: i.slug || '',
          title: i.title || '',
          subtitle: i.subtitle || '',
          price: i.price ?? '',
          description: i.description || '',
          duration: i.duration || '',
          icon_key: i.icon_key || '',
          template_code: i.template_code || '',
          sort_order: i.sort_order ?? 10,
          is_active: i.is_active !== false,
        })),
      });
      setPageContent(pageContentFromApi(data.page_content));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const updateCatalog = (key, value) => setCatalog((prev) => ({ ...prev, [key]: value }));

  const updateInitiative = (index, key, value) => {
    setCatalog((prev) => ({
      ...prev,
      initiatives: prev.initiatives.map((row, i) =>
        i === index ? { ...row, [key]: value } : row,
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...catalog,
        price: catalog.price === '' ? null : Number(catalog.price),
        sort_order: Number(catalog.sort_order) || 0,
        initiatives: catalog.initiatives.map((i, idx) => ({
          ...i,
          price: i.price === '' ? 0 : Number(i.price),
          sort_order: Number(i.sort_order) || (idx + 1) * 10,
          icon_key: i.icon_key || catalog.icon_key || null,
        })),
        page_content: pageContentToApi(pageContent, catalog.title),
      };
      if (id) {
        await axiosInstance.patch(`/website-donation-projects/${id}`, payload);
      } else {
        await axiosInstance.post('/website-donation-projects', payload);
      }
      navigate('/dms/website_donation_projects/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title={id ? 'Edit Website Donation Project' : 'Add Website Donation Project'}
          onBackClick={() => navigate('/dms/website_donation_projects/list')}
        />
        <div className="form-card card website-donation-project-form">
          {error && <div className="error-message">{error}</div>}

          <div className="wdp-tabs" role="tablist" aria-label="Project form sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`wdp-tab${activeTab === tab.id ? ' wdp-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {activeTab === 'catalog' && (
              <>
                <p className="wdp-help">
                  Donation form options (Quick Donate, checkout). Use the same slug the website
                  already knows (e.g. health, education).
                </p>
                <div className="form-grid">
                  <FormInput
                    label="Title"
                    name="title"
                    value={catalog.title}
                    onChange={(e) => updateCatalog('title', e.target.value)}
                    required
                  />
                  <FormInput
                    label="Slug (website id)"
                    name="slug"
                    value={catalog.slug}
                    onChange={(e) => updateCatalog('slug', e.target.value)}
                    placeholder="health"
                    required
                  />
                  <div className="form-group">
                    <label className="form-label" htmlFor="category">Category</label>
                    <select
                      id="category"
                      className="form-input"
                      value={catalog.category}
                      onChange={(e) => updateCatalog('category', e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="icon_key">Icon</label>
                    <select
                      id="icon_key"
                      className="form-input"
                      value={catalog.icon_key}
                      onChange={(e) => updateCatalog('icon_key', e.target.value)}
                    >
                      <option value="">None</option>
                      {ICON_KEYS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <FormInput
                    label="Fallback price"
                    name="price"
                    type="number"
                    value={catalog.price}
                    onChange={(e) => updateCatalog('price', e.target.value)}
                  />
                  <FormInput
                    label="Sort order"
                    name="sort_order"
                    type="number"
                    value={catalog.sort_order}
                    onChange={(e) => updateCatalog('sort_order', e.target.value)}
                  />
                  <FormInput
                    label="Template code (optional)"
                    name="template_code"
                    value={catalog.template_code}
                    onChange={(e) => updateCatalog('template_code', e.target.value)}
                  />
                </div>

                <h3 className="form-section-heading">Programs listing page (/projects)</h3>
                <p className="wdp-help">
                  Card image shown on the public Programs &amp; Projects page. Falls back to
                  static website data if empty.
                </p>
                <PageContentImageUpload
                  label="Listing card image"
                  value={catalog.listing_image_url}
                  onChange={(url) => updateCatalog('listing_image_url', url)}
                />

                <div className="wdp-checkbox-group">
                  <label className="wdp-checkbox-label">
                    <input
                      type="checkbox"
                      checked={catalog.is_active}
                      onChange={(e) => updateCatalog('is_active', e.target.checked)}
                    />
                    <span>Visible in donation catalog</span>
                  </label>
                  <label className="wdp-checkbox-label">
                    <input
                      type="checkbox"
                      checked={catalog.is_new}
                      onChange={(e) => updateCatalog('is_new', e.target.checked)}
                    />
                    <span>Mark as new</span>
                  </label>
                  <label className="wdp-checkbox-label">
                    <input
                      type="checkbox"
                      checked={catalog.is_default}
                      onChange={(e) => updateCatalog('is_default', e.target.checked)}
                    />
                    <span>Default in Quick Donate</span>
                  </label>
                </div>

                <h3 className="form-section-heading">Initiatives / options</h3>
                <p className="wdp-help">
                  Leave empty for projects that only take a custom amount (e.g. Gaza Relief).
                </p>
                {catalog.initiatives.map((row, index) => (
                  <div key={row.id || `new-${index}`} className="wdp-repeat-card">
                    <div className="wdp-repeat-card__header">
                      <h4 className="wdp-repeat-card__title">
                        Option {index + 1}
                        {row.title ? `: ${row.title}` : ''}
                      </h4>
                      <button
                        type="button"
                        className="secondary_btn secondary_btn--danger"
                        onClick={() =>
                          setCatalog((prev) => ({
                            ...prev,
                            initiatives: prev.initiatives.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <div className="form-grid">
                      <FormInput
                        label="Option title"
                        name={`init-title-${index}`}
                        value={row.title}
                        onChange={(e) => updateInitiative(index, 'title', e.target.value)}
                        required
                      />
                      <FormInput
                        label="Slug (website id)"
                        name={`init-slug-${index}`}
                        value={row.slug}
                        onChange={(e) => updateInitiative(index, 'slug', e.target.value)}
                        placeholder="health-patient-care"
                        required
                      />
                      <FormInput
                        label="Subtitle"
                        name={`init-subtitle-${index}`}
                        value={row.subtitle}
                        onChange={(e) => updateInitiative(index, 'subtitle', e.target.value)}
                      />
                      <FormInput
                        label="Price"
                        name={`init-price-${index}`}
                        type="number"
                        value={row.price}
                        onChange={(e) => updateInitiative(index, 'price', e.target.value)}
                        required
                      />
                      <FormInput
                        label="Duration"
                        name={`init-duration-${index}`}
                        value={row.duration}
                        onChange={(e) => updateInitiative(index, 'duration', e.target.value)}
                        placeholder="One time"
                      />
                      <FormInput
                        label="Sort order"
                        name={`init-sort-${index}`}
                        type="number"
                        value={row.sort_order}
                        onChange={(e) => updateInitiative(index, 'sort_order', e.target.value)}
                      />
                      <FormInput
                        label="Template code"
                        name={`init-template-${index}`}
                        value={row.template_code}
                        onChange={(e) => updateInitiative(index, 'template_code', e.target.value)}
                      />
                    </div>
                    <FormTextarea
                      label="Description"
                      name={`init-desc-${index}`}
                      value={row.description}
                      onChange={(e) => updateInitiative(index, 'description', e.target.value)}
                    />
                    <label className="wdp-checkbox-label">
                      <input
                        type="checkbox"
                        checked={row.is_active}
                        onChange={(e) => updateInitiative(index, 'is_active', e.target.checked)}
                      />
                      <span>Visible on website</span>
                    </label>
                  </div>
                ))}
                <button
                  type="button"
                  className="secondary_btn wdp-add-btn"
                  onClick={() =>
                    setCatalog((prev) => ({
                      ...prev,
                      initiatives: [...prev.initiatives, emptyInitiative()],
                    }))
                  }
                >
                  + Add option
                </button>
              </>
            )}

            {activeTab === 'page' && (
              <PageContentEditor
                pageContent={pageContent}
                setPageContent={setPageContent}
                catalogTitle={catalog.title}
                catalogCategory={catalog.category}
              />
            )}

            {activeTab === 'preview' && (
              <PageContentPreview
                pageContent={pageContent}
                catalog={{
                  slug: catalog.slug,
                  title: catalog.title,
                  category: catalog.category,
                }}
              />
            )}

            <div className="form-actions">
              <button
                type="button"
                className="secondary_btn"
                onClick={() => navigate('/dms/website_donation_projects/list')}
              >
                Cancel
              </button>
              <button type="submit" className="primary_btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default WebsiteDonationProjectForm;
