import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiMail,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiSend,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { HiOutlineDocumentText } from 'react-icons/hi';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import PageHeader from '../../../../common/PageHeader';
import Navbar from '../../../../Navbar';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import DonationAuditHistory from '../../shared/DonationAuditHistory';
import DonationAllotmentPanel from '../../shared/DonationAllotmentPanel';
import DonationReceiptModal from '../../shared/DonationReceiptModal';
import DonationPendingAttachments, {
  uploadPendingDonationAttachments,
} from '../../shared/DonationPendingAttachments';
import '../../shared/DonationPendingAttachments.css';
import { useAuth } from '../../../../../context/AuthContext';
import { isLocalId } from '../../../../../offline/handlers';
import { toast } from 'react-toastify';
import './index.css';

/** Matches UserPermissions `communication.*` send flags; `super_admin` is handled in checks. */
const COMM_PERMS = {
  emailPaymentLinks: 'communication.email_payment_links.send',
  emailThanks: 'communication.email_thanks.send',
  emailCampaigns: 'communication.email_campaigns.send',
  whatsappPaymentLinks: 'communication.whatsapp_payment_links.send',
  whatsappThanks: 'communication.whatsapp_thanks.send',
  whatsappCampaigns: 'communication.whatsapp_campaigns.send',
  donationReceiptsView: 'communication.donation_receipts.view',
  donationReceiptsSend: 'communication.donation_receipts.send',
};

const PROGRESS_STEP_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'cancelled', label: 'Cancelled' },
];

