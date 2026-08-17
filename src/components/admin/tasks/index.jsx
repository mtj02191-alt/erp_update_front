import React, { useState, useCallback } from 'react';
import TasksBoard from './board';
import TasksList from './list';
import { loadTasksViewMode, saveTasksViewMode } from './shared/taskViewMode';
import useNotificationListRefresh from '../../../hooks/useNotificationListRefresh';
import { NotificationRefreshPresets } from '../../../utils/notifications/events';

export default function TasksPage() {
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
      <TasksList
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        refreshNonce={refreshNonce}
      />
    );
  }

  return (
    <TasksBoard
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      refreshNonce={refreshNonce}
    />
  );
}
