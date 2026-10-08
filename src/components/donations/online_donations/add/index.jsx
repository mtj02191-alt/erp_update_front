import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
import DonationPendingAttachments, {
  uploadPendingDonationAttachments,
} from '../../../dms/donations/shared/DonationPendingAttachments';
import {
  getDonationListRoutes,
  donationViewPath,
} from '../../../dms/donations/shared/donationListRoutes';
import { toast } from 'react-toastify';
import { getInKindCategoryLabel } from '../../../../utils/inKindCategories';
import { useAuth } from '../../../../context/AuthContext';
import {
  canReconcileDonations,
  donationStatusOptionsForUser,
} from '../../../../utils/permissions';

const AddDonation = ({
  embedded = false,
  embeddedCsrDonorId = null,
  embeddedCsrPocId = null,
  embeddedDonorId = null,
  embeddedChannel = null,
  onSaved = null,
  onCancel = null,
} = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions } = useAuth();
  const isCsrHubAddRoute = !embedded && location.pathname.includes('/dms/csr-donations/add');
  const isInKindHubAddRoute =
    !embedded && location.pathname.includes('/dms/in-kind-donations/add');
  const { inKindItems, refetchInKindItems } = useInKindItems();
  const [searchParams] = useSearchParams();
  const donorIdFromUrl =
    (embeddedDonorId != null && embeddedDonorId !== ''
      ? String(embeddedDonorId)
      : null) || searchParams.get('donor_id');
  const csrDonorIdFromUrl =
    (embeddedCsrDonorId != null && embeddedCsrDonorId !== ''
      ? String(embeddedCsrDonorId)
      : null) || searchParams.get('csr_donor_id');
  const csrPocIdFromUrl =
    (embeddedCsrPocId != null && embeddedCsrPocId !== ''
      ? String(embeddedCsrPocId)
      : null) || searchParams.get('csr_poc_id');
  const isCsrMode = Boolean(csrDonorIdFromUrl) || isCsrHubAddRoute;
  const donationRoutes = useMemo(() => {
    if (isCsrHubAddRoute || csrDonorIdFromUrl) {
      return getDonationListRoutes(
        csrDonorIdFromUrl
          ? { pathname: `/dms/csr-donors/${csrDonorIdFromUrl}/donations` }
          : location,
        { csrDonorId: csrDonorIdFromUrl || '', channel: 'csr' },
      );
    }
    if (isInKindHubAddRoute) {
      return getDonationListRoutes(location, { channel: 'in_kind' });
    }
    if (embedded && donorIdFromUrl) {
      return getDonationListRoutes(location, {
        channel: embeddedChannel === 'offline' ? 'offline' : 'online',
      });
    }
    return getDonationListRoutes(location);
  }, [
    location.pathname,
    isCsrHubAddRoute,
    isInKindHubAddRoute,
    csrDonorIdFromUrl,
    embedded,
    donorIdFromUrl,
    embeddedChannel,
  ]);
  // console.log("inKindItems", inKindItems);
  const [form, setForm] = useState({
    // Donor information (will come from selected donor)
    donor_id: '',
    
    // Donation details
    amount: '',
    currency: 'PKR',
    date: new Date().toISOString().split('T')[0], // Current date
    donation_type: 'general',
    donation_method: isInKindHubAddRoute ? 'in_kind' : 'cash',
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
    csr_poc_id: '',
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
  const [selectedCsrDonor, setSelectedCsrDonor] = useState(null);
  const [csrPocs, setCsrPocs] = useState([]);
  const [loadingCsrContext, setLoadingCsrContext] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const attachmentsRef = useRef(null);
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
              description: selectedItem.description || '',
              category: selectedItem.category || '',
              estimated_value: item.estimated_value
            };
          }
          return {
            ...item,
            id: null,
            name: value,
            category: '',
          };
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

  const sumInKindEstimatedValue = (items = []) =>
    items.reduce((sum, item) => {
      const value = parseFloat(item?.estimated_value);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

  // Check if cheque is selected as payment method — declared early for amount sync
  const isChequeSelected = form.donation_method === 'cheque';
  const isInKindSelected = form.donation_method === 'in_kind';
  const canReconcile = useMemo(
    () =>
      canReconcileDonations(permissions, {
        channel: donationRoutes.channel,
        donation_method:
          isInKindSelected || isInKindHubAddRoute ? 'in_kind' : undefined,
      }),
    [
      permissions,
      donationRoutes.channel,
      isInKindSelected,
      isInKindHubAddRoute,
    ],
  );

  // In-kind: amount is always the sum of estimated values (read-only for user).
  // Non-reconciler: keep status forced to pending.
  useEffect(() => {
    if (!isInKindSelected) return;
    const total = sumInKindEstimatedValue(form.in_kind_items);
    const nextAmount = Number.isFinite(total) ? String(total) : '0';
    setForm((prev) => {
      if (prev.donation_method !== 'in_kind') return prev;
      const nextStatus = canReconcile ? prev.status : 'pending';
      if (String(prev.amount) === nextAmount && prev.status === nextStatus) return prev;
      return { ...prev, amount: nextAmount, status: nextStatus };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInKindSelected, form.in_kind_items, canReconcile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let resolvedDonorId = form.donor_id || null;
      let csrBillingContact = null;

      if (isCsrMode) {
        const activeCsrDonorId = csrDonorIdFromUrl || selectedCsrDonor?.id;
        if (!activeCsrDonorId) {
          setError('Please select a CSR donor company');
          setIsSubmitting(false);
          return;
        }

        const pocId = form.csr_poc_id || csrPocIdFromUrl || '';
        const pocRow = pocId
          ? csrPocs.find((row) => {
              const pocEntity = row.poc || row;
              return String(pocEntity.id) === String(pocId);
            })
          : null;
        const pocEntity = pocRow?.poc || pocRow || null;
        const legacyDonorId =
          pocId && pocEntity
            ? pocEntity?.legacy_donor_id || pocRow?.legacy_donor_id || null
            : null;

        if (legacyDonorId) {
          resolvedDonorId = legacyDonorId;
        } else if (pocEntity) {
          csrBillingContact = {
            donor_name: pocEntity.name || selectedCsrDonor?.name || 'CSR Donor',
            donor_email: pocEntity.email || selectedCsrDonor?.email || null,
            donor_phone: pocEntity.phone || selectedCsrDonor?.phone || null,
          };
        } else {
          csrBillingContact = {
            donor_name: selectedCsrDonor?.name || 'CSR Donor',
            donor_email: selectedCsrDonor?.email || null,
            donor_phone: selectedCsrDonor?.phone || null,
          };
        }

        if (!resolvedDonorId && !csrBillingContact?.donor_email && !csrBillingContact?.donor_phone) {
          setError(
            'Add company or POC email/phone on the CSR donor profile before recording a donation.',
          );
          setIsSubmitting(false);
          return;
        }
      } else if (!form.donor_id) {
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

      const activeCsrPocId = form.csr_poc_id || csrPocIdFromUrl || '';

      const donationData = {
        ...(resolvedDonorId ? { donor_id: resolvedDonorId } : {}),
        ...(isCsrMode
          ? {
              organization_id: Number(csrDonorIdFromUrl || selectedCsrDonor?.id),
              ...(activeCsrPocId ? { csr_poc_id: Number(activeCsrPocId) } : {}),
              ...(csrBillingContact || {}),
              city: selectedCsrDonor?.city || null,
              country: selectedCsrDonor?.country || null,
              address: selectedCsrDonor?.address || null,
            }
          : {}),
        amount:
          form.donation_method === 'in_kind' || isInKindHubAddRoute
            ? sumInKindEstimatedValue(form.in_kind_items)
            : qurbaniTotal != null
              ? Number(qurbaniTotal)
              : parseFloat(form.amount),
        currency: form.currency,
        date: form.date,
        donation_type: form.donation_type,
        donation_method: isInKindHubAddRoute ? 'in_kind' : form.donation_method,
        donation_source: isCsrMode
          ? 'fund_raising'
          : isInKindHubAddRoute || form.donation_method === 'in_kind'
            ? String(form.source || '').trim() || 'fund_raising'
            : String(form.source || '').trim() ||
              (donationRoutes.channel === 'offline' ||
              donationRoutes.channel === 'csr'
                ? 'fund_raising'
                : 'website'),
        status:
          form.donation_method === 'in_kind' || isInKindHubAddRoute
            ? canReconcile
              ? form.status || 'pending'
              : 'pending'
            : canReconcile
              ? form.status
              : 'pending',
        project_id: form.project_id || null,
        project_name: form.project_name,
        on_behalf_names: String(form.on_behalf_names || '').trim() || null,
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
        payload && typeof payload === 'object'
          ? String(payload.id || payload.local_id || '').startsWith('local_')
            ? String(payload.id || payload.local_id)
            : Number.isFinite(Number(payload.id)) && Number(payload.id) > 0
              ? Number(payload.id)
              : null
          : null;

      if (
        newDonationId &&
        !String(newDonationId).startsWith('local_')
      ) {
        const toUpload =
          attachmentsRef.current?.collectForSubmit?.() || pendingAttachments;
        if (toUpload.length > 0) {
          const { uploaded, failed } = await uploadPendingDonationAttachments({
            axiosInstance,
            donationId: newDonationId,
            items: toUpload,
          });
          if (uploaded > 0) {
            toast.success(
              uploaded === 1
                ? 'Attachment uploaded successfully.'
                : `${uploaded} attachments uploaded successfully.`,
            );
          }
          if (failed > 0) {
            toast.error(
              failed === 1
                ? 'Donation saved, but failed to upload 1 attachment.'
                : `Donation saved, but failed to upload ${failed} attachments.`,
            );
          }
        }
      }

      if (newDonationId) {
        if (embedded && typeof onSaved === 'function') {
          onSaved({ donationId: newDonationId });
          return;
        }
        navigate(donationViewPath(donationRoutes, newDonationId));
        return;
      }

      if (embedded && typeof onSaved === 'function') {
        onSaved({ donationId: null });
        return;
      }

      if (donorIdFromUrl) {
        navigate(`${donationRoutes.listPath}?donor_id=${donorIdFromUrl}`);
      } else if (csrDonorIdFromUrl) {
        const pocQuery = csrPocIdFromUrl || form.csr_poc_id
          ? `?person=${csrPocIdFromUrl || form.csr_poc_id}`
          : '';
        navigate(`${donationRoutes.listPath}${pocQuery}`);
      } else {
        navigate(donationRoutes.listPath);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add donation. Please try again.');
      console.error('Error adding donation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (embedded && typeof onCancel === 'function') {
      onCancel();
      return;
    }
    if (donorIdFromUrl) {
      navigate(`${donationRoutes.listPath}?donor_id=${donorIdFromUrl}`);
      return;
    }
    if (csrDonorIdFromUrl) {
      const pocQuery = csrPocIdFromUrl || form.csr_poc_id
        ? `?person=${csrPocIdFromUrl || form.csr_poc_id}`
        : '';
      navigate(`${donationRoutes.listPath}${pocQuery}`);
      return;
    }
    navigate(donationRoutes.listPath);
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

  const donationMethodOptions = isInKindHubAddRoute
    ? [{ value: 'in_kind', label: 'In Kind' }]
    : [
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

  const visibleStatusOptions = useMemo(() => {
    const channelOpts = {
      channel: donationRoutes.channel,
      donation_method: isInKindSelected ? 'in_kind' : undefined,
    };
    if (isInKindSelected) {
      if (!canReconcileDonations(permissions, channelOpts)) {
        return [{ value: 'pending', label: 'Pending' }];
      }
      return [
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' },
        { value: 'cancelled', label: 'Cancelled' },
      ];
    }
    return donationStatusOptionsForUser(
      permissions,
      statusOptions,
      form.status,
      channelOpts,
    );
  }, [
    permissions,
    isInKindSelected,
    form.status,
    donationRoutes.channel,
  ]);

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

  // In-kind donation condition options
  const inKindConditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

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

  const loadCsrContext = async (csrId, initialPocId = '') => {
    if (!csrId) return;
    try {
      setLoadingCsrContext(true);
      setError('');
      const [orgRes, pocsRes] = await Promise.all([
        axiosInstance.get(`/csr-donors/${csrId}`),
        axiosInstance.get(`/csr-donors/${csrId}/pocs`, {
          params: { page: 1, pageSize: 200 },
        }),
      ]);

      const org = orgRes.data?.data || null;
      const pocList = pocsRes.data?.data || [];
      setSelectedCsrDonor(org);
      setCsrPocs(pocList);
      setSelectedDonor(null);

      if (initialPocId) {
        const pocRow = pocList.find((row) => {
          const pocEntity = row.poc || row;
          return String(pocEntity.id) === String(initialPocId);
        });
        const pocEntity = pocRow?.poc || pocRow || null;
        const legacyDonorId =
          pocEntity?.legacy_donor_id || pocRow?.legacy_donor_id || null;
        setForm((prev) => ({
          ...prev,
          csr_poc_id: String(initialPocId),
          donor_id: legacyDonorId ? String(legacyDonorId) : '',
        }));
        if (legacyDonorId) {
          try {
            const donorRes = await axiosInstance.get(`/donors/${legacyDonorId}`);
            if (donorRes.data?.data) setSelectedDonor(donorRes.data.data);
          } catch {
            /* legacy donor optional */
          }
        }
      } else {
        setForm((prev) => ({
          ...prev,
          csr_poc_id: '',
          donor_id: '',
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load CSR donor context');
    } finally {
      setLoadingCsrContext(false);
    }
  };

  useEffect(() => {
    if (!csrDonorIdFromUrl) return;
    loadCsrContext(csrDonorIdFromUrl, csrPocIdFromUrl || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csrDonorIdFromUrl, csrPocIdFromUrl]);

  const handleCsrDonorHubSelect = async (org) => {
    setForm((prev) => ({ ...prev, csr_poc_id: '', donor_id: '' }));
    setSelectedDonor(null);
    if (error) setError('');
    await loadCsrContext(org?.id, '');
  };

  const handleCsrDonorHubClear = () => {
    setSelectedCsrDonor(null);
    setCsrPocs([]);
    setForm((prev) => ({ ...prev, csr_poc_id: '', donor_id: '' }));
    setSelectedDonor(null);
  };

  const handleCsrPocChange = (e) => {
    const pocId = e.target.value;
    const pocRow = pocId
      ? csrPocs.find((row) => {
          const pocEntity = row.poc || row;
          return String(pocEntity.id) === String(pocId);
        })
      : null;
    const pocEntity = pocRow?.poc || pocRow || null;
    const legacyDonorId =
      pocEntity?.legacy_donor_id || pocRow?.legacy_donor_id || null;

    setForm((prev) => ({
      ...prev,
      csr_poc_id: pocId,
      donor_id: legacyDonorId ? String(legacyDonorId) : '',
    }));

    if (legacyDonorId) {
      axiosInstance
        .get(`/donors/${legacyDonorId}`)
        .then((res) => {
          if (res.data?.data) setSelectedDonor(res.data.data);
        })
        .catch(() => setSelectedDonor(null));
    } else {
      setSelectedDonor(null);
    }
    if (error) setError('');
  };


  return (
    <>
      {!embedded && <Navbar />}
      <div className={embedded ? 'donor-profile-donations-embed' : 'form-content'}>
        <PageHeader
          title={
            isInKindHubAddRoute
              ? 'Add In Kind Donation'
              : isCsrMode
                ? 'Add CSR Donation'
                : 'Add Donation'
          }
          backPath={
            embedded
              ? undefined
              : donationRoutes.channel === 'csr' && !csrDonorIdFromUrl
                ? donationRoutes.listPath
                : undefined
          }
          onBackClick={
            embedded || donationRoutes.channel !== 'csr' || csrDonorIdFromUrl
              ? handleBack
              : undefined
          }
          showBackButton
        />
        
        {error && (
          <div className="status-message status-message--error">
            {error}
          </div>
        )}

        {loadingCsrContext && isCsrMode ? (
          <div className="loading">Loading CSR donor...</div>
        ) : null}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            {isCsrMode ? (
              <>
                <p className="reconciliation-notes">
                  Donation is credited to the CSR donor company. Choose a POC when the gift is tied to a specific contact; otherwise it is recorded company-wide.
                </p>
                <div className="form-grid-2">
                  {isCsrHubAddRoute && !csrDonorIdFromUrl ? (
                    <SearchableDropdown
                      label="CSR Donor"
                      placeholder="Search CSR donor company..."
                      apiEndpoint="/csr-donors"
                      apiParams={{ pageSize: 20 }}
                      onSelect={handleCsrDonorHubSelect}
                      onClear={handleCsrDonorHubClear}
                      value={selectedCsrDonor}
                      displayKey="name"
                      debounceDelay={400}
                      minSearchLength={2}
                      required
                      renderOption={(org) => (
                        <div className="searchable-dropdown__option" style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 500 }}>{org.name}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            {[org.city, org.registration_number].filter(Boolean).join(' · ') ||
                              'CSR Donor'}
                          </div>
                        </div>
                      )}
                    />
                  ) : (
                    <FormInput
                      label="CSR Donor"
                      name="csr_donor_display"
                      value={selectedCsrDonor?.name || (loadingCsrContext ? 'Loading…' : 'CSR Donor')}
                      readOnly
                      disabled
                    />
                  )}
                  {selectedCsrDonor ? (
                  <div className="form-group">
                    <label htmlFor="csr_poc_id">POC (optional)</label>
                    <select
                      id="csr_poc_id"
                      name="csr_poc_id"
                      className="form-control"
                      value={form.csr_poc_id || ''}
                      onChange={handleCsrPocChange}
                      disabled={loadingCsrContext}
                    >
                      <option value="">Company-wide (no specific POC)</option>
                      {csrPocs.map((row) => {
                        const pocEntity = row.poc || row;
                        return (
                          <option key={pocEntity.id} value={String(pocEntity.id)}>
                            {pocEntity.name || pocEntity.email || `POC #${pocEntity.id}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  ) : null}
                </div>
                {selectedDonor ? (
                  <FormInput
                    label="Billing donor (legacy link)"
                    name="legacy_donor_display"
                    value={selectedDonor.name || selectedDonor.email || `Donor #${selectedDonor.id}`}
                    readOnly
                    disabled
                  />
                ) : null}
              </>
            ) : (
            <>
            <SearchableDropdown
              label="Select Donor :"
              placeholder="Search donors by name, email, or phone..."
              apiEndpoint="/donors/lookup"
              apiParams={{ pageSize: 20 }}
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
            </>
            )}
          </div>

          {/* Donation Details */}
          <div className="form-section">
            <h3 className="form-section-heading">Donation Details</h3>
            <div className="form-grid-2">
              <FormInput
                label={isInKindSelected ? 'Amount (from estimated values)' : 'Amount'}
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required={!isInKindSelected}
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={isInKindSelected}
                title={
                  isInKindSelected
                    ? 'Amount is the sum of Estimated Value on in-kind items'
                    : undefined
                }
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
                disabled={isInKindHubAddRoute}
                onChange={(e) => {
                  const method = e.target.value;
                  setForm({ 
                    ...form, 
                    donation_method: method,
                    // In-kind / cheque start as pending
                    status:
                      method === 'cheque' || method === 'in_kind'
                        ? 'pending'
                        : form.status,
                    amount:
                      method === 'in_kind'
                        ? String(sumInKindEstimatedValue(form.in_kind_items))
                        : form.amount,
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
                options={visibleStatusOptions}
                required
                disabled={!canReconcile}
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
                 <h3 className="form-section-heading form-section-heading--accent" style={{ margin: 0 }}>
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
                             ...inKindItems.map((catalogItem) => ({
                               value: catalogItem.name,
                               label: catalogItem.category
                                 ? `${catalogItem.name} (${getInKindCategoryLabel(catalogItem.category)})`
                                 : catalogItem.name,
                             })),
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
                     <div className="form-group">
                       <label>Category</label>
                       <div
                         className="form-control"
                         style={{
                           background: '#f3f4f6',
                           color: item.category ? '#111827' : '#9ca3af',
                           minHeight: '38px',
                           display: 'flex',
                           alignItems: 'center',
                         }}
                       >
                         {item.name
                           ? getInKindCategoryLabel(item.category)
                           : 'Select an item to see category'}
                       </div>
                     </div>

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
              <h3 className="form-section-heading" style={{ margin: 0 }}>Project Information (Optional)</h3>
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
              </>
            )}
          </div>

          <div className="form-section">
            <h3 className="form-section-heading">On behalf (optional)</h3>
            <FormInput
              label="On behalf name(s)"
              type="text"
              name="on_behalf_names"
              value={form.on_behalf_names}
              onChange={handleChange}
              placeholder="Enter name(s) this donation is on behalf of"
            />
          </div>

          {/* Payment Details */}
          {/* <div className="form-section">
            <h3 className="form-section-heading">Payment Details (Optional)</h3>
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

          <div className="form-section">
            <DonationPendingAttachments
              ref={attachmentsRef}
              items={pendingAttachments}
              onChange={setPendingAttachments}
              disabled={isSubmitting}
            />
          </div>

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