const ViewOnlineDonation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasAnyPermission } = useAuth();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalDonationAmount, setTotalDonationAmount] = useState(0);
  const [sendingThanksEmail, setSendingThanksEmail] = useState(false);
  const [sendingThanksWhatsApp, setSendingThanksWhatsApp] = useState(false);
  const [sendingLinkEmail, setSendingLinkEmail] = useState(false);
  const [sendingLinkWhatsApp, setSendingLinkWhatsApp] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [messageStatus, setMessageStatus] = useState({ type: '', message: '' });
  const [markingCompleted, setMarkingCompleted] = useState(false);
  const [markingFailed, setMarkingFailed] = useState(false);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteStatus, setNoteStatus] = useState({ type: '', message: '' });
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);
  const [fetchingProviderStatus, setFetchingProviderStatus] = useState(false);
  const [providerStatusData, setProviderStatusData] = useState(null);
  const [progressTrackers, setProgressTrackers] = useState([]);
  const [progressTemplates, setProgressTemplates] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [creatingTracker, setCreatingTracker] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('all');
  const [savingProgressStep, setSavingProgressStep] = useState(false);
  const [progressSectionError, setProgressSectionError] = useState('');
  const [progressEvidenceUrl, setProgressEvidenceUrl] = useState('');
  const [progressEvidenceTitle, setProgressEvidenceTitle] = useState('');
  const [progressEvidenceType, setProgressEvidenceType] = useState('link');
  const [activeProgressStepId, setActiveProgressStepId] = useState(null);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const attachmentsRef = useRef(null);
  const [savingAttachments, setSavingAttachments] = useState(false);
  const [batchTagDraft, setBatchTagDraft] = useState('');
  const [batchTagNameDraft, setBatchTagNameDraft] = useState('');
  const [savingBatchTag, setSavingBatchTag] = useState(false);
  const [partsToAddByTracker, setPartsToAddByTracker] = useState({});
  const [allocatingPartsTrackerId, setAllocatingPartsTrackerId] = useState(null);

  /** Batches across every workflow tracker for this donation (batch_id is unique). */
  const donationBatchOptions = useMemo(() => {
    const map = new Map();
    for (const tr of progressTrackers || []) {
      const tplName = tr?.template?.name || 'Workflow';
      for (const s of tr?.steps || []) {
        const bid = s?.batch_id != null ? Number(s.batch_id) : null;
        if (bid == null || !Number.isFinite(bid) || bid <= 0) continue;
        const bn =
          s?.batch?.batch_number != null ? Number(s.batch.batch_number) : bid;
        const tagRaw = s?.batch?.tag_number;
        const tag =
          tagRaw != null && String(tagRaw).trim() !== ''
            ? String(tagRaw).trim()
            : null;
        const nameRaw = s?.batch?.tag_name;
        const tname =
          nameRaw != null && String(nameRaw).trim() !== ''
            ? String(nameRaw).trim()
            : null;
        if (!map.has(bid)) {
          map.set(bid, {
            value: String(bid),
            label: `${tplName} · #${bn}${tag ? ` · ${tag}` : ''}${tname ? ` (${tname})` : ''}`,
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => Number(a.value) - Number(b.value));
  }, [progressTrackers]);

  /** Per-tracker step lists after batch filter (same fallback as tracker view when batch empty). */
  const visibleTrackerSections = useMemo(() => {
    return (progressTrackers || []).map((tr) => {
      const steps = (tr.steps || []).filter((s) => !s.is_archived);
      let shown = steps;
      if (selectedBatchId !== 'all') {
        const bid = Number(selectedBatchId);
        if (Number.isFinite(bid) && bid > 0) {
          const filtered = steps.filter((s) => Number(s?.batch_id) === bid);
          shown = filtered.length ? filtered : steps;
        }
      }
      return { tracker: tr, steps: shown };
    });
  }, [progressTrackers, selectedBatchId]);

  const totalProgressSteps = useMemo(
    () => visibleTrackerSections.reduce((n, sec) => n + sec.steps.length, 0),
    [visibleTrackerSections],
  );

  const canSendComm = (path) => hasAnyPermission(['super_admin', path]);
  const donationStatus = String(donation?.status || '').toLowerCase();
  const isDonationCompleted = donationStatus === 'completed';
  const isDonationFailed = donationStatus === 'failed';

  // Links for unpaid / non-completed; thanks + receipt only after completion
  const showPaymentLinkActions = !isDonationCompleted;
  const showThanksActions = isDonationCompleted;

  const canEmailPaymentLink =
    showPaymentLinkActions && canSendComm(COMM_PERMS.emailPaymentLinks);
  const canEmailThanks = showThanksActions && canSendComm(COMM_PERMS.emailThanks);
  const canWhatsAppPaymentLink =
    showPaymentLinkActions && canSendComm(COMM_PERMS.whatsappPaymentLinks);
  const canWhatsAppThanks = showThanksActions && canSendComm(COMM_PERMS.whatsappThanks);

  const showEmailComm = canEmailPaymentLink || canEmailThanks;
  const showWhatsAppComm = canWhatsAppPaymentLink || canWhatsAppThanks;
  const showCommSection = showEmailComm || showWhatsAppComm;
  const canViewReceipt = canSendComm(COMM_PERMS.donationReceiptsView);
  const canSendReceiptEmail = canSendComm(COMM_PERMS.donationReceiptsSend);
  const showReceiptSection =
    isDonationCompleted && (canViewReceipt || canSendReceiptEmail);
  const showMarkCompleted = !isDonationCompleted;
  const showMarkFailed = !isDonationFailed;
  const showStatusActions = showMarkCompleted || showMarkFailed;
  const isPendingOffline = isLocalId(id);

  useEffect(() => {
    fetchDonation();
  }, [id]);

  useEffect(() => {
    if (!id || isLocalId(id)) return;
    fetchProgressData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setNote(donation?.note || '');
  }, [donation?.note]);

  useEffect(() => {
    if (selectedBatchId === 'all') {
      setBatchTagDraft('');
      setBatchTagNameDraft('');
      return;
    }
    const bid = Number(selectedBatchId);
    if (!Number.isFinite(bid) || bid <= 0) {
      setBatchTagDraft('');
      setBatchTagNameDraft('');
      return;
    }
    let tag = '';
    let tname = '';
    outer: for (const tr of progressTrackers || []) {
      for (const s of tr?.steps || []) {
        if (s?.batch_id != null && Number(s.batch_id) === bid && s.batch) {
          const tn = s.batch.tag_number;
          if (tn != null && String(tn).trim() !== '') tag = String(tn).trim();
          const nm = s.batch.tag_name;
          if (nm != null && String(nm).trim() !== '') tname = String(nm).trim();
          break outer;
        }
      }
    }
    setBatchTagDraft(tag);
    setBatchTagNameDraft(tname);
  }, [selectedBatchId, progressTrackers]);

  const saveBatchTagFromDonation = async () => {
    if (selectedBatchId === 'all') return;
    const bid = Number(selectedBatchId);
    if (!Number.isFinite(bid) || bid <= 0) return;
    setSavingBatchTag(true);
    setProgressSectionError('');
    try {
      await axiosInstance.patch(`/progress/batches/${bid}`, {
        tag_number: batchTagDraft.trim() || null,
        tag_name: batchTagNameDraft.trim() || null,
      });
      await fetchProgressData();
    } catch (e) {
      setProgressSectionError(e.response?.data?.message || 'Failed to update batch tag');
    } finally {
      setSavingBatchTag(false);
    }
  };

  const fetchProgressData = async () => {
    setLoadingProgress(true);
    try {
      const [templatesRes, trackerRes] = await Promise.all([
        axiosInstance.get('/progress/workflow-templates'),
        axiosInstance.get(`/progress/trackers/by-donation/${id}`),
      ]);

      if (templatesRes.data?.success) {
        setProgressTemplates(templatesRes.data.data || []);
      }

      if (trackerRes.data?.success && trackerRes.data.data) {
        const d = trackerRes.data.data;
        let trackers = [];
        if (Array.isArray(d.trackers)) trackers = d.trackers;
        else if (d.id != null && Array.isArray(d.steps)) trackers = [d];
        setProgressTrackers(trackers);
        setSelectedBatchId('all');
      } else {
        setProgressTrackers([]);
      }
    } catch (e) {
      setProgressTrackers([]);
      try {
        const templatesRes = await axiosInstance.get('/progress/workflow-templates');
        if (templatesRes.data?.success) setProgressTemplates(templatesRes.data.data || []);
      } catch (_) {}
    } finally {
      setLoadingProgress(false);
    }
  };

  const updateProgressStep = async (stepId, patch) => {
    setSavingProgressStep(true);
    setProgressSectionError('');
    try {
      await axiosInstance.patch(`/progress/trackers/steps/${stepId}`, patch);
      await fetchProgressData();
    } catch (e) {
      setProgressSectionError(e.response?.data?.message || 'Failed to update step');
    } finally {
      setSavingProgressStep(false);
    }
  };

  const addProgressEvidence = async () => {
    if (!activeProgressStepId || !progressEvidenceUrl) return;
    setSavingProgressStep(true);
    setProgressSectionError('');
    try {
      await axiosInstance.post(`/progress/trackers/steps/${activeProgressStepId}/evidence`, {
        file_url: progressEvidenceUrl,
        file_type: progressEvidenceType,
        title: progressEvidenceTitle || null,
      });
      setProgressEvidenceUrl('');
      setProgressEvidenceTitle('');
      await fetchProgressData();
    } catch (e) {
      setProgressSectionError(e.response?.data?.message || 'Failed to add evidence');
    } finally {
      setSavingProgressStep(false);
    }
  };

  const createProgressTracker = async () => {
    if (!selectedTemplateId) return;
    setCreatingTracker(true);
    try {
      const res = await axiosInstance.post('/progress/trackers', {
        template_id: Number(selectedTemplateId),
        donation_id: Number(id),
        donor_visible: true,
      });
      if (res.data?.success) {
        await fetchProgressData();
      }
    } catch (e) {
      console.error('Failed to create progress tracker', e);
    } finally {
      setCreatingTracker(false);
    }
  };

  const allocateMoreParts = async (trackerId) => {
    const raw = partsToAddByTracker?.[trackerId];
    const n = Number(raw || 0);
    if (!Number.isFinite(n) || n <= 0) return;
    setAllocatingPartsTrackerId(trackerId);
    setProgressSectionError('');
    try {
      await axiosInstance.post(`/progress/trackers/${trackerId}/allocate-parts`, {
        parts_requested: n,
      });
      setPartsToAddByTracker((p) => ({ ...(p || {}), [trackerId]: '' }));
      await fetchProgressData();
    } catch (e) {
      setProgressSectionError(e.response?.data?.message || 'Failed to allocate parts');
    } finally {
      setAllocatingPartsTrackerId(null);
    }
  };

  const fetchDonation = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/donations/${id}`);
      if (response.data.success) {
        setDonation(response.data.data);
        setError('');
      } else {
        setError('Failed to fetch donation data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch donation data. Please try again.');
      console.error('Error fetching donation:', err);
    } finally {
      setLoading(false);
    }
  };

  const uploadViewAttachments = async () => {
    if (isLocalId(id)) return;
    const toUpload =
      attachmentsRef.current?.collectForSubmit?.() || pendingAttachments;
    if (!toUpload.length) {
      toast.error('Add an attachment name and file first.');
      return;
    }
    setSavingAttachments(true);
    try {
      const { uploaded, failed } = await uploadPendingDonationAttachments({
        axiosInstance,
        donationId: id,
        items: toUpload,
      });
      if (uploaded > 0) {
        toast.success(
          uploaded === 1
            ? 'Attachment uploaded successfully.'
            : `${uploaded} attachments uploaded successfully.`,
        );
        setPendingAttachments([]);
        await fetchDonation();
      }
      if (failed > 0) {
        toast.error(
          failed === 1
            ? 'Failed to upload 1 attachment.'
            : `Failed to upload ${failed} attachments.`,
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload attachments.');
    } finally {
      setSavingAttachments(false);
    }
  };

  const removeDonationAttachment = async (attachmentId) => {
    if (!window.confirm('Remove this attachment?')) return;
    try {
      await axiosInstance.delete(`/donations/${id}/attachments/${attachmentId}`);
      setDonation((prev) => ({
        ...prev,
        attachments: (prev.attachments || []).filter((a) => a.id !== attachmentId),
      }));
      toast.success('Attachment removed.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove attachment.');
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const saveNote = async () => {
    if (!id) return;
    setSavingNote(true);
    setNoteStatus({ type: '', message: '' });
    try {
      const response = await axiosInstance.patch(`/donations/${id}/note`, { note });
      if (response.data.success) {
        setDonation(response.data.data);
        setAuditRefreshKey((k) => k + 1);
        setNoteStatus({ type: 'success', message: 'Note saved successfully.' });
        setTimeout(() => setNoteStatus({ type: '', message: '' }), 4000);
      } else {
        setNoteStatus({ type: 'error', message: response.data.message || 'Failed to save note.' });
      }
    } catch (err) {
      setNoteStatus({ type: 'error', message: err.response?.data?.message || 'Failed to save note. Please try again.' });
    } finally {
      setSavingNote(false);
    }
  };
  
  const formatAmount = (amount, currency = 'PKR') => {
    if (!amount) return '0';
    return `${currency} ${parseFloat(amount).toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { class: 'status-pending', text: 'Pending' },
      'completed': { class: 'status-completed', text: 'Completed' },
      'failed': { class: 'status-failed', text: 'Failed' },
      'cancelled': { class: 'status-cancelled', text: 'Cancelled' },
      'registered': { class: 'status-registered', text: 'Registered' }
    };
    
    const statusInfo = statusMap[status] || { class: 'status-pending', text: status };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const sendThanksEmail = async () => {
    if (!id) return;
    
    setSendingThanksEmail(true);
    setMessageStatus({ type: '', message: '' });
    
    try {
      const response = await axiosInstance.post(`/communication/donation/${id}/thanks?emailOnly=true`);
      
      if (response.data.success && response.data.data.results.email.sent) {
        setMessageStatus({
          type: 'success',
          message: 'Thank you email sent successfully!',
        });
        setTimeout(() => setMessageStatus({ type: '', message: '' }), 5000);
      } else {
        setMessageStatus({
          type: 'error',
          message: response.data.data?.results?.email?.error || 'Failed to send thank you email',
        });
      }
    } catch (err) {
      setMessageStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to send thank you email. Please try again.',
      });
      console.error('Error sending thanks email:', err);
    } finally {
      setSendingThanksEmail(false);
    }
  };

  const sendThanksWhatsApp = async () => {
    if (!id) return;
    
    setSendingThanksWhatsApp(true);
    setMessageStatus({ type: '', message: '' });
    
    try {
      const response = await axiosInstance.post(`/communication/donation/${id}/thanks?whatsappOnly=true`);
      
      if (response.data.success && response.data.data.results.whatsapp.sent) {
        setMessageStatus({
          type: 'success',
          message: 'Thank you WhatsApp message sent successfully!',
        });
        setTimeout(() => setMessageStatus({ type: '', message: '' }), 5000);
      } else {
        setMessageStatus({
          type: 'error',
          message: response.data.data?.results?.whatsapp?.error || 'Failed to send thank you WhatsApp',
        });
      }
    } catch (err) {
      setMessageStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to send thank you WhatsApp. Please try again.',
      });
      console.error('Error sending thanks WhatsApp:', err);
    } finally {
      setSendingThanksWhatsApp(false);
    }
  };

  const sendLinkEmail = async () => {
    if (!id) return;
    
    setSendingLinkEmail(true);
    setMessageStatus({ type: '', message: '' });
    
    try {
      const response = await axiosInstance.post(`/communication/donation/${id}/link?emailOnly=true`); 
      
      if (response.data.success && response.data.data.results.email.sent) {
        setMessageStatus({
          type: 'success',
          message: 'Donation link email sent successfully!',
        });
        setTimeout(() => setMessageStatus({ type: '', message: '' }), 5000);
      } else {
        setMessageStatus({
          type: 'error',
          message: response.data.data?.results?.email?.error || 'Failed to send donation link email',
        });
      }
    } catch (err) {
      setMessageStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to send donation link email. Please try again.',
      });
      console.error('Error sending link email:', err);
    } finally {
      setSendingLinkEmail(false);
    }
  };

  const sendLinkWhatsApp = async () => {
    if (!id) return;
    
    setSendingLinkWhatsApp(true);
    setMessageStatus({ type: '', message: '' });
    
    try {
      const response = await axiosInstance.post(`/communication/donation/${id}/link?whatsappOnly=true`);
      
      if (response.data.success && response.data.data.results.whatsapp.sent) {
        setMessageStatus({
          type: 'success',
          message: 'Donation link WhatsApp message sent successfully!',
        });
        setTimeout(() => setMessageStatus({ type: '', message: '' }), 5000);
      } else {
        setMessageStatus({
          type: 'error',
          message: response.data.data?.results?.whatsapp?.error || 'Failed to send donation link WhatsApp',
        });
      }
    } catch (err) {
      setMessageStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to send donation link WhatsApp. Please try again.',
      });
      console.error('Error sending link WhatsApp:', err);
    } finally {
      setSendingLinkWhatsApp(false);
    }
  };

  const markAsCompleted = async () => {
    if (!id) return;
    
    setMarkingCompleted(true);
    setMessageStatus({ type: '', message: '' });
    
    try {
      const response = isLocalId(id)
        ? await axiosInstance.patch(`/donations/${id}`, { status: 'completed' })
        : await axiosInstance.post(`/donations/status-action`, {
            donation_id: parseInt(id, 10),
            status: 'completed',
          });
      
      if (response.data.success) {
        setMessageStatus({
          type: 'success',
          message: response.data.message || 'Donation marked as completed successfully!',
        });
        await fetchDonation();
        setAuditRefreshKey((k) => k + 1);
        setTimeout(() => setMessageStatus({ type: '', message: '' }), 5000);
      } else {
        setMessageStatus({
          type: 'error',
          message: response.data.message || 'Failed to mark donation as completed',
        });
      }
    } catch (err) {
      setMessageStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to mark donation as completed. Please try again.',
      });
      console.error('Error marking donation as completed:', err);
    } finally {
      setMarkingCompleted(false);
    }
  };

  const markAsFailed = async () => {
    if (!id) return;
    
    setMarkingFailed(true);
    setMessageStatus({ type: '', message: '' });
    
    try {
      const response = isLocalId(id)
        ? await axiosInstance.patch(`/donations/${id}`, { status: 'failed' })
        : await axiosInstance.post(`/donations/status-action`, {
            donation_id: parseInt(id, 10),
            status: 'failed',
          });
      
      if (response.data.success) {
        setMessageStatus({
          type: 'success',
          message: response.data.message || 'Donation marked as failed successfully!',
        });
        await fetchDonation();
        setAuditRefreshKey((k) => k + 1);
        setTimeout(() => setMessageStatus({ type: '', message: '' }), 5000);
      } else {
        setMessageStatus({
          type: 'error',
          message: response.data.message || 'Failed to mark donation as failed',
        });
      }
    } catch (err) {
      setMessageStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to mark donation as failed. Please try again.',
      });
      console.error('Error marking donation as failed:', err);
    } finally {
      setMarkingFailed(false);
    }
  };

  const fetchProviderStatus = async () => {
    if (!id) return;

    setFetchingProviderStatus(true);
    setProviderStatusData(null);
    setMessageStatus({ type: '', message: '' });

    try {
      const response = await axiosInstance.get(`/donations/${id}/provider-status`);

      if (response.data.success) {
        setProviderStatusData(response.data.data);

        // If DB was updated, refresh the donation data so the page reflects the new status
        if (response.data.data?.dbUpdated) {
          await fetchDonation();
          setMessageStatus({
            type: 'success',
            message: `Status synced from ${response.data.data.provider?.toUpperCase()}: updated to "${response.data.data.donationStatus}"`,
          });
        } else {
          setMessageStatus({
            type: 'success',
            message: `Status retrieved from ${response.data.data.provider?.toUpperCase()} successfully.`,
          });
        }
        setTimeout(() => setMessageStatus({ type: '', message: '' }), 8000);
      } else {
        setMessageStatus({
          type: 'error',
          message: response.data.message || 'Failed to get provider status',
        });
      }
    } catch (err) {
      setMessageStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to get provider status. Please try again.',
      });
      console.error('Error fetching provider status:', err);
    } finally {
      setFetchingProviderStatus(false);
    }
  };

  // Check if donation method supports provider status check
  const supportsProviderStatus = donation?.donation_method &&
    ['meezan'].includes(donation.donation_method.toLowerCase());

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="View Online Donation"
            showBackButton={true}
            backPath="/donations/online_donations/list"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader 
            title="View Online Donation"
            showBackButton={true}
            backPath="/donations/online_donations/list"
          />
          <div className="view-content">
            <div className="status-message status-message--error">{error}</div>
          </div>
        </div>
      </>
    );
  }
  
  if (!donation) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader 
            title="View Online Donation"
            showBackButton={true}
            backPath="/donations/online_donations/list"
          />
          <div className="view-content">
            <div className="status-message status-message--error">Donation not found</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar /> 
      <div className="view-wrapper">
        <PageHeader 
          title="View Online Donation"
          showBackButton={true}
          backPath="/donations/online_donations/list"
        />
        <div className="view-content">
          {isPendingOffline && (
            <div
              className="status-message"
              style={{
                marginBottom: 16,
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                color: '#92400e',
              }}
            >
              This donation is saved locally and pending sync. Email, WhatsApp, receipts, and
              provider status are unavailable until it is synced.
            </div>
          )}
          {/* {!isPendingOffline && (
          <div className="view-section">
            <h3 className="view-section-title">Progress Tracking</h3>

            {loadingProgress ? (
              <div className="loading">Loading progress...</div>
            ) : progressTrackers.length === 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px', alignItems: 'end', maxWidth: 720 }}>
                <FormSelect
                  label="Workflow Template"
                  name="progress_template"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  options={(progressTemplates || []).map((t) => ({ value: String(t.id), label: `${t.name} (${t.code})` }))}
                  showDefaultOption={true}
                  defaultOptionText="Select a template"
                />
                <button
                  type="button"
                  className="primary_btn"
                  disabled={!selectedTemplateId || creatingTracker}
                  onClick={createProgressTracker}
                  style={{ height: '44px' }}
                >
                  {creatingTracker ? 'Creating...' : 'Create Tracker'}
                </button>
              </div>
            ) : (
              <div>
                {progressSectionError && (
                  <div className="status-message status-message--error" style={{ marginBottom: 12 }}>
                    {progressSectionError}
                  </div>
                )}
                <div style={{ marginBottom: 12, fontSize: 14, color: '#475569' }}>
                  <strong>Workflows on this donation:</strong> {progressTrackers.length}
                </div>

                {donationBatchOptions.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      alignItems: 'center',
                      marginBottom: 10,
                      padding: '10px 12px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>Batches:</span>
                    <button
                      type="button"
                      className="secondary_btn"
                      onClick={() => setSelectedBatchId('all')}
                      style={{
                        padding: '6px 10px',
                        height: '34px',
                        borderRadius: 8,
                        background: selectedBatchId === 'all' ? '#dbeafe' : 'white',
                        borderColor: '#bfdbfe',
                        color: '#1e40af',
                      }}
                    >
                      All
                    </button>
                    {donationBatchOptions.map((b) => (
                      <button
                        key={b.value}
                        type="button"
                        className="secondary_btn"
                        onClick={() => setSelectedBatchId(String(b.value))}
                        style={{
                          padding: '6px 10px',
                          height: '34px',
                          borderRadius: 8,
                          background: String(selectedBatchId) === String(b.value) ? '#dbeafe' : 'white',
                          borderColor: '#bfdbfe',
                          color: '#1e40af',
                          whiteSpace: 'nowrap',
                        }}
                        title={b.label}
                      >
                        {String(b.label || '').replace('Batch ', '')}
                      </button>
                    ))}
                  </div>
                )}
                {donationBatchOptions.length > 0 && selectedBatchId !== 'all' && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 10,
                      alignItems: 'end',
                      marginBottom: 12,
                      padding: '10px 12px',
                      background: '#f1f5f9',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ flex: '1 1 200px', minWidth: 160 }}>
                      <FormInput
                        label="Tag number (shared on this batch)"
                        name="donation_batch_tag"
                        value={batchTagDraft}
                        onChange={(e) => setBatchTagDraft(e.target.value)}
                        placeholder="e.g. 441"
                        disabled={savingBatchTag || savingProgressStep}
                      />
                    </div>
                    <div style={{ flex: '1 1 200px', minWidth: 160 }}>
                      <FormInput
                        label="Tag name (optional)"
                        name="donation_batch_tag_name"
                        value={batchTagNameDraft}
                        onChange={(e) => setBatchTagNameDraft(e.target.value)}
                        placeholder="e.g. North pen"
                        disabled={savingBatchTag || savingProgressStep}
                      />
                    </div>
                    <button
                      type="button"
                      className="secondary_btn"
                      onClick={saveBatchTagFromDonation}
                      disabled={savingBatchTag || savingProgressStep}
                      style={{ height: 40 }}
                    >
                      {savingBatchTag ? 'Saving…' : 'Save batch tag'}
                    </button>
                  </div>
                )}

                {totalProgressSteps > 0 ? (
                  <div style={{ display: 'grid', gap: '20px', maxHeight: 640, overflow: 'auto', paddingRight: 4 }}>
                    {visibleTrackerSections.map(({ tracker: tr, steps }) => (
                      <div
                        key={tr.id}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 10,
                          padding: 14,
                          background: '#fafafa',
                        }}
                      >
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>
                              {tr?.template?.name || 'Workflow'}{' '}
                              <span style={{ fontWeight: 500, color: '#64748b' }}>
                                ({tr?.template?.code || tr.template_id})
                              </span>
                            </div>
                            <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                              Overall: {tr.overall_status}
                              {tr.public_tracking_token ? (
                                <span style={{ marginLeft: 10 }}>Token: {tr.public_tracking_token}</span>
                              ) : null}
                            </div>
                            {tr?.template?.is_batchable === true && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'end', marginTop: 10 }}>
                                <div style={{ width: 160 }}>
                                  <FormInput
                                    label="Add parts"
                                    name={`add_parts_${tr.id}`}
                                    value={partsToAddByTracker?.[tr.id] ?? ''}
                                    onChange={(e) =>
                                      setPartsToAddByTracker((p) => ({
                                        ...(p || {}),
                                        [tr.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="e.g. 1"
                                    disabled={allocatingPartsTrackerId === tr.id}
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="secondary_btn"
                                  disabled={allocatingPartsTrackerId === tr.id}
                                  onClick={() => allocateMoreParts(tr.id)}
                                  style={{ height: 40 }}
                                >
                                  {allocatingPartsTrackerId === tr.id ? 'Allocating…' : 'Allocate'}
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="form-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
                            <button
                              type="button"
                              className="secondary_btn"
                              disabled={savingProgressStep}
                              onClick={() =>
                                navigate(
                                  `/progress/trackers/${tr.id}${selectedBatchId !== 'all' ? `?batch_id=${encodeURIComponent(selectedBatchId)}` : ''}`,
                                )
                              }
                            >
                              Open tracker
                            </button>
                            <button
                              type="button"
                              className="secondary_btn"
                              disabled={savingProgressStep}
                              onClick={() =>
                                navigate(
                                  `/progress/trackers/${tr.id}/steps${selectedBatchId !== 'all' ? `?batch_id=${encodeURIComponent(selectedBatchId)}` : ''}`,
                                )
                              }
                            >
                              Manage steps
                            </button>
                            {tr.public_tracking_token && (
                              <button
                                type="button"
                                className="secondary_btn"
                                disabled={savingProgressStep}
                                onClick={() => navigate(`/tracking/${tr.public_tracking_token}`)}
                              >
                                Public page
                              </button>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gap: 10 }}>
                          {steps.map((s) => (
                            <div key={s.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', background: '#fff' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                                <div style={{ fontWeight: 600 }}>
                                  {s.step_order}. {s.title}
                                  {s.batch_id != null && (
                                    <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: '#64748b' }}>
                                      (Batch #{s?.batch?.batch_number ?? s.batch_id}
                                      {s.batch?.tag_number != null && String(s.batch.tag_number).trim() !== ''
                                        ? ` · ${String(s.batch.tag_number).trim()}`
                                        : ''}
                                      {s.batch?.tag_name != null && String(s.batch.tag_name).trim() !== ''
                                        ? ` (${String(s.batch.tag_name).trim()})`
                                        : ''}
                                      )
                                    </span>
                                  )}
                                </div>
                                <span className={`status-badge status-${s.status}`}>{s.status}</span>
                              </div>
                              {s.completed_at && (
                                <div style={{ marginTop: '6px', color: '#6b7280', fontSize: '13px' }}>
                                  Completed: {new Date(s.completed_at).toLocaleString()}
                                </div>
                              )}
                              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 10, marginTop: 10 }}>
                                <FormSelect
                                  label="Status"
                                  name={`progress_status_${s.id}`}
                                  value={s.status}
                                  onChange={(e) => updateProgressStep(s.id, { status: e.target.value })}
                                  options={PROGRESS_STEP_STATUS_OPTIONS}
                                  disabled={savingProgressStep}
                                />
                                <FormInput
                                  label="Notes"
                                  name={`progress_notes_${s.id}`}
                                  type="textarea"
                                  value={s.notes || ''}
                                  onChange={(e) => updateProgressStep(s.id, { notes: e.target.value })}
                                  placeholder="Internal notes / donor-visible notes per template"
                                  disabled={savingProgressStep}
                                />
                              </div>
                              {(s.evidence || []).length > 0 && (
                                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {(s.evidence || []).map((ev) => (
                                    <a key={ev.id} href={ev.file_url} target="_blank" rel="noreferrer" style={{ fontSize: '13px' }}>
                                      {ev.evidence_label ? `${ev.evidence_label}: ` : ''}{ev.title || ev.file_type}
                                    </a>
                                  ))}
                                </div>
                              )}
                              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10, alignItems: 'end' }}>
                                <FormInput
                                  label="Evidence URL"
                                  name={`progress_evidence_${s.id}`}
                                  value={activeProgressStepId === s.id ? progressEvidenceUrl : ''}
                                  onChange={(e) => { setActiveProgressStepId(s.id); setProgressEvidenceUrl(e.target.value); }}
                                  placeholder="https://..."
                                  disabled={savingProgressStep}
                                />
                                <button
                                  type="button"
                                  className="secondary_btn"
                                  onClick={() => { setActiveProgressStepId(s.id); addProgressEvidence(); }}
                                  disabled={savingProgressStep}
                                >
                                  Add evidence
                                </button>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 10, marginTop: 8 }}>
                                <FormInput
                                  label="Evidence title"
                                  name={`progress_evidence_title_${s.id}`}
                                  value={activeProgressStepId === s.id ? progressEvidenceTitle : ''}
                                  onChange={(e) => { setActiveProgressStepId(s.id); setProgressEvidenceTitle(e.target.value); }}
                                  placeholder="Optional"
                                  disabled={savingProgressStep}
                                />
                                <FormSelect
                                  label="Type"
                                  name={`progress_evidence_type_${s.id}`}
                                  value={activeProgressStepId === s.id ? progressEvidenceType : 'link'}
                                  onChange={(e) => { setActiveProgressStepId(s.id); setProgressEvidenceType(e.target.value); }}
                                  options={[
                                    { value: 'image', label: 'Image' },
                                    { value: 'video', label: 'Video' },
                                    { value: 'pdf', label: 'PDF' },
                                    { value: 'document', label: 'Document' },
                                    { value: 'link', label: 'Link' },
                                  ]}
                                  disabled={savingProgressStep}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '20px' }}>
                    No steps found for these trackers (try another batch filter if applied).
                  </div>
                )}
              </div>
            )}
          </div>
          )} */}

          <div className="view-section">
            <h3 className="view-section-title">Donation Details</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Donation ID</span>
                <span className="view-item-value">MTJF-D-{donation.id}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Status</span>
                <span className="view-item-value">{getStatusBadge(donation.status)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Amount</span>
                <span className="view-item-value">{formatAmount(donation.amount, donation.currency)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Donation Date</span>
                <span className="view-item-value">{formatDate(donation.date || donation.created_at)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Type</span>
                <span className="view-item-value">
                  {donation.donation_type === 'zakat' ? 'Zakat' : 
                   donation.donation_type === 'sadqa' ? 'Sadqa' : 
                   donation.donation_type || 'General'}
                </span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Payment Method</span>
                <span className="view-item-value">{donation.donation_method?.toUpperCase() || 'N/A'}</span>
              </div>
              { donation?.donation_method && donation.donation_method == "cheque" &&( 
              <div className="view-item">
                <span className="view-item-label">Cheque Number</span>
                <span className="view-item-value">{donation.cheque_number || 'N/A'}</span>
              </div>
              )}
              {donation.orderId && (
                <div className="view-item">
                  <span className="view-item-label">Order ID</span>
                  <span className="view-item-value">{donation.orderId}</span>
                </div>
              )}
              {donation.status === 'failed' && donation.err_msg && (
                <div className="view-item view-item--full">
                  <span className="view-item-label">Error Message</span>
                  <span className="view-item-value" style={{ color: '#dc2626', fontWeight: '500' }}>
                    {donation.err_msg}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Attachments</h3>
            {(donation.attachments || []).length > 0 ? (
              <ul className="donation-attachments-list">
                {(donation.attachments || []).map((a) => {
                  const displayName = a.description || a.file_name;
                  return (
                    <li key={a.id} className="donation-attachments-list__item">
                      <div className="donation-attachments-list__main">
                        <strong>{displayName}</strong>
                        {a.description && a.file_name && a.description !== a.file_name && (
                          <span>{a.file_name}</span>
                        )}
                      </div>
                      <div className="donation-attachments-list__actions">
                        <a href={a.file_url} target="_blank" rel="noreferrer">
                          View
                        </a>
                        {!isLocalId(id) && (
                          <button
                            type="button"
                            onClick={() => removeDonationAttachment(a.id)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p style={{ margin: '0.5rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                No attachments yet.
              </p>
            )}

            {!isLocalId(id) && (
              <div style={{ marginTop: '1rem' }}>
                <DonationPendingAttachments
                  ref={attachmentsRef}
                  items={pendingAttachments}
                  onChange={setPendingAttachments}
                  disabled={savingAttachments}
                  title="Add attachment"
                  fileInputId="donation-view-pending-attachment-file"
                />
                <div style={{ marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    className="primary_btn"
                    onClick={uploadViewAttachments}
                    disabled={savingAttachments}
                  >
                    {savingAttachments ? 'Uploading...' : 'Upload attachments'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Internal Note :</h3>
            {noteStatus.message && (
              <div
                className={`status-message ${noteStatus.type === 'success' ? 'status-message--success' : 'status-message--error'}`}
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px'
                }}
              >
                {noteStatus.message}
              </div>
            )}

            <FormInput
              name="note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add an internal note for this donation..."
              // rows={4}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                className="primary_btn"
                onClick={saveNote}
                disabled={savingNote}
              >
                {savingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>

          {!isPendingOffline && (
            <div className="view-section">
              <h3 className="view-section-title">Change history</h3>
              <DonationAuditHistory donationId={id} refreshKey={auditRefreshKey} />
            </div>
          )}

          <div className="view-section">
            <h3 className="view-section-title">Donor Information</h3>
            <div className="view-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <div className="view-item">
                <span className="view-item-label">Name</span>
                <span className="view-item-value">
                  {donation?.donor?.id ? (
                    <a
                      href={`/dms/donors/view/${donation.donor.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/dms/donors/view/${donation.donor.id}`);
                      }}
                      style={{ color: '#2563eb', textDecoration: 'underline' }}
                    >
                      {donation.donor.name || 'Anonymous'}
                    </a>
                  ) : (
                    donation?.donor?.name || 'Anonymous'
                  )}
                </span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Email</span>
                <span className="view-item-value" style={{ wordBreak: 'break-word' }}>
                  {donation?.donor?.email || '-'}
                </span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Phone</span>
                <span className="view-item-value">{donation?.donor?.phone || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Country</span>
                <span className="view-item-value">{donation?.donor?.country || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">City</span>
                <span className="view-item-value">{donation?.donor?.city || '-'}</span>
              </div>
              {donation.address && (
                <div className="view-item view-item--full">
                  <span className="view-item-label">Address</span>
                  <span className="view-item-value">{donation?.donor?.address}</span>
                </div>
              )}
            </div>
          </div>

          {donation.in_kind_items && donation.in_kind_items.length > 0 && (
            <div className="view-section">
              <h3 className="view-section-title">In-Kind Donation Details</h3>
              {donation.in_kind_items.map((item, index) => (
                <div key={index} style={{ 
                  marginBottom: '1.5rem', 
                  padding: '1rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '16px' }}>
                    Item {index + 1}
                  </h4>
                  <div className="view-grid">
                    <div className="view-item">
                      <span className="view-item-label">Item Name</span>
                      <span className="view-item-value">{item.item_name || '-'}</span>
                    </div>
                    <div className="view-item">
                      <span className="view-item-label">Category</span>
                      <span className="view-item-value">{item.category || '-'}</span>
                    </div>
                    <div className="view-item">
                      <span className="view-item-label">Condition</span>
                      <span className="view-item-value">{item.condition || '-'}</span>
                    </div>
                    <div className="view-item">
                      <span className="view-item-label">Quantity</span>
                      <span className="view-item-value">{item.quantity || '-'}</span>
                    </div>
                    {item.estimated_value && (
                      <div className="view-item">
                        <span className="view-item-label">Estimated Value</span>
                        <span className="view-item-value">{formatAmount(item.estimated_value, donation.currency)}</span>
                      </div>
                    )}
                    {item.brand && (
                      <div className="view-item">
                        <span className="view-item-label">Brand</span>
                        <span className="view-item-value">{item.brand}</span>
                      </div>
                    )}
                    {item.model && (
                      <div className="view-item">
                        <span className="view-item-label">Model</span>
                        <span className="view-item-value">{item.model}</span>
                      </div>
                    )}
                    {item.size && (
                      <div className="view-item">
                        <span className="view-item-label">Size</span>
                        <span className="view-item-value">{item.size}</span>
                      </div>
                    )}
                    {item.color && (
                      <div className="view-item">
                        <span className="view-item-label">Color</span>
                        <span className="view-item-value">{item.color}</span>
                      </div>
                    )}
                    {item.collection_date && (
                      <div className="view-item">
                        <span className="view-item-label">Collection Date</span>
                        <span className="view-item-value">{formatDate(item.collection_date)}</span>
                      </div>
                    )}
                    {item.collection_location && (
                      <div className="view-item">
                        <span className="view-item-label">Collection Location</span>
                        <span className="view-item-value">{item.collection_location}</span>
                      </div>
                    )}
                    {item.description && (
                      <div className="view-item view-item--full">
                        <span className="view-item-label">Description</span>
                        <span className="view-item-value">{item.description}</span>
                      </div>
                    )}
                    {item.notes && (
                      <div className="view-item view-item--full">
                        <span className="view-item-label">Notes</span>
                        <span className="view-item-value">{item.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* <div className="view-section">
            <h3 className="view-section-title">System Information</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Created At</span>
                <span className="view-item-value">{formatDate(donation.created_at)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Updated At</span>
                <span className="view-item-value">{formatDate(donation.updated_at)}</span>
              </div>
              {donation.recurrence_id && (
                <div className="view-item">
                  <span className="view-item-label">Recurrence ID</span>
                  <span className="view-item-value">{donation.recurrence_id}</span>
                </div>
              )}
            </div>
          </div> */}
          {/* Communication & Actions */}
          {!isPendingOffline && (
          <div className="view-section donation-view-actions-panel donation-comm-panel">
            <div className="donation-comm-panel__header">
              <div className="donation-comm-panel__header-icon" aria-hidden>
                <FiSend />
              </div>
              <div className="donation-comm-panel__header-text">
                <h3 className="donation-comm-panel__title">Communication & Actions</h3>
                <p className="donation-comm-panel__subtitle">
                  Send messages, generate receipt and update status for this donation.
                </p>
              </div>
            </div>

            {messageStatus.message && (
              <div
                className={`status-message donation-view-status-message ${messageStatus.type === 'success' ? 'status-message--success' : 'status-message--error'}`}
              >
                {messageStatus.message}
              </div>
            )}

            <div className="donation-comm-grid">
              {showEmailComm && (
                <div className="donation-comm-col">
                  <h4 className="donation-comm-col__title">Email</h4>
                  <div className="donation-comm-col__actions">
                    {canEmailPaymentLink && (
                      <button
                        type="button"
                        className="donation-comm-btn donation-comm-btn--email"
                        onClick={sendLinkEmail}
                        disabled={sendingLinkEmail || !donation?.donor?.email}
                      >
                        <span className="donation-comm-btn__icon">
                          <FiMail />
                        </span>
                        <span className="donation-comm-btn__label">
                          {sendingLinkEmail ? 'Sending…' : 'Payment Link'}
                        </span>
                      </button>
                    )}
                    {canEmailThanks && (
                      <button
                        type="button"
                        className="donation-comm-btn donation-comm-btn--email"
                        onClick={sendThanksEmail}
                        disabled={sendingThanksEmail || !donation?.donor?.email}
                      >
                        <span className="donation-comm-btn__icon">
                          <FiMail />
                        </span>
                        <span className="donation-comm-btn__label">
                          {sendingThanksEmail ? 'Sending…' : 'Thanks Email'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {showWhatsAppComm && (
                <div className="donation-comm-col">
                  <h4 className="donation-comm-col__title">WhatsApp</h4>
                  <div className="donation-comm-col__actions">
                    {canWhatsAppPaymentLink && (
                      <button
                        type="button"
                        className="donation-comm-btn donation-comm-btn--whatsapp"
                        onClick={sendLinkWhatsApp}
                        disabled={sendingLinkWhatsApp || !donation?.donor?.phone}
                      >
                        <span className="donation-comm-btn__icon">
                          <FaWhatsapp />
                        </span>
                        <span className="donation-comm-btn__label">
                          {sendingLinkWhatsApp ? 'Sending…' : 'Payment Link'}
                        </span>
                      </button>
                    )}
                    {canWhatsAppThanks && (
                      <button
                        type="button"
                        className="donation-comm-btn donation-comm-btn--whatsapp"
                        onClick={sendThanksWhatsApp}
                        disabled={sendingThanksWhatsApp || !donation?.donor?.phone}
                      >
                        <span className="donation-comm-btn__icon">
                          <FaWhatsapp />
                        </span>
                        <span className="donation-comm-btn__label">
                          {sendingThanksWhatsApp ? 'Sending…' : 'Thanks WhatsApp'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {showReceiptSection && (
                <div className="donation-comm-col">
                  <h4 className="donation-comm-col__title">Receipt</h4>
                  <div className="donation-comm-col__actions">
                    <button
                      type="button"
                      className="donation-comm-btn donation-comm-btn--receipt donation-comm-btn--wide"
                      onClick={() => setShowReceiptModal(true)}
                    >
                      <span className="donation-comm-btn__icon">
                        <HiOutlineDocumentText />
                      </span>
                      <span className="donation-comm-btn__label">Generate Receipt</span>
                    </button>
                  </div>
                </div>
              )}

              {(showStatusActions || supportsProviderStatus) && (
              <div className="donation-comm-col">
                <h4 className="donation-comm-col__title">Status</h4>
                {showStatusActions && (
                <div className="donation-comm-col__actions">
                  {showMarkCompleted && (
                    <button
                      type="button"
                      className="donation-comm-btn donation-comm-btn--completed donation-comm-btn--inline"
                      onClick={markAsCompleted}
                      disabled={markingCompleted}
                    >
                      <span className="donation-comm-btn__icon">
                        <FiCheckCircle />
                      </span>
                      <span className="donation-comm-btn__label">
                        {markingCompleted ? 'Updating…' : 'Completed'}
                      </span>
                    </button>
                  )}
                  {showMarkFailed && (
                    <button
                      type="button"
                      className="donation-comm-btn donation-comm-btn--failed donation-comm-btn--inline"
                      onClick={markAsFailed}
                      disabled={markingFailed}
                    >
                      <span className="donation-comm-btn__icon">
                        <FiXCircle />
                      </span>
                      <span className="donation-comm-btn__label">
                        {markingFailed ? 'Updating…' : 'Failed'}
                      </span>
                    </button>
                  )}
                </div>
                )}
                {supportsProviderStatus && (
                  <button
                    type="button"
                    className="donation-comm-provider-btn"
                    onClick={fetchProviderStatus}
                    disabled={fetchingProviderStatus}
                  >
                    <FiRefreshCw className={fetchingProviderStatus ? 'donation-comm-spin' : ''} />
                    {fetchingProviderStatus
                      ? 'Checking…'
                      : `Get Status from ${donation?.donation_method?.toUpperCase()}`}
                  </button>
                )}
              </div>
              )}
            </div>

            {showCommSection && !donation?.donor?.email && !donation?.donor?.phone && (
              <p className="donation-view-hint-text">
                Donor email and/or phone number are required to send messages.
              </p>
            )}

            {/* Provider Status Response */}
            {providerStatusData && (
              <div className="donation-view-provider-panel">
                <h4 className="donation-view-provider-title">
                  Provider Response ({providerStatusData.provider?.toUpperCase()})
                </h4>

                <div className="view-grid" style={{ gap: '0.5rem 1rem' }}>
                  <div className="view-item">
                    <span className="view-item-label">Provider Status Code</span>
                    <span className="view-item-value" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {providerStatusData.providerStatus || '-'}
                    </span>
                  </div>
                  <div className="view-item">
                    <span className="view-item-label">Mapped Donation Status</span>
                    <span className="view-item-value">
                      {getStatusBadge(providerStatusData.donationStatus)}
                    </span>
                  </div>
                  <div className="view-item">
                    <span className="view-item-label">DB Updated</span>
                    <span className={`view-item-value ${providerStatusData.dbUpdated ? 'donation-view-sync-yes' : 'donation-view-sync-no'}`}>
                      {providerStatusData.dbUpdated ? 'Yes - status synced' : 'No - already in sync'}
                    </span>
                  </div>
                </div>

                {providerStatusData.details && Object.keys(providerStatusData.details).length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <span className="donation-view-provider-label">
                      Details:
                    </span>
                    <div className="donation-view-provider-details">
                      {Object.entries(providerStatusData.details)
                        .filter(([, value]) => value !== null && value !== undefined && value !== '')
                        .map(([key, value]) => (
                          <div key={key} className="donation-view-detail-row">
                            <span className="donation-view-detail-key">{key}:</span>
                            <span className="donation-view-detail-value">{String(value)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DonationAllotmentPanel
              donationId={id}
              donation={donation}
              onUpdated={fetchDonation}
            />
          </div>
          )}
          {isPendingOffline && (
            <div className="view-section donation-view-actions-panel donation-comm-panel">
              <div className="donation-comm-panel__header">
                <div className="donation-comm-panel__header-icon" aria-hidden>
                  <FiSend />
                </div>
                <div className="donation-comm-panel__header-text">
                  <h3 className="donation-comm-panel__title">Communication & Actions</h3>
                  <p className="donation-comm-panel__subtitle">
                    Update status for this offline donation.
                  </p>
                </div>
              </div>
              {messageStatus.message && (
                <div
                  className={`status-message donation-view-status-message ${messageStatus.type === 'success' ? 'status-message--success' : 'status-message--error'}`}
                >
                  {messageStatus.message}
                </div>
              )}
              <div className="donation-comm-grid donation-comm-grid--offline">
                {(showStatusActions) && (
                <div className="donation-comm-col">
                  <h4 className="donation-comm-col__title">Status</h4>
                  <div className="donation-comm-col__actions">
                    {showMarkCompleted && (
                      <button
                        type="button"
                        className="donation-comm-btn donation-comm-btn--completed donation-comm-btn--inline"
                        onClick={markAsCompleted}
                        disabled={markingCompleted}
                      >
                        <span className="donation-comm-btn__icon">
                          <FiCheckCircle />
                        </span>
                        <span className="donation-comm-btn__label">
                          {markingCompleted ? 'Updating…' : 'Completed'}
                        </span>
                      </button>
                    )}
                    {showMarkFailed && (
                      <button
                        type="button"
                        className="donation-comm-btn donation-comm-btn--failed donation-comm-btn--inline"
                        onClick={markAsFailed}
                        disabled={markingFailed}
                      >
                        <span className="donation-comm-btn__icon">
                          <FiXCircle />
                        </span>
                        <span className="donation-comm-btn__label">
                          {markingFailed ? 'Updating…' : 'Failed'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <DonationReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        donationId={id}
        donation={donation}
        canPreview={canViewReceipt}
        canSendEmail={canSendReceiptEmail}
        onStatusMessage={(status) => {
          setMessageStatus(status);
          if (status.type === 'success') {
            setTimeout(() => setMessageStatus({ type: '', message: '' }), 5000);
          }
        }}
      />
    </>
  );
};

export default ViewOnlineDonation;
