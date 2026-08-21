import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';

const ProgressUpdate = ({
  taskId,
  currentProgress,
  lastProgressNotes,
  movLines,
  assignedUsers = [],
  isTaskCreator = false,
  onUpdate,
  canEdit = true,
  currentUser,
  progressActivities = [],
  taskStatus,
  onShowMovCompletionPrompt,
}) => {
  const isStructured = useMemo(() => {
    return (
      Array.isArray(movLines) &&
      movLines.length > 0 &&
      typeof movLines[0] === 'object' &&
      movLines[0] !== null &&
      ('checked' in movLines[0] || 'checked_by_id' in movLines[0])
    );
  }, [movLines]);

  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(
    Number.isFinite(Number(currentProgress)) ? Number(currentProgress) : 0,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const parseCheckedIndices = useCallback((notes) => {
    if (!notes || typeof notes !== 'string') return null;
    const match = notes.match(/\[indices:([\d,]+)\]/);
    if (match) {
      return match[1].split(',').map(Number);
    }
    return null;
  }, []);

  // Parse ownership information from notes
  // Format: [ownership:0=123,1=456,2=789] where key=index, value=user_id
  const parseOwnershipMap = useCallback((notes) => {
    if (!notes || typeof notes !== 'string') return {};
    const match = notes.match(/\[ownership:([^\]]+)\]/);
    if (!match) return {};
    
    const ownershipMap = {};
    const pairs = match[1].split(',');
    pairs.forEach(pair => {
      const [index, userId] = pair.split('=');
      if (index !== undefined && userId !== undefined) {
        ownershipMap[Number(index)] = Number(userId);
      }
    });
    return ownershipMap;
  }, []);

  const getItemCompletedBy = useCallback((index, targetProgress) => {
    if (!Array.isArray(progressActivities) || progressActivities.length === 0) return null;
    
    // First try to find by encoded indices in notes
    const activityWithIndices = [...progressActivities].reverse().find(a => {
      const indices = parseCheckedIndices(a?.details?.notes);
      return indices && indices.includes(index);
    });
    if (activityWithIndices) return activityWithIndices.performed_by?.id || null;

    // Fallback to progress percentage matching (legacy)
    
    const activityWithProgress = progressActivities.find(a => {
      if (!a || !a.details) return false;
      return Number(a.details.progress) === targetProgress;
    });
    return activityWithProgress?.performed_by?.id || null;
  }, [progressActivities, parseCheckedIndices]);

  // Use a ref to track initialized items to prevent ownership loss during re-renders
  const initializedItemsRef = React.useRef(null);

  useEffect(() => {
    if (isStructured) {
      // Structured mode: Backend provides items with checked_by_id already set
      setItems(movLines);
      setProgress(
        Number.isFinite(Number(currentProgress)) ? Number(currentProgress) : 0,
      );
      initializedItemsRef.current = movLines;
      return;
    }

    // Legacy mode: Parse MOV lines from text
    const lines = Array.isArray(movLines)
      ? movLines
          .map((line) => typeof line === 'object' ? line : { text: String(line || '').trim() })
          .filter((line) => String(line.text || '').trim().length > 0)
      : [];
    const total = lines.length;
    if (total === 0) {
      setItems([]);
      setProgress(
        Number.isFinite(Number(currentProgress)) ? Number(currentProgress) : 0,
      );
      initializedItemsRef.current = [];
      return;
    }

    const checkedIndices = parseCheckedIndices(lastProgressNotes);
    const ownershipMap = parseOwnershipMap(lastProgressNotes);
    const numericProgress = Number(currentProgress) || 0;
    const completedCount = Math.max(
      0,
      Math.min(total, Math.round((numericProgress / 100) * total)),
    );

    const nextItems = lines.map((line, index) => {
      const text = String(line.text || '').trim();
      let completed = false;
      const movIndex = Number.isInteger(Number(line.mov_index))
        ? Number(line.mov_index)
        : index;
      if (checkedIndices) {
        completed = checkedIndices.includes(movIndex);
      } else {
        completed = index < completedCount;
      }

      // CRITICAL: Preserve existing completed_by_id to prevent ownership loss
      // Priority order:
      // 1. Parse from lastProgressNotes (persisted ownership from backend) - HIGHEST PRIORITY
      // 2. Use ref (most recent state from previous renders)
      // 3. Use activity history (if item was completed before page load)
      // 4. Leave as null (new completion, will be set on toggle)
      let completed_by_id = null;
      
      if (completed) {
        // FIRST: Try to get ownership from persisted notes (survives page refresh/session change)
        if (ownershipMap && ownershipMap[index] !== undefined) {
          completed_by_id = ownershipMap[index];
        }
        // SECOND: Check if we have this item in our ref with ownership info
        else if (initializedItemsRef.current && Array.isArray(initializedItemsRef.current) && initializedItemsRef.current[index]) {
          const refItem = initializedItemsRef.current[index];
          // STRICT OWNERSHIP: If ref item has an owner, ALWAYS preserve it
          if (refItem.completed_by_id) {
            completed_by_id = refItem.completed_by_id;
          }
        }
        
        // THIRD: If no ownership in ref or notes, try to determine from activity history
        if (!completed_by_id) {
          const targetProgress = Math.round(((index + 1) / total) * 100);
          completed_by_id = getItemCompletedBy(index, targetProgress);
        }
      }
      
      return {
        text,
        mov_index: movIndex,
        completed,
        completed_by_id,
        assigned_user_id: line.assigned_user_id ?? null,
      };
    });
    
    // ONLY update state if there are actual changes (prevent unnecessary re-renders)
    const shouldUpdate = !initializedItemsRef.current || 
      nextItems.length !== initializedItemsRef.current.length ||
      nextItems.some((item, idx) => {
        const refItem = initializedItemsRef.current[idx];
        if (!refItem) return true;
        return item.completed !== refItem.completed || 
               item.completed_by_id !== refItem.completed_by_id ||
               item.text !== refItem.text ||
               item.assigned_user_id !== refItem.assigned_user_id;
      });
    
    if (shouldUpdate) {
      setItems(nextItems);
      initializedItemsRef.current = nextItems;
      
      const nextProgress =
        total > 0 ? Math.round((nextItems.filter(i => i.completed).length / total) * 100) : 0;
      setProgress(nextProgress);
    }
  }, [movLines, isStructured, currentProgress, lastProgressNotes, getItemCompletedBy, parseCheckedIndices]);

  const completedCount = isStructured
    ? items.filter((item) => item.checked).length
    : items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const calculatedProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const clampedProgress = Math.max(0, Math.min(100, calculatedProgress));

  const getAssignedUserName = (userId) => {
    if (userId == null) return 'Unassigned';
    const assignedUser = assignedUsers.find((user) => Number(user.id) === Number(userId));
    return assignedUser
      ? `${assignedUser.first_name || ''} ${assignedUser.last_name || ''}`.trim() || assignedUser.email
      : `User #${userId}`;
  };

  const handleToggle = async (index) => {
    if (!taskId || !items.length || loading || !canEdit) return;

    const item = items[index];

    // RESTRICTION: Once checked by a user, the item is LOCKED and owned by that user.
    // Other assignees cannot check, uncheck, or modify it.
    const isChecked = isStructured ? item.checked : item.completed;
    const checkedById = isStructured ? item.checked_by_id : item.completed_by_id;

    // IMMUTABILITY CHECK: If item is checked by someone else, BLOCK all modifications
    if (isChecked && checkedById && Number(checkedById) !== Number(currentUser?.id)) {
      toast.error('This MOV item is locked and was checked by another assignee');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let nextItems;
      let allCompleted = false;

      // First calculate next items to check if all are completed
      if (isStructured) {
        nextItems = items.map((i, idx) => {
          if (idx === index) {
            return { ...i, checked: !i.checked };
          }
          return i;
        });
        allCompleted = nextItems.every((i) => i.checked);
      } else {
        // Legacy mode
        const nextChecked = !item.completed;
        
        // STATE-LEVEL IMMUTABILITY: When unchecking, only allow if current user owns it
        if (!nextChecked && checkedById && Number(checkedById) !== Number(currentUser?.id)) {
          toast.error('You cannot uncheck an item checked by another assignee');
          setLoading(false);
          return;
        }
        
        nextItems = items.map((i, idx) => {
          if (idx === index) {
            return {
              ...i,
              completed: nextChecked,
              completed_by_id: nextChecked ? (checkedById || currentUser?.id) : null,
            };
          }
          return i;
        });
        allCompleted = nextItems.every((i) => i.completed);
      }

      // Now proceed with API call
      if (isStructured) {
        const nextChecked = !item.checked;
        const res = await axiosInstance.patch(
          `/tasks/${taskId}/mov/${index}`,
          { checked: nextChecked },
        );
        const updatedTask = res.data?.data;
        if (updatedTask) {
          // Backend should return updated mov_checklist with checked_by_id
          setItems(updatedTask.mov_checklist);
          initializedItemsRef.current = updatedTask.mov_checklist;
          setProgress(updatedTask.progress);
          if (onUpdate) {
            onUpdate(
              updatedTask.progress,
              `Toggled MOV: ${item.text}`,
              updatedTask,
            );
          }
        }
      } else {
        // Legacy mode: Enforce per-item ownership
        const nextChecked = !item.completed;
        
        // Create next state by mapping ALL items to preserve ownership
        const total = nextItems.length;
        const checkedCount = nextItems.filter((item) => item.completed).length;
        const nextProgress =
          total > 0 ? Math.round((checkedCount / total) * 100) : 0;

        // Build indices array for checked items
        const indices = nextItems
          .map((item) => (item.completed ? item.mov_index : null))
          .filter((i) => i !== null);
        
        // Build ownership map to persist who checked each item
        const ownershipPairs = nextItems
          .map((item) => {
            if (item.completed && item.completed_by_id) {
              return `${item.mov_index}=${item.completed_by_id}`;
            }
            return null;
          })
          .filter(pair => pair !== null);
        
        const note = `Complete: ${checkedCount} of ${total} checklist items completed. [indices:${indices.join(',')}]${ownershipPairs.length > 0 ? `[ownership:${ownershipPairs.join(',')}]` : ''}`;
        
        const payload = {
          progress: nextProgress,
          notes: note,
        };
        const res = await axiosInstance.put(
          `/tasks/${taskId}/progress`,
          payload,
        );
        
        // After API call, refresh from backend to ensure data consistency
        const responseData = res.data?.data;
        if (responseData && responseData.mov_checklist && Array.isArray(responseData.mov_checklist)) {
          setItems(responseData.mov_checklist);
          initializedItemsRef.current = responseData.mov_checklist;
        } else {
          setItems(nextItems);
          initializedItemsRef.current = nextItems;
        }
        setProgress(nextProgress);
        if (onUpdate) {
          const data = res.data?.data;
          onUpdate(data?.progress || nextProgress, note, data);
        }
      }

      toast.success('Progress updated');
    } catch (e2) {
      const msg = e2.response?.data?.message || 'Failed to update progress.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="task-progress">
      <div className="task-progress-header">
        <div className="task-progress-main">
          <div className="task-progress-label">Task Verification Checklist</div>
          <div className="task-progress-value">
            <span className="task-progress-percentage">{clampedProgress}%</span>
            <span className="task-progress-separator">·</span>
            <span>
              {completedCount}/{totalCount} completed
            </span>
          </div>
        </div>
        <div className="task-progress-bar">
          <div 
            className="task-progress-bar-fill"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>
      {error && <div className="task-progress-error">{error}</div>}
      <ul className="mov-checklist-list">
        {items.map((item, index) => {
          const isChecked = isStructured ? item.checked : item.completed;
          const checkedById = isStructured ? item.checked_by_id : item.completed_by_id;
          const isCheckedByOther = isChecked && checkedById && Number(checkedById) !== Number(currentUser?.id);
          const isCheckedByCurrentUser = isChecked && checkedById && Number(checkedById) === Number(currentUser?.id);
          const isAssignedToCurrentUser =
            item.assigned_user_id != null &&
            Number(item.assigned_user_id) === Number(currentUser?.id);
          const isCreatorOnAnotherUsersMov =
            isTaskCreator && item.assigned_user_id != null && !isAssignedToCurrentUser;
          const isDisabled = loading || !canEdit || isCheckedByOther || isCreatorOnAnotherUsersMov;

          // Determine the reason for disabled state to show appropriate tooltip
          let disabledTooltip = '';
          if (!canEdit) {
            disabledTooltip = 'Only assignees can interact with MOV items';
          } else if (isCheckedByOther) {
            disabledTooltip = 'Locked: Checked by another assignee';
          } else if (isCreatorOnAnotherUsersMov) {
            disabledTooltip = 'Only the MOV assignee can update this item';
          } else if (loading) {
            disabledTooltip = 'Updating...';
          }

          return (
            <li key={`${item.text}-${index}`} className={`mov-checklist-item${isCheckedByOther ? ' mov-checklist-item--locked' : ''}`}>
              <button
                type="button"
                className={`mov-checklist-button${
                  isChecked ? ' mov-checklist-button--checked' : ''
                }${isCheckedByOther ? ' mov-checklist-button--readonly' : ''}${
                  isCheckedByCurrentUser ? ' mov-checklist-button--owned' : ''
                }`}
                onClick={() => handleToggle(index)}
                disabled={isDisabled}
                title={disabledTooltip}
              >
                <span className="mov-checklist-checkbox">
                  {isChecked ? '✓' : ''}
                </span>
                <span className="mov-checklist-label">{item.text}</span>
                {'assigned_user_id' in item && (
                  <span className="mov-checklist-assignee">
                    {getAssignedUserName(item.assigned_user_id)}
                  </span>
                )}
                {isChecked && checkedById && (
                  <span
                    className="mov-checklist-info"
                  >
                    {Number(checkedById) === Number(currentUser?.id)
                      ? '(You checked)'
                      : `(Locked)`}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ProgressUpdate;
