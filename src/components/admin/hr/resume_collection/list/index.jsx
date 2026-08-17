import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';
import Pagination from '../../../../common/Pagination';
import { SearchFilter, DropdownFilter, RefreshButton } from '../../../../common/filters';
import { SearchButton, ClearButton } from '../../../../common/filters/index';
import { departments } from '../../../../../utils/user';
import { FiEye, FiTrash2, FiDownload } from 'react-icons/fi';
import './index.css';

const departmentLabel = (value) => {
  if (!value) return '—';
  const found = departments.find((d) => d.value === value);
  return found?.label || value;
};

const emptyFilters = () => ({
  search: '',
  applicant_name: '',
  phone: '',
  email: '',
  cnic: '',
  address: '',
  city: '',
  role: '',
  experience: '',
  education: '',
  department: '',
  notes: '',
});

const ResumeCollectionList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [tempFilters, setTempFilters] = useState(emptyFilters());
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters());

  useEffect(() => {
    fetchItems();
  }, [currentPage, pageSize, appliedFilters]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: currentPage,
        pageSize,
      };
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value && String(value).trim()) {
          params[key] = String(value).trim();
        }
      });

      const response = await axiosInstance.get('/resume-collection', { params });

      if (response.data.success) {
        setItems(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resume collection');
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
    const empty = emptyFilters();
    setTempFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

  const handleDownload = async (row) => {
    try {
      const response = await axiosInstance.get(`/resume-collection/${row.id}/file`, {
        responseType: 'blob',
        params: { disposition: 'attachment' },
      });
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = row.original_filename || 'resume';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download file');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this resume from the collection?')) return;
    try {
      await axiosInstance.delete(`/resume-collection/${id}`);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const truncate = (text, max = 40) => {
    if (!text) return '—';
    return text.length > max ? `${text.slice(0, max)}…` : text;
  };

  const getActionMenuItems = (row) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/hr/resume-collection/view/${row.id}`),
      visible: true,
    },
    {
      icon: <FiDownload />,
      label: 'Download',
      color: '#2196F3',
      onClick: () => handleDownload(row),
      visible: !!row.resume_url,
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDelete(row.id),
      visible: true,
    },
  ];

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <div className="list-content resume-collection-list">
          <PageHeader
            title="Resume Collection"
            showBackButton={false}
            showAdd
            addPath="/hr/resume-collection/add"
            addTitle="Upload Resume"
          />

          {error && <div className="status-message status-message--error">{error}</div>}

          <div className="resume-collection-filters card">
          <div className="resume-collection-filters-grid">
            <SearchFilter
              filterKey="applicant_name"
              label="Applicant name"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            <SearchFilter
              filterKey="phone"
              label="Phone"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            <SearchFilter
              filterKey="email"
              label="Email"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            <SearchFilter
              filterKey="cnic"
              label="CNIC"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            <SearchFilter
              filterKey="address"
              label="Address"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            <SearchFilter
              filterKey="city"
              label="City"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            <SearchFilter
              filterKey="role"
              label="Role"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            <SearchFilter
              filterKey="experience"
              label="Experience"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            <SearchFilter
              filterKey="education"
              label="Education"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            <DropdownFilter
              filterKey="department"
              label="Department"
              data={departments}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All departments"
            />
            <SearchFilter
              filterKey="notes"
              label="Notes"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            <SearchFilter
              filterKey="search"
              label="Search all"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Search all fields..."
              className="search-filter-container--wide"
            />
            <div className="resume-collection-filters-actions">
              <SearchButton onClick={handleApplyFilters} />
              <ClearButton onClick={handleClearFilters} />
              <RefreshButton onClick={fetchItems} loading={loading} />
            </div>
          </div>
        </div>

          <div className="table-container resume-collection-table-container">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <table className="data-table resume-collection-table">
                <thead>
                  <tr>
                    <th className="col-applicant">Applicant</th>
                    <th className="col-phone">Phone</th>
                    <th className="col-email">Email</th>
                    <th className="col-role">Role</th>
                    <th className="col-city">City</th>
                    <th className="col-department">Department</th>
                    <th className="table-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((row) => (
                      <tr key={row.id}>
                        <td className="col-applicant">
                          <span className="resume-collection-applicant">
                            {row.applicant_name || '—'}
                          </span>
                        </td>
                        <td className="col-phone">{row.phone || '—'}</td>
                        <td className="col-email">{row.email || '—'}</td>
                        <td className="col-role" title={row.role || ''}>
                          {truncate(row.role, 32)}
                        </td>
                        <td className="col-city">{row.city || '—'}</td>
                        <td className="col-department">{departmentLabel(row.department)}</td>
                        <td className="table-actions">
                          <ActionMenu actions={getActionMenuItems(row)} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-data">
                        No resumes in collection yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {!loading && (
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
          )}
        </div>
      </div>
    </>
  );
};

export default ResumeCollectionList;
