import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from '../../../../common/buttons/primary';
import SecondaryButton from '../../../../common/buttons/secondary';
import ActionMenu from '../../../../common/ActionMenu';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import Pagination from '../../../../common/Pagination';
import Table from '../../../../common/table';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import { DropdownFilter } from '../../../../common/filters';
import { DownloadCSV } from '../../../../common/download';

const InKindItemsList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Filter states
  const [tempFilters, setTempFilters] = useState({
    category: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    category: ''
  });

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'food', label: 'Food' },
    { value: 'medical', label: 'Medical' },
    { value: 'educational', label: 'Educational' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'books', label: 'Books' },
    { value: 'toys', label: 'Toys' },
    { value: 'household', label: 'Household' },
    { value: 'other', label: 'Other' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Item Name' },
    { value: 'category', label: 'Category' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' }
  ];

  const fetchItems = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: itemsPerPage.toString(),
        sortField: sortBy,
        sortOrder: sortOrder.toUpperCase(),
        ...(appliedFilters.category && { category: appliedFilters.category })
      });
      const response = await axiosInstance.get('/dms/in-kind-items/list', {params: queryParams});
      
      if (response.data.success) {
        setItems(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalItems(response.data.pagination?.totalItems || 0);
      } else {
        setError('Failed to fetch in-kind items');
      }
    } catch (err) {
      console.error('Error fetching in-kind items:', err);
      setError('Failed to fetch in-kind items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentPage, sortBy, sortOrder, appliedFilters]);

  const handleFilterChange = (key, value) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setTempFilters({
      category: ''
    });
    setAppliedFilters({
      category: ''
    });
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleView = (item) => {
    navigate(`/dms/in-kind-items/view/${item.id}`);
  };

  const handleEdit = (item) => {
    navigate(`/dms/in-kind-items/edit/${item.id}`);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await axiosInstance.delete(`/dms/in-kind-items/${itemToDelete.id}`);
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchItems(); // Refresh the list
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item. Please try again.');
    }
  };

  const handleAddNew = () => {
    navigate('/dms/in-kind-items/add');
  };

  const getCategoryBadge = (category) => {
    const categoryLabels = {
      clothing: 'Clothing',
      food: 'Food',
      medical: 'Medical',
      educational: 'Educational',
      electronics: 'Electronics',
      furniture: 'Furniture',
      books: 'Books',
      toys: 'Toys',
      household: 'Household',
      other: 'Other'
    };

    return (
      <span className="status-badge status-badge--info">
        {categoryLabels[category] || category}
      </span>
    );
  };

  // Table columns configuration
  const tableColumns = [
    {
      key: 'name',
      label: 'Item Name',
      render: (value, row) => (
        <div style={{ fontWeight: '500', color: '#374151' }}>
          {value}
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (value, row) => getCategoryBadge(value)
    },
    {
      key: 'description',
      label: 'Description',
      hideOnMobile: true,
      render: (value, row) => (
        <div style={{ 
          maxWidth: '200px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap' 
        }}>
          {value || '-'}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Created Date',
      render: (value, row) => (
        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          {formatDate(value)}
        </div>
      )
    }
  ];

  // Render actions for each row
  const renderRowActions = (item) => (
    <ActionMenu
      onView={() => handleView(item)}
      onEdit={() => handleEdit(item)}
      onDelete={() => handleDelete(item)}
    />
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // const csvData = items.map(item => ({
  //   'Item Code': item.item_code,
  //   'Item Name': item.name,
  //   'Category': item.category,
  //   'Description': item.description || '',
  //   'Created Date': formatDate(item.created_at),
  //   'Updated Date': formatDate(item.updated_at)
  // }));

    const csvData = {}


  const csvHeaders = [
    { label: 'Item Code', key: 'Item Code' },
    { label: 'Item Name', key: 'Item Name' },
    { label: 'Category', key: 'Category' },
    { label: 'Description', key: 'Description' },
    { label: 'Created Date', key: 'Created Date' },
    { label: 'Updated Date', key: 'Updated Date' }
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader title="In-Kind Items" />
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div>Loading in-kind items...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader 
          title="In-Kind Items" 
          onBack={() => navigate('/dms')}
        />
        
        {error && (
          <div className="status-message status-message--error">
            {error}
          </div>
        )}

        <div className="list-wrapper">
          <div className="list-content">
            {/* Filters */}
            <div className="filters-section" style={{ 
              display: 'flex', 
              gap: '20px', 
              flexWrap: 'wrap', 
              marginBottom: '20px',
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px'
            }}>
              <DropdownFilter
                filterKey="category"
                label="Category"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                data={categoryOptions}
              />

              <div style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                <button
                  onClick={handleApplyFilters}
                  className="primary_btn"
                  style={{ padding: '8px 16px' }}
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="secondary_btn"
                  style={{ padding: '8px 16px' }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <PrimaryButton onClick={handleAddNew}>
                  Add New Item
                </PrimaryButton>
                <DownloadCSV
                  data={csvData}
                  headers={csvHeaders}
                  filename="in_kind_items"
                  label="Export CSV"
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontSize: '14px', color: '#374151' }}>Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="secondary_btn"
                  style={{ padding: '6px 12px' }}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {/* Items Table */}
            <Table
              columns={tableColumns}
              data={items}
              renderActions={renderRowActions}
              showActions={false} 
              emptyMessage="No in-kind items found"
              onRowClick={handleView}
              striped={true}
              hoverable={true}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
              />
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Delete In-Kind Item"
          message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      </div>
    </>
  );
};

export default InKindItemsList;
