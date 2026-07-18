import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';

const EmailTemplateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
    description: '',
    category: 'general',
    is_active: true
  });

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/email-templates/${id}`);
      if (response.data.success) {
        setForm(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch template');
      console.error('Error fetching template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await axiosInstance.patch(`/email-templates/${id}`, form);
      } else {
        await axiosInstance.post('/email-templates', form);
      }
      navigate('/dms/email_templates/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/dms/email_templates/list');
  };

  const categoryOptions = [
    { value: 'donation', label: 'Donation' },
    { value: 'receipt', label: 'Receipt' },
    { value: 'general', label: 'General' }
  ];

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader 
          title={id ? 'Edit Email Template' : 'Add Email Template'} 
          onBack={handleBack}
        />
        
        <div className="form-card card">
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <FormInput 
                label="Template Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., donation-confirmation-email"
                required
              />
              <FormInput 
                label="Email Subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Subject of the email"
                required
              />
              <FormSelect 
                label="Category"
                name="category"
                value={form.category}
                onChange={handleChange}
                options={categoryOptions}
              />
              <div className="form-item checkbox-item">
                <label>
                  <input 
                    type="checkbox" 
                    name="is_active" 
                    checked={form.is_active} 
                    onChange={handleChange} 
                  /> Active
                </label>
              </div>
            </div>

            <FormTextarea 
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Internal description of what this template is for"
            />

            <FormTextarea 
              label="Email Body (HTML/Text)"
              name="body"
              value={form.body}
              onChange={handleChange}
              placeholder="HTML or plain text body. Use placeholders like {{donor_name}}"
              required
              rows={15}
            />

            <div className="form-actions">
              <button type="button" className="secondary-btn" onClick={handleBack}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EmailTemplateForm;
