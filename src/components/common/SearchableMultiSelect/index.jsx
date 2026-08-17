import React, { useState, useEffect, useRef, useMemo } from 'react';
import { simpleDebounce } from '../../../utils/debounce';
import axiosInstance from '../../../utils/axios';
import './styles.css';

/**
 * SearchableMultiSelect Component
 * A reusable component that combines API search functionality with multi-selection capability
 * Allows searching via API and selecting multiple items
 * 
 * @param {string} label - Label for the input field
 * @param {string} placeholder - Placeholder text for the input
 * @param {Function} onSearch - Callback function to fetch search results (receives search term)
 * @param {string} apiEndpoint - API endpoint to call for search (alternative to onSearch)
 * @param {object} apiParams - Additional params to send with API request
 * @param {string} searchParamName - Name of the search query parameter (default: 'search')
 * @param {Function} onSelect - Callback when items are selected/deselected (receives array of selected items)
 * @param {Function} renderOption - Custom render function for dropdown options (receives item, index)
 * @param {string} displayKey - Key to display in the input after selection (default: 'name')
 * @param {string} valueKey - Key to use as value from option objects (default: 'id')
 * @param {number} debounceDelay - Delay in ms before triggering search (default: 500)
 * @param {number} minSearchLength - Minimum characters before search (default: 2)
 * @param {string} loadingText - Text to show while loading (default: 'Searching...')
 * @param {string} noResultsText - Text to show when no results (default: 'No results found')
 * @param {string} name - Input name attribute
 * @param {boolean} required - Whether field is required
 * @param {Array} value - Controlled value (array of selected items)
 * @param {Function} onClear - Callback when all selections are cleared
 * @param {boolean} allowResearch - Allow searching again after selection (default: true)
 * @param {boolean} disabled - Whether the component is disabled
 * @param {string} error - Error message to display
 * @param {string} className - Additional CSS classes
 */
