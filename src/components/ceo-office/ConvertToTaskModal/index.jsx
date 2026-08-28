import React, { useMemo, useState, useEffect, useRef } from 'react';
import axios from '../../../utils/axios';
import SearchableMultiSelect from '../../common/SearchableMultiSelect';
import FormInput from '../../common/FormInput';
import MovAssignmentPicker from '../../admin/tasks/shared/MovAssignmentPicker';
import './index.css';

const ConvertToTaskModal = ({ 
  isOpen, 
  onClose, 
  convertData, 
  setConvertData, 
  onConvert 
}) => {
  // Local state for user objects and MOV items
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [assignedUserDepartments, setAssignedUserDepartments] = useState({});
  const [movItems, setMovItems] = useState([{ text: '', user_id: null }]);
  const hasInitialized = useRef(false); // To track if we've already initialized assignedUsers

  // Sync local state with convertData when modal first opens
  useEffect(() => {
    const fetchInitialUsers = async () => {
      if (convertData.assigned_users && convertData.assigned_users.length > 0) {
        try {
          // Fetch user details for all initial assigned user IDs at once
          const response = await axios.get('/users/by-ids', {
            params: { ids: convertData.assigned_users }
          });
          let users = response.data || [];
          // Add full_name field if not present (since /users/by-ids doesn't return it like /users/options does)
          users = users.map(u => ({
            ...u,
            full_name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email
          }));
          setAssignedUsers(users);
        } catch (err) {
          console.error('Error fetching initial users:', err);
        }
      } else {
        setAssignedUsers([]);
      }
    };
    
    if (isOpen && !hasInitialized.current) {
      hasInitialized.current = true;
      const initialMovItems = Array.isArray(convertData.mov_items)
        ? convertData.mov_items.map((item, index) => ({
          text: typeof item === 'string' ? item : item?.text || '',
          user_id: convertData.mov_assignments?.find(
            (assignment) => Number(assignment.mov_index) === index,
          )?.user_id ?? (typeof item === 'object' ? item?.user_id : null),
        }))
        : [];
      setMovItems(initialMovItems.length > 0 ? initialMovItems : [{ text: '', user_id: null }]);
      fetchInitialUsers();
    }
  }, [isOpen]); // Only depend on isOpen, not convertData.assigned_users!

  // Reset the initialization ref when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [isOpen]);

  // Reset local state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAssignedUsers([]);
      setAssignedUserDepartments({});
      setMovItems([{ text: '', user_id: null }]);
    }
  }, [isOpen]);

  // Custom search function for assignees
  const searchAssignees = useMemo(() => {
    return async (searchTerm) => {
      try {
        const response = await axios.get('/users/options', {
          params: { search: searchTerm, active: true }
        });
        // /users/options returns the array directly, not wrapped in data
        const users = Array.isArray(response.data) ? response.data : response.data.data || [];
        return users;
      } catch (err) {
        console.error('Search error:', err);
        return [];
      }
    };
  }, []);

  // Helper functions
  const userDisplayName = (u) => {
    const name = `${u?.first_name || ''} ${u?.last_name || ''}`.trim();
    return name || u?.email || '';
  };
  
  const formatDepartment = (dept) => {
    if (!dept) return '';
    return String(dept)
      .split('_')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ');
  };

  // Update convertData when users are selected
  const handleSelectUsers = (users) => {
    setAssignedUsers(users);
    setConvertData((previous) => ({
      ...previous,
      assigned_users: users.map((user) => user.id),
      mov_assignments: movItems
        .filter((item) => item.text.trim())
        .map((item, mov_index) => ({
          mov_index,
          user_id: users.length === 1 ? users[0].id : item.user_id,
        })),
    }));
  };

  // MOV handlers
  const handleMovAdd = () => {
    setMovItems((prev) => [...prev, { text: '', user_id: null }]);
  };

  const handleMovRemove = (index) => {
    const newMovItems = movItems.filter((_, i) => i !== index);
    setMovItems(newMovItems);
    updateMovData(newMovItems);
  };

  const handleMovChange = (index, value) => {
    const newMovItems = movItems.map((item, itemIndex) => (
      itemIndex === index ? { ...item, text: value } : item
    ));
    setMovItems(newMovItems);
    updateMovData(newMovItems);
  };

  const handleMovUserChange = (index, userId) => {
    const newMovItems = movItems.map((item, itemIndex) => (
      itemIndex === index ? { ...item, user_id: userId } : item
    ));
    setMovItems(newMovItems);
    updateMovData(newMovItems);
  };

  const updateMovData = (items) => {
    const cleanItems = items
      .map((item) => ({ ...item, text: String(item.text || '').trim() }))
      .filter((item) => item.text.length > 0);
    setConvertData((previous) => ({
      ...previous,
      mov_items: cleanItems.map((item) => item.text),
      mov_assignments: cleanItems.map((item, mov_index) => ({
        mov_index,
        user_id: assignedUsers.length === 1 ? assignedUsers[0].id : item.user_id,
      })),
    }));
  };

  // Validation checks
  const hasAssignees = assignedUsers.length > 0;
  const hasMovItems = movItems.some(item => item.text.trim() !== '');
  const isFormValid = hasAssignees && hasMovItems;

  // Wrapper for onConvert to validate first
  const handleConvert = () => {
    if (isFormValid) {
      onConvert();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="convert-modal-overlay">
      <div className="convert-modal-content">
        <div className="convert-modal-header">
          <h2>Convert to Task</h2>
          <button onClick={onClose} className="convert-close-btn">&times;</button>
        </div>
        <div className="convert-modal-body">
          {/* Validation Message */}
          {!isFormValid && (
            <div className="convert-validation-message">
              <span className="convert-validation-message-icon">⚠️</span>
              <span>Please add the assignee(s) and MOV items.</span>
            </div>
          )}
          <div className="convert-form-group">
            <label className="convert-form-label">Task Title</label>
            <input
              type="text"
              value={convertData.task_title}
              onChange={(e) => setConvertData({ ...convertData, task_title: e.target.value })}
              className="convert-form-control"
            />
          </div>
          <div className="convert-form-group">
            <label className="convert-form-label">Description</label>
            <textarea
              value={convertData.task_description}
              onChange={(e) => setConvertData({ ...convertData, task_description: e.target.value })}
              rows={4}
              className="convert-form-control"
            />
          </div>
          <div className="convert-form-group">
            <label className="convert-form-label">Priority</label>
            <select
              value={convertData.task_priority}
              onChange={(e) => setConvertData({ ...convertData, task_priority: e.target.value })}
              className="convert-form-control"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="convert-form-group">
            <label className="convert-form-label">Due Date</label>
            <input
              type="date"
              value={convertData.task_due_date}
              onChange={(e) => setConvertData({ ...convertData, task_due_date: e.target.value })}
              className="convert-form-control"
            />
          </div>
          {/* MOV Section */}
          <div className="convert-form-group">
            <label className="convert-form-label">
              Means of Verification (MOV) <span style={{ color: 'red' }}>*</span>
            </label>
            <div className="convert-mov-container">
              {movItems.map((item, index) => (
                <div key={index} className="convert-mov-item-row">
                  <FormInput
                    name={`mov_item_${index}`}
                    value={item.text}
                    onChange={(e) => handleMovChange(index, e.target.value)}
                    placeholder="Define a clear, specific, and measurable verification point"
                  />
                  <MovAssignmentPicker
                    assignedUsers={assignedUsers}
                    userId={assignedUsers.length === 1 ? assignedUsers[0].id : item.user_id}
                    onChange={(userId) => handleMovUserChange(index, userId)}
                    disabled={assignedUsers.length === 0}
                  />
                  {movItems.length > 1 && (
                    <button
                      type="button"
                      className="convert-mov-item-remove-button"
                      onClick={() => handleMovRemove(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <div className="convert-mov-actions">
                <button
                  type="button"
                  className="convert-mov-item-add-button"
                  onClick={handleMovAdd}
                >
                  + Add MOV item
                </button>
              </div>
            </div>
          </div>
          <div className="convert-form-group">
            <label className="convert-form-label">Assigned Users</label>
            <SearchableMultiSelect
              onSearch={searchAssignees}
              onSelect={handleSelectUsers}
              onClear={() => {
                setAssignedUsers([]);
                setConvertData({ ...convertData, assigned_users: [] });
              }}
              value={assignedUsers}
              displayKey="full_name"
              valueKey="id"
              allowResearch={true}
              debounceDelay={500}
              minSearchLength={2}
              renderOption={(user) => (
                <div className="assign-user-option">
                  <div className="assign-user-name">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="assign-user-email">
                    {user.email}
                  </div>
                  {user.department && (
                    <div className="assign-user-meta">
                      {user.department} • {user.role || 'User'}
                    </div>
                  )}
                </div>
              )}
              placeholder="Select users to assign"
            />
            {assignedUsers.length > 0 && (
              <div className="assign-users-hint">
                {'\u2713'} {assignedUsers.length}{' '}
                {assignedUsers.length === 1 ? 'user selected' : 'users selected'}
              </div>
            )}
          </div>
          {assignedUsers.length > 0 && (
            <div className="assign-users-summary">
              <div className="assign-users-summary-label">
                Selected Assignees:
              </div>
              {assignedUsers.map((u) => (
                <div
                  key={u.id}
                  className="assign-users-row"
                >
                  <div className="assign-users-row-col">
                    <FormInput
                      name={`user_${u.id}_label`}
                      label=""
                      value={userDisplayName(u)}
                      onChange={() => {}}
                      disabled
                    />
                  </div>
                  <div className="assign-users-row-col">
                    <FormInput
                      name={`dept_${u.id}`}
                      label=""
                      value={formatDepartment(
                        assignedUserDepartments[u.id] ||
                          u.department ||
                          ''
                      )}
                      onChange={() => {}}
                      disabled
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="convert-modal-footer">
          <button onClick={onClose} className="convert-btn convert-btn-secondary">
            Cancel
          </button>
          <button 
            onClick={handleConvert} 
            className="convert-btn convert-btn-primary"
            disabled={!isFormValid}
          >
            Convert
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConvertToTaskModal;
