import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';

const AddInKindItem = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'other'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

      await axiosInstance.post('dms/in-kind-items', itemData);

      // Redirect to in-kind items list after successful creation
      navigate('/dms/in-kind-items/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add in-kind item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/dms/in-kind-items/list');
  };

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

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader 
          title="Add In-Kind Item" 
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
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddInKindItem;
