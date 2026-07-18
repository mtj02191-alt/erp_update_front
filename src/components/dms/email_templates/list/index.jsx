import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Pagination from '../../../common/Pagination';
import { SearchFilter } from '../../../common/filters';
import { SearchButton, ClearButton } from '../../../common/filters/index';
import { FiEye, FiEdit2, FiTrash2, FiPlus, FiMail } from 'react-icons/fi';

const EmailTemplateList = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Filter state
  const [tempFilters, setTempFilters] = useState({ search: '', category: '' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '', category: '' });

  useEffect(() => {
    fetchTemplates();
  }, [currentPage, pageSize, appliedFilters]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/email-templates', {
        params: {
          page: currentPage,
          pageSize: pageSize,
          search: appliedFilters.search,
          category: appliedFilters.category
        }
      });
      
      if (response.data.success) {
        setTemplates(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch templates');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(tempFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    const empty = { search: '', category: '' };
    setTempFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this template?')) {
      try {
        await axiosInstance.delete(`/email-templates/${id}`);
        fetchTemplates();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete template');
      }
    }
  };

  const getActionMenuItems = (template) => [
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => navigate(`/dms/email_templates/edit/${template.id}`),
      visible: true
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDelete(template.id),
      visible: true
    }
  ];

  return (
    <>
      <Navbar />
      <div className="list-content">
        <PageHeader 
          title="Email Templates" 
          actions={
            <button className="primary-btn" onClick={() => navigate('/dms/email_templates/add')}>
              <FiPlus /> Add Template
            </button>
          }
        />

        <div className="filters-container card">
          <div className="filters-grid">
            <SearchFilter 
              filterKey="search"
              label="Search Name/Subject"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            <div className="filter-item">
              <label>Category</label>
              <select 
                value={tempFilters.category} 
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="form-control"
              >
                <option value="">All Categories</option>
                <option value="donation">Donation</option>
                <option value="receipt">Receipt</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          <div className="filters-actions">
            <SearchButton onClick={handleApplyFilters} />
            <ClearButton onClick={handleClearFilters} />
          </div>
        </div>

        <div className="table-container card">
          {loading ? (
            <div className="loading">Loading templates...</div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.length > 0 ? (
                  templates.map(template => (
                    <tr key={template.id}>
                      <td>{template.name}</td>
                      <td>{template.subject}</td>
                      <td><span className="badge">{template.category}</span></td>
                      <td>
                        <span className={`status-badge ${template.is_active ? 'status-completed' : 'status-failed'}`}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <ActionMenu actions={getActionMenuItems(template)} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">No templates found</td>
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
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        </div>
      </div>
    </>
  );
};

export default EmailTemplateList;
