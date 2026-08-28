import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import DropdownFilter from '../DropdownFilter';
import SearchableDropdown from '../../SearchableDropdown';
import './styles.css';

export const TEAM_FILTER_DEFAULT = 'all';

export const TEAM_FILTER_PRESETS = [
  { value: 'all', label: 'All (per access scope)' },
  { value: 'me', label: 'Me' },
  { value: 'direct', label: 'Direct reports' },
  { value: 'entire', label: 'Entire my team' },
];

export function defaultTeamFilterState() {
  return {
    team_filter: TEAM_FILTER_DEFAULT,
    team_filter_user_id: '',
  };
}

/**
 * Append team filter query/body fields. Skips when mode is empty.
 * Does not send team_filter_user_id unless mode is `user`.
 */
export function appendTeamFilterParams(target, filters = {}) {
  const mode = String(filters.team_filter || TEAM_FILTER_DEFAULT)
    .trim()
    .toLowerCase();
  target.team_filter = mode;
  if (mode === 'user' && filters.team_filter_user_id) {
    target.team_filter_user_id = filters.team_filter_user_id;
  } else {
    delete target.team_filter_user_id;
  }
  return target;
}

function formatUserLabel(user) {
  if (!user) return '';
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name || user.full_name || user.email || '';
}

/**
 * Team / reporting hierarchy list filter.
 * Pure query narrowing — does not change Access Scope permissions.
 *
 * Filter keys on parent object:
 * - team_filter: all | me | direct | entire | user
 * - team_filter_user_id: set when mode is user
 */
export default function TeamFilter({
  filters = {},
  onFilterChange,
  label = 'Team member / Report',
  personLabel = 'Specific person',
  className = '',
}) {
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [staticPeople, setStaticPeople] = useState([]);
  const mode = String(filters.team_filter || TEAM_FILTER_DEFAULT).toLowerCase();

  const loadOptions = useCallback(async (search = '') => {
    try {
      const res = await axiosInstance.get('/users/team-filter-options', {
        params: search ? { search } : {},
      });
      const data = res.data || {};
      const team = Array.isArray(data.entire_team) ? data.entire_team : [];
      const me = data.me ? [data.me] : [];
      // Person picker: self + entire reporting tree
      const byId = new Map();
      [...me, ...team].forEach((u) => {
        if (u?.id != null) byId.set(Number(u.id), u);
      });
      setStaticPeople(Array.from(byId.values()));
      return Array.from(byId.values());
    } catch (err) {
      console.error('Failed to load team filter options', err);
      setStaticPeople([]);
      return [];
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  // Restore selected person from filters when mode is user
  useEffect(() => {
    if (mode !== 'user' || !filters.team_filter_user_id) {
      if (mode !== 'user') setSelectedPerson(null);
      return;
    }
    const id = Number(filters.team_filter_user_id);
    const found = staticPeople.find((u) => Number(u.id) === id);
    if (found) {
      setSelectedPerson(found);
    }
  }, [mode, filters.team_filter_user_id, staticPeople]);

  const handleModeChange = (key, value) => {
    const next = value || TEAM_FILTER_DEFAULT;
    if (onFilterChange) {
      onFilterChange('team_filter', next);
      if (next !== 'user') {
        onFilterChange('team_filter_user_id', '');
        setSelectedPerson(null);
      }
    }
  };

  const handlePersonSelect = (user) => {
    setSelectedPerson(user);
    if (onFilterChange) {
      onFilterChange('team_filter', 'user');
      onFilterChange('team_filter_user_id', user?.id ? String(user.id) : '');
    }
  };

  const handlePersonClear = () => {
    setSelectedPerson(null);
    if (onFilterChange) {
      onFilterChange('team_filter', TEAM_FILTER_DEFAULT);
      onFilterChange('team_filter_user_id', '');
    }
  };

  const searchPeople = useCallback(
    async (term) => {
      const people = await loadOptions(term);
      const q = String(term || '').trim().toLowerCase();
      if (!q) return people;
      return people.filter((u) => {
        const labelText = formatUserLabel(u).toLowerCase();
        const email = String(u.email || '').toLowerCase();
        return labelText.includes(q) || email.includes(q);
      });
    },
    [loadOptions],
  );

  const presetData = useMemo(() => TEAM_FILTER_PRESETS, []);

  return (
    <div className={`team-filter ${className}`.trim()}>
      <DropdownFilter
        filterKey="team_filter"
        label={label}
        data={presetData}
        filters={{ ...filters, team_filter: mode }}
        onFilterChange={handleModeChange}
        placeholder="Select team filter"
        showClearButton={false}
      />

      <SearchableDropdown
        label={personLabel}
        placeholder="Search & pick one person..."
        staticOptions={staticPeople}
        onSearch={searchPeople}
        onSelect={handlePersonSelect}
        onClear={handlePersonClear}
        value={selectedPerson}
        displayKey="full_name"
        debounceDelay={300}
        minSearchLength={0}
        allowResearch
        renderOption={(user) => (
          <>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              {formatUserLabel(user)}
            </div>
            {user.email && (
              <div style={{ fontSize: 12, color: '#666' }}>{user.email}</div>
            )}
            {user.department && (
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                {user.department}
                {user.role ? ` • ${user.role}` : ''}
              </div>
            )}
          </>
        )}
      />
    </div>
  );
}
