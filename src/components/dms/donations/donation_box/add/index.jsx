import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import FormInput from '../../../../common/FormInput';
import SearchableDropdown from '../../../../common/SearchableDropdown';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';

const AddDonationBoxDonation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    donation_box_id: '',
    donation_box: id ?? null, // Will store the selected donation box object
    collection_amount: '',
    collection_date: new Date().toISOString().split('T')[0]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [donationBox, setDonationBox] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Handle donation box selection from searchable dropdown
  const handleDonationBoxSelect = (donationBox) => {
    setForm({
      ...form,
      donation_box_id: donationBox.id,
      donation_box: donationBox
    });
    if (error) setError('');
  };

  // Clear donation box selection
  const handleClearDonationBox = () => {
    setForm({
      ...form,
      donation_box_id: '',
      donation_box: null
    });
  };

  // Custom render function for donation box options
  // Note: SearchableDropdown wraps this with key, onClick, and onMouseEnter
  const renderDonationBoxOption = (box) => (
    <>
      <div style={{ fontWeight: '600', color: '#333' }}>
        Key: {box?.key_no}
      </div>
      <div style={{ fontSize: '0.9em', color: '#666' }}>
        {box?.shop_name} - {box?.shopkeeper || 'N/A'}
      </div>
      <div style={{ fontSize: '0.85em', color: '#999' }}>
        {box?.route?.cities?.find(city => city.id === box.city_id)?.name}, {box?.route?.region?.name} • {box?.box_type}
      </div>
    </>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!form.donation_box_id || !form.collection_amount || !form.collection_date) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      // Validate collection amount
      const amount = parseFloat(form.collection_amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid collection amount');
        setIsSubmitting(false);
        return;
      }

      // Prepare donation data
      const donationData = {
        donation_box_id: form.donation_box_id,
        collection_amount: amount,
        collection_date: form.collection_date
      };

      await axiosInstance.post('/donation-box-donation', donationData); 

      // Redirect to donations list after successful creation 
      navigate(`/dms/donation-box-donations/list/${form?.donation_box_id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add donation. Please try again.');
      console.error('Error adding donation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/dms/donation-box-donations/list');
  };

  const fetchDonationBox = async (id) => {
    try {
      const response = await axiosInstance.get(`/donation-box/${id}`);
      if (response.data.success) {
        setDonationBox(response.data.data);
        setForm({...form, donation_box_id: response.data.data.id});
      }
    }
    catch (err) {
      console.error('Error fetching donation box:', err);
      setError('Failed to fetch donation box');
      setDonationBox(null);
    }
  };
useEffect(()=>{},[id])
  useEffect(() => {
    if (id) {
      fetchDonationBox(id);
    }
  }, [id]);

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader 
          title="Add Donation Box Collection" 
          onBack={handleBack}
        />
        
        {error && (
          <div className="status-message status-message--error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          {/* Donation Box Selection */}
          {!id ?<> <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Donation Box Information</h3>
            <div className="form-grid-2"> 
              <SearchableDropdown
                label="Search Donation Box"
                placeholder="Type Box Key Number or Shopkeeper name..."
                apiEndpoint="/donation-box"
                searchParamName="search"
                onSelect={handleDonationBoxSelect}
                onClear={handleClearDonationBox}
                renderOption={renderDonationBoxOption}
                displayKey="key_no"
                value={form.donation_box}
                name="donation_box"
                required
                minSearchLength={1}
                debounceDelay={300}
                allowResearch={true}
              />

              {/* {form.donation_box && (
                <div style={{ 
                  padding: '15px', 
                  backgroundColor: '#f0f9ff', 
                  borderRadius: '8px',
                  border: '1px solid #bae6fd'
                }}>
                  <div style={{ fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
                    Selected Box Details
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#333' }}>
                    <div><strong>Box ID:</strong> {form.donation_box.box_id_no}</div>
                    <div><strong>Shop:</strong> {form.donation_box.shop_name}</div>
                    <div><strong>Shopkeeper:</strong> {form.donation_box.shopkeeper || 'N/A'}</div>
                    <div><strong>Location:</strong> {form.donation_box.city}, {form.donation_box.region}</div>
                    <div><strong>Box Type:</strong> {form.donation_box.box_type}</div>
                  </div>
                </div>
              )} */}
            </div>
          </div>
          </> : <>
          <h3>Add Donation for:  <small style={{color:"green"}}>{donationBox?.key_no} </small></h3>
          </>
          }

          {/* Collection Details */}
          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Collection Details</h3>
            <div className="form-grid-2">
              <FormInput
                label="Collection Amount"
                type="number"
                name="collection_amount"
                value={form.collection_amount}
                onChange={handleChange}
                required
                placeholder="Enter amount collected"
                step="0.01"
                min="0"
              />

              <FormInput
                label="Collection Date"
                type="date"
                name="collection_date"
                value={form.collection_date}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="primary_btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Donation'}
            </button>
            <button 
              type="button" 
              className="secondary_btn" 
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddDonationBoxDonation;

