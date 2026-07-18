import React, { useState, useEffect, useRef, useMemo } from 'react';
import { simpleDebounce } from '../../../utils/debounce';
import axiosInstance from '../../../utils/axios';
import './styles.css';

/**
 * SearchableDropdown Component
 * A reusable component that provides search functionality with debouncing
 * and displays results in a dropdown. Can be used for user assignment, etc.
 * 
 * @param {string} label - Label for the input field
 * @param {string} placeholder - Placeholder text for the input
 * @param {Function} onSearch - Callback function to fetch search results (receives search term)
 * @param {string} apiEndpoint - API endpoint to call for search (alternative to onSearch)
 * @param {object} apiParams - Additional params to send with API request
 * @param {string} searchParamName - Name of the search query parameter (default: 'search')
 * @param {Function} onSelect - Callback when an item is selected (receives selected item)
 * @param {Function} renderOption - Custom render function for dropdown options (receives item, index). 
 *                                   Component automatically wraps it with key, onClick, and onMouseEnter handlers.
 *                                   Just return the content you want to display (use Fragment or div).
 * @param {string} displayKey - Key to display in the input after selection (default: 'name'). Falls back to 'name' property if displayKey doesn't exist.
 * @param {number} debounceDelay - Delay in ms before triggering search (default: 500)
 * @param {number} minSearchLength - Minimum characters before search (default: 2)
 * @param {string} loadingText - Text to show while loading (default: 'Searching...')
 * @param {string} noResultsText - Text to show when no results (default: 'No results found')
 * @param {string} name - Input name attribute
 * @param {boolean} required - Whether field is required
 * @param {any} value - Controlled value (selected item)
 * @param {Function} onClear - Callback when selection is cleared
 * @param {boolean} allowResearch - Allow searching again after selection (default: true)
 */
const SearchableDropdown = ({
  label,
  placeholder = 'Type to search...',
  onSearch,
  apiEndpoint,
  apiParams = {},
  searchParamName = 'search',
  onSelect,
  renderOption,
  displayKey = 'name',
  debounceDelay = 500,
  minSearchLength = 2,
  loadingText = 'Searching...',
  noResultsText = 'No results found',
  name,
  required = false,
  value = null,
  onClear,
  allowResearch = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Perform search function
  const performSearch = async (term) => {
    if (term.length < minSearchLength) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let results;
      
      // Use custom onSearch if provided, otherwise use API endpoint
      if (onSearch) {
        results = await onSearch(term);
      } else if (apiEndpoint) {
        const response = await axiosInstance.get(apiEndpoint, {
          params: { [searchParamName]: term, ...apiParams }
        });
        results = response.data.data || response.data || [];
      } else {
        results = [];
      }
      
      setResults(results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Create debounced search function using useMemo
  const debouncedSearch = useMemo(
    () => simpleDebounce(performSearch, debounceDelay),
    [debounceDelay, minSearchLength, onSearch, apiEndpoint, apiParams, searchParamName]
  );

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);
    setHighlightedIndex(-1);
    
    if (value.length >= minSearchLength) {
      setIsLoading(true);
      debouncedSearch(value);
    } else {
      setResults([]);
      setIsLoading(false);
    }
  };

  // Handle item selection
  const handleSelect = (item) => {
    // console.log("wqeeerwrwre13213", item);
    setSelectedItem(item);
    setSearchTerm(item[displayKey] || '');
    setIsOpen(false);
    setResults([]);
    setHighlightedIndex(-1);
    if (onSelect) {
      onSelect(item);
    }
  };

  // Handle input focus - allow re-searching
  const handleInputFocus = () => {
    if (!allowResearch && selectedItem) {
      // If research is not allowed and item is selected, don't open dropdown
      return;
    }
    
    if (searchTerm && searchTerm.length >= minSearchLength) {
      setIsOpen(true);
      // Re-trigger search if there's a term
      if (results.length === 0) {
        setIsLoading(true);
        debouncedSearch(searchTerm);
      }
    }
  };

  // Handle clear selection
  const handleClear = () => {
    setSelectedItem(null);
    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
    if (onClear) {
      onClear();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selected item when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedItem(value);
      setSearchTerm(value[displayKey] || '');
    } else {
      setSelectedItem(null);
      setSearchTerm('');
    }
  }, [value, displayKey]);

  // Default render function for options
  const defaultRenderOption = (item, index) => {
    // Use displayKey first, then fallback to 'name', then 'Unnamed'
    const displayValue = item[displayKey] || item.name || 'Unnamed';
    
    return (
      <div 
        key={item.id || index}
        className={`searchable-dropdown__option ${
          highlightedIndex === index ? 'searchable-dropdown__option--highlighted' : ''
        }`}
        onClick={() => handleSelect(item)}
        onMouseEnter={() => setHighlightedIndex(index)}
      >
        <div className="searchable-dropdown__option-name">
          {displayValue}
        </div>
        {item.email && (
          <div className="searchable-dropdown__option-secondary">
            {item.email}
          </div>
        )}
      </div>
    );
  };

  const renderOptionFunc = renderOption || defaultRenderOption;

  return (
    <div className="searchable-dropdown" ref={dropdownRef}>
      {label && (
        <label className="searchable-dropdown__label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      
      <div className="searchable-dropdown__input-wrapper">
        <input
          ref={inputRef}
          type="text"
          name={name}
          className="searchable-dropdown__input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          required={required}
          autoComplete="off"
        />
        
        {selectedItem && (
          <button
            type="button"
            className="searchable-dropdown__clear"
            onClick={handleClear}
            aria-label="Clear selection"
          >
            ×
          </button>
        )}
        
        {isLoading && (
          <div className="searchable-dropdown__loading">
            <div className="spinner-small"></div>
          </div>
        )}
      </div>

      {isOpen && searchTerm.length >= minSearchLength && (
        <div className="searchable-dropdown__dropdown">
          {isLoading ? (
            <div className="searchable-dropdown__message">
              {loadingText}
            </div>
          ) : results.length > 0 ? (
            <div className="searchable-dropdown__results">
              {results.map((item, index) => {
                // If custom render is provided, wrap it with necessary handlers
                if (renderOption) {
                  return (
                    <div
                      key={item.id || index}
                      className={`searchable-dropdown__option ${
                        highlightedIndex === index ? 'searchable-dropdown__option--highlighted' : ''
                      }`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      {renderOption(item, index)}
                    </div>
                  );
                }
                // Use default render
                return defaultRenderOption(item, index);
              })}
            </div>
          ) : (
            <div className="searchable-dropdown__message searchable-dropdown__message--empty">
              {noResultsText}
            </div>
          )}
        </div>
      )}

      {searchTerm.length > 0 && searchTerm.length < minSearchLength && (
        <div className="searchable-dropdown__hint">
          Type at least {minSearchLength} characters to search
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;

