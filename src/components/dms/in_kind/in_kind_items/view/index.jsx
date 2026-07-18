import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';

const ViewInKindItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/dms/in-kind-items/${id}`);
        
        if (response.data.success) {
          setItem(response.data.data);
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

  const handleBack = () => {
    navigate('/dms/in-kind-items/list');
  };

  const handleEdit = () => {
    navigate(`/dms/in-kind-items/edit/${id}`);
  };

  const getCategoryBadge = (category) => {
    const categoryLabels = {
      clothing: 'Clothing',
      food: 'Food',
      medical: 'Medical',
      educational: 'Educational',
      electronics: 'Electronics',
      furniture: 'Furniture',
      books: 'Books',
      toys: 'Toys',
      household: 'Household',
      other: 'Other'
    };

    return (
      <span className="status-badge status-badge--info">
        {categoryLabels[category] || category}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader title="In-Kind Item Details" onBack={handleBack} />
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div>Loading item details...</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader title="In-Kind Item Details" onBack={handleBack} />
          <div className="status-message status-message--error">
            {error}
          </div>
        </div>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader title="In-Kind Item Details" onBack={handleBack} />
          <div className="status-message status-message--error">
            Item not found
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
          title="In-Kind Item Details" 
          onBack={handleBack}
          showEdit={true}
          onEdit={handleEdit}
        />
        
        <div className="view-wrapper">
          <div className="view-content">
            {/* Item Information */}
            <div className="view-section">
              <h3 className="view-section-title">Item Information</h3>
              <div className="view-grid">
                <div className="view-item">
                  <span className="view-item-label">Item Name</span>
                  <span className="view-item-value">{item.name}</span>
                </div>
                <div className="view-item">
                  <span className="view-item-label">Category</span>
                  <span className="view-item-value">{getCategoryBadge(item.category)}</span>
                </div>
                <div className="view-item view-item--full">
                  <span className="view-item-label">Description</span>
                  <span className="view-item-value">
                    {item.description || 'No description provided'}
                  </span>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="view-section">
              <h3 className="view-section-title">System Information</h3>
              <div className="view-grid">
                <div className="view-item">
                  <span className="view-item-label">Item ID</span>
                  <span className="view-item-value">#{item.id}</span>
                </div>
                <div className="view-item">
                  <span className="view-item-label">Created Date</span>
                  <span className="view-item-value">{formatDate(item.created_at)}</span>
                </div>
                <div className="view-item">
                  <span className="view-item-label">Last Updated</span>
                  <span className="view-item-value">{formatDate(item.updated_at)}</span>
                </div>
                <div className="view-item">
                  <span className="view-item-label">Status</span>
                  <span className="view-item-value">
                    <span className="status-badge status-badge--success">Active</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewInKindItem;
