import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { MdEdit, MdAdd } from 'react-icons/md';
import { FaFilter } from 'react-icons/fa6';
import { useNavigationHistory } from '../../../context/NavigationHistoryContext';
import RefreshButton from '../filters/RefreshButton';
import './PageHeader.css';

const PageHeader = ({
  title,
  backPath,
  onBackClick,
  showBackButton = true,
  className = '',
  showEdit = false,
  editPath = '',
  showAdd = false,
  addPath = '',
  onAddClick,
  addDisabled = false,
  addTitle = 'Add new',
  showFilterToggle = false,
  filtersOpen = false,
  onFilterToggle,
  filterTitle = 'Toggle filters',
  onRefresh,
  refreshing = false,
  refreshTitle = 'Refresh',
  rightElement,
}) => {
  const navigate = useNavigate();
  const { canGoBack } = useNavigationHistory();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
      return;
    }

    // Prefer browser/in-app history when the user came from another app screen
    if (canGoBack) {
      navigate(-1);
      return;
    }

    // No in-app history (direct link / refresh) → safe default
    if (backPath) {
      navigate(backPath);
      return;
    }

    navigate('/welcome');
  };

  const handleEditClick = () => {
    if (editPath) {
      navigate(editPath);
    }
  };

  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick();
      return;
    }
    if (addPath) {
      navigate(addPath);
    }
  };

  return (
    <div className={`page-header ${className}`}>
      <div className="page-header-content">
        {showBackButton && (
          <button
            type="button"
            className="back-button"
            onClick={handleBackClick}
            title="Go back"
          >
            <FiArrowLeft />
          </button>
        )}
        <h1 className="page-title">{title}</h1>
        {showFilterToggle && (
          <button
            type="button"
            className={`back-button filter-toggle-button${filtersOpen ? ' filter-toggle-button--active' : ''}`}
            onClick={onFilterToggle}
            title={filterTitle}
            aria-label={filterTitle}
            aria-expanded={filtersOpen}
          >
            <FaFilter />
          </button>
        )}
        {onRefresh && (
          <RefreshButton
            variant="header"
            onClick={onRefresh}
            loading={refreshing}
            title={refreshTitle}
          />
        )}
        {showAdd && (addPath || onAddClick) && (
          <button
            type="button"
            className={`back-button ${addDisabled ? 'disabled' : ''}`}
            onClick={handleAddClick}
            title={addTitle}
            disabled={addDisabled}
          >
            <MdAdd />
          </button>
        )}
        {showEdit && editPath && (
          <button
            type="button"
            className="back-button"
            onClick={handleEditClick}
            title="Edit"
          >
            <MdEdit />
          </button>
        )}
        {rightElement}
      </div>
    </div>
  );
};

export default PageHeader;
