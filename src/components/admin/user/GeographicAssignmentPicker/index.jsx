import React, { useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import { simpleDebounce } from '../../../../utils/debounce';
import {
  GEO_TYPE_LABELS,
  GEO_TYPE_TO_FIELD,
  hasAnyGeographicAssignment,
  itemKey,
  normalizeGeographicAssignments,
} from '../../../../utils/geographicAssignment';
import './GeographicAssignmentPicker.css';

const GeographicAssignmentPicker = ({
  value,
  onChange,
  geographicOff = false,
  onGeographicOffChange,
  disabled = false,
}) => {
  const assignments = useMemo(
    () => normalizeGeographicAssignments(value),
    [value],
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const rootRef = useRef(null);

  const selectedKeySet = useMemo(
    () => new Set(selectedItems.map(itemKey)),
    [selectedItems],
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const resolveLabels = async () => {
      if (!hasAnyGeographicAssignment(assignments)) {
        setSelectedItems([]);
        return;
      }

      setIsResolving(true);
      try {
        const response = await axiosInstance.post('/geographic-assignments/resolve', assignments);
        if (!cancelled) {
          setSelectedItems(response.data?.data || []);
        }
      } catch (error) {
        console.error('Failed to resolve geographic assignments:', error);
        if (!cancelled) {
          setSelectedItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsResolving(false);
        }
      }
    };

    resolveLabels();
    return () => {
      cancelled = true;
    };
  }, [
    assignments.countries.join(','),
    assignments.regions.join(','),
    assignments.districts.join(','),
    assignments.tehsils.join(','),
    assignments.cities.join(','),
    assignments.routes.join(','),
  ]);

  const runSearch = async (term) => {
    const q = String(term || '').trim();
    if (q.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axiosInstance.get('/geographic-assignments/search', {
        params: { q, limit: 30 },
      });
      const data = response.data?.data || [];
      setResults(data.filter((item) => !selectedKeySet.has(itemKey(item))));
      setHighlightedIndex(data.length ? 0 : -1);
    } catch (error) {
      console.error('Geographic search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useMemo(
    () => simpleDebounce(runSearch, 350),
    [selectedKeySet],
  );

  useEffect(() => {
    if (!isOpen) return;
    debouncedSearch(searchTerm);
  }, [searchTerm, isOpen, debouncedSearch]);

  const addItem = (item) => {
    const field = GEO_TYPE_TO_FIELD[item.type];
    if (!field) return;

    const current = assignments[field] || [];
    if (current.includes(item.id)) return;

    onChange({
      ...assignments,
      [field]: [...current, item.id],
    });

    setSelectedItems((prev) => [...prev, item]);
    setResults((prev) => prev.filter((row) => itemKey(row) !== itemKey(item)));
    setSearchTerm('');
    setIsOpen(false);
  };

  const removeItem = (item) => {
    const field = GEO_TYPE_TO_FIELD[item.type];
    if (!field) return;

    onChange({
      ...assignments,
      [field]: (assignments[field] || []).filter((id) => id !== item.id),
    });
    setSelectedItems((prev) => prev.filter((row) => itemKey(row) !== itemKey(item)));
  };

  const handleKeyDown = (event) => {
    if (!isOpen || !results.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter' && highlightedIndex >= 0) {
      event.preventDefault();
      addItem(results[highlightedIndex]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="geo-assignment-picker" ref={rootRef}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={geographicOff}
          onChange={(e) => onGeographicOffChange?.(e.target.checked)}
          disabled={disabled}
        />
        <span>Exempt from geographic area restriction (DMS only; permissions still apply)</span>
      </label>

      <div className="geo-assignment-search-wrap">
        <input
          type="text"
          className="geo-assignment-search-input"
          placeholder="Search country, region, district, tehsil, city, or route..."
          value={searchTerm}
          disabled={disabled || geographicOff}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {isOpen && !geographicOff && searchTerm.trim().length >= 2 && (
          <div className="geo-assignment-dropdown">
            {isSearching && (
              <div className="geo-assignment-status" style={{ padding: '10px 12px' }}>
                Searching...
              </div>
            )}
            {!isSearching && results.length === 0 && (
              <div className="geo-assignment-status" style={{ padding: '10px 12px' }}>
                No matches found
              </div>
            )}
            {!isSearching &&
              results.map((item, index) => (
                <button
                  key={itemKey(item)}
                  type="button"
                  className={`geo-assignment-option${index === highlightedIndex ? ' is-active' : ''}`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => addItem(item)}
                >
                  <div className="geo-assignment-option-name">{item.name}</div>
                  <div className="geo-assignment-option-meta">
                    {GEO_TYPE_LABELS[item.type] || item.type}
                    {item.breadcrumb ? ` · ${item.breadcrumb}` : ''}
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      <p className="geo-assignment-hint">
        Type at least 2 characters (e.g. Karachi). Pick any level directly — no need to select country first.
      </p>

      <div className="geo-assignment-chips">
        {isResolving && <span className="geo-assignment-status">Loading assignments...</span>}
        {!isResolving && selectedItems.length === 0 && (
          <span className="geo-assignment-empty">No geographic areas assigned yet.</span>
        )}
        {!isResolving &&
          selectedItems.map((item) => (
            <span className="geo-assignment-chip" key={itemKey(item)}>
              <span className="geo-assignment-chip-type">{GEO_TYPE_LABELS[item.type]}</span>
              <span>{item.name}</span>
              {!disabled && (
                <button
                  type="button"
                  className="geo-assignment-chip-remove"
                  onClick={() => removeItem(item)}
                  aria-label={`Remove ${item.name}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
      </div>
    </div>
  );
};

export default GeographicAssignmentPicker;
