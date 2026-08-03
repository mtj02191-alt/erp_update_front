import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaBuilding, FaClipboard, FaFilter, FaFlag, FaSearch, FaEye, FaSyncAlt, FaEdit, FaTrash,
  FaCalendarCheck, FaHistory, FaPhoneAlt, FaWhatsappSquare, FaUserFriends, FaHandshake,
  FaExclamationTriangle, FaLightbulb, FaHourglassHalf, FaProjectDiagram,
  FaCheckDouble, 
  FaEnvelope,
  FaArrowUp,
  FaRedo,
  FaPrint,
  FaCheck,
  FaTimes,
  FaLock
} from 'react-icons/fa';          
import { toast } from 'react-toastify';
import axios from '../../../utils/axios';
import Navbar from '../../Navbar';
import ConvertToTaskModal from '../ConvertToTaskModal';
import EmptyState from '../common/EmptyState';
import './index.css';

const InstructionRegister = () => {
  const navigate = useNavigate();
  const [allNotes, setAllNotes] = useState([]); // Store all notes
  const [allUsers, setAllUsers] = useState([]); // Store all users
  const [usersMap, setUsersMap] = useState(new Map()); // Map user ID to user
  const [notes, setNotes] = useState([]); // Filtered notes to display
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, pending: 0, critical: 0 });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({
    category: '',
    department: '',
    status: '',
    priority: '',
    search: '',
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
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
  const [currentConvertNoteId, setCurrentConvertNoteId] = useState(null);
  const [currentConvertVisitorId, setCurrentConvertVisitorId] = useState(null);
  const [currentConvertProjectSheetId, setCurrentConvertProjectSheetId] = useState(null);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Fetch notes from server whenever filters or pagination change
  useEffect(() => {
    fetchAllNotes();
  }, [filters.category, filters.department, filters.status, filters.priority, filters.search, pagination.page, pagination.pageSize]);

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('/users/options');
      const users = response.data.data || response.data || [];
      setAllUsers(users);
      
      // Create a map from user ID to user object
      const map = new Map();
      users.forEach(user => {
        if (user.id) {
          map.set(user.id, user);
        }
      });
      setUsersMap(map);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAllNotes = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortOrder: 'DESC',
      };
      if (filters.category) params.category = filters.category;
      if (filters.department) params.department = filters.department;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const response = await axios.get('/ceo-notes/instruction-register', { params });
      const records = response.data.data || [];

      // Normalize records to a common format for display
      const normalized = records.map(record => {
        const item = record.item || record;
        const type = record.type || 'note';
        
        if (type === 'note') {
          return { ...item, source: 'ceo-note', id: item.id };
        }
        if (type === 'visitor') {
          return {
            ...item,
            id: item.id,
            source: 'visitor-record',
            category: 'visitors',
            title: item.visitor_name || 'Visitor Record',
            details: item.purpose || '',
            status: item.status || 'pending',
            date: item.visit_datetime || item.created_at,
          };
        }
        if (type === 'call') {
          return {
            ...item,
            id: item.id,
            source: 'visitor-record',
            category: 'calls',
            title: item.caller_name || 'Call Record',
            details: item.call_purpose || '',
            status: item.status || 'pending',
            date: item.visit_datetime || item.created_at,
          };
        }
        if (type === 'whatsapp') {
          return {
            ...item,
            id: item.id,
            source: 'visitor-record',
            category: 'whatsapp',
            title: item.contact_name || 'WhatsApp Record',
            details: item.message_summary || '',
            status: item.status || 'pending',
            date: item.visit_datetime || item.created_at,
          };
        }
        if (type === 'project_command_sheet') {
          return {
            ...item,
            id: item.id,
            source: 'project-command-sheet',
            category: 'project_command_sheets',
            title: item.project_name || 'Project Sheet',
            details: item.project_details || '',
            status: item.status || 'pending',
            date: item.created_at,
          };
        }
        return { ...item, source: type, id: item.id };
      });

      setNotes(normalized);

      // Update pagination from server response
      const serverPagination = response.data.pagination || {};
      setPagination(prev => ({
        ...prev,
        total: serverPagination.total || normalized.length,
      }));

      // Update stats from counts
      const counts = response.data.counts || {};
      setStats({
        total: serverPagination.total || normalized.length,
        completed: 0,
        inProgress: 0,
        pending: 0,
        critical: 0,
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load instructions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPagination({ ...pagination, page: 1 });
  };

  const handleResetFilters = () => {
    setFilters({
      category: '',
      department: '',
      status: '',
      priority: '',
      search: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  const refreshInstructions = async () => {
    try {
      setRefreshing(true);
      await fetchAllNotes();
    } finally {
      setRefreshing(false);
    }
  };

  const handleConvertToTask = async () => {
    try {
      if (currentConvertVisitorId) {
        await axios.post(`/visitors/${currentConvertVisitorId}/convert-to-task`, convertData);
        toast.success('Record converted to task successfully');
      } else if (currentConvertProjectSheetId) {
        await axios.post(`/project-command-sheets/${currentConvertProjectSheetId}/convert-to-task`, convertData);
        toast.success('Project command sheet converted to task successfully');
      } else {
        await axios.post(`/ceo-notes/${currentConvertNoteId}/convert-to-task`, convertData);
        toast.success('Note converted to task successfully');
      }
      setConvertModalOpen(false);
      await fetchAllNotes();
    } catch (error) {
      console.error('Error converting:', error);
      toast.error('Failed to convert');
    }
  };

  const openConvertModal = (note) => {
    if (note.source === 'visitor-record') {
      setCurrentConvertVisitorId(note.id);
      const name = note.visitor_name || note.caller_name || note.contact_name || 'Contact';
      const purpose = note.purpose || note.call_purpose || note.message_summary || 'N/A';
      setConvertData({
        task_title: `Follow up with ${name}`,
        task_description: `Purpose: ${purpose}\nOrganization: ${note.organization || 'N/A'}\nRemarks: ${note.remarks || 'N/A'}`,
        task_department: note.department || '',
        task_priority: note.priority || '',
        task_due_date: note.due_date ? note.due_date.split('T')[0] : '',
        assigned_users: [],
        mov_items: []
      });
      setCurrentConvertNoteId(null);
    } else if (note.source === 'project-command-sheet') {
      setCurrentConvertNoteId(null);
      setCurrentConvertVisitorId(null);
      setConvertData({
        task_title: note.title,
        task_description: note.details,
        task_department: 'executive_office',
        task_priority: note.priority,
        task_due_date: note.due_date ? new Date(note.due_date).toISOString().split('T')[0] : '',
        assigned_users: note.assigned_user_ids || [],
        mov_items: []
      });
      // We'll need to track this is a project sheet, so let's add a new state variable
      setCurrentConvertProjectSheetId(note.id);
    } else {
      setCurrentConvertNoteId(note.id);
      setCurrentConvertVisitorId(null);
      setCurrentConvertProjectSheetId(null);
      setConvertData({
        task_title: note.title,
        task_description: note.details,
        task_department: note.department || 'executive_office',
        task_priority: note.priority,
        task_due_date: note.due_date ? note.due_date.split('T')[0] : '',
        assigned_users: note.assigned_user_ids?.length > 0 
          ? note.assigned_user_ids 
          : note.assigned_users?.length > 0
            ? note.assigned_users.map(u => u.id)
            : [],
        mov_items: []
      });
    }
    setConvertModalOpen(true);
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await axios.delete(`/ceo-notes/${noteId}`);
      toast.success('Note deleted successfully');
      await fetchAllNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };
  
  const handleVisitorDelete = async (visitorId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await axios.delete(`/visitors/${visitorId}`);
      toast.success('Record deleted successfully');
      await fetchAllNotes();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }
  };

  const handleProjectSheetDelete = async (sheetId) => {
    if (!window.confirm('Are you sure you want to delete this project command sheet?')) return;
    try {
      await axios.delete(`/project-command-sheets/${sheetId}`);
      toast.success('Project command sheet deleted successfully');
      await fetchAllNotes();
    } catch (error) {
      console.error('Error deleting project command sheet:', error);
      toast.error('Failed to delete project command sheet');
    }
  };

  const handleApprove = async (noteId) => {
    if (!window.confirm('Approve this note?')) return;
    try {
      await axios.post(`/ceo-notes/${noteId}/approve`, { decision: 'approved', remarks: 'Approved from Instruction Register' });
      toast.success('Note approved successfully');
      await fetchAllNotes();
    } catch (error) {
      console.error('Error approving note:', error);
      toast.error('Failed to approve note');
    }
  };

  const handleClose = async (noteId) => {
    if (!window.confirm('Close this note?')) return;
    try {
      await axios.patch(`/ceo-notes/${noteId}`, { status: 'closed' });
      toast.success('Note closed successfully');
      await fetchAllNotes();
    } catch (error) {
      console.error('Error closing note:', error);
      toast.error('Failed to close note');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'top_priority', label: 'Top Priority' },
    { value: 'today_task', label: 'Today Task' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'calls', label: 'Calls' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'visitors', label: 'Visitors' },
    { value: 'meetings', label: 'Meetings' },
    { value: 'ceo_direct_orders', label: 'CEO Direct Orders' },
    { value: 'important_decisions', label: 'Important Decisions' },
    { value: 'emails_and_approvals', label: 'Emails & Approvals' },
    { value: 'waiting_response', label: 'Waiting Response' },
    { value: 'project_notes', label: 'Project Notes' },
    { value: 'project_command_sheets', label: 'Project Command Sheets' },
    { value: 'completed', label: 'Completed' },
  ];

  const statuses = [
    { value: '', label: 'All Status' },
    { value: 'unprocessed', label: 'Unprocessed' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting_response', label: 'Waiting Response' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' },
    { value: 'closed', label: 'Closed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const priorities = [
    { value: '', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const departments = [
    { value: '', label: 'All Departments' },
    "admin",
    "store",
    "procurements",
    "accounts_and_finance",
    "program",
    "it",
    "hr",
    "marketing",
    "audio_video",
    "fund_raising",
    "meal",
    "health",
    "executive_office",
    "ceo",
    "internal_audit",
    "crd",
    "aas_lab"
  ].map(dept => (
    typeof dept === 'string'
      ? { value: dept, label: dept.replace('_', ' ') }
      : dept
  ));

  // Helper to get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      top_priority: <FaArrowUp color="#dc3545" />,
      today_task: <FaCalendarCheck color="#17a2b8" />,
      follow_up: <FaHistory color="#6c757d" />,
      calls: <FaPhoneAlt color="#28a745" />,
      whatsapp: <FaWhatsappSquare color="#25d366" />,
      visitors: <FaUserFriends color="#6610f2" />,
      meetings: <FaHandshake color="#e83e8c" />,
      ceo_direct_orders: <FaExclamationTriangle color="#ffc107" />,
      important_decisions: <FaLightbulb color="#fd7e14" />,
      emails_and_approvals: <FaEnvelope color="#007bff" />,
      waiting_response: <FaHourglassHalf color="#6f42c1" />,
      project_notes: <FaProjectDiagram color="#20c997" />,
      project_command_sheets: <FaProjectDiagram color="#007bff" />,
      completed: <FaCheckDouble color="#28a745" />
    };
    return icons[category] || <FaClipboard color="#6c757d" />;
  };

  const isOverdue = (note) => {
    if (!note.due_date) return false;
    const dueDate = new Date(note.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today && !['completed', 'closed', 'cancelled'].includes(note.status);
  };

  const getAssignedUserNames = (note) => {
    // Collect all unique user objects and ids
    const userMap = new Map(); // Map id (number) to user object
    
    // Helper to normalize id to number
    const normalizeId = (id) => {
      const num = Number(id);
      return isNaN(num) ? null : num;
    };
    
    // 1. From assigned_users relation (array of user objects)
    if (note.assigned_users && Array.isArray(note.assigned_users)) {
      note.assigned_users.forEach(user => {
        const normalizedId = normalizeId(user.id);
        if (normalizedId && !userMap.has(normalizedId)) {
          userMap.set(normalizedId, user);
        }
      });
    }
    
    // 2. From assigned_user_ids array
    if (note.assigned_user_ids && Array.isArray(note.assigned_user_ids)) {
      note.assigned_user_ids.forEach(id => {
        const normalizedId = normalizeId(id);
        if (normalizedId && !userMap.has(normalizedId)) {
          userMap.set(normalizedId, null);
        }
      });
    }
    
    // If no users found
    if (userMap.size === 0) {
      return '-';
    }
    
    // Get user names
    const names = [];
    userMap.forEach((user, id) => {
      let finalUser = user;
      
      // If we don't have the user object, look it up in usersMap
      if (!finalUser) {
        finalUser = usersMap.get(id) || usersMap.get(String(id)) || usersMap.get(Number(id));
      }
      
      if (finalUser) {
        const firstName = finalUser.first_name || finalUser.firstName || '';
        const lastName = finalUser.last_name || finalUser.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) {
          names.push(fullName);
        } else if (finalUser.email) {
          names.push(finalUser.email);
        } else {
          names.push(`User ${id}`);
        }
      } else {
        names.push(`User ${id}`);
      }
    });
    
    return names.join(', ');
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= pagination.page - 1 && i <= pagination.page + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <>
      <Navbar />
      <div className="instruction-register">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Instruction Register</h2>
        </div>
        <div className="instruction-page-header-right">
        {/* <button onClick={handlePrint} className="instruction-btn btn-print" title="Print Register">
          <FaPrint /> Print
        </button> */}
        <Link to="/ceo-office/reports" className="instruction-btn btn-reports" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <FaClipboard /> Reports
        </Link>
        <Link to="/ceo-office/quick-note" className="add-instruction-btn">
          <span className="btn-icon">+</span> Quick Note
        </Link>
        <button onClick={() => navigate('/ceo-office/dashboard')} className="note-view-btn note-view-btn-secondary">
            Back
          </button>
        </div>
      </div>

      <div className="instruction-toolbar">
        <div className="instruction-toolbar-meta">
          <span className="instruction-summary-pill">
            {stats.total} visible {stats.total === 1 ? 'item' : 'items'}
          </span>
          <span className={`instruction-summary-pill ${hasActiveFilters ? 'active' : 'neutral'}`}>
            {hasActiveFilters ? `${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}` : 'All filters cleared'}
          </span>
          {lastUpdated && (
            <span className="instruction-summary-pill secondary">
              Updated {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </div>
        <button type="button" className="instruction-refresh-btn" onClick={refreshInstructions} disabled={refreshing}>
          <FaRedo className={refreshing ? 'instruction-refresh-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="instruction-stats-grid">
        <div className="instruction-stat-card total">
          <div className="instruction-stat-icon">📝</div>
          <div className="instruction-stat-content">
            <div className="instruction-stat-value">{stats.total}</div>
            <div className="instruction-stat-label">Total Instructions</div>
          </div>
        </div>
        <div className="instruction-stat-card completed">
          <div className="instruction-stat-icon">✅</div>
          <div className="instruction-stat-content">
            <div className="instruction-stat-value">{stats.completed}</div>
            <div className="instruction-stat-label">Completed</div>
          </div>
        </div>
        <div className="instruction-stat-card in-progress">
          <div className="instruction-stat-icon">⏰</div>
          <div className="instruction-stat-content">
            <div className="instruction-stat-value">{stats.inProgress}</div>
            <div className="instruction-stat-label">In Progress</div>
          </div>
        </div>
        <div className="instruction-stat-card pending">
          <div className="instruction-stat-icon">⏳</div>
          <div className="instruction-stat-content">
            <div className="instruction-stat-value">{stats.pending}</div>
            <div className="instruction-stat-label">Pending</div>
          </div>
        </div>
        <div className="instruction-stat-card critical">
          <div className="instruction-stat-icon">⚠️</div>
          <div className="instruction-stat-content">
            <div className="instruction-stat-value">{stats.critical}</div>
            <div className="instruction-stat-label">Critical</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="instruction-filters-bar">
        <div className="filter-group search">
          <div className="filter-instruction">
            <FaSearch className="instruction-filter-icon" />
            <input
              type="text"
              name="search"
              placeholder="Search instructions..."
              value={filters.search}
              onChange={handleFilterChange}
              className="instruction-control"
            />
          </div>
        </div>
        <div className="filter-group">
          <div className="filter-instruction">
            <FaClipboard className="instruction-filter-icon" />
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="instruction-control"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-group">
          <div className="filter-instruction">
            <FaBuilding className="instruction-filter-icon" />
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className="instruction-control"
            >
              {departments.map(dept => (
                <option key={dept.value} value={dept.value}>{dept.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-group">
          <div className="filter-instruction">
            <FaFilter className="instruction-filter-icon" />
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="instruction-control"
            >
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-group">
          <div className="filter-instruction">
            <FaFlag className="instruction-filter-icon" />
            <select
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className="instruction-control"
            >
              {priorities.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={handleResetFilters} className="instruction-btn btn-reset">
          <span className="instruction-btn-icon">↻</span> Reset
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">Loading...</div>
        ) : (
          <table className="notes-table">
            <thead>
              <tr>
                <th>#</th>
                {/* <th>Date</th> */}
                <th>Title</th>
                <th>Category</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Due Date</th>
                <th>Related Task</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.length > 0 ? (
                notes.map((note, index) => (
                  <tr key={note.id} className={isOverdue(note) ? 'overdue' : ''}>
                    <td>{((pagination.page - 1) * pagination.pageSize) + index + 1}</td>
                    {/* <td>{note.date ? new Date(note.date).toLocaleDateString() : '-'}</td> */}
                    <td>
                      <span className="instruction-td-title">{note.title}</span>
                    </td>
                    <td>
                      <div className="category-cell">
                        <span className="category-icon">{getCategoryIcon(note.category)}</span>
                        <span className="category-name">{note.category?.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td>{note.department?.replace('_', ' ')}</td>
                    <td>
                      <span className={`priority-badge-instruction priority-badge-instruction-${note.priority}`}>
                        {note.priority?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`instruction-list-status-badge instruction-list-status-badge-${note.status}`}>
                        {note.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        const names = getAssignedUserNames(note);
                        // For styling, split into badges if multiple
                        if (names === '-') {
                          return '-';
                        }
                        const nameArray = names.split(', ');
                        return (
                          <div className="assigned-users-container">
                            {nameArray.map((name, idx) => (
                              <span key={idx} className="assigned-badge-instruction">
                                {name}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </td>
                    <td>{note.due_date ? new Date(note.due_date).toLocaleDateString() : '-'}</td>
                    <td>
                      {note.related_task_id ? (
                        <Link
                          to={`/tasks/view/${note.related_task_id}`}
                          className="visitors-list-related-note"
                        >
                          Task #{note.related_task_id}
                        </Link>
                      ) : '-'}
                    </td>
                    <td>
                      <div className="instruction-actions">
                        <Link 
                          to={
                            note.source === 'visitor-record' 
                              ? `/ceo-office/visitors/${note.id}` 
                              : note.source === 'project-command-sheet' 
                                ? `/ceo-office/project-command-sheets/${note.id}` 
                                : `/ceo-office/notes/${note.id}`
                          } 
                          className="instruction-action-btn btn-view" 
                          title="View"
                        >
                          <FaEye color="#007bff" />
                        </Link>
                        <Link 
                          to={
                            note.source === 'visitor-record' 
                              ? `/ceo-office/visitors/${note.id}` 
                              : note.source === 'project-command-sheet' 
                                ? `/ceo-office/project-command-sheets/${note.id}` 
                                : `/ceo-office/notes/${note.id}`
                          } 
                          state={
                            note.source === 'visitor-record' || note.source === 'project-command-sheet' 
                              ? {} 
                              : { isEditing: true }
                          } 
                          className="instruction-action-btn btn-edit" 
                          title="Edit"
                        >
                          <FaEdit color="#fd7e14" />
                        </Link>
                        <button
                          onClick={() => openConvertModal(note)}
                          className="instruction-action-btn btn-convert"
                          disabled={note.related_task_id}
                          title={note.related_task_id ? 'Already converted' : 'Convert to Task'}
                        >
                          <FaSyncAlt color={note.related_task_id ? "#6c757d" : "#20c997"} />
                        </button>
                        {note.source === 'ceo-note' && !['completed', 'closed', 'cancelled', 'approved', 'rejected'].includes(note.status) && (
                          <button
                            onClick={() => handleApprove(note.id)}
                            className="instruction-action-btn btn-approve"
                            title="Approve"
                          >
                            <FaCheck color="#28a745" />
                          </button>
                        )}
                        {note.source === 'ceo-note' && !['completed', 'closed', 'cancelled'].includes(note.status) && (
                          <button
                            onClick={() => handleClose(note.id)}
                            className="instruction-action-btn btn-close"
                            title="Close"
                          >
                            <FaLock color="#6c757d" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (note.source === 'visitor-record') {
                              handleVisitorDelete(note.id);
                            } else if (note.source === 'project-command-sheet') {
                              handleProjectSheetDelete(note.id);
                            } else {
                              handleDelete(note.id);
                            }
                          }}
                          className="instruction-action-btn btn-delete"
                          title="Delete"
                        >
                          <FaTrash color="#dc3545" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11">
                    <EmptyState
                      title="No instructions match these filters"
                      message="Try clearing a filter or adding a fresh note from the quick note form."
                      actionLabel="Create quick note"
                      actionHref="/ceo-office/quick-note"
                      compact
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="instruction-pagination-wrapper">
        <div className="instruction-pagination-info">
          Showing {(pagination.page - 1) * pagination.pageSize + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} entries
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <select className="form-control-instruction" style={{ width: '85px', fontSize: '12px' }} value={pagination.pageSize} onChange={(e) => setPagination(p => ({ ...p, pageSize: Number(e.target.value), page: 1 }))}>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={30}>30 / page</option>
              <option value={40}>40 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
              className="btn btn-sm btn-secondary"
            >
              «
            </button>
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
              className="btn btn-sm btn-secondary"
            >
              ‹
            </button>
            {getPageNumbers().map((page, idx) => (
              page === '...' ? (
                <span key={`dots-${idx}`} className="page-dots">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setPagination(p => ({ ...p, page }))}
                  className={`btn btn-sm ${pagination.page === page ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {page}
                </button>
              )
            ))}
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= totalPages}
              className="btn btn-sm btn-secondary"
            >
              ›
            </button>
            <button
              onClick={() => setPagination(p => ({ ...p, page: totalPages }))}
              disabled={pagination.page >= totalPages}
              className="btn btn-sm btn-secondary"
            >
              »
            </button>
          </div>
        )}
      </div>

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

export default InstructionRegister;
