import React, { useState, useCallback } from 'react';
import ComplaintsBoard from './board';
import ComplaintsList from './list';
import { loadTasksViewMode, saveTasksViewMode } from './shared/taskViewMode';
import useNotificationListRefresh from '../../../hooks/useNotificationListRefresh';
import { NotificationRefreshPresets } from '../../../utils/notifications/events';

export default function ComplaintsPage() {
  const [viewMode, setViewMode] = useState(loadTasksViewMode);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    saveTasksViewMode(mode);
  };

  const bumpRefresh = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  // Any task notification (assignment, approver, status, comment, mention)
  // refreshes whichever view is currently mounted — list or kanban.
  useNotificationListRefresh(bumpRefresh, {
    ...NotificationRefreshPresets.tasks,
  });

  if (viewMode === 'list') {
    return (
      <ComplaintsList
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        refreshNonce={refreshNonce}
      />
    );
  }

  return (
    <ComplaintsBoard
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      refreshNonce={refreshNonce}
    />
  );
}
