import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import SearchableDropdown from '../../../common/SearchableDropdown';
import HybridDropdown from '../../../common/HybridDropdown';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import { donation_collection_centers } from '../../../../utils/dms';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useInKindItems } from '../../../../context/InKindItemsContext';
import ReloadButton from '../../../common/buttons/reload';
import { projectCards } from '../../../../utils/program';

const AddDonation = () => {
  const navigate = useNavigate();
  const { inKindItems, refetchInKindItems } = useInKindItems();
  const [searchParams] = useSearchParams();
  const donorIdFromUrl = searchParams.get('donor_id');
  // console.log("inKindItems", inKindItems);
  const [form, setForm] = useState({
    // Donor information (will come from selected donor)
    donor_id: '',
    
    // Donation details
    amount: '',
    currency: 'PKR',
    date: new Date().toISOString().split('T')[0], // Current date
    donation_type: 'general',
    donation_method: 'cash',
    source: '',
    collection_center: '',
    status: 'pending',
    
    // Payment method specific fields
    cheque_number: '',
    bank_name: '',
    bank: '',
    transaction_id: '',
    
    // In-kind donation fields (array of items)
        in_kind_items: [
          {
            id: null,
            name: '',
            description: '',
            category: '',
            condition: 'good',
            quantity: 1,
            estimated_value: '',
            brand: '',
            model: '',
            size: '',
            color: '',
            collection_date: new Date().toISOString().split('T')[0],
            collection_location: '',
            notes: ''
          }
        ],
    
    // Project information
    project_id: '',
    project_name: '',

    // Optional: website-style payload for initiatives/cart (used by Qurbani workflow)
    donation_items: [],

    /** Qurbani only: optional on-behalf name(s) */
    on_behalf_names: '',
  });

  const QURBANI_PROJECT_ID = 'qurbani-baraye-mustehqeen'; 
  const qurbaniProject = (projectCards || []).find((p) => p.id === QURBANI_PROJECT_ID) || null;
  const qurbaniInitiatives = qurbaniProject?.initiatives || [];
  const isQurbaniProject = form.project_id === QURBANI_PROJECT_ID;
  const projectOptions = (projectCards || []).map((p) => ({
    value: p.id,
    label: p.title,
  }));

  const setToQurbaniProject = () => {
    setForm((prev) => ({
      ...prev,
      project_id: QURBANI_PROJECT_ID,
      project_name: qurbaniProject?.title || prev.project_name || 'Qurbani Barai Mustehqeen',
      donation_items: Array.isArray(prev.donation_items) ? prev.donation_items : [],
    }));
  };

  const addQurbaniItemRow = () => {
    setForm((prev) => ({
      ...prev,
      donation_items: [
        ...(Array.isArray(prev.donation_items) ? prev.donation_items : []),
        {
          initiativeId: '',
          initiativeTitle: '',
          initiativeSubtitle: '',
          quantity: 1,
          basePrice: 0,
          totalAmount: 0,
        },
      ],
    }));
  };

  const removeQurbaniItemRow = (idx) => {
    setForm((prev) => ({
      ...prev,
      donation_items: (Array.isArray(prev.donation_items) ? prev.donation_items : []).filter(
        (_, i) => i !== idx,
      ),
    }));
  };

  const updateQurbaniItemRow = (idx, patch) => {
    setForm((prev) => {
      const items = Array.isArray(prev.donation_items) ? prev.donation_items : [];
      const next = items.map((it, i) => {
        if (i !== idx) return it;
        const merged = { ...(it || {}), ...(patch || {}) };
        const qty = Number(merged.quantity || 0);
        const price = Number(merged.basePrice || 0);
        const q = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1;
        const p = Number.isFinite(price) && price >= 0 ? price : 0;
        return {
          ...merged,
          quantity: q,
          basePrice: p,
          totalAmount: q * p,
        };
      });
      return { ...prev, donation_items: next };
    });
  };
  
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Handle donor selection from SearchableDropdown
  const handleDonorSelect = (donor) => {
    setSelectedDonor(donor);
    setForm({
      ...form,
      donor_id: donor.id
    });
  };

  // Handle donor clear
  const handleDonorClear = () => {
    setSelectedDonor(null);
    setForm({
      ...form,
      donor_id: ''
    });
  };

  // Handle adding new in-kind item
  const addInKindItem = () => {
    const newItem = {
      id: null,
      name: '',
      item_code: '',
      description: '',
      category: '',
      condition: 'good',
      quantity: 1,
      estimated_value: '',
      brand: '',
      model: '',
      size: '',
      color: '',
      collection_date: new Date().toISOString().split('T')[0],
      collection_location: '',
      notes: ''
    };
    
    setForm({
      ...form,
      in_kind_items: [...form.in_kind_items, newItem]
    });
  };

  // Handle removing in-kind item
  const removeInKindItem = (index) => {
    if (form.in_kind_items.length > 1) {
      const updatedItems = form.in_kind_items.filter((_, i) => i !== index);
      setForm({
        ...form,
        in_kind_items: updatedItems
      });
    }
  };

  // Handle in-kind item field change
  const handleInKindItemChange = (index, field, value) => {
    const updatedItems = form.in_kind_items.map((item, i) => {
      if (i === index) {
        // If changing the name field, find the selected item and populate its data
        if (field === 'name') {
          const selectedItem = inKindItems.find(inkindItem => inkindItem.name === value);
          if (selectedItem) {
            return {
              ...item,
              id: selectedItem.id,
              name: selectedItem.name,
              description: selectedItem.description || item.description,
              category: selectedItem.category || item.category,
              // Don't override estimated_value, let user keep their input
              estimated_value: item.estimated_value
            };
          }
        }
        return { ...item, [field]: value };
      }
      return item;
    });
    setForm({
      ...form,
      in_kind_items: updatedItems
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate donor selection
      if (!form.donor_id) {
        setError('Please select a donor before submitting');
        setIsSubmitting(false);
        return;
      }

      // Prepare donation data
      const donationItems = Array.isArray(form.donation_items) ? form.donation_items : [];
      const qurbaniPayloadItems =
        isQurbaniProject && donationItems.length > 0
          ? donationItems
              .filter((x) => x?.initiativeId && Number(x?.quantity || 0) > 0)
              .map((x) => {
                const initiative =
                  (qurbaniInitiatives || []).find((i) => i.id === x.initiativeId) || null;
                return {
                  projectId: QURBANI_PROJECT_ID,
                  initiativeId: x.initiativeId,
                  projectTitle: qurbaniProject?.title || form.project_name || 'Qurbani Barai Mustehqeen',
                  initiativeTitle: x.initiativeTitle,
                  initiativeSubtitle: x.initiativeSubtitle,
                  templateCode: initiative?.templateCode || x.templateCode || null,
                  quantity: Number(x.quantity),
                  donationType: String(form.donation_type || 'GENERAL').toUpperCase(),
                  basePrice: Number(x.basePrice || 0),
                  selectedPricingOptionId: null,
                  selectedPricingOptionLabel: null,
                  customAmount: 0,
                  totalAmount: Number(x.totalAmount || 0),
                };
              })
          : [];

      const qurbaniTotal =
        qurbaniPayloadItems.length > 0
          ? qurbaniPayloadItems.reduce((sum, it) => sum + Number(it.totalAmount || 0), 0)
          : null;

      const donationData = {
        donor_id: form.donor_id,
        amount: qurbaniTotal != null ? Number(qurbaniTotal) : parseFloat(form.amount),
        currency: form.currency,
        date: form.date,
        donation_type: form.donation_type,
        donation_method: form.donation_method,
        source: form.source,
        collection_center: form.collection_center || null,
        status: form.status,
        project_id: form.project_id || null,
        project_name: form.project_name,
        ...(isQurbaniProject
          ? {
              on_behalf_names: String(form.on_behalf_names || '').trim() || null,
            }
          : {}),
        ...(qurbaniPayloadItems.length > 0 ? { donation_items: qurbaniPayloadItems } : {}),
        // Payment method specific fields
        cheque_number: form.cheque_number || null,
        bank_name: form.bank_name || null,
        bank: form.bank || null,
        transaction_id: form.transaction_id || null,
        
        // In-kind donation fields
        in_kind_items: form.in_kind_items.map(item => ({ 
          name: item.name || null,
          description: item.description || null, 
          category: item.category || null,
          condition: item.condition || null,
          quantity: item.quantity ? parseInt(item.quantity) : null,
          estimated_value: item.estimated_value ? parseFloat(item.estimated_value) : null,
          brand: item.brand || null,
          model: item.model || null,
          size: item.size || null,
          color: item.color || null,
          collection_date: item.collection_date || null,
          collection_location: item.collection_location || null,
          notes: item.notes || null
        }))
      };

      const res = await axiosInstance.post('/donations', donationData);
      const payload = res.data?.data;
      const newDonationId =
        payload &&
        typeof payload === 'object' &&
        Number.isFinite(Number(payload.id)) &&
        Number(payload.id) > 0
          ? Number(payload.id)
          : null;

      // Progress tracking, batch tags, allocate parts — use the shared donation view.
      if (newDonationId) {
        navigate(`/donations/online_donations/view/${newDonationId}`);
        return;
      }

      if (donorIdFromUrl) {
        navigate(`/donations/online_donations/list?donor_id=${donorIdFromUrl}`);
      } else {
        navigate('/donations/online_donations/list');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add donation. Please try again.');
      console.error('Error adding donation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (donorIdFromUrl) {
      navigate(`/donations/online_donations/list?donor_id=${donorIdFromUrl}`);
    } else {
      navigate('/donations/online_donations/list');
    }
  };

  // Dropdown options
  const donationTypeOptions = [
    { value: 'zakat', label: 'Zakat' },
    { value: 'sadqa', label: 'Sadqa' },
    { value: 'general', label: 'General' },
    { value: 'fidya', label: 'Fidya' },
    { value: 'kaffarah', label: 'Kaffarah' },
    { value: 'qurbani-barai-mustehqeen', label: 'Qurbani Barai Mustehqeen' },
  ];

  const donationMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'in_kind', label: 'In Kind' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'registered', label: 'Registered' }
  ];

  const currencyOptions = [
    { value: 'PKR', label: 'PKR - Pakistani Rupee' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'AED', label: 'AED - UAE Dirham' },
    { value: 'SAR', label: 'SAR - Saudi Riyal' }
  ];

  const bankOptions = [
    { value: 'habib_bank', label: 'Habib Bank Limited (HBL)' },
    { value: 'mcb', label: 'Muslim Commercial Bank (MCB)' },
    { value: 'ubl', label: 'United Bank Limited (UBL)' },
    { value: 'allied_bank', label: 'Allied Bank Limited (ABL)' },
    { value: 'meezan_bank', label: 'Meezan Bank' },
    { value: 'national_bank', label: 'National Bank of Pakistan (NBP)' },
    { value: 'standard_chartered', label: 'Standard Chartered Bank' },
    { value: 'bank_alfalah', label: 'Bank Alfalah' },
    { value: 'faysal_bank', label: 'Faysal Bank' },
    { value: 'askari_bank', label: 'Askari Bank' },
    { value: 'js_bank', label: 'JS Bank' },
    { value: 'soneri_bank', label: 'Soneri Bank' },
    { value: 'silk_bank', label: 'Silk Bank' },
    { value: 'other', label: 'Other Bank' }
  ];

  const bankNameOptions = [
    { value: '', label: 'Select bank (optional)' },
    { value: 'habib_bank', label: 'Habib Bank Limited (HBL)' },
    { value: 'mcb', label: 'Muslim Commercial Bank (MCB)' },
    { value: 'ubl', label: 'United Bank Limited (UBL)' },
    { value: 'allied_bank', label: 'Allied Bank Limited (ABL)' },
    { value: 'meezan_bank', label: 'Meezan Bank' },
    { value: 'national_bank', label: 'National Bank of Pakistan (NBP)' },
    { value: 'standard_chartered', label: 'Standard Chartered Bank' },
    { value: 'bank_alfalah', label: 'Bank Alfalah' },
    { value: 'faysal_bank', label: 'Faysal Bank' },
    { value: 'askari_bank', label: 'Askari Bank' },
    { value: 'js_bank', label: 'JS Bank' },
    { value: 'soneri_bank', label: 'Soneri Bank' },
    { value: 'silk_bank', label: 'Silk Bank' },
    { value: 'other', label: 'Other Bank' }
  ];

  // In-kind donation category options
  const inKindCategoryOptions = [
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

  // In-kind donation condition options
  const inKindConditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  // Check if cheque is selected as payment method
  const isChequeSelected = form.donation_method === 'cheque';
  
  // Check if in kind is selected as payment method
  const isInKindSelected = form.donation_method === 'in_kind';
  
  // Check if collection center is selected as donation source
  const isCollectionCenter = form.source === 'collection_center';

  // Fetch donor by donor_id from URL param only once
  useEffect(() => {
    if (donorIdFromUrl && !selectedDonor) {
      async function fetchDonor() {
        try {
          const response = await axiosInstance.get(`/donors/${donorIdFromUrl}`);
          if (response.data.success) {
            setSelectedDonor(response.data.data);
            setForm(prev => ({ ...prev, donor_id: response.data.data.id }));
          }
        } catch (err) {
          console.error('Failed to fetch donor by id from URL:', err);
        }
      }
      fetchDonor();
    }
    // eslint-disable-next-line
  }, [donorIdFromUrl, selectedDonor]);


  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader 
          title="Add Donation" 
          onBack={handleBack}
        />
        
        {error && (
          <div className="status-message status-message--error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          {/* if the donor_id exists in the url, then show the donor  */}
          

          {/* Donor Selection */}
          <div className="form-section">
            <SearchableDropdown
              label="Select Donor :"
              placeholder="Search donors by name, email, or phone..."
              apiEndpoint="/donors"
              onSelect={handleDonorSelect}
              onClear={handleDonorClear}
              value={selectedDonor}
              displayKey="name"
              debounceDelay={500}
              minSearchLength={2}
              allowResearch={true}
              renderOption={(donor, index) => (
                <div 
                  key={donor.id}
                  className="searchable-dropdown__option"
                  onClick={() => handleDonorSelect(donor)}
                  style={{ 
                    padding: '12px',
                    borderBottom: index < donor.length - 1 ? '1px solid #eee' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                    {donor.name || `${donor.first_name} ${donor.last_name}`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {donor.email} • {donor.phone}
                  </div>
                  {donor.donor_type && (
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                      {donor.donor_type === 'individual' ? 'Individual' : 'Corporate'} Donor
                    </div>
                  )}
                </div>
              )}
            />
            {!selectedDonor && (
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                💡 Please register the donor first if not in the system
              </div>
            )}
          </div>

          {/* Donation Details */}
          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Donation Details</h3>
            <div className="form-grid-2">
              <FormInput
                label="Amount"
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
                placeholder="0.00"
                step="0.01"
                min="0"
              />

              <FormSelect
                label="Currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                options={currencyOptions}
                required
              />

              <FormInput
                label="Donation Date"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />

              <FormSelect
                label="Donation Type"
                name="donation_type"
                value={form.donation_type}
                onChange={handleChange}
                options={donationTypeOptions}
                required
              />

              <FormSelect
                label="Payment Method"
                name="donation_method"
                value={form.donation_method}
                onChange={(e) => {
                  const method = e.target.value;
                  setForm({ 
                    ...form, 
                    donation_method: method,
                    // Set status to pending if cheque is selected
                    status: method === 'cheque' ? 'pending' : form.status,
                    // Reset cheque fields if not cheque
                    cheque_number: method === 'cheque' ? form.cheque_number : '',
                    bank_name: method === 'cheque' ? form.bank_name : '',
                    // Reset in kind fields if not in kind
                    in_kind_items: method === 'in_kind' ? form.in_kind_items : [
                      {
                        name: '',
                        item_code: '',
                        description: '',
                        category: '',
                        condition: 'good',
                        quantity: 1,
                        estimated_value: '',
                        brand: '',
                        model: '',
                        size: '',
                        color: '',
                        collection_date: new Date().toISOString().split('T')[0],
                        collection_location: '',
                        notes: ''
                      }
                    ]
                  });
                }}
                options={donationMethodOptions}
                required
              />

              {/* Cheque Fields - Only show if cheque is selected */}
              {isChequeSelected && (
                <>
                  <FormInput
                    label="Cheque Number"
                    type="text"
                    name="cheque_number"
                    value={form.cheque_number}
                    onChange={handleChange}
                    required
                    placeholder="Enter cheque number"
                  />

                  <FormSelect
                    label="Bank Name"
                    name="bank_name"
                    value={form.bank_name}
                    onChange={handleChange}
                    options={bankOptions}
                    required
                  />
                </>
              )}

              <FormSelect
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={statusOptions}
                required
              />

              <HybridDropdown
                label="Donation Source"
                placeholder="Type or select source..."
                options={[
                  { value: 'website', label: 'Website' },
                  { value: 'mobile_app', label: 'Mobile App' },
                  { value: 'collection_center', label: 'Collection Center' },
                  { value: 'home_collection', label: 'Home Collection' },
                  { value: 'email_campaign', label: 'Email Campaign' },
                  { value: 'event', label: 'Event' },
                  { value: 'referral', label: 'Referral' },
                  { value: 'collection_box', label: 'Collection Box' },
                  {value:'bank', label:'Bank'}
                ]}
                value={form.source}
                onChange={(value) => setForm({ 
                  ...form, 
                  source: value,
                  // Reset collection center when source changes
                  collection_center: value === 'collection_center' ? form.collection_center : ''
                })}
                allowCustom={true}
              />

              {/* Collection Center Field - Only show if collection_center is selected */}
              {isCollectionCenter && (
                <HybridDropdown
                  label="Collection Center"
                  placeholder="Type or select collection center..."
                  options={donation_collection_centers}
                  value={form.collection_center}
                  onChange={(value) => setForm({ ...form, collection_center: value })}
                  allowCustom={true}
                />
              )}

              <FormSelect
                label="Bank (Optional)"
                name="bank"
                value={form.bank}
                onChange={handleChange}
                options={bankNameOptions}
              />

              <FormInput
                label="Transaction ID (Optional)"
                type="text"
                name="transaction_id"
                value={form.transaction_id}
                onChange={handleChange}
                placeholder="Enter transaction reference ID"
              />
            </div>
          </div>

           {/* In Kind Details - Only show if in kind is selected */}
           {isInKindSelected && (
             <div className='form-section'>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                 <h3 style={{ color: '#2563eb', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem', margin: 0 }}>
                   In-Kind Donation Details
                 </h3>
               </div>

               {form.in_kind_items.map((item, index) => (
                 <div key={index} style={{ 
                   marginBottom: '2rem', 
                   padding: '1.5rem', 
                   border: '1px solid #e5e7eb', 
                   borderRadius: '8px',
                   backgroundColor: '#f9fafb'
                 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                     <h4 style={{ margin: 0, color: '#374151', fontSize: '16px' }}>
                       Item {index + 1}
                     </h4>
                     <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                       <button
                         type="button"
                         onClick={addInKindItem}
                         style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '4px',
                           padding: '6px 12px',
                           backgroundColor: '#10b981',
                           color: 'white',
                           border: 'none',
                           borderRadius: '4px',
                           cursor: 'pointer',
                           fontSize: '12px'
                         }}
                       >
                         <FiPlus size={14} />
                         Add Item
                       </button>
                       {form.in_kind_items.length > 1 && (
                         <button
                           type="button"
                           onClick={() => removeInKindItem(index)}
                           style={{
                             display: 'flex',
                             alignItems: 'center',
                             gap: '4px',
                             padding: '6px 12px',
                             backgroundColor: '#ef4444',
                             color: 'white',
                             border: 'none',
                             borderRadius: '4px',
                             cursor: 'pointer',
                             fontSize: '12px'
                           }}
                         >
                           <FiTrash2 size={14} />
                           Remove
                         </button>
                       )}
                     </div>
                   </div>

                   <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
                     <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
                       <div style={{ flex: 1 }}>
                         <FormSelect
                           label="Item Name"
                           name={`name_${index}`}
                           value={item.name}
                           onChange={(e) => handleInKindItemChange(index, 'name', e.target.value)}
                           options={[
                             { value: '', label: 'Select item name...' },
                             ...inKindItems.map(item => ({
                               value: item.name,
                               label: item.name
                             }))
                           ]}
                           required
                         />
                       </div>
                       <ReloadButton 
                         contextRefetch={refetchInKindItems}
                         className="reload-btn--small"
                       />
                     </div>
                   </div>

                   <FormInput
                     label="Description"
                     type="textarea"
                     name={`description_${index}`}
                     value={item.description}
                     onChange={(e) => handleInKindItemChange(index, 'description', e.target.value)}
                     placeholder="Detailed description of the item(s)"
                     rows="3"
                     style={{ marginBottom: '1rem' }}
                   />

                   <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
                     <FormSelect
                       label="Category"
                       name={`category_${index}`}
                       value={item.category}
                       onChange={(e) => handleInKindItemChange(index, 'category', e.target.value)}
                       options={inKindCategoryOptions}
                       required
                       placeholder="Select category"
                     />

                     <FormSelect
                       label="Condition"
                       name={`condition_${index}`}
                       value={item.condition}
                       onChange={(e) => handleInKindItemChange(index, 'condition', e.target.value)}
                       options={inKindConditionOptions}
                       required
                     />
                   </div>

                   <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
                     <FormInput
                       label="Quantity"
                       type="number"
                       name={`quantity_${index}`}
                       value={item.quantity}
                       onChange={(e) => handleInKindItemChange(index, 'quantity', e.target.value)}
                       required
                       placeholder="Enter quantity"
                       min="1"
                     />

                     <FormInput
                       label="Estimated Value (PKR)"
                       type="number"
                       name={`estimated_value_${index}`}
                       value={item.estimated_value}
                       onChange={(e) => handleInKindItemChange(index, 'estimated_value', e.target.value)}
                       placeholder="Estimated market value"
                       step="0.01"
                       min="0"
                     />
                   </div>

                   <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
                     <FormInput
                       label="Brand"
                       type="text"
                       name={`brand_${index}`}
                       value={item.brand}
                       onChange={(e) => handleInKindItemChange(index, 'brand', e.target.value)}
                       placeholder="Brand name (if applicable)"
                     />

                     <FormInput
                       label="Model"
                       type="text"
                       name={`model_${index}`}
                       value={item.model}
                       onChange={(e) => handleInKindItemChange(index, 'model', e.target.value)}
                       placeholder="Model number (if applicable)"
                     />
                   </div>

                   <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
                     <FormInput
                       label="Size"
                       type="text"
                       name={`size_${index}`}
                       value={item.size}
                       onChange={(e) => handleInKindItemChange(index, 'size', e.target.value)}
                       placeholder="Size (if applicable)"
                     />

                     <FormInput
                       label="Color"
                       type="text"
                       name={`color_${index}`}
                       value={item.color}
                       onChange={(e) => handleInKindItemChange(index, 'color', e.target.value)}
                       placeholder="Color (if applicable)"
                     />
                   </div>

                   <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
                     <FormInput
                       label="Collection Date"
                       type="date"
                       name={`collection_date_${index}`}
                       value={item.collection_date}
                       onChange={(e) => handleInKindItemChange(index, 'collection_date', e.target.value)}
                       required
                     />

                     <FormInput
                       label="Collection Location"
                       type="text"
                       name={`collection_location_${index}`}
                       value={item.collection_location}
                       onChange={(e) => handleInKindItemChange(index, 'collection_location', e.target.value)}
                       placeholder="Where was it collected from?"
                     />
                   </div>

                   <FormInput
                     label="Notes"
                     type="textarea"
                     name={`notes_${index}`}
                     value={item.notes}
                     onChange={(e) => handleInKindItemChange(index, 'notes', e.target.value)}
                     placeholder="Any additional notes about the item(s)"
                     rows="2"
                   />
                 </div>
               ))}
             </div>
           )}
          {/* Project Information */}
          <div className="form-section">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>Project Information (Optional)</h3>
              {!isQurbaniProject && (
                <button
                  type="button"
                  className="secondary_btn"
                  onClick={setToQurbaniProject}
                  style={{ padding: '8px 10px' }}
                >
                  Use Qurbani workflow
                </button>
              )}
            </div>

            {!isQurbaniProject ? (
              <div className="form-grid-2">
                <FormSelect
                  label="Project ID"
                  name="project_id"
                  value={form.project_id}
                  options={projectOptions}
                  onChange={(e) => {
                    const id = e.target.value;
                    const proj = (projectCards || []).find((p) => p.id === id) || null;
                    setForm((prev) => ({
                      ...prev,
                      project_id: id,
                      project_name: proj?.title || prev.project_name,
                      donation_items: id === QURBANI_PROJECT_ID ? prev.donation_items : [],
                      on_behalf_names:
                        id === QURBANI_PROJECT_ID ? prev.on_behalf_names : '',
                    }));
                  }}
                  showDefaultOption={true}
                  defaultOptionText="Select project"
                />
                <FormInput
                  label="Project Name"
                  type="text"
                  name="project_name"
                  value={
                    (projectCards || []).find((p) => p.id === form.project_id)?.title ||
                    form.project_name
                  }
                  onChange={handleChange}
                  placeholder="Auto-filled from selected project"
                  disabled={true}
                />
              </div>
            ) : (
              <>
                <div className="form-grid-2" style={{ marginBottom: '12px' }}>
                  <FormInput
                    label="Project ID"
                    type="text"
                    name="project_id"
                    value={form.project_id}
                    onChange={handleChange}
                    placeholder="Enter project ID"
                    disabled={true}
                  />
                  <FormInput
                    label="Project Name"
                    type="text"
                    name="project_name"
                    value={form.project_name}
                    onChange={handleChange}
                    placeholder="Enter project name"
                    disabled={true}
                  />
                </div>

                <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, color: '#333' }}>Qurbani items</div>
                  <button type="button" className="secondary_btn" onClick={addQurbaniItemRow}>
                    <FiPlus style={{ marginRight: '6px' }} /> Add item
                  </button>
                </div>

                {(Array.isArray(form.donation_items) ? form.donation_items : []).length === 0 ? (
                  <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#475569' }}>
                    Add at least one Qurbani item (Cow Share / Full Cow / Goat). The amount will be calculated from these items.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(form.donation_items || []).map((it, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '10px',
                          padding: '12px',
                          background: 'white',
                        }}
                      >
                        <div className="form-grid-2" style={{ alignItems: 'end' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#374151' }}>
                              Initiative
                            </label>
                            <select
                              className="form-control"
                              value={it?.initiativeId || ''}
                              onChange={(e) => {
                                const initiativeId = e.target.value;
                                const initiative = (qurbaniInitiatives || []).find((x) => x.id === initiativeId) || null;
                                updateQurbaniItemRow(idx, {
                                  initiativeId,
                                  initiativeTitle: initiative?.title || '',
                                  initiativeSubtitle: initiative?.subtitle || '',
                                  basePrice: Number(initiative?.price || 0),
                                });
                              }}
                            >
                              <option value="">Select initiative</option>
                              {(qurbaniInitiatives || []).map((x) => (
                                <option key={x.id} value={x.id}>
                                  {x.title} — {Number(x.price || 0).toLocaleString()} PKR
                                </option>
                              ))}
                            </select>
                          </div>

                          <FormInput
                            label="Quantity"
                            type="number"
                            name={`qurbani_qty_${idx}`}
                            value={it?.quantity ?? 1}
                            onChange={(e) => updateQurbaniItemRow(idx, { quantity: e.target.value })}
                            min="1"
                            step="1"
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: '#334155' }}>
                          <div>
                            Unit: {Number(it?.basePrice || 0).toLocaleString()} PKR
                          </div>
                          <div style={{ fontWeight: 700 }}>
                            Line total: {Number(it?.totalAmount || 0).toLocaleString()} PKR
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                          <button
                            type="button"
                            className="danger_btn"
                            onClick={() => removeQurbaniItemRow(idx)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <FiTrash2 /> Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 800, color: '#111827' }}>
                      Total:{' '}
                      {((form.donation_items || []).reduce((sum, x) => sum + Number(x?.totalAmount || 0), 0) || 0).toLocaleString()} PKR
                    </div>
                  </div>
                )}

                <FormInput
                  label="On behalf name(s) (optional)"
                  type="textarea"
                  name="on_behalf_names"
                  value={form.on_behalf_names}
                  onChange={handleChange}
                  placeholder="Enter name(s) this Qurbani is performed on behalf of"
                  rows="3"
                />
              </>
            )}
          </div>

          {/* Payment Details */}
          {/* <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Payment Details (Optional)</h3>
            <div className="form-grid-2">
              <FormInput
                label="Order ID"
                type="text"
                name="orderId"
                value={form.orderId}
                onChange={handleChange}
                placeholder="Bank/Payment gateway order ID"
              />

              <FormInput
                label="Recurrence ID"
                type="text"
                name="recurrence_id"
                value={form.recurrence_id}
                onChange={handleChange}
                placeholder="For recurring donations"
              />
            </div>
          </div> */}

          <div className="form-actions">
            <button 
              type="submit" 
              className="primary_btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding Donation...' : 'Add Donation'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddDonation;

