import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Card from '../../../common/Card';
import ConfirmationModal from '../../../common/ConfirmationModal';
import { FiEdit, FiUsers, FiCalendar, FiMapPin, FiCopy, FiCheck, FiX } from 'react-icons/fi';

const ViewEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Passes state
  const [passesPage, setPassesPage] = useState(1);
  const [passesTotal, setPassesTotal] = useState(0);
  const [passesFilter, setPassesFilter] = useState('');
  const [generatingPasses, setGeneratingPasses] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);

  // Scan state
  const [scanCode, setScanCode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Revoke modal
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [passToRevoke, setPassToRevoke] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchEvent();
    fetchStats();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'passes') {
      fetchPasses();
    }
  }, [id, activeTab, passesPage, passesFilter]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/events/${id}`);
      if (response.data.success) {
        setEvent(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch event');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get(`/events/${id}/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchPasses = async () => {
    try {
      const params = { page: passesPage, pageSize: 20 };
      if (passesFilter) params.status = passesFilter;
      const response = await axiosInstance.get(`/events/${id}/passes`, { params });
      if (response.data.success) {
        setPasses(response.data.data || []);
        setPassesTotal(response.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching passes:', err);
    }
  };

  const handleGeneratePasses = async () => {
    if (generateCount < 1 || generateCount > 1000) {
      alert('Count must be between 1 and 1000');
      return;
    }
    setGeneratingPasses(true);
    try {
      const response = await axiosInstance.post(`/events/${id}/passes/generate?count=${generateCount}`);
      if (response.data.success) {
        alert(`${response.data.data.length} passes generated successfully!`);
        fetchPasses();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate passes');
    } finally {
      setGeneratingPasses(false);
    }
  };

  const handleRevokePass = (pass) => {
    setPassToRevoke(pass);
    setShowRevokeModal(true);
  };

  const confirmRevokePass = async () => {
    if (!passToRevoke) return;
    try {
      await axiosInstance.patch(`/events/${id}/passes/${passToRevoke.id}/revoke`);
      setShowRevokeModal(false);
      setPassToRevoke(null);
      fetchPasses();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke pass');
    }
  };

  const handleScan = async () => {
    if (!scanCode.trim()) {
      setScanResult({ ok: false, code: 'EMPTY_CODE', message: 'Please enter a pass code' });
      return;
    }
    setScanning(true);
    setScanResult(null);
    try {
      const response = await axiosInstance.post(`/events/${id}/passes/scan`, {
        pass_code: scanCode.trim()
      });
      setScanResult(response.data);
      if (response.data.ok) {
        setScanCode('');
        fetchStats();
      }
    } catch (err) {
      setScanResult({
        ok: false,
        code: err.response?.data?.code || 'ERROR',
        message: err.response?.data?.message || 'Scan failed'
      });
    } finally {
      setScanning(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: '#6b7280',
      upcoming: '#3b82f6',
      ongoing: '#10b981',
      completed: '#8b5cf6',
      cancelled: '#ef4444',
      archived: '#9ca3af'
    };
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '4px',
        backgroundColor: colors[status] || '#6b7280',
        color: 'white',
        fontSize: '14px',
        textTransform: 'capitalize'
      }}>
        {status}
      </span>
    );
  };

  const getPassStatusBadge = (status) => {
    const colors = {
      unused: '#10b981',
      used: '#6b7280',
      revoked: '#ef4444',
      expired: '#f59e0b'
    };
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: colors[status] || '#6b7280',
        color: 'white',
        fontSize: '12px',
        textTransform: 'capitalize'
      }}>
        {status}
      </span>
    );
  };

  const handleBack = () => navigate('/dms/events/list');
  const handleEdit = () => navigate(`/dms/events/edit/${id}`);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading event...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="error-container">
            <div className="status-message status-message--error">{error || 'Event not found'}</div>
            <button className="primary_btn" onClick={handleBack}>Back to Events</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title={event.title}
          onBack={handleBack}
          showEdit={true}
          editPath={`/dms/events/edit/${id}`}
        />

        <div className="list-content">
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '0',
            marginBottom: '20px',
            borderBottom: '2px solid #e5e7eb'
          }}>
            {['details', 'passes', 'scan'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === tab ? '600' : '400',
                  color: activeTab === tab ? '#2563eb' : '#6b7280',
                  borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                  marginBottom: '-2px',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '300px' }}>
                  <Card
                    title="Event Information"
                    data={{
                      Status: getStatusBadge(event.status),
                      Type: event.event_type || '-',
                      'Start Date': new Date(event.start_at).toLocaleString(),
                      'End Date': new Date(event.end_at).toLocaleString(),
                      Location: event.location || '-',
                      'Public Event': event.is_public ? 'Yes' : 'No'
                    }}
                  />
                </div>

                {stats && (
                  <div style={{ flex: '1', minWidth: '300px' }}>
                    <Card
                      title="Attendance Stats"
                      data={{
                        Capacity: stats.allowed_attendees,
                        Attendees: stats.attendees_count,
                        Remaining: stats.remaining,
                        'Total Passes': stats.passes_total,
                        'Passes Used': stats.passes_used,
                        'Passes Unused': stats.passes_unused,
                        'Passes Revoked': stats.passes_revoked
                      }}
                    />
                  </div>
                )}
              </div>

              {event.description && (
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ marginBottom: '10px' }}>Description</h3>
                  <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{event.description}</p>
                </div>
              )}

              <div className="form-actions">
                <button className="primary_btn" onClick={handleEdit}>
                  <FiEdit style={{ marginRight: '8px' }} />
                  Edit Event
                </button>
              </div>
            </div>
          )}

          {/* Passes Tab */}
          {activeTab === 'passes' && (
            <div>
              {/* Generate Passes */}
              <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f0fdf4',
                borderRadius: '8px'
              }}>
                <label style={{ fontWeight: '500' }}>Generate Passes:</label>
                <input
                  type="number"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(parseInt(e.target.value) || 0)}
                  min={1}
                  max={1000}
                  style={{
                    width: '100px',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                />
                <button
                  className="primary_btn"
                  onClick={handleGeneratePasses}
                  disabled={generatingPasses}
                >
                  {generatingPasses ? 'Generating...' : 'Generate'}
                </button>
              </div>

              {/* Filter */}
              <div style={{ marginBottom: '15px' }}>
                <select
                  value={passesFilter}
                  onChange={(e) => { setPassesFilter(e.target.value); setPassesPage(1); }}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="unused">Unused</option>
                  <option value="used">Used</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>

              {/* Passes Table */}
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Pass Code</th>
                      <th>Status</th>
                      <th>Used At</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passes.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="no-data">No passes found</td>
                      </tr>
                    ) : (
                      passes.map((pass) => (
                        <tr key={pass.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <code style={{ fontSize: '12px' }}>
                                {pass.pass_code.substring(0, 16)}...
                              </code>
                              <button
                                onClick={() => copyToClipboard(pass.pass_code)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#6b7280'
                                }}
                                title="Copy"
                              >
                                <FiCopy size={14} />
                              </button>
                            </div>
                          </td>
                          <td>{getPassStatusBadge(pass.status)}</td>
                          <td>{pass.used_at ? new Date(pass.used_at).toLocaleString() : '-'}</td>
                          <td>{new Date(pass.created_at).toLocaleString()}</td>
                          <td>
                            {pass.status === 'unused' && (
                              <button
                                onClick={() => handleRevokePass(pass)}
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {passesTotal > 20 && (
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button
                    disabled={passesPage === 1}
                    onClick={() => setPassesPage(p => p - 1)}
                    className="secondary_btn"
                  >
                    Previous
                  </button>
                  <span style={{ padding: '8px' }}>Page {passesPage}</span>
                  <button
                    disabled={passes.length < 20}
                    onClick={() => setPassesPage(p => p + 1)}
                    className="secondary_btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Scan Tab */}
          {activeTab === 'scan' && (
            <div>
              <div style={{
                maxWidth: '500px',
                margin: '0 auto',
                padding: '30px',
                backgroundColor: '#f9fafb',
                borderRadius: '12px'
              }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <FiUsers style={{ marginRight: '10px' }} />
                  Check-in Scanner
                </h2>

                {stats && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    marginBottom: '25px',
                    padding: '15px',
                    backgroundColor: 'white',
                    borderRadius: '8px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                        {stats.attendees_count}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Checked In</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                        {stats.remaining}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Remaining</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700' }}>
                        {stats.allowed_attendees}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Capacity</div>
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="text"
                    value={scanCode}
                    onChange={(e) => setScanCode(e.target.value)}
                    placeholder="Enter or scan pass code..."
                    style={{
                      width: '100%',
                      padding: '15px',
                      fontSize: '16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                  />
                </div>

                <button
                  onClick={handleScan}
                  disabled={scanning}
                  style={{
                    width: '100%',
                    padding: '15px',
                    fontSize: '18px',
                    fontWeight: '600',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  {scanning ? 'Scanning...' : 'SCAN'}
                </button>

                {scanResult && (
                  <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    borderRadius: '8px',
                    backgroundColor: scanResult.ok ? '#dcfce7' : '#fee2e2',
                    textAlign: 'center'
                  }}>
                    {scanResult.ok ? (
                      <>
                        <FiCheck size={48} color="#10b981" />
                        <h3 style={{ color: '#10b981', marginTop: '10px' }}>SUCCESS!</h3>
                        <p>Attendee checked in. {scanResult.remaining} spots remaining.</p>
                      </>
                    ) : (
                      <>
                        <FiX size={48} color="#ef4444" />
                        <h3 style={{ color: '#ef4444', marginTop: '10px' }}>
                          {scanResult.code === 'EVENT_FULL' && 'EVENT FULL'}
                          {scanResult.code === 'PASS_ALREADY_USED' && 'ALREADY USED'}
                          {scanResult.code === 'INVALID_PASS' && 'INVALID PASS'}
                          {scanResult.code === 'PASS_REVOKED' && 'PASS REVOKED'}
                          {!['EVENT_FULL', 'PASS_ALREADY_USED', 'INVALID_PASS', 'PASS_REVOKED'].includes(scanResult.code) && 'ERROR'}
                        </h3>
                        {scanResult.used_at && (
                          <p>Used at: {new Date(scanResult.used_at).toLocaleString()}</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showRevokeModal}
        text={`Are you sure you want to revoke this pass? This cannot be undone.`}
        onConfirm={confirmRevokePass}
        onCancel={() => { setShowRevokeModal(false); setPassToRevoke(null); }}
      />
    </>
  );
};

export default ViewEvent;
