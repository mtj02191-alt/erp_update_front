import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import ConvertToTaskModal from '../../ConvertToTaskModal';
import EditSheetModal from '../EditSheetModal';
import './index.css';

const ProjectCommandSheetView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [usersMap, setUsersMap] = useState(new Map());
  const [formData, setFormData] = useState({
    projectName: '',
    projectDetails: '',
    discussions: '',
    decisions: '',
    meetingNotes: '',
    pendingItems: [],
    actionItems: [],
    nextSteps: '',
    results: '',
    startDate: '',
    endDate: '',
    status: 'Pending'
  });
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertData, setConvertData] = useState({
    task_title: '',
    task_description: '',
    task_department: '',
    task_priority: '',
    task_due_date: '',
    assigned_users: []
  });
  const [currentConvertActionItemId, setCurrentConvertActionItemId] = useState(null);
  const [isConvertingActionItem, setIsConvertingActionItem] = useState(false);

  // Helper function to normalize id to number
  const normalizeId = (id) => {
    const num = Number(id);
    return isNaN(num) ? null : num;
  };

  const getAssignedUserName = (assignedToId) => {
    if (!assignedToId) return null;
    const normalizedId = normalizeId(assignedToId);
    const user = usersMap.get(normalizedId) || usersMap.get(String(normalizedId));
    if (!user) return null;
    const firstName = user.first_name || user.firstName || '';
    const lastName = user.last_name || user.lastName || '';
    return `${firstName} ${lastName}`.trim() || user.email || `User ${normalizedId}`;
  };

  useEffect(() => {
    if (id) {
      Promise.all([fetchSheet(), fetchAllUsers()]);
    }
  }, [id]);

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('/users/options');
      const users = response.data.data || response.data || [];
      setAllUsers(users);

      // Create a map from user ID to user object
      const map = new Map();
      users.forEach(user => {
        if (user.id) {
          const normalizedId = normalizeId(user.id);
          if (normalizedId) {
            map.set(normalizedId, user);
          }
        }
      });
      setUsersMap(map);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSheet = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/project-command-sheets/${id}`);
      setSheet(response.data);
      setFormData({
        projectName: response.data.project_name,
        projectDetails: response.data.project_details,
        discussions: response.data.discussions,
        decisions: response.data.decisions,
        meetingNotes: response.data.meeting_notes,
        pendingItems: response.data.pending_items || [],
        actionItems: response.data.action_items || [],
        nextSteps: response.data.next_steps,
        results: response.data.results,
        startDate: response.data.start_date ? response.data.start_date.split('T')[0] : '',
        endDate: response.data.end_date ? response.data.end_date.split('T')[0] : '',
        status: response.data.status || 'Pending'
      });
    } catch (error) {
      console.error('Error fetching project command sheet:', error);
      toast.error('Failed to load project command sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`/project-command-sheets/${id}`, {
        project_name: formData.projectName,
        project_details: formData.projectDetails,
        discussions: formData.discussions,
        decisions: formData.decisions,
        meeting_notes: formData.meetingNotes,
        pending_items: formData.pendingItems,
        action_items: formData.actionItems,
        next_steps: formData.nextSteps,
        results: formData.results,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        status: formData.status
      });
      toast.success('Project command sheet updated successfully');
      setIsEditing(false);
      fetchSheet();
    } catch (error) {
      console.error('Error updating project command sheet:', error);
      toast.error('Failed to update project command sheet');
    }
  };

  const handleConvertToTask = async () => {
    try {
      if (isConvertingActionItem) {
        await axios.post(`/project-command-sheets/${id}/action-items/${currentConvertActionItemId}/convert-to-task`, convertData);
        toast.success('Action item converted to task successfully');
      } else {
        await axios.post(`/project-command-sheets/${id}/convert-to-task`, convertData);
        toast.success('Sheet converted to task successfully');
      }
      setConvertModalOpen(false);
      fetchSheet();
    } catch (error) {
      console.error('Error converting to task:', error);
      toast.error('Failed to convert to task');
    }
  };

  const openConvertModalForSheet = () => {
    setCurrentConvertActionItemId(null);
    setIsConvertingActionItem(false);
    setConvertData({
      task_title: sheet.project_name,
      task_description: `From project command sheet: ${sheet.project_name}`,
      task_department: '',
      task_priority: '',
      task_due_date: '',
      assigned_users: []
    });
    setConvertModalOpen(true);
  };

  const openConvertModal = (actionItem) => {
    setCurrentConvertActionItemId(actionItem.id);
    setIsConvertingActionItem(true);
    setConvertData({
      task_title: actionItem.text,
      task_description: `From project command sheet: ${sheet.project_name}`,
      task_department: '',
      task_priority: '',
      task_due_date: actionItem.due_date ? actionItem.due_date.split('T')[0] : '',
      assigned_users: actionItem.assigned_to_id ? [actionItem.assigned_to_id] : []
    });
    setConvertModalOpen(true);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project command sheet?')) return;
    try {
      await axios.delete(`/project-command-sheets/${id}`);
      toast.success('Project command sheet deleted successfully');
      navigate('/ceo-office/project-command-sheets');
    } catch (error) {
      console.error('Error deleting project command sheet:', error);
      toast.error('Failed to delete project command sheet');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pcs-view-loading-container">Loading...</div>
      </>
    );
  }

  if (!sheet) {
    return (
      <>
        <Navbar />
        <div className="pcs-view-loading-container">Project command sheet not found</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pcs-view-container">
      <div className="pcs-view-header">
        <h3 className="pcs-view-title"> {sheet.project_name}</h3>
        <div className="pcs-view-header-actions">
          <button onClick={() => navigate('/ceo-office/project-command-sheets')} className="pcs-view-btn pcs-view-btn-secondary">
            Back
          </button>
          {!sheet.related_task_id && (
            <button onClick={openConvertModalForSheet} className="pcs-view-btn pcs-view-btn-info">
              Convert to Task
            </button>
          )}
          <button onClick={() => setIsEditing(!isEditing)} className="pcs-view-btn pcs-view-btn-primary">
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button onClick={handleDelete} className="pcs-view-btn pcs-view-btn-danger">
            Delete
          </button>
        </div>
      </div>

      <div className="pcs-view-details-container">
        <div className="pcs-view-meta-section">
          <div className="pcs-view-meta-item">
            <span className="pcs-view-meta-label">Created On</span>
            <span className="pcs-view-meta-value">{new Date(sheet.created_at).toLocaleString()}</span>
          </div>
          <div className="pcs-view-meta-item">
            <span className="pcs-view-meta-label">Updated On</span>
            <span className="pcs-view-meta-value">{new Date(sheet.updated_at).toLocaleString()}</span>
          </div>
        </div>

        {sheet.related_task_id && (
          <div className="pcs-view-form-group">
            <h4 className="pcs-view-subtitle">Related Task</h4>
            <p className="pcs-view-content-text">
              <a
                href="#"
                className="pcs-view-task-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/tasks/view/${sheet.related_task_id}`);
                }}
              >
                Task #{sheet.related_task_id}
              </a>
            </p>
          </div>
        )}

        {sheet.project_details && (
          <div className="pcs-view-form-group">
            <label className="pcs-view-form-label">Project Details</label>
            <p className="pcs-view-content-text">{sheet.project_details}</p>
          </div>
        )}

        {sheet.discussions && (
          <div className="pcs-view-form-group">
            <label className="pcs-view-form-label">Discussions</label>
            <p className="pcs-view-content-text">{sheet.discussions}</p>
          </div>
        )}

        {sheet.decisions && (
          <div className="pcs-view-form-group">
            <label className="pcs-view-form-label">Decisions</label>
            <p className="pcs-view-content-text">{sheet.decisions}</p>
          </div>
        )}

        {sheet.meeting_notes && (
          <div className="pcs-view-form-group">
            <label className="pcs-view-form-label">Meeting Notes</label>
            <p className="pcs-view-content-text">{sheet.meeting_notes}</p>
          </div>
        )}

        {sheet.pending_items?.length > 0 && (
          <div className="pcs-view-pending-items">
            <h4 className="pcs-view-subtitle">Pending Items</h4>
            <ul className="pcs-view-items-list">
              {sheet.pending_items.map((item, idx) => (
                <li key={idx} className={`pcs-view-item ${item.status === 'completed' ? 'pcs-view-item-completed' : ''}`}>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {sheet.action_items?.length > 0 && (
          <div className="pcs-view-action-items">
            <h4 className="pcs-view-subtitle">Action Items</h4>
            <ul className="pcs-view-items-list">
              {sheet.action_items.map((item) => {
                const assignedUserName = getAssignedUserName(item.assigned_to_id);
                return (
                <li key={item.id} className={`pcs-view-item ${item.status === 'completed' ? 'pcs-view-item-completed' : ''}`}>
                  <span className="pcs-view-item-text">{item.text}</span>
                  <div className="pcs-view-item-meta-section">
                    {assignedUserName && (
                      <span className="pcs-view-item-meta">• Assigned to: {assignedUserName}</span>
                    )}
                    {item.due_date && (
                      <span className="pcs-view-item-meta">• Due: {new Date(item.due_date).toLocaleDateString()}</span>
                    )}
                    {item.related_task_id ? (
                      <span className="pcs-view-item-meta">
                        • Converted to{' '}
                        <a
                          href="#"
                          className="pcs-view-task-link"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/tasks/view/${item.related_task_id}`);
                          }}
                        >
                          Task #{item.related_task_id}
                        </a>
                      </span>
                    ) : (
                      <button
                        onClick={() => openConvertModal(item)}
                        className="pcs-view-btn pcs-view-btn-sm pcs-view-btn-info"
                      >
                        Convert to Task
                      </button>
                      
                    )}
                  </div>
                </li>
              )})}
            </ul>
          </div>
        )}

        {sheet.next_steps && (
          <div className="pcs-view-form-group">
            <label className="pcs-view-form-label">Next Steps</label>
            <p className="pcs-view-content-text">{sheet.next_steps}</p>
          </div>
        )}

        {sheet.results && (
          <div className="pcs-view-form-group">
            <label className="pcs-view-form-label">Results</label>
            <p className="pcs-view-content-text">{sheet.results}</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditSheetModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
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

export default ProjectCommandSheetView;
