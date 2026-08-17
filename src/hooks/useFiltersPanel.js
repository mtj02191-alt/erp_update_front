import { useState, useCallback } from 'react';

const useFiltersPanel = (defaultOpen = false) => {
  const [filtersOpen, setFiltersOpen] = useState(defaultOpen);
  const toggleFilters = useCallback(() => setFiltersOpen((open) => !open), []);

  return { filtersOpen, toggleFilters, setFiltersOpen };
};

export default useFiltersPanel;
