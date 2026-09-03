import React, { useEffect, useMemo, useState } from 'react';
import { FiCheck, FiUser, FiX } from 'react-icons/fi';
import './MovAssignmentPicker.css';

const getUserName = (user) => {
  const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
  return name || user?.email || `User #${user?.id}`;
};

const getAvatar = (user) => user?.avatar || user?.avatar_url || user?.profile_image || user?.profile_picture;

const UserRow = ({ user, isSelected, onSelect }) => {
  const avatar = getAvatar(user);
  return (
    <button
      type="button"
      className={`mov-assignment-user${isSelected ? ' is-selected' : ''}`}
      onClick={onSelect}
    >
      {avatar ? (
        <img className="mov-assignment-avatar" src={avatar} alt="" />
      ) : (
        <span className="mov-assignment-avatar mov-assignment-avatar--fallback">
          {getUserName(user).charAt(0).toUpperCase()}
        </span>
      )}
      <span className="mov-assignment-user-details">
        <strong>{getUserName(user)}</strong>
        {user.email && <small>{user.email}</small>}
      </span>
      {isSelected && <FiCheck className="mov-assignment-selected-icon" />}
    </button>
  );
};

const MovAssignmentPicker = ({
  assignedUsers = [],
  userId,
  onChange,
  onAssignAll,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('single'); // 'single' | 'all'
  const selectedUser = useMemo(
    () => assignedUsers.find((user) => Number(user.id) === Number(userId)),
    [assignedUsers, userId],
  );

  useEffect(() => {
    if (assignedUsers.length === 1 && userId == null) {
      onChange(assignedUsers[0].id);
    }
  }, [assignedUsers, onChange, userId]);

  useEffect(() => {
    if (!isOpen) setMode('single');
  }, [isOpen]);

  const displayUser = selectedUser || null;
  const label = displayUser ? getUserName(displayUser) : 'Unassigned';
  const canAssignAll =
    typeof onAssignAll === 'function' && assignedUsers.length > 1;

  const handlePick = (id) => {
    if (mode === 'all' && canAssignAll) {
      onAssignAll(id);
    } else {
      onChange(id);
    }
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="mov-assignment-button"
        onClick={() => setIsOpen(true)}
        disabled={disabled || assignedUsers.length === 0}
      >
        {displayUser ? (
          getAvatar(displayUser) ? (
            <img className="mov-assignment-avatar" src={getAvatar(displayUser)} alt="" />
          ) : (
            <span className="mov-assignment-avatar mov-assignment-avatar--fallback">
              {getUserName(displayUser).charAt(0).toUpperCase()}
            </span>
          )
        ) : <FiUser />}
        <span>{label}</span>
      </button>

      {isOpen && (
        <div className="mov-assignment-modal-backdrop" role="presentation" onMouseDown={() => setIsOpen(false)}>
          <div className="mov-assignment-modal" role="dialog" aria-modal="true" aria-label="Assign MOV user" onMouseDown={(event) => event.stopPropagation()}>
            <div className="mov-assignment-modal-header">
              <h3>Assign MOV User</h3>
              <button type="button" className="mov-assignment-close" onClick={() => setIsOpen(false)} aria-label="Close">
                <FiX />
              </button>
            </div>

            {canAssignAll && (
              <div className="mov-assignment-mode-toggle" role="tablist" aria-label="Assignment scope">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'single'}
                  className={`mov-assignment-mode-btn${mode === 'single' ? ' is-active' : ''}`}
                  onClick={() => setMode('single')}
                >
                  This MOV only
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'all'}
                  className={`mov-assignment-mode-btn${mode === 'all' ? ' is-active' : ''}`}
                  onClick={() => setMode('all')}
                >
                  All MOVs
                </button>
              </div>
            )}

            <p className="mov-assignment-modal-hint">
              {mode === 'all' && canAssignAll
                ? 'Pick a user to assign every MOV item to them.'
                : 'Pick a user to assign only this MOV item.'}
            </p>

            <div className="mov-assignment-user-list">
              {assignedUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isSelected={mode === 'single' && Number(user.id) === Number(userId)}
                  onSelect={() => handlePick(user.id)}
                />
              ))}
            </div>

            {mode === 'single' && assignedUsers.length > 1 && (
              <button
                type="button"
                className="mov-assignment-unassign"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
              >
                Leave Unassigned
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MovAssignmentPicker;
