import React from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import './Pagination.css';

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
  const pageSizeOptions = [10, 15, 20, 30, { value: -1, label: 'View All' }];

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    if (newPageSize !== pageSize) {
      onPageSizeChange(newPageSize);
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
    } else {
      if (currentPage <= 3) {
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
    }
    
    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Calculate display text based on viewing mode
  const getDisplayText = () => {
    if (pageSize === -1) {
      return `Showing all ${totalItems} items`;
    }
    return `Showing ${startItem} to ${endItem} of ${totalItems} items`;
  };

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        <span className="pagination-text">
          {getDisplayText()}
        </span>
      </div>

      <div className="pagination-controls">
        {/* Page Size Selector */}
        <div className="page-size-selector">
          <label htmlFor="pageSize">Records per page:</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="page-size-select"
          >
            {pageSizeOptions.map(option => {
              const value = typeof option === 'object' ? option.value : option;
              const label = typeof option === 'object' ? option.label : option;
              return (
                <option key={value} value={value}>{label}</option>
              );
            })}
          </select>
        </div>

        {/* Sort Options - Only show when not viewing all */}
        {sortOptions.length > 0 && pageSize !== -1 && (
          <div className="sort-selector">
            <label htmlFor="sortField">Sort by:</label>
            <select
              id="sortField"
              value={sortField}
              onChange={(e) => handleSortChange(e.target.value, sortOrder)}
              className="sort-field-select"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              className={`sort-order-btn ${sortOrder === 'ASC' ? 'active' : ''}`}
              onClick={() => handleSortChange(sortField, sortOrder === 'ASC' ? 'DESC' : 'ASC')}
              title={`Sort ${sortOrder === 'ASC' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'ASC' ? '↑' : '↓'}
            </button>
          </div>
        )}


        {/* Pagination Navigation - Only show when not viewing all */}
        {pageSize !== -1 && (
          <div className="pagination-navigation">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            title="First Page"
          >
            <FiChevronsLeft />
          </button>
          
          <button
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
                key={index}
                className={`page-number ${page === currentPage ? 'active' : ''} ${page === '...' ? 'ellipsis' : ''}`}
                onClick={() => page !== '...' && handlePageChange(page)}
                disabled={page === '...'}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Next Page"
          >
            <FiChevronRight />
          </button>
          
          <button
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