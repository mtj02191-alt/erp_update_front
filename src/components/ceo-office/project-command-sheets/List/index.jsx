import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import SheetCard from '../SheetCard';
import ConvertToTaskModal from '../../ConvertToTaskModal';
import './index.css';


const ProjectCommandSheets = () => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
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
    assigned_users: [],
    mov_items: []
  });
  const [currentConvertSheetId, setCurrentConvertSheetId] = useState(null);
  const [currentConvertActionItemId, setCurrentConvertActionItemId] = useState(null);
  const [isConvertingActionItem, setIsConvertingActionItem] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSheets();
  }, []);

  // Function to convert a CEO note to project command sheet format
  const noteToPcsFormat = (note) => {
    return {
      id: `note-${note.id}`,
      project_name: note.title, // Use note title as project name
      project_details: note.details, // Use note details
      discussions: null,
      decisions: null,
      meeting_notes: null,
      pending_items: [],
      action_items: [],
      next_steps: null,
      results: null,
      start_date: note.date, // Use note date as start date
      end_date: note.due_date, // Use due date as end date
      status: note.status || 'Pending',
      related_note_id: note.id,
      related_task_id: note.related_task_id,
      is_ceo_note: true,
      created_at: note.created_at,
      updated_at: note.updated_at
    };
  };

  const fetchSheets = async () => {
    try {
      setLoading(true);
      // Fetch from project-command-sheets endpoint
      const pcsResponse = await axios.get('/project-command-sheets');
      const sheetsData = pcsResponse.data.data || [];
      // Fetch CEO notes for project_command_sheets category
      const notesResponse = await axios.get('/ceo-notes');
      const notesData = notesResponse.data.data || [];
      const filteredNotes = notesData.filter(note =>
        note.category === 'project_command_sheets'
      );
      // Convert to project command sheet format
      const noteRecords = filteredNotes.map(noteToPcsFormat);
      // Combine
      const combinedData = [...sheetsData, ...noteRecords];
      console.log('Fetched combined data:', combinedData);
      setSheets(combinedData);
    } catch (error) {
      console.error('Error fetching project command sheets:', error);
      toast.error('Failed to load project command sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/project-command-sheets', {
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
      toast.success('Project command sheet created successfully');
      setShowAddModal(false);
      setFormData({
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
      fetchSheets();
    } catch (error) {
      console.error('Error creating project command sheet:', error);
      toast.error('Failed to create project command sheet');
    }
  };

  const handleConvertToTask = async () => {
    try {
      if (currentConvertSheetId.toString().startsWith('note-')) {
        // Convert a CEO note
        const noteId = currentConvertSheetId.toString().replace('note-', '');
        await axios.post(`/ceo-notes/${noteId}/convert-to-task`, convertData);
        toast.success('Note converted to task successfully');
      } else {
        if (isConvertingActionItem) {
          await axios.post(`/project-command-sheets/${currentConvertSheetId}/action-items/${currentConvertActionItemId}/convert-to-task`, convertData);
          toast.success('Action item converted to task successfully');
        } else {
          await axios.post(`/project-command-sheets/${currentConvertSheetId}/convert-to-task`, convertData);
          toast.success('Sheet converted to task successfully');
        }
      }
      setConvertModalOpen(false);
      fetchSheets();
    } catch (error) {
      console.error('Error converting to task:', error);
      toast.error('Failed to convert to task');
    }
  };

  const openConvertModalForSheet = (sheet) => {
    setCurrentConvertSheetId(sheet.id);
    setCurrentConvertActionItemId(null);
    setIsConvertingActionItem(false);
    setConvertData({
      task_title: sheet.project_name,
      task_description: `From project command sheet: ${sheet.project_name}`,
      task_department: '',
      task_priority: '',
      task_due_date: '',
      assigned_users: [],
      mov_items: []
    });
    setConvertModalOpen(true);
  };

  const openConvertModal = (sheetId, actionItem, sheetProjectName) => {
    setCurrentConvertSheetId(sheetId);
    setCurrentConvertActionItemId(actionItem.id);
    setIsConvertingActionItem(true);
    setConvertData({
      task_title: actionItem.text,
      task_description: `From project command sheet: ${sheetProjectName}`,
      task_department: '',
      task_priority: '',
      task_due_date: actionItem.due_date ? actionItem.due_date.split('T')[0] : '',
      assigned_users: actionItem.assigned_to_id ? [actionItem.assigned_to_id] : [],
      mov_items: []
    });
    setConvertModalOpen(true);
  };

  const handleEdit = (sheet) => {
    if (sheet.is_ceo_note) {
      navigate(`/ceo-office/notes/${sheet.related_note_id}`, { state: { isEditing: true } });
    }
  };

  const handleDelete = async (sheet) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      if (sheet.is_ceo_note) {
        await axios.delete(`/ceo-notes/${sheet.related_note_id}`);
        toast.success('Note deleted successfully');
      } else {
        await axios.delete(`/project-command-sheets/${sheet.id}`);
        toast.success('Project command sheet deleted successfully');
      }
      fetchSheets();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pcs-loading-container">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pcs-container">
        <div className="pcs-header">
          <h1 className="pcs-title">📋 Project Command Sheets</h1>
          <div className="pcs-header-right">
            <Link to="/ceo-office/quick-note" className="pcs-add-btn">
              <span className="btn-icon">+</span> Quick Note
            </Link>
            <button onClick={() => navigate('/ceo-office/dashboard')} className="note-view-btn note-view-btn-secondary">
              Back
            </button>
          </div>
        </div>

        <div className="pcs-sheets-grid">
          {sheets.length > 0 ? (
            sheets.map((sheet) => (
              <SheetCard
                key={sheet.id}
                sheet={sheet}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onConvert={openConvertModalForSheet}
              />
            ))
          ) : (
            <div className="pcs-empty-state">No project command sheets yet</div>
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

export default ProjectCommandSheets;
