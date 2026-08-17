import React, { useEffect, useRef, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import FormSelect from '../../../common/FormSelect';
import './DonationReceiptModal.css';

const RECEIPT_STYLE_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal (monetary)' },
  { value: 'vertical', label: 'Vertical (monetary)' },
  { value: 'donation', label: 'In-kind' },
];

const defaultStyleForDonation = (donation) => {
  const method = String(donation?.donation_method || '').toLowerCase();
  const hasInKind =
    method === 'in_kind' ||
    (Array.isArray(donation?.in_kind_items) && donation.in_kind_items.length > 0);
  return hasInKind ? 'donation' : 'horizontal';
};

const DonationReceiptModal = ({
  isOpen,
  onClose,
  donationId,
  donation,
  canPreview = false,
  canSendEmail = false,
  onStatusMessage,
}) => {
  const [style, setStyle] = useState('horizontal');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const iframeRef = useRef(null);
  const printAfterLoadRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !donation) return;
    setStyle(defaultStyleForDonation(donation));
    setError('');
    setPreviewHtml('');
    setShowPreview(false);
    printAfterLoadRef.current = false;
    setIsPrinting(false);
  }, [isOpen, donation]);

  useEffect(() => {
    setPreviewHtml('');
    setShowPreview(false);
    printAfterLoadRef.current = false;
  }, [style]);

  if (!isOpen) return null;

  const fetchReceiptHtml = async () => {
    const response = await axiosInstance.get(`/donations/${donationId}/receipt`, {
      params: { style },
    });
    if (!response.data?.success || !response.data?.data?.html) {
      throw new Error(response.data?.message || 'Failed to generate receipt');
    }
    return response.data.data.html;
  };

  const printFromIframe = () => {
    const frameWindow = iframeRef.current?.contentWindow;
    if (!frameWindow) {
      throw new Error('Receipt preview is not ready yet.');
    }
    frameWindow.focus();
    frameWindow.print();
  };

  const handleIframeLoad = () => {
    if (!printAfterLoadRef.current) return;
    printAfterLoadRef.current = false;
    setLoadingPreview(false);
    setIsPrinting(false);
    try {
      printFromIframe();
    } catch (err) {
      setError(err.message || 'Failed to print receipt.');
    }
  };

  const handlePreviewPrint = async () => {
    if (!donationId || !canPreview) return;
    setLoadingPreview(true);
    setIsPrinting(true);
    setError('');

    try {
      const html = await fetchReceiptHtml();

      if (showPreview && previewHtml === html) {
        printFromIframe();
        setLoadingPreview(false);
        setIsPrinting(false);
        return;
      }

      printAfterLoadRef.current = true;
      setPreviewHtml(html);
      setShowPreview(true);
    } catch (err) {
      printAfterLoadRef.current = false;
      setLoadingPreview(false);
      setIsPrinting(false);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to load receipt for printing.';
      setError(msg);
    }
  };

  const handleLoadPreview = async () => {
    if (!donationId || !canPreview) return;
    setLoadingPreview(true);
    setError('');
    printAfterLoadRef.current = false;

    try {
      const html = await fetchReceiptHtml();
      setPreviewHtml(html);
      setShowPreview(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to load receipt preview.';
      setError(msg);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSendEmail = async () => {
    if (!donationId || !canSendEmail) return;
    if (!donation?.donor?.email) {
      setError('Donor email is required to send the receipt.');
      return;
    }

    setSendingEmail(true);
    setError('');
    try {
      const response = await axiosInstance.post(
        `/donations/sendDonationReceipt/${donationId}`,
        { style },
      );
      if (response.data?.success) {
        onStatusMessage?.({
          type: 'success',
          message: response.data.message || 'Receipt sent successfully!',
        });
        onClose?.();
      } else {
        setError(response.data.message || 'Failed to send receipt');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to send receipt. Please try again.',
      );
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="donation-receipt-modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`donation-receipt-modal${showPreview ? ' donation-receipt-modal--wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="donation-receipt-modal-title"
      >
        <h3 id="donation-receipt-modal-title" className="donation-receipt-modal__title">
          Donation Receipt
        </h3>
        <p className="donation-receipt-modal__hint">
          Choose a layout, preview in the panel below, then print or email — no pop-up window needed.
        </p>

        <FormSelect
          label="Receipt style"
          name="receipt_style"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          options={RECEIPT_STYLE_OPTIONS}
        />

        {!donation?.donor?.email && (
          <p className="donation-receipt-modal__warn">
            No donor email on file — you can still print; email send is disabled.
          </p>
        )}

        {error && (
          <div className="donation-receipt-modal__error">{error}</div>
        )}

        {showPreview && (
          <div className="donation-receipt-modal__preview-wrap">
            <iframe
              ref={iframeRef}
              title="Receipt preview"
              className="donation-receipt-modal__preview-frame"
              srcDoc={previewHtml}
              onLoad={handleIframeLoad}
            />
          </div>
        )}

        <div className="donation-receipt-modal__actions">
          {canPreview && (
            <>
          <button
            type="button"
            className="donation-action-btn donation-action-btn--indigo"
            onClick={handleLoadPreview}
            disabled={loadingPreview || sendingEmail}
          >
            {loadingPreview && !isPrinting ? 'Loading...' : 'Load Preview'}
          </button>
          <button
            type="button"
            className="donation-action-btn donation-action-btn--indigo"
            onClick={handlePreviewPrint}
            disabled={loadingPreview || sendingEmail}
          >
            {isPrinting ? 'Printing...' : 'Print'}
          </button>
            </>
          )}
          {canSendEmail && (
          <button
            type="button"
            className="donation-action-btn donation-action-btn--amber"
            onClick={handleSendEmail}
            disabled={sendingEmail || loadingPreview || !donation?.donor?.email}
          >
            {sendingEmail ? 'Sending...' : 'Send Email'}
          </button>
          )}
          <button
            type="button"
            className="donation-action-btn"
            onClick={onClose}
            disabled={sendingEmail || loadingPreview}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationReceiptModal;
