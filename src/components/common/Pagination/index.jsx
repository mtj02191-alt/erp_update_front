import React, { useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import './Pagination.css';

/**
 * Floor / select-option value for "View All".
 * Actual request size is max(totalItems, this) so >10k lists still load fully.
 */
export const VIEW_ALL_PAGE_SIZE = 10000;

const STANDARD_PAGE_SIZES = [10, 15, 20, 30];

/** Positive LIMIT large enough to cover the full result set. */
export function resolveViewAllPageSize(totalItems = 0) {
  const total = Math.max(0, Math.floor(Number(totalItems) || 0));
  return Math.max(total, VIEW_ALL_PAGE_SIZE);
}

/** True for legacy -1 or any View All-sized pageSize (>= floor). */
export function isViewAllPageSize(pageSize) {
  const n = Number(pageSize);
  return n === -1 || n >= VIEW_ALL_PAGE_SIZE;
}

/**
 * Ensures API requests never send a non-positive LIMIT.
 * Maps legacy View All (-1) / View All sizes to max(totalItems, floor).
 */
export function normalizePageSize(pageSize, totalItems = 0, fallback = 10) {
  const n = Number(pageSize);
  if (n === -1 || n >= VIEW_ALL_PAGE_SIZE) {
    return resolveViewAllPageSize(totalItems);
  }
  if (!Number.isFinite(n) || n < 1) {
    return Number.isFinite(fallback) && fallback > 0 ? fallback : 10;
  }
  return Math.floor(n);
}

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  sortField = 'created_at',
  sortOrder = 'DESC',
  sortOptions = []
}) => {
  const pageSizeOptions = [
    ...STANDARD_PAGE_SIZES,
    { value: VIEW_ALL_PAGE_SIZE, label: 'View All' },
  ];

  const viewingAll = isViewAllPageSize(pageSize);
  const selectValue = viewingAll ? VIEW_ALL_PAGE_SIZE : pageSize;

  // Migrate persisted pageSize=-1; grow View All if total exceeds current size
  useEffect(() => {
    if (typeof onPageSizeChange !== 'function') return;
    if (Number(pageSize) === -1) {
      onPageSizeChange(resolveViewAllPageSize(totalItems));
      return;
    }
    if (isViewAllPageSize(pageSize)) {
      const needed = resolveViewAllPageSize(totalItems);
      if (needed > pageSize) {
        onPageSizeChange(needed);
      }
    }
  }, [pageSize, totalItems, onPageSizeChange]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    const raw = Number(newPageSize);
    const next =
      raw === VIEW_ALL_PAGE_SIZE || raw === -1 || raw >= VIEW_ALL_PAGE_SIZE
        ? resolveViewAllPageSize(totalItems)
        : normalizePageSize(raw, totalItems, pageSize);
    if (next !== pageSize) {
      onPageSizeChange(next);
    }
  };

  const handleSortChange = (field, order) => {
    onSortChange(field, order);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const safePageSize = viewingAll
    ? Math.max(totalItems, 1)
    : Math.max(Number(pageSize) || 10, 1);
  const startItem = viewingAll ? 1 : (currentPage - 1) * safePageSize + 1;
  const endItem = viewingAll
    ? totalItems
    : Math.min(currentPage * safePageSize, totalItems);

  const getDisplayText = () => {
    if (viewingAll) {
      return `Showing all ${totalItems} items`;
    }
    return `Showing ${startItem} to ${endItem} of ${totalItems} items`;
  };

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        <span className="pagination-text">{getDisplayText()}</span>
      </div>

      <div className="pagination-controls">
        <div className="page-size-selector">
          <label htmlFor="pageSize">Records per page:</label>
          <select
            id="pageSize"
            value={selectValue}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="page-size-select"
          >
            {pageSizeOptions.map((option) => {
              const value = typeof option === 'object' ? option.value : option;
              const label = typeof option === 'object' ? option.label : option;
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        {sortOptions.length > 0 && !viewingAll && (
          <div className="sort-selector">
            <label htmlFor="sortField">Sort by:</label>
            <select
              id="sortField"
              value={sortField}
              onChange={(e) => handleSortChange(e.target.value, sortOrder)}
              className="sort-field-select"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`sort-order-btn ${sortOrder === 'ASC' ? 'active' : ''}`}
              onClick={() =>
                handleSortChange(
                  sortField,
                  sortOrder === 'ASC' ? 'DESC' : 'ASC',
                )
              }
              title={`Sort ${sortOrder === 'ASC' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'ASC' ? '↑' : '↓'}
            </button>
          </div>
        )}

        {!viewingAll && (
          <div className="pagination-navigation">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              title="First Page"
            >
              <FiChevronsLeft />
            </button>

            <button
              type="button"
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              title="Previous Page"
            >
              <FiChevronLeft />
            </button>

            <div className="page-numbers">
              {getPageNumbers().map((page, index) => (
                <button
                  type="button"
                  key={index}
                  className={`page-number ${page === currentPage ? 'active' : ''} ${
                    page === '...' ? 'ellipsis' : ''
                  }`}
                  onClick={() => page !== '...' && handlePageChange(page)}
                  disabled={page === '...'}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              title="Next Page"
            >
              <FiChevronRight />
            </button>

            <button
              type="button"
              className="pagination-btn"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              title="Last Page"
            >
              <FiChevronsRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;
