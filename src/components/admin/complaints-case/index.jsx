import React, { useState } from 'react';
import ComplaintsCaseList from './list';
import ComplaintsCaseBoard from './board';

export default function ComplaintsCasePage() {
  const [viewMode, setViewMode] = useState('board');

  if (viewMode === 'list') {
    return (
      <ComplaintsCaseList
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    );
  }

  return (
    <ComplaintsCaseBoard
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    />
  );
}
