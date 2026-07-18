import React, { useMemo, useState, useEffect, useRef } from 'react';
import axios from '../../../utils/axios';
import SearchableMultiSelect from '../../common/SearchableMultiSelect';
import FormInput from '../../common/FormInput';
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
  const [movItems, setMovItems] = useState(['']); // Start with one empty MOV item
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
      setMovItems(['']);
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
    setConvertData({ 
      ...convertData, 
      assigned_users: users.map(u => u.id) 
    });
  };

  // MOV handlers
  const handleMovAdd = () => {
    setMovItems([...movItems, '']);
  };

  const handleMovRemove = (index) => {
    const newMovItems = movItems.filter((_, i) => i !== index);
    setMovItems(newMovItems);
  };

  const handleMovChange = (index, value) => {
    const newMovItems = [...movItems];
    newMovItems[index] = value;
    setMovItems(newMovItems);
    setConvertData({
      ...convertData,
      mov_items: newMovItems.filter(item => item.trim() !== '')
    });
  };

  // Validation checks
  const hasAssignees = assignedUsers.length > 0;
  const hasMovItems = movItems.some(item => item.trim() !== '');
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
            <label className="convert-form-label">Department</label>
            <select
              value={convertData.task_department}
              onChange={(e) => setConvertData({ ...convertData, task_department: e.target.value })}
              className="convert-form-control"
            >
              <option value="">Select Department</option>
              <option value="admin">Admin</option>
              <option value="program">Program</option>
              <option value="store">Store</option>
              <option value="procurements">Procurements</option>
              <option value="accounts_and_finance">Accounts & Finance</option>
              <option value="fund_raising">Fund Raising</option>
              <option value="hr">HR</option>
              <option value="it">IT</option>
              <option value="marketing">Marketing</option>
              <option value="audio_video">Audio Video</option>
              <option value="meal">Meal</option>
              <option value="health">Health</option>
              <option value="executive_office">Executive Office</option>
              <option value="ceo">CEO</option>
              <option value="internal_audit">Internal Audit</option>
              <option value="crd">CRD</option>
              <option value="aas_lab">Aas Lab</option>
            </select>
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
              {movItems.map((value, index) => (
                <div key={index} className="convert-mov-item-row">
                  <FormInput
                    name={`mov_item_${index}`}
                    // label={index === 0 ? 'MOV item' : ''}
                    value={value}
                    onChange={(e) => handleMovChange(index, e.target.value)}
                    placeholder="Define a clear, specific, and measurable verification point"
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
              // label="Assign Users"
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
