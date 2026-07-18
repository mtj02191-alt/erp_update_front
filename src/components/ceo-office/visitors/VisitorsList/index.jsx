import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUsers, FaUserCheck, FaPhone, FaWhatsapp, FaEye, FaEdit, FaTrash,FaPlus,  FaSyncAlt,  FaListAlt } from 'react-icons/fa';
import axios from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import Navbar from '../../../Navbar';
import ConvertToTaskModal from '../../ConvertToTaskModal';
import AddVisitorModal from '../AddVisitorModal';
import EditVisitorModal from '../EditVisitorModal';
import './index.css';

// Helper to get initials from name
const getInitials = (name) => {
  const nameParts = name.split(' ').filter(Boolean);
  if (nameParts.length >= 2) {
    return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  }
  return name[0]?.toUpperCase() || '?';
};

const getDefaultFormData = () => ({
  type: 'visitor',
  visitorName: '',
  organization: '',
  purpose: '',
  meetingWith: '',
  department: '',
  protocolRequired: '',
  expectedDuration: '',
  visitorOutcome: '',
  callerName: '',
  phoneNumber: '',
  callPurpose: '',
  callSummary: '',
  followUpRequired: 'No',
  followUpDate: '',
  assignedTo: '',
  contactName: '',
  whatsappPhoneNumber: '',
  messageSummary: '',
  requiredAction: '',
  attachmentUrl: '',
  responseStatus: '',
  visitDatetime: new Date().toISOString().slice(0, 16),
  relatedNoteId: '',
  remarks: '',
  status: 'Pending'
});

