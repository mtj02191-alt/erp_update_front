import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Manual row selection for paginated list tables.
 * "Select all" applies to the current page rows only.
 */
export default function useListRowSelection(items, idKey = 'id', resetKey = null) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const headerCheckboxRef = useRef(null);

  const itemIds = useMemo(
    () => (items || []).map((item) => item?.[idKey]).filter((id) => id != null),
    [items, idKey],
  );

  useEffect(() => {
    setSelectedIds(new Set());
  }, [resetKey]);

  const isSelected = useCallback((id) => selectedIds.has(id), [selectedIds]);

  const toggleOne = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllOnPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected =
        itemIds.length > 0 && itemIds.every((id) => next.has(id));
      if (allSelected) {
        itemIds.forEach((id) => next.delete(id));
      } else {
        itemIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [itemIds]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const allOnPageSelected =
    itemIds.length > 0 && itemIds.every((id) => selectedIds.has(id));
  const someOnPageSelected =
    itemIds.some((id) => selectedIds.has(id)) && !allOnPageSelected;

  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (el) el.indeterminate = someOnPageSelected;
  }, [someOnPageSelected]);

  const selectedCount = selectedIds.size;
  const selectedItems = useMemo(
    () => (items || []).filter((item) => selectedIds.has(item?.[idKey])),
    [items, selectedIds, idKey],
  );

  return {
    selectedIds,
    selectedCount,
    selectedItems,
    isSelected,
    toggleOne,
    toggleAllOnPage,
    clearSelection,
    allOnPageSelected,
    someOnPageSelected,
    headerCheckboxRef,
  };
}
