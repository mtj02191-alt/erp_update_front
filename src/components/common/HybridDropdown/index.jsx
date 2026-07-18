import React, { useState, useRef, useEffect } from 'react';
import './styles.css';

/**
 * HybridDropdown Component
 * A dropdown that allows both custom input and selection from predefined options
 * No API calls - works with local data only
 * 
 * @param {string} label - Label for the input field
 * @param {string} placeholder - Placeholder text for the input
 * @param {Array} options - Array of options to display in dropdown
 * @param {Function} onChange - Callback when value changes (receives value)
 * @param {string} value - Current value (controlled)
 * @param {string} name - Input name attribute
 * @param {boolean} required - Whether field is required
 * @param {string} displayKey - Key to display from option objects (default: 'label')
 * @param {string} valueKey - Key to use as value from option objects (default: 'value')
 * @param {boolean} allowCustom - Allow custom input (default: true)
 * @param {string} className - Additional CSS classes
 */
const HybridDropdown = ({
  label,
  placeholder = 'Type or select...',
  options = [],
  onChange,
  value = '',
  name,
  required = false,
  displayKey = 'label',
  valueKey = 'value',
  allowCustom = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isCustomValue, setIsCustomValue] = useState(false);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
    // Check if current value is from options or custom
    const isFromOptions = options.some(option => 
      (typeof option === 'string' ? option : option[valueKey]) === value
    );
    setIsCustomValue(!isFromOptions && value !== '');
  }, [value, options, valueKey]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsCustomValue(true);
    setHighlightedIndex(-1);
    
    if (onChange) {
      onChange(newValue);
    }
  };

  // Handle option selection
  const handleOptionSelect = (option) => {
    const optionValue = typeof option === 'string' ? option : option[valueKey];
    const optionLabel = typeof option === 'string' ? option : option[displayKey];
    
    setInputValue(optionLabel);
    setIsCustomValue(false);
    setIsOpen(false);
    setHighlightedIndex(-1);
    
    if (onChange) {
      onChange(optionValue);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
  };

  // Handle input blur (with delay to allow option selection)
  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || options.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleOptionSelect(options[highlightedIndex]);
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

  // Filter options based on input
  const filteredOptions = options.filter(option => {
    const optionLabel = typeof option === 'string' ? option : option[displayKey];
    return optionLabel.toLowerCase().includes(inputValue.toLowerCase());
  });

  return (
    <div className={`hybrid-dropdown ${className}`} ref={dropdownRef}>
      {label && (
        <label className="hybrid-dropdown__label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      
      <div className="hybrid-dropdown__input-wrapper">
        <input
          ref={inputRef}
          type="text"
          name={name}
          className="hybrid-dropdown__input"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          required={required}
          autoComplete="off"
        />
        
        <div className="hybrid-dropdown__arrow">
          ▼
        </div>
      </div>

      {isOpen && (
        <div className="hybrid-dropdown__dropdown">
          {filteredOptions.length > 0 ? (
            <div className="hybrid-dropdown__options">
              {filteredOptions.map((option, index) => {
                const optionLabel = typeof option === 'string' ? option : option[displayKey];
                return (
                  <div
                    key={typeof option === 'string' ? option : option[valueKey] || index}
                    className={`hybrid-dropdown__option ${
                      highlightedIndex === index ? 'hybrid-dropdown__option--highlighted' : ''
                    }`}
                    onClick={() => handleOptionSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {optionLabel}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="hybrid-dropdown__no-results">
              {allowCustom ? 'Type to add custom value' : 'No options available'}
            </div>
          )}
        </div>
      )}

      {isCustomValue && inputValue && (
        <div className="hybrid-dropdown__custom-indicator">
          Custom value
        </div>
      )}
    </div>
  );
};

export default HybridDropdown;
