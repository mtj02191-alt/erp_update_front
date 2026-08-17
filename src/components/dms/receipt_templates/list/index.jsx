import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import Pagination from '../../../common/Pagination';
import { SearchFilter, CollapsibleFilters } from '../../../common/filters';
import { SearchButton, ClearButton } from '../../../common/filters/index';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';
import { FiEye, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

const ReceiptTemplateList = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { filtersOpen, toggleFilters } = useFiltersPanel();
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [tempFilters, setTempFilters] = useState({ search: '' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '' });

  useEffect(() => {
    fetchTemplates();
  }, [currentPage, pageSize, appliedFilters]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get('/receipt-templates', {
        params: {
          page: currentPage,
          pageSize,
          search: appliedFilters.search,
        },
      });

      if (response.data.success) {
        setTemplates(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError('Failed to fetch receipt templates');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch receipt templates');
      console.error('Error fetching receipt templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(tempFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    const empty = { search: '' };
    setTempFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this receipt template?')) {
      return;
    }
    try {
      await axiosInstance.delete(`/receipt-templates/${id}`);
      fetchTemplates();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete receipt template');
    }
  };

  const getActionMenuItems = (template) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/dms/receipt_templates/view/${template.id}`),
      visible: true,
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => navigate(`/dms/receipt_templates/edit/${template.id}`),
      visible: true,
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDelete(template.id),
      visible: true,
    },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Navbar />
      <div className="list-content">
        <PageHeader
          onRefresh={fetchTemplates}
          refreshing={loading}
          title="Receipt Templates"
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          showAdd
          addPath="/dms/receipt_templates/add"
          addTitle="Add Template"
        />

        {error && (
          <div className="status-message status-message--error">{error}</div>
        )}

        <CollapsibleFilters open={filtersOpen}>
        <div className="filters-container card">
          <div className="filters-grid">
            <SearchFilter
              filterKey="search"
              label="Search by name"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
          </div>
          <div className="filters-actions">
            <SearchButton onClick={handleApplyFilters} />
            <ClearButton onClick={handleClearFilters} />
          </div>
        </div>
        </CollapsibleFilters>

        <div className="table-container card">
          {loading ? (
            <div className="loading">Loading receipt templates...</div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.length > 0 ? (
                  templates.map((template) => (
                    <tr key={template.id}>
                      <td>{template.name}</td>
                      <td>{formatDate(template.created_at)}</td>
                      <td>{formatDate(template.updated_at)}</td>
                      <td>
                        <ActionMenu actions={getActionMenuItems(template)} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center">
                      No receipt templates found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default ReceiptTemplateList;
