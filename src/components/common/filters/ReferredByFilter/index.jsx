import React, { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import SearchableMultiSelect from '../../SearchableMultiSelect';
import './styles.css';

function formatUserLabel(user) {
  if (!user) return '';
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name || user.full_name || user.email || `User #${user.id}`;
}

function normalizeIds(raw) {
  if (Array.isArray(raw)) {
    return raw
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n) && n > 0);
  }
  if (raw == null || raw === '') return [];
  return String(raw)
    .split(',')
    .map((v) => Number(String(v).trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/**
 * Multi-select staff referrer filter.
 * Filter keys:
 * - referrer_user_ids: number[] (selected staff)
 * - referrer_any: 'true' | '' — only rows that have any referral
 */
export default function ReferredByFilter({
  filters = {},
  onFilterChange,
  label = 'Referred by',
  className = '',
}) {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [peopleById, setPeopleById] = useState(new Map());

  const referrerAny =
    String(filters.referrer_any || '').toLowerCase() === 'true' ||
    String(filters.referrer_user_id || '').toLowerCase() === 'any';

  const loadPeople = useCallback(async (search = '') => {
    try {
      const res = await axiosInstance.get('/users/team-filter-options', {
        params: search ? { search } : {},
      });
      const data = res.data || {};
      const team = Array.isArray(data.entire_team) ? data.entire_team : [];
      const me = data.me ? [data.me] : [];
      const next = new Map();
      [...me, ...team].forEach((u) => {
        if (u?.id != null) {
          next.set(Number(u.id), {
            ...u,
            full_name: formatUserLabel(u),
          });
        }
      });
      setPeopleById((prev) => {
        const merged = new Map(prev);
        next.forEach((v, k) => merged.set(k, v));
        return merged;
      });
      return Array.from(next.values());
    } catch (err) {
      console.error('Failed to load referrer options', err);
      return [];
    }
  }, []);

  useEffect(() => {
    loadPeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore selected users from filter ids
  useEffect(() => {
    const ids = normalizeIds(
      filters.referrer_user_ids ?? filters.referrer_user_id,
    );
    if (!ids.length) {
      setSelectedUsers([]);
      return;
    }
    const next = ids.map((id) => {
      const known = peopleById.get(id);
      if (known) return known;
      return { id, full_name: `User #${id}`, first_name: `User #${id}` };
    });
    setSelectedUsers(next);
  }, [filters.referrer_user_ids, filters.referrer_user_id, peopleById]);

  const emitIds = (users) => {
    if (!onFilterChange) return;
    const ids = (users || [])
      .map((u) => Number(u?.id))
      .filter((n) => Number.isFinite(n) && n > 0);
    onFilterChange('referrer_user_ids', ids);
    // Clear legacy single-id key if present
    if (filters.referrer_user_id) {
      onFilterChange('referrer_user_id', '');
    }
  };

  const handleSelect = (users) => {
    setSelectedUsers(users || []);
    emitIds(users);
  };

  const handleClear = () => {
    setSelectedUsers([]);
    if (onFilterChange) {
      onFilterChange('referrer_user_ids', []);
      onFilterChange('referrer_user_id', '');
    }
  };

  const handleAnyToggle = (e) => {
    const checked = e.target.checked;
    if (!onFilterChange) return;
    onFilterChange('referrer_any', checked ? 'true' : '');
    if (checked) {
      // Any-referral mode: clear specific people
      setSelectedUsers([]);
      onFilterChange('referrer_user_ids', []);
      onFilterChange('referrer_user_id', '');
    }
  };

  const searchPeople = useCallback(
    async (term) => {
      const people = await loadPeople(term);
      const q = String(term || '').trim().toLowerCase();
      if (!q) return people;
      return people.filter((u) => {
        const labelText = formatUserLabel(u).toLowerCase();
        const email = String(u.email || '').toLowerCase();
        return labelText.includes(q) || email.includes(q);
      });
    },
    [loadPeople],
  );

  return (
    <div className={`referred-by-filter ${className}`.trim()}>
      <div className="referred-by-filter__header">
        <span className="referred-by-filter__label">{label}</span>
        <label className="referred-by-filter__any">
          <input
            type="checkbox"
            checked={referrerAny}
            onChange={handleAnyToggle}
          />
          Any referral
        </label>
      </div>

      <SearchableMultiSelect
        placeholder={
          referrerAny
            ? 'Clear “Any referral” to pick staff...'
            : 'Search & select staff...'
        }
        value={selectedUsers}
        onSelect={handleSelect}
        onClear={handleClear}
        onSearch={searchPeople}
        displayKey="full_name"
        valueKey="id"
        minSearchLength={0}
        debounceDelay={300}
        allowResearch
        disabled={referrerAny}
        renderOption={(user) => (
          <div style={{ padding: 4 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              {formatUserLabel(user)}
            </div>
            {user.email && (
              <div style={{ fontSize: 12, color: '#666' }}>{user.email}</div>
            )}
          </div>
        )}
      />
    </div>
  );
}