const VisitorsList = () => {
  const navigate = useNavigate();
  const { loading: authLoading, user } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [formData, setFormData] = useState(getDefaultFormData());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertData, setConvertData] = useState({
    task_title: '',
    task_description: '',
    task_department: '',
    task_priority: '',
    task_due_date: '',
    assigned_users: [],
    mov_items: []
  });
  const [currentConvertVisitorId, setCurrentConvertVisitorId] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      console.log('Auth loaded, fetching visitors...');
      fetchVisitors();
    }
  }, [authLoading, user]);

  useEffect(() => {
    let result = [...visitors];

    // Filter by type
    if (typeFilter !== 'all') {
      result = result.filter(v => (v.type || 'visitor').toLowerCase() === typeFilter.toLowerCase());
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v =>
        // Check all possible name fields
        v.visitor_name?.toLowerCase().includes(query) ||
        v.caller_name?.toLowerCase().includes(query) ||
        v.contact_name?.toLowerCase().includes(query) ||
        v.organization?.toLowerCase().includes(query) ||
        v.purpose?.toLowerCase().includes(query) ||
        v.call_purpose?.toLowerCase().includes(query) ||
        v.message_summary?.toLowerCase().includes(query) ||
        v.remarks?.toLowerCase().includes(query)
      );
    }

    setFilteredVisitors(result);
  }, [visitors, searchQuery, typeFilter]);



  const fetchVisitors = async () => {
    try {
      setLoading(true);
      console.log('Fetching visitors...');
      // Fetch from /visitors - this already includes all records, including those linked to CEO notes
      const visitorsResponse = await axios.get('/visitors');
      const visitorsData = visitorsResponse.data.data || [];
      console.log('Fetched visitors data:', visitorsData);
      setVisitors(visitorsData);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      console.error('Error details:', error.response);
      toast.error('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = (data) => {
    const type = data.type;
    // Parse related note ID
    let relatedNoteId = null;
    const trimmedId = data.relatedNoteId.trim();
    const parsedId = parseInt(trimmedId);
    if (trimmedId && !isNaN(parsedId) && parsedId > 0) {
      relatedNoteId = parsedId;
    }

    // Common fields
    const payload = {
      type,
      status: data.status,
      visit_datetime: data.visitDatetime,
      remarks: data.remarks,
    };
    if (relatedNoteId !== null) {
      payload.related_note_id = relatedNoteId;
    }

    // Type-specific fields
    if (type === 'visitor') {
      return {
        ...payload,
        visitor_name: data.visitorName,
        organization: data.organization,
        purpose: data.purpose,
        meeting_with: data.meetingWith,
        department: data.department,
        protocol_required: data.protocolRequired,
        expected_duration: data.expectedDuration,
        visitor_outcome: data.visitorOutcome,
      };
    }
    if (type === 'call') {
      const callPayload = {
        ...payload,
        caller_name: data.callerName,
        organization: data.organization,
        phone_number: data.phoneNumber,
        call_purpose: data.callPurpose,
        call_summary: data.callSummary,
        follow_up_required: data.followUpRequired,
      };
      if (data.followUpRequired === 'Yes' && data.followUpDate) {
        callPayload.follow_up_date = data.followUpDate;
        callPayload.assigned_to = data.assignedTo;
      }
      return callPayload;
    }
    if (type === 'whatsapp') {
      return {
        ...payload,
        contact_name: data.contactName,
        phone_number: data.whatsappPhoneNumber,
        message_summary: data.messageSummary,
        required_action: data.requiredAction,
        attachment_url: data.attachmentUrl,
        response_status: data.responseStatus,
      };
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = buildPayload(formData);
      await axios.post('/visitors', payload);

      toast.success('Visitor logged successfully');
      setShowAddModal(false);
      setFormData(getDefaultFormData());
      fetchVisitors();
    } catch (error) {
      console.error('Error logging visitor:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.detail || '';
      if (errorMsg.includes('foreign key constraint') || errorMsg.includes('not present in table') || errorMsg.includes('Related note')) {
        toast.error('Error: Related note ID does not exist. Please enter a valid note ID.');
      } else {
        toast.error('Failed to log visitor');
      }
    }
  };

  const handleEdit = (visitor) => {
    console.log('Editing visitor:', visitor);
    if (visitor.related_note_id) {
      // For records linked to CEO notes, navigate to note view page with edit state
      navigate(`/ceo-office/notes/${visitor.related_note_id}`, { state: { isEditing: true } });
      return;
    }
    console.log('Visitor type:', visitor.type);
    setEditingVisitor(visitor);
    setFormData({
      type: (visitor.type || 'visitor').toLowerCase(),
      status: visitor.status || 'Pending',
      visitDatetime: visitor.visit_datetime ? visitor.visit_datetime.slice(0, 16) : new Date().toISOString().slice(0, 16),
      relatedNoteId: visitor.related_note_id ? visitor.related_note_id.toString() : '',
      remarks: visitor.remarks,

      visitorName: visitor.visitor_name,
      organization: visitor.organization,
      purpose: visitor.purpose,
      meetingWith: visitor.meeting_with,
      department: visitor.department,
      protocolRequired: visitor.protocol_required,
      expectedDuration: visitor.expected_duration,
      visitorOutcome: visitor.visitor_outcome,

      callerName: visitor.caller_name,
      phoneNumber: visitor.phone_number,
      callPurpose: visitor.call_purpose,
      callSummary: visitor.call_summary,
      followUpRequired: visitor.follow_up_required,
      followUpDate: visitor.follow_up_date ? visitor.follow_up_date.slice(0, 16) : '',
      assignedTo: visitor.assigned_to,

      contactName: visitor.contact_name,
      whatsappPhoneNumber: visitor.phone_number, // For WhatsApp, use the same phone_number field
      messageSummary: visitor.message_summary,
      requiredAction: visitor.required_action,
      attachmentUrl: visitor.attachment_url,
      responseStatus: visitor.response_status
    });
    setShowEditModal(true);
  };

  const handleDelete = async (visitor) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      if (visitor.related_note_id) {
        await axios.delete(`/ceo-notes/${visitor.related_note_id}`);
        toast.success('Note deleted successfully');
      } else {
        await axios.delete(`/visitors/${visitor.id}`);
        toast.success('Visitor log deleted successfully');
      }
      fetchVisitors();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = buildPayload(formData);
      await axios.patch(`/visitors/${editingVisitor.id}`, payload);

      toast.success('Visitor log updated successfully');
      setShowEditModal(false);
      setEditingVisitor(null);
      fetchVisitors();
    } catch (error) {
      console.error('Error updating visitor log:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.detail || '';
      if (errorMsg.includes('foreign key constraint') || errorMsg.includes('not present in table') || errorMsg.includes('Related note')) {
        toast.error('Error: Related note ID does not exist. Please enter a valid note ID.');
      } else {
        toast.error('Failed to update visitor log');
      }
    }
  };

  const handleConvertToTask = async () => {
    try {
      // Find the visitor record to check if it has a related note
      const visitor = visitors.find(v => v.id === currentConvertVisitorId);
      if (visitor?.related_note_id) {
        await axios.post(`/ceo-notes/${visitor.related_note_id}/convert-to-task`, convertData);
        toast.success('Note converted to task successfully');
      } else {
        await axios.post(`/visitors/${currentConvertVisitorId}/convert-to-task`, convertData);
        toast.success('Visitor log converted to task successfully');
      }
      setConvertModalOpen(false);
      fetchVisitors();
    } catch (error) {
      console.error('Error converting record to task:', error);
      toast.error('Failed to convert record to task');
    }
  };

  const openConvertModal = (visitor) => {
    setCurrentConvertVisitorId(visitor.id);
    const name = visitor.visitor_name || visitor.caller_name || visitor.contact_name || 'Contact';
    const purpose = visitor.purpose || visitor.call_purpose || visitor.message_summary || 'N/A';
    setConvertData({
      task_title: `Follow up with ${name}`,
      task_description: `Purpose: ${purpose}\nOrganization: ${visitor.organization || 'N/A'}\nRemarks: ${visitor.remarks || 'N/A'}`,
      task_department: '',
      task_priority: '',
      task_due_date: '',
      assigned_users: [],
      mov_items: []
    });
    setConvertModalOpen(true);
  };

  // Calculate summary stats
  const totalRecords = visitors.length;
  const visitorsCount = visitors.filter(v => (v.type || 'visitor').toLowerCase() === 'visitor').length;
  const callsCount = visitors.filter(v => (v.type || 'call').toLowerCase() === 'call').length;
  const whatsappCount = visitors.filter(v => (v.type || 'whatsapp').toLowerCase() === 'whatsapp').length;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="visitors-list-loading-container">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="visitors-list-container">
        {/* Summary Cards */}
        <div className="visitors-list-summary-cards">
          <div className="visitors-list-summary-card visitors-list-card-total">
            <div className="visitors-list-card-icon visitors-list-icon-total">
              <FaUsers />
            </div>
            <div className="visitors-list-card-content">
              <span className="visitors-list-card-value">{totalRecords}</span>
              <span className="visitors-list-card-label">Total Records</span>
            </div>
          </div>
          <div className="visitors-list-summary-card visitors-list-card-visitors">
            <div className="visitors-list-card-icon visitors-list-icon-visitors">
              <FaUserCheck />
            </div>
            <div className="visitors-list-card-content">
              <span className="visitors-list-card-value">{visitorsCount}</span>
              <span className="visitors-list-card-label">Visitors</span>
            </div>
          </div>
          <div className="visitors-list-summary-card visitors-list-card-calls">
            <div className="visitors-list-card-icon visitors-list-icon-calls">
              <FaPhone />
            </div>
            <div className="visitors-list-card-content">
              <span className="visitors-list-card-value">{callsCount}</span>
              <span className="visitors-list-card-label">Calls</span>
            </div>
          </div>
          <div className="visitors-list-summary-card visitors-list-card-whatsapp">
            <div className="visitors-list-card-icon visitors-list-icon-whatsapp">
              <FaWhatsapp />
            </div>
            <div className="visitors-list-card-content">
              <span className="visitors-list-card-value">{whatsappCount}</span>
              <span className="visitors-list-card-label">WhatsApp</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="visitors-list-main-content">
          <div className="visitors-list-page-header">
            <h3>Visitors / Calls / WhatsApp</h3>
            <div className="visitors-list-header-actions">
              <div className="visitors-list-search-filter-container">
                <input
                  type="text"
                  placeholder="Search visitors, organizations, purposes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="visitors-list-search-input"
                />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="visitors-list-type-filter"
                >
                  <option value="all">All Types</option>
                  <option value="visitor">Visitors</option>
                  <option value="call">Calls</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('all');
                  }}
                  className="visitors-list-clear-btn"
                  title="Clear filters"
                >
                  {/* <FaTimes /> */}
                  &nbsp;Clear
                </button>
              </div>
              <button onClick={() => setShowAddModal(true)} className="visitors-list-btn-primary">
                <FaPlus />
                &nbsp;Log Visitor / Call
              </button>
              <button onClick={() => navigate('/ceo-office/dashboard')} className="note-view-btn note-view-btn-secondary">
                Back
              </button>
            </div>
          </div>

          <div className="visitors-list-table-wrapper">
            <div className="visitors-list-table-container">
              <table className="visitors-list-data-table">
                <thead>
                  <tr>
                    <th>TYPE</th>
                    <th>VISITOR / CONTACT</th>
                    <th>ORGANIZATION</th>
                    <th>PURPOSE</th>
                    <th>DATE & TIME</th>
                    <th>STATUS</th>
                    <th>RELATED NOTE</th>
                    <th>RELATED TASK</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.map((visitor) => (
                    <tr key={visitor.id} className="visitors-list-table-row">
                      <td>
                        <div className={`visitors-list-type-badge visitors-list-type-${(visitor.type || 'visitor').toLowerCase()}`}>
                          {visitor.type?.toLowerCase() === 'call' && <FaPhone />}
                          {visitor.type?.toLowerCase() === 'whatsapp' && <FaWhatsapp />}
                          {visitor.type?.toLowerCase() !== 'call' && visitor.type?.toLowerCase() !== 'whatsapp' && <FaUserCheck />}
                          &nbsp;
                          {visitor.type?.toLowerCase() === 'visitor' ? 'Visitor' :
                            visitor.type?.toLowerCase() === 'call' ? 'Call' : 'WhatsApp'}
                        </div>
                      </td>
                      <td>
                        <div className="visitors-list-visitor-info">
                          <span className="visitors-list-visitor-name">
                            {visitor.visitor_name || visitor.caller_name || visitor.contact_name || '-'}
                          </span>
                        </div>
                      </td>
                      <td>{visitor.visitor_organization || '-'}</td>
                      <td>{visitor.visitor_purpose || visitor.call_purpose || visitor.message_summary || '-'}</td>
                      <td>{new Date(visitor.visit_datetime).toLocaleDateString()}</td>
                      <td>
                        <span
                          className={`visitors-list-status-badge visitors-list-status-badge-${(visitor.status || "Pending")
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {visitor.status || "Pending"}
                        </span>
                      </td>
                      <td>
                        {visitor.related_note_id ? (
                          <Link
                            to={`/ceo-office/notes/${visitor.related_note_id}`}
                            className="visitors-list-related-note"
                          >
                            Note #{visitor.related_note_id}
                          </Link>
                        ) : '-'}
                      </td>
                      <td>
                        {(visitor.related_task_id || visitor.related_note?.related_task_id) ? (
                            <Link
                                to={`/tasks/view/${visitor.related_task_id || visitor.related_note?.related_task_id}`}
                                className="visitors-list-related-note"
                            >
                                Task #{visitor.related_task_id || visitor.related_note?.related_task_id}
                            </Link>
                        ) : '-'}
                    </td>
                    <td>
                        <div className="visitors-list-actions-group">
                            {visitor.related_note_id ? (
                                <Link
                                    to={`/ceo-office/notes/${visitor.related_note_id}`}
                                    className="visitors-list-action-btn visitors-list-action-view"
                                    title="View Note"
                                >
                                    <FaEye color="#007bff" />
                                </Link>
                            ) : (
                                <Link
                                    to={`/ceo-office/visitors/${visitor.id}`}
                                    className="visitors-list-action-btn visitors-list-action-view"
                                    title="View"
                                >
                                    <FaEye color="#007bff" />
                                </Link>
                            )}
                            <button
                                onClick={() => openConvertModal(visitor)}
                                className="visitors-list-action-btn visitors-list-action-convert"
                                disabled={visitor.related_task_id || visitor.related_note?.related_task_id}
                                title={(visitor.related_task_id || visitor.related_note?.related_task_id) ? "Already converted" : "Convert to Task"}
                            >
                                <FaSyncAlt color={(visitor.related_task_id || visitor.related_note?.related_task_id) ? "#6c757d" : "#20c997"} />
                            </button>
                          <button
                            onClick={() => handleEdit(visitor)}
                            className="visitors-list-action-btn visitors-list-action-edit"
                            title="Edit"
                          >
                            <FaEdit color="#fd7e14" />
                          </button>
                          <button
                            onClick={() => handleDelete(visitor)}
                            className="visitors-list-action-btn visitors-list-action-delete"
                            title="Delete"
                          >
                            <FaTrash color="#dc3545" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="visitors-list-table-footer">
                <span className="visitors-list-showing-text">
                  Showing {filteredVisitors.length} of {visitors.length} records
                </span>
                <div className="visitors-list-footer-info">
                  <FaListAlt />
                  <span>MTJ Foundation</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Modal */}
        <AddVisitorModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
        />

        {/* Edit Modal */}
        <EditVisitorModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdate}
        />

        {/* Convert to Task Modal */}
        <ConvertToTaskModal
          isOpen={convertModalOpen}
          onClose={() => setConvertModalOpen(false)}
          convertData={convertData}
          setConvertData={setConvertData}
          onConvert={handleConvertToTask}
        />
      </div>
    </>
  );
};

export default VisitorsList;
