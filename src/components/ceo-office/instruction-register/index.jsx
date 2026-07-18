import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaBuilding, FaClipboard, FaFilter, FaFlag, FaSearch, FaEye, FaSyncAlt, FaEdit, FaTrash,
  FaCalendarCheck, FaHistory, FaPhoneAlt, FaWhatsappSquare, FaUserFriends, FaHandshake,
  FaExclamationTriangle, FaLightbulb, FaHourglassHalf, FaProjectDiagram,
  FaCheckDouble, 
  FaEnvelope,
  FaArrowUp
} from 'react-icons/fa';          
import { toast } from 'react-toastify';
import axios from '../../../utils/axios';
import Navbar from '../../Navbar';
import ConvertToTaskModal from '../ConvertToTaskModal';
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
    Promise.all([fetchAllNotes(), fetchAllUsers()]);
  }, []);

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('/users/options');
      const users = response.data.data || response.data || [];
      console.log('All users from options endpoint:', users);
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
      // Fetch ceo-notes, visitors, AND project command sheets
      const [notesResponse, visitorsResponse, projectSheetsResponse] = await Promise.all([
        axios.get('/ceo-notes', { params: { pageSize: 1000 } }),
        axios.get('/visitors', { params: { pageSize: 1000 } }),
        axios.get('/project-command-sheets', { params: { pageSize: 1000 } }),
      ]);
      const notes = notesResponse.data.data || [];
      const visitorsRecords = visitorsResponse.data.data || [];
      const projectSheets = projectSheetsResponse.data.data || [];
      
      // Combine notes and visitors records, avoiding duplicates
      const noteIds = new Set(notes.map(note => note.id));
      const filteredVisitorRecords = visitorsRecords.filter(
        record => !record.related_note_id || !noteIds.has(record.related_note_id)
      );

      // Convert visitor records to note-like objects for display
      const convertedVisitorRecords = filteredVisitorRecords.map(record => {
        const category = record.type === 'call' ? 'calls' : record.type === 'whatsapp' ? 'whatsapp' : 'visitors';
        let title;
        if (record.type === 'call') {
          title = record.caller_name || record.title || 'Call Record';
        } else if (record.type === 'whatsapp') {
          title = record.contact_name || record.title || 'WhatsApp Record';
        } else {
          title = record.visitor_name || record.title || 'Visitor Record';
        }
        return {
          ...record,
          id: record.id,
          source: 'visitor-record',
          category: category,
          title: title,
          details: record.purpose || record.call_purpose || record.message_summary || '',
          department: record.department || null,
          priority: 'medium',
          status: record.status || 'pending',
          due_date: record.follow_up_date || null,
          date: record.visit_datetime || new Date().toISOString(),
          related_task_id: record.related_task_id || null,
        };
      });

      // Convert project command sheets to note-like objects
      const convertedProjectSheets = projectSheets.map(sheet => ({
        ...sheet,
        id: sheet.id,
        source: 'project-command-sheet',
        category: 'project_command_sheets',
        title: sheet.project_name,
        details: sheet.project_details || sheet.meeting_notes || sheet.next_steps || '',
        department: null, // We can leave this null for now or add later if needed
        priority: 'medium', // Default priority for project sheets
        status: sheet.status || 'pending',
        due_date: sheet.end_date || null,
        date: sheet.created_at || new Date().toISOString(),
        related_task_id: sheet.related_task_id || null,
        assigned_user_ids: sheet.assigned_user_ids || [],
        assigned_users: sheet.assigned_users || []
      }));

      const combinedData = [...notes, ...convertedVisitorRecords, ...convertedProjectSheets];
      // Sort by date descending
      combinedData.sort((a, b) => {
        const dateA = new Date(a.date || a.visit_datetime || a.created_at);
        const dateB = new Date(b.date || b.visit_datetime || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });
      console.log('Combined data:', combinedData);
      setAllNotes(combinedData);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load instructions');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever they change
  useEffect(() => {
    if (allNotes.length > 0) {
      applyFilters();
    }
  }, [allNotes, filters, pagination.page, pagination.pageSize]);

  const applyFilters = () => {
    let filtered = [...allNotes];
    
    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(note => note.category === filters.category);
    }
    
    // Apply department filter
    if (filters.department) {
      filtered = filtered.filter(note => note.department === filters.department);
    }
    
    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(note => note.status === filters.status);
    }
    
    // Apply priority filter
    if (filters.priority) {
      filtered = filtered.filter(note => note.priority === filters.priority);
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(note => {
        const assignedUserNames = [
            ...(note.assigned_users?.map(u => `${u.first_name} ${u.last_name}`) || [])
          ].join(' ').toLowerCase();
        return (
          note.title.toLowerCase().includes(searchLower) ||
          note.department?.replace('_', ' ').toLowerCase().includes(searchLower) ||
          note.category?.replace('_', ' ').toLowerCase().includes(searchLower) ||
          assignedUserNames.includes(searchLower)
        );
      });
    }
    
    // Update statistics based on filtered data
    const completed = filtered.filter(n => n.status === 'completed' || n.status === 'closed').length;
    const inProgress = filtered.filter(n => n.status === 'in_progress').length;
    const pending = filtered.filter(n => n.status === 'pending').length;
    const critical = filtered.filter(n => n.priority === 'critical').length;
    setStats({ 
      total: filtered.length, 
      completed, 
      inProgress, 
      pending, 
      critical 
    });
    
    // Update pagination total
    setPagination(p => ({ ...p, total: filtered.length }));
    
    // Paginate the results
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    const paginated = filtered.slice(start, end);
    
    setNotes(paginated);
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
    console.log('=== getAssignedUserNames ===');
    console.log('note:', note);
    console.log('usersMap:', usersMap);
    
    // Collect all unique user objects and ids
    const userMap = new Map(); // Map id (number) to user object
    
    // Helper to normalize id to number
    const normalizeId = (id) => {
      const num = Number(id);
      return isNaN(num) ? null : num;
    };
    
    // 1. From assigned_users relation (array of user objects)
    if (note.assigned_users && Array.isArray(note.assigned_users)) {
      console.log('note.assigned_users:', note.assigned_users);
      note.assigned_users.forEach(user => {
        const normalizedId = normalizeId(user.id);
        if (normalizedId && !userMap.has(normalizedId)) {
          userMap.set(normalizedId, user);
        }
      });
    }
    
    // 2. From assigned_user_ids array
    if (note.assigned_user_ids && Array.isArray(note.assigned_user_ids)) {
      console.log('note.assigned_user_ids:', note.assigned_user_ids);
      note.assigned_user_ids.forEach(id => {
        const normalizedId = normalizeId(id);
        if (normalizedId && !userMap.has(normalizedId)) {
          userMap.set(normalizedId, null);
        }
      });
    }
    
    console.log('userMap entries:', [...userMap.entries()]);
    
    // If no users found
    if (userMap.size === 0) {
      console.log('No users found, returning -');
      return '-';
    }
    
    // Get user names
    const names = [];
    userMap.forEach((user, id) => {
      console.log('Processing id:', id, 'user:', user);
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
    
    console.log('names array:', names, 'joined:', names.join(', '));
    return names.join(', ');
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
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
        {/* <button onClick={() => window.print()} className="btn btn-info">
          Print
        </button> */}
        <Link to="/ceo-office/quick-note" className="add-instruction-btn">
          <span className="btn-icon">+</span> Quick Note
        </Link>
        <button onClick={() => navigate('/ceo-office/dashboard')} className="note-view-btn note-view-btn-secondary">
            Back
          </button>
        </div>
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
                  <td colSpan="11" className="empty-state">No notes found</td>
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
