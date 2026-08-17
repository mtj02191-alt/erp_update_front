import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../../utils/axios';
import { useAuth } from '../../../context/AuthContext';
import { hasPermission, isSuperAdmin } from '../../../utils/permissions';
import Navbar from '../../Navbar';
import PageHeader from '../../common/PageHeader';
import { FiMail, FiRefreshCw } from 'react-icons/fi';
import './index.css';

const GoogleIcon = () => (
  <svg className="ec-google-icon" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const EmailChecklist = () => {
  const { permissions, user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [connection, setConnection] = useState({
    connected: false,
    gmail_email: null,
    last_synced_at: null,
    google_signin_ready: false,
    redirect_uri: '',
  });
  const [appConfig, setAppConfig] = useState({
    configured: false,
    client_id: '',
    redirect_uri: '',
    has_client_secret: false,
  });
  const [appConfigForm, setAppConfigForm] = useState({ client_id: '', client_secret: '' });
  const [savingAppConfig, setSavingAppConfig] = useState(false);
  const [items, setItems] = useState([]);
  const [showDone, setShowDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isSuperAdminUser = useMemo(
    () => user?.role === 'super_admin' || isSuperAdmin(permissions),
    [user, permissions],
  );

  const canView = useMemo(
    () =>
      isSuperAdminUser ||
      hasPermission(permissions, 'communication', 'email_checklist', 'list_view'),
    [permissions, isSuperAdminUser],
  );

  const canUpdate = useMemo(
    () =>
      isSuperAdminUser ||
      hasPermission(permissions, 'communication', 'email_checklist', 'update'),
    [permissions, isSuperAdminUser],
  );

  const fetchConnection = useCallback(async () => {
    const res = await axiosInstance.get('/email-checklist/connection');
    if (res.data?.success) {
      setConnection(res.data.data || { connected: false });
    }
  }, []);

  const fetchAppConfig = useCallback(async () => {
    if (!isSuperAdminUser) return;
    try {
      const res = await axiosInstance.get('/email-checklist/gmail/app-config');
      if (res.data?.success) {
        const data = res.data.data || {};
        setAppConfig(data);
        setAppConfigForm((prev) => ({
          client_id: data.client_id || prev.client_id,
          client_secret: '',
        }));
      }
    } catch {
      /* super admin only */
    }
  }, [isSuperAdminUser]);

  const fetchItems = useCallback(async () => {
    const res = await axiosInstance.get('/email-checklist/items', {
      params: { show_done: showDone ? 'true' : 'false' },
    });
    if (res.data?.success) {
      setItems(Array.isArray(res.data.data) ? res.data.data : []);
    }
  }, [showDone]);

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      await Promise.all([fetchConnection(), fetchItems(), fetchAppConfig()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load email checklist');
    } finally {
      setLoading(false);
    }
  }, [fetchConnection, fetchItems, fetchAppConfig]);

  useEffect(() => {
    if (!authLoading && canView) {
      loadPage();
    }
  }, [authLoading, canView, loadPage]);

  // Backend cron imports new mail every ~2 min; refresh the list while this page is open.
  useEffect(() => {
    if (!authLoading && !canView) return undefined;
    if (!connection.connected) return undefined;

    const intervalId = setInterval(() => {
      fetchConnection().catch(() => {});
      fetchItems().catch(() => {});
    }, 60_000);

    return () => clearInterval(intervalId);
  }, [authLoading, canView, connection.connected, fetchConnection, fetchItems]);

  useEffect(() => {
    const gmailStatus = searchParams.get('gmail');
    if (!gmailStatus) return;

    if (gmailStatus === 'connected') {
      setNotice('Gmail connected successfully.');
      loadPage();
    } else if (gmailStatus === 'error') {
      const message = searchParams.get('message');
      setError(message ? decodeURIComponent(message) : 'Gmail connection failed.');
    }

    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, loadPage]);

  const handleSaveAppConfig = async (e) => {
    e.preventDefault();
    if (!appConfigForm.client_id.trim()) {
      setError('Enter Google Client ID.');
      return;
    }
    if (!appConfig.configured && !appConfigForm.client_secret.trim()) {
      setError('Enter Google Client Secret.');
      return;
    }
    try {
      setSavingAppConfig(true);
      setError('');
      const payload = { client_id: appConfigForm.client_id.trim() };
      if (appConfigForm.client_secret.trim()) {
        payload.client_secret = appConfigForm.client_secret.trim();
      }
      const res = await axiosInstance.post('/email-checklist/gmail/app-config', payload);
      if (res.data?.success) {
        setNotice(res.data.message || 'Google sign-in enabled.');
        setAppConfig(res.data.data || {});
        setAppConfigForm((prev) => ({ ...prev, client_secret: '' }));
        await fetchConnection();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save Google app config');
    } finally {
      setSavingAppConfig(false);
    }
  };

  const handleCopyRedirectUri = async () => {
    const uri = appConfig.redirect_uri || connection.redirect_uri;
    if (!uri) return;
    try {
      await navigator.clipboard.writeText(uri);
      setNotice('Redirect URI copied — paste it in Google Cloud Console.');
    } catch {
      setError('Could not copy redirect URI.');
    }
  };

  const handleConnectGmail = async () => {
    try {
      setConnecting(true);
      setError('');
      const res = await axiosInstance.get('/email-checklist/gmail/auth-url');
      const url = res.data?.data?.url;
      if (!url) {
        throw new Error('Could not start Google sign-in');
      }
      window.location.href = url;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to connect Gmail');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Gmail from your email checklist?')) return;
    try {
      await axiosInstance.delete('/email-checklist/gmail/disconnect');
      setConnection((prev) => ({
        ...prev,
        connected: false,
        gmail_email: null,
        last_synced_at: null,
      }));
      setItems([]);
      setNotice('Gmail disconnected.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disconnect Gmail');
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError('');
      const res = await axiosInstance.post('/email-checklist/sync');
      setNotice(res.data?.message || 'Inbox synced.');
      await fetchItems();
      await fetchConnection();
    } catch (err) {
      setError(err.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggle = async (item) => {
    if (!canUpdate) return;
    const nextDone = !item.is_done;
    try {
      setTogglingId(item.id);
      await axiosInstance.patch(`/email-checklist/items/${item.id}`, {
        is_done: nextDone,
      });
      if (showDone) {
        setItems((prev) =>
          prev.map((row) =>
            row.id === item.id
              ? { ...row, is_done: nextDone, done_at: nextDone ? new Date().toISOString() : null }
              : row,
          ),
        );
      } else if (nextDone) {
        setItems((prev) => prev.filter((row) => row.id !== item.id));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update item');
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="ec-page-loading">Loading…</div>
      </>
    );
  }

  if (!canView) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <>
      <Navbar />
      <div className="ec-page">
        <PageHeader
          title="My Email Checklist"
          subtitle="Connect your Gmail once. New unread emails appear here automatically every 15 minutes (from connect time onward)."
        />

        {notice && (
          <div className="ec-notice" role="status">
            {notice}
          </div>
        )}
        {error && (
          <div className="ec-error" role="alert">
            {error}
          </div>
        )}

        {isSuperAdminUser && !connection.google_signin_ready && (
          <div className="ec-setup-card">
            <h3 className="ec-setup-title">One-time setup (super admin only)</h3>
            <p className="ec-setup-text">
              Create one OAuth app in Google Cloud, copy the redirect URI below into Google Console,
              then save Client ID and Secret here. After that, every user only clicks Connect Gmail.
            </p>
            <form className="ec-setup-form" onSubmit={handleSaveAppConfig}>
              <label className="ec-setup-label">
                Redirect URI (add in Google Cloud → Authorized redirect URIs)
                <div className="ec-setup-redirect-row">
                  <input
                    className="ec-setup-input"
                    value={appConfig.redirect_uri || connection.redirect_uri || ''}
                    readOnly
                  />
                  <button type="button" className="ec-btn ec-btn--ghost" onClick={handleCopyRedirectUri}>
                    Copy
                  </button>
                </div>
              </label>
              <label className="ec-setup-label">
                Client ID
                <input
                  className="ec-setup-input"
                  value={appConfigForm.client_id}
                  onChange={(e) =>
                    setAppConfigForm((p) => ({ ...p, client_id: e.target.value }))
                  }
                  placeholder="xxxx.apps.googleusercontent.com"
                />
              </label>
              <label className="ec-setup-label">
                Client Secret
                <input
                  type="password"
                  className="ec-setup-input"
                  value={appConfigForm.client_secret}
                  onChange={(e) =>
                    setAppConfigForm((p) => ({ ...p, client_secret: e.target.value }))
                  }
                  placeholder={appConfig.configured ? 'Leave blank to keep existing' : 'Required'}
                />
              </label>
              <button type="submit" className="ec-btn ec-btn--primary" disabled={savingAppConfig}>
                {savingAppConfig ? 'Saving…' : 'Enable Connect Gmail for everyone'}
              </button>
            </form>
          </div>
        )}

        {!connection.connected && canUpdate && connection.google_signin_ready && (
          <div className="ec-connect-card">
            <p className="ec-connect-text">
              Link your Gmail inbox. New unread emails are added to your checklist automatically every 15 minutes.
            </p>
            <button
              type="button"
              className="ec-google-btn"
              onClick={handleConnectGmail}
              disabled={connecting}
            >
              <GoogleIcon />
              {connecting ? 'Opening Google…' : 'Connect Gmail'}
            </button>
          </div>
        )}

        {!connection.connected && canUpdate && !connection.google_signin_ready && !isSuperAdminUser && (
          <div className="ec-connect-card">
            <p className="ec-connect-text ec-connect-text--muted">
              Gmail connect is not enabled yet. Ask your super admin to complete the one-time Google setup.
            </p>
          </div>
        )}

        {connection.connected && (
          <div className="ec-toolbar">
            <div className="ec-connection">
              <FiMail className="ec-connection-icon" aria-hidden />
              <span>
                Connected: <strong>{connection.gmail_email}</strong>
                {connection.last_synced_at && (
                  <span className="ec-synced-at">
                    {' '}
                    · Last sync {formatDate(connection.last_synced_at)}
                  </span>
                )}
              </span>
            </div>

            <div className="ec-toolbar-actions">
              <label className="ec-show-done">
                <input
                  type="checkbox"
                  checked={showDone}
                  onChange={(e) => setShowDone(e.target.checked)}
                />
                Show completed
              </label>

              <button
                type="button"
                className="ec-btn ec-btn--ghost"
                onClick={handleSync}
                disabled={syncing}
              >
                <FiRefreshCw className={syncing ? 'ec-spin' : ''} />
                {syncing ? 'Syncing…' : 'Sync now'}
              </button>

              {canUpdate && (
                <button
                  type="button"
                  className="ec-btn ec-btn--ghost"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        )}

        <div className="ec-table-wrap">
          <table className="ec-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Done</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="ec-table-empty">
                    Loading checklist…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="ec-table-empty">
                    {connection.connected
                      ? 'No pending emails in your checklist.'
                      : 'Click Connect Gmail to import your unread emails.'}
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id} className={item.is_done ? 'ec-row--done' : ''}>
                    <td className="ec-col-index">{index + 1}</td>
                    <td className="ec-col-subject">
                      <div className="ec-subject-title">{item.subject}</div>
                      <div className="ec-subject-meta">
                        {item.email_from || 'Unknown sender'}
                        {item.received_at ? ` · ${formatDate(item.received_at)}` : ''}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`ec-status-pill ${
                          item.is_done ? 'ec-status-pill--done' : 'ec-status-pill--todo'
                        }`}
                      >
                        {item.is_done ? 'Done' : 'Todo'}
                      </span>
                    </td>
                    <td className="ec-col-check">
                      <input
                        type="checkbox"
                        className="ec-checkbox"
                        checked={!!item.is_done}
                        disabled={!canUpdate || togglingId === item.id}
                        onChange={() => handleToggle(item)}
                        aria-label={`Mark "${item.subject}" as done`}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default EmailChecklist;
