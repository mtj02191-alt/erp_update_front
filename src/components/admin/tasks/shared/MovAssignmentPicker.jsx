import React, { useEffect, useMemo, useState } from 'react';
import { FiCheck, FiUser, FiX } from 'react-icons/fi';
import './MovAssignmentPicker.css';

const getUserName = (user) => {
  const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
  return name || user?.email || `User #${user?.id}`;
};

const getAvatar = (user) => user?.avatar || user?.avatar_url || user?.profile_image || user?.profile_picture;

const MovAssignmentPicker = ({
  assignedUsers = [],
  userId,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedUser = useMemo(
    () => assignedUsers.find((user) => Number(user.id) === Number(userId)),
    [assignedUsers, userId],
  );

  useEffect(() => {
    if (assignedUsers.length === 1 && userId == null) {
      onChange(assignedUsers[0].id);
    }
  }, [assignedUsers, onChange, userId]);

  const displayUser = selectedUser || null;
  const label = displayUser ? getUserName(displayUser) : 'Unassigned';

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
            <p className="mov-assignment-modal-hint">Choose from the users assigned to this task.</p>
            <div className="mov-assignment-user-list">
              {assignedUsers.map((user) => {
                const isSelected = Number(user.id) === Number(userId);
                const avatar = getAvatar(user);
                return (
                  <button
                    type="button"
                    key={user.id}
                    className={`mov-assignment-user${isSelected ? ' is-selected' : ''}`}
                    onClick={() => {
                      onChange(user.id);
                      setIsOpen(false);
                    }}
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
              })}
            </div>
            {assignedUsers.length > 1 && (
              <button type="button" className="mov-assignment-unassign" onClick={() => { onChange(null); setIsOpen(false); }}>
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
