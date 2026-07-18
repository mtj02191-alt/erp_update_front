import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../../../common/PageHeader';
import axiosInstance from '../../../../../utils/axios'; 
import FormSelect from '../../../../common/FormSelect';
import Navbar from '../../../../Navbar';

const EditInKindItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categoryOptions = [
    { value: 'clothing', label: 'Clothing' },
    { value: 'food', label: 'Food' },
    { value: 'medical', label: 'Medical' },
    { value: 'educational', label: 'Educational' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'books', label: 'Books' },
    { value: 'toys', label: 'Toys' },
    { value: 'household', label: 'Household' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/in-kind-items/${id}`);
        
        if (response.data.success) {
          const itemData = response.data.data;
          setForm({
            name: itemData.name || '',
            description: itemData.description || '',
            category: itemData.category || ''
          });
        } else {
          setError('Failed to fetch in-kind item details');
        }
      } catch (err) {
        console.error('Error fetching in-kind item:', err);
        setError('Failed to fetch in-kind item details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItem();
    }
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const itemData = {
        name: form.name,
        description: form.description || null,
        category: form.category
      };

      await axiosInstance.put(`dms/in-kind-items/${id}`, itemData);

      // Redirect to in-kind items list after successful update
      navigate('/dms/in-kind-items/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update in-kind item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/dms/in-kind-items/list');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader title="Edit In-Kind Item" onBack={handleBack} />
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div>Loading item details...</div>
          </div>
        </div>
      </>
    );
  }

  if (error && !form.name) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader title="Edit In-Kind Item" onBack={handleBack} />
          <div className="status-message status-message--error">
            {error}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader 
          title="Edit In-Kind Item" 
          onBack={handleBack}
        />
        
        {error && (
          <div className="status-message status-message--error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Item Details</h3>
            
            <div className="form-grid-2">

              <FormInput
                label="Item Name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Enter item name"
              />
            </div>

            <FormSelect
              label="Category"
              name="category"
              value={form.category}
              onChange={handleChange}
              options={categoryOptions}
              required
              placeholder="Select category"
            />

            <FormInput
              label="Description"
              type="textarea"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter detailed description of the item"
              rows="4"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleBack}
              className="secondary_btn"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary_btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Item'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditInKindItem;