const SearchableMultiSelect = ({
  label,
  placeholder = '',
  onSearch,
  apiEndpoint,
  apiParams = {},
  searchParamName = 'search',
  onSelect,
  renderOption,
  displayKey = 'name',
  valueKey = 'id',
  debounceDelay = 500,
  minSearchLength = 2,
  loadingText = 'Searching...',
  noResultsText = 'No results found',
  name,
  required = false,
  value = [],
  onClear,
  allowResearch = true,
  disabled = false,
  error = '',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedItems, setSelectedItems] = useState([]);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => simpleDebounce(async (term) => {
      if (term.length < minSearchLength) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        let results = [];
        
        if (onSearch) {
          results = await onSearch(term);
        } else if (apiEndpoint) {
          const params = {
            [searchParamName]: term,
            ...apiParams
          };
          const response = await axiosInstance.get(apiEndpoint, { params });
          results = response.data.data || response.data || [];
        }
        
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceDelay),
    [onSearch, apiEndpoint, apiParams, searchParamName, minSearchLength, debounceDelay]
  );

  // Update selected items when value prop changes
  useEffect(() => {
    setSelectedItems(value || []);
  }, [value]);

  // Handle input change
  const handleInputChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setHighlightedIndex(-1);
    
    if (term.length >= minSearchLength) {
      debouncedSearch(term);
    } else {
      setSearchResults([]);
    }
  };

  // Handle item selection/deselection
  const handleItemToggle = (item) => {
    const itemValue = item[valueKey];
    const isSelected = selectedItems.some(selected => selected[valueKey] === itemValue);
    
    let newSelectedItems;
    if (isSelected) {
      // Remove item
      newSelectedItems = selectedItems.filter(selected => selected[valueKey] !== itemValue);
    } else {
      // Add item
      newSelectedItems = [...selectedItems, item];
    }
    
    setSelectedItems(newSelectedItems);
    
    // Clear search term after selection to allow easy searching for more items
    setSearchTerm('');
    setSearchResults([]);
    
    if (onSelect) {
      onSelect(newSelectedItems);
    }
    
    // Keep dropdown open to allow searching for more items
    if (allowResearch && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  // Handle clear all selections
  const handleClearAll = () => {
    setSelectedItems([]);
    setSearchTerm('');
    setSearchResults([]);
    if (onSelect) {
      onSelect([]);
    }
    if (onClear) {
      onClear();
    }
    // Focus input after clearing
    if (allowResearch && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  // Handle remove individual item
  const handleRemoveItem = (e, itemToRemove) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent dropdown from opening/closing
    
    const newSelectedItems = selectedItems.filter(item => item[valueKey] !== itemToRemove[valueKey]);
    setSelectedItems(newSelectedItems);
    
    if (onSelect) {
      onSelect(newSelectedItems);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
          handleItemToggle(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render selected items as tags
  const renderSelectedItems = () => {
    if (selectedItems.length === 0) {
      return null;
    }
    
    return selectedItems.map((item, index) => (
      <span key={item[valueKey] || index} className="searchable-multi-select__tag">
        <span className="searchable-multi-select__tag-text">{item[displayKey]}</span>
        <button
          type="button"
          className="searchable-multi-select__tag-remove"
          onClick={(e) => handleRemoveItem(e, item)}
          onMouseDown={(e) => e.preventDefault()} // Prevent input focus
          title="Remove"
          aria-label={`Remove ${item[displayKey]}`}
        >
          ×
        </button>
      </span>
    ));
  };

  return (
    <div className={`searchable-multi-select ${className}`} ref={dropdownRef}>
      {label && (
        <label className="searchable-multi-select__label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      
      <div className="searchable-multi-select__input-wrapper">
        <div
          className={`searchable-multi-select__control ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={handleInputFocus}
        >
          <div className="searchable-multi-select__value">
            {renderSelectedItems()}
            {allowResearch && (
              <input
                ref={inputRef}
                type="text"
                className="searchable-multi-select__search-input"
                placeholder={selectedItems.length === 0 ? placeholder : ''}
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                disabled={disabled}
                autoComplete="off"
                style={{
                  width: searchTerm ? `${Math.max(searchTerm.length * 8 + 20, 50)}px` : selectedItems.length === 0 ? '100%' : '50px'
                }}
              />
            )}
          </div>
          <div className="searchable-multi-select__actions">
            {selectedItems.length > 0 && (
              <button
                type="button"
                className="searchable-multi-select__clear"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                title="Clear all"
              >
                ×
              </button>
            )}
            <span className="searchable-multi-select__arrow">▼</span>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="searchable-multi-select__dropdown">
          {loading ? (
            <div className="searchable-multi-select__loading">
              {loadingText}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="searchable-multi-select__options">
              {searchResults.map((item, index) => {
                const isSelected = selectedItems.some(selected => selected[valueKey] === item[valueKey]);
                return (
                  <div
                    key={item[valueKey] || index}
                    className={`searchable-multi-select__option ${
                      highlightedIndex === index ? 'searchable-multi-select__option--highlighted' : ''
                    } ${isSelected ? 'searchable-multi-select__option--selected' : ''}`}
                    onClick={() => handleItemToggle(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleItemToggle(item)}
                      className="searchable-multi-select__checkbox"
                    />
                    {renderOption ? (
                      <div className="searchable-multi-select__custom-option">
                        {renderOption(item, index)}
                      </div>
                    ) : (
                      <span className="searchable-multi-select__option-text">
                        {item[displayKey]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="searchable-multi-select__no-results">
              {searchTerm.length < minSearchLength 
                ? `Type at least ${minSearchLength} characters to search`
                : noResultsText
              }
            </div>
          )}
        </div>
      )}

      {error && <span className="searchable-multi-select__error">{error}</span>}
    </div>
  );
};

export default SearchableMultiSelect;
