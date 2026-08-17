import React, { useState } from 'react';
import { FiCloud, FiCloudOff, FiRefreshCw } from 'react-icons/fi';
import { IoMdRemoveCircleOutline } from 'react-icons/io';
import { useOffline } from '../../context/OfflineContext';
import ConfirmationModal from './ConfirmationModal';
import './OfflineModeControls.css';

/**
 * Offline mode toggle + sync + clear cache (navbar and login).
 * @param {{ compact?: boolean }} props
 */
const OfflineModeControls = ({ compact = false }) => {
  const {
    offlineMode,
    networkOnline,
    pendingCount,
    localCacheCount,
    isSyncing,
    isClearing,
    toggleOfflineMode,
    syncNow,
    clearOfflineCache,
  } = useOffline();
  const [showClearModal, setShowClearModal] = useState(false);

  const handleClearConfirm = async () => {
    setShowClearModal(false);
    await clearOfflineCache();
  };

  return (
    <>
      <div className={`offline-controls${compact ? ' offline-controls--compact' : ''}`}>
        {!networkOnline && (
          <span className="offline-controls__badge offline-controls__badge--warn">
            No network
          </span>
        )}
        {offlineMode && pendingCount > 0 && (
          <span className="offline-controls__badge" title="Pending sync">
            {pendingCount} pending
          </span>
        )}
        <label
          className="offline-controls__toggle"
          title={offlineMode ? 'Working offline' : 'Working online'}
        >
          <input
            type="checkbox"
            checked={offlineMode}
            onChange={() => toggleOfflineMode()}
          />
          <span className="offline-controls__track">
            <span className="offline-controls__thumb" />
          </span>
          <span className="offline-controls__label">
            {offlineMode ? <FiCloudOff /> : <FiCloud />}
            <span>{offlineMode ? 'Offline' : 'Online'}</span>
          </span>
        </label>
        <button
          type="button"
          className="offline-controls__sync"
          onClick={() => syncNow()}
          disabled={isSyncing || isClearing || pendingCount === 0 || !networkOnline}
          title={
            !networkOnline
              ? 'Connect to internet to sync'
              : pendingCount === 0
                ? 'Nothing to sync'
                : 'Sync offline changes to server'
          }
        >
          <FiRefreshCw className={isSyncing ? 'offline-controls__spin' : ''} />
          {!compact && <span>{isSyncing ? 'Syncing…' : 'Sync'}</span>}
        </button>
        {offlineMode && (
          <button
            type="button"
            className="offline-controls__clear"
            onClick={() => setShowClearModal(true)}
            disabled={isClearing || isSyncing || localCacheCount === 0}
            title={
              localCacheCount === 0
                ? 'No offline data stored'
                : 'Clear all locally saved offline data'
            }
          >
            <IoMdRemoveCircleOutline
              className={isClearing ? 'offline-controls__spin' : ''}
            />
            {!compact && <span>{isClearing ? 'Clearing…' : 'Clear cache'}</span>}
          </button>
        )}
      </div>
      <ConfirmationModal
        isOpen={showClearModal}
        text={`Clear all ${localCacheCount} locally saved offline record(s)? This cannot be undone. Unsynced test or wrong data will be removed.`}
        delete
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearModal(false)}
      />
    </>
  );
};

export default OfflineModeControls;
