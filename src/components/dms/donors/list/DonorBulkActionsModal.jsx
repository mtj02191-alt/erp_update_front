import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiHeart, FiArrowLeft } from 'react-icons/fi';
import CommunicationSendForm from '../../email_templates/send/CommunicationSendForm';
import './DonorBulkActionsModal.css';

/**
 * Multi-action modal for donors list selection / filtered audience.
 * Action registry is extensible — add entries to `ACTIONS` later.
 */
const DonorBulkActionsModal = ({
  isOpen,
  onClose,
  audienceMode = 'manual',
  donorIds = [],
  donorFilters = null,
  selectedCount = 0,
  matchedHint = null,
  onSendSuccess,
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState('picker');

  useEffect(() => {
    if (isOpen) setStep('picker');
  }, [isOpen]);

  const audienceLabel = useMemo(() => {
    if (audienceMode === 'filters') {
      if (matchedHint != null) return `${matchedHint} matching donor${matchedHint === 1 ? '' : 's'}`;
      return 'Filtered donors';
    }
    return `${selectedCount || donorIds.length} donor${(selectedCount || donorIds.length) === 1 ? '' : 's'} selected`;
  }, [audienceMode, matchedHint, selectedCount, donorIds.length]);

  const actions = useMemo(
    () => [
      {
        id: 'send_communication',
        title: 'Send communication',
        description: 'Email or WhatsApp using a saved template',
        icon: FiMail,
        enabled: true,
        onSelect: () => setStep('send_communication'),
      },
      {
        id: 'thanks_message',
        title: 'Thanks message',
        description: 'Coming soon — donation-level thank-you messages',
        icon: FiHeart,
        enabled: false,
        onSelect: () => {},
      },
    ],
    [],
  );

  if (!isOpen) return null;

  const title =
    step === 'send_communication' ? 'Send communication' : 'Donor actions';

  return (
    <div
      className="custom-modal-overlay donor-bulk-actions-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="custom-modal-content donor-bulk-actions-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="donor-bulk-actions-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="custom-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        <div className="donor-bulk-actions-modal__header">
          {step !== 'picker' && (
            <button
              type="button"
              className="donor-bulk-actions-modal__back"
              onClick={() => setStep('picker')}
            >
              <FiArrowLeft />
              Back
            </button>
          )}
          <h2 id="donor-bulk-actions-title">{title}</h2>
          <p className="donor-bulk-actions-modal__audience">{audienceLabel}</p>
        </div>

        {step === 'picker' && (
          <div className="donor-bulk-actions-modal__picker">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  className={`donor-bulk-actions-modal__action${
                    action.enabled ? '' : ' donor-bulk-actions-modal__action--disabled'
                  }`}
                  onClick={action.enabled ? action.onSelect : undefined}
                  disabled={!action.enabled}
                  title={action.enabled ? action.title : action.description}
                >
                  <span className="donor-bulk-actions-modal__action-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="donor-bulk-actions-modal__action-text">
                    <strong>{action.title}</strong>
                    <span>{action.description}</span>
                  </span>
                  {!action.enabled && (
                    <span className="donor-bulk-actions-modal__badge">Soon</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {step === 'send_communication' && (
          <div className="donor-bulk-actions-modal__send">
            <CommunicationSendForm
              initialAudienceMode={audienceMode}
              initialDonorIds={audienceMode === 'manual' ? donorIds : []}
              initialDonorFilters={audienceMode === 'filters' ? donorFilters : null}
              lockAudience
              sendSource="donor_bulk"
              compact
              showHistoryLink
              onNavigateHistory={() => {
                onClose();
                navigate('/dms/email_templates/batches?source=donor_bulk');
              }}
              onSuccess={(data) => {
                if (typeof onSendSuccess === 'function') onSendSuccess(data);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorBulkActionsModal;
