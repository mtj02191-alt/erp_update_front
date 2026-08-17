import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';

const ReceiptTemplateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    raw_html: '',
  });

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/receipt-templates/${id}`);
      if (response.data.success) {
        const data = response.data.data;
        setForm({
          name: data.name || '',
          raw_html: data.raw_html || '',
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch receipt template');
      console.error('Error fetching receipt template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (id) {
        await axiosInstance.patch(`/receipt-templates/${id}`, form);
      } else {
        await axiosInstance.post('/receipt-templates', form);
      }
      navigate('/dms/receipt_templates/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save receipt template');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/dms/receipt_templates/list');
  };

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title={id ? 'Edit Receipt Template' : 'Add Receipt Template'}
          onBack={handleBack}
        />

        <div className="form-card card">
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <FormInput
              label="Receipt Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., donation-receipt-default"
              required
            />

            <FormTextarea
              label="Raw HTML"
              name="raw_html"
              value={form.raw_html}
              onChange={handleChange}
              placeholder="Paste full HTML for the receipt. Use placeholders like {{donor_name}}, {{amount}}."
              required
              rows={18}
            />

            <div className="form-actions">
              <button type="button" className="secondary-btn" onClick={handleBack}>
                Cancel
              </button>
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

export default ReceiptTemplateForm;
