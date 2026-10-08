import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../../../../../utils/axios';
import PageHeader from '../../../../../common/PageHeader';
import ActionMenu from '../../../../../common/ActionMenu';
import Pagination from '../../../../../common/Pagination';
import ConfirmationModal from '../../../../../common/ConfirmationModal';
import Navbar from '../../../../../Navbar';
import {
  SearchFilter,
  DropdownFilter,
  DateRangeFilter,
  SearchButton,
  ClearButton,
  CollapsibleFilters,
} from '../../../../../common/filters';
import useFiltersPanel from '../../../../../../hooks/useFiltersPanel';
import { FiEye, FiTrash2, FiDownload } from 'react-icons/fi';

const EMPTY_FILTERS = {
  search: '',
  job_id: '',
  status: '',
  gender: '',
  city: '',
  has_work_experience: '',
  from_date: '',
  to_date: '',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'true', label: 'Has experience' },
  { value: 'false', label: 'Fresh / no experience' },
];

const STATUS_COLORS = {
  pending: { background: '#fef3c7', color: '#92400e' },
  reviewed: { background: '#dbeafe', color: '#1e40af' },
  shortlisted: { background: '#ede9fe', color: '#5b21b6' },
  rejected: { background: '#fee2e2', color: '#991b1b' },
  hired: { background: '#dcfce7', color: '#166534' },
};

const truncate = (value, max = 25) => {
  if (!value) return '-';
  const text = String(value);
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const TruncatedCell = ({ value, max }) => (
  <span title={value || ''}>{truncate(value, max)}</span>
);

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Application Date' },
  { value: 'applicant_name', label: 'Applicant Name' },
  { value: 'email', label: 'Email' },
  { value: 'status', label: 'Status' },
  { value: 'city', label: 'City' },
];

const AdminApplicationsList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';
  const initialFilters = { ...EMPTY_FILTERS, job_id: initialJobId };

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jobOptions, setJobOptions] = useState([]);
  const { filtersOpen, toggleFilters } = useFiltersPanel(Boolean(initialJobId));

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [tempFilters, setTempFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState(null);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await axiosInstance.get('/jobs', { params: { page: 1, limit: 100 } });
        const jobs = res.data?.data?.jobs || [];
        const options = jobs.map((j) => ({ value: String(j.id), label: j.title }));
        if (initialJobId && !options.some((o) => o.value === initialJobId)) {
          try {
            const jobRes = await axiosInstance.get(`/jobs/${initialJobId}`);
            const job = jobRes.data?.data;
            options.unshift({ value: initialJobId, label: job?.title || `Job #${initialJobId}` });
          } catch {
            options.unshift({ value: initialJobId, label: `Job #${initialJobId}` });
          }
        }
        setJobOptions(options);
      } catch (err) {
        console.error('Error fetching jobs for filter:', err);
      }
    };
    loadJobs();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: currentPage,
        pageSize,
        sortField,
        sortOrder,
      };
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value !== '' && value != null) params[key] = value;
      });
      if (params.to_date) params.to_date = `${params.to_date}T23:59:59`;

      const response = await axiosInstance.get('/job_applications', { params });
      setApplications(response.data?.data || []);
      setTotalItems(response.data?.pagination?.total || 0);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const syncJobIdParam = (jobId) => {
    const next = new URLSearchParams(searchParams);
    if (jobId) next.set('jobId', jobId);
    else next.delete('jobId');
    setSearchParams(next, { replace: true });
  };

  const handleApplyFilters = () => {
    syncJobIdParam(tempFilters.job_id);
    if (JSON.stringify(appliedFilters) !== JSON.stringify(tempFilters)) {
      setAppliedFilters(tempFilters);
      setCurrentPage(1);
    } else {
      fetchApplications();
    }
  };

  const handleClearFilters = () => {
    syncJobIdParam('');
    setTempFilters(EMPTY_FILTERS);
    if (JSON.stringify(appliedFilters) !== JSON.stringify(EMPTY_FILTERS)) {
      setAppliedFilters(EMPTY_FILTERS);
      setCurrentPage(1);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!applicationToDelete) return;
    try {
      await axiosInstance.delete(`/job_applications/${applicationToDelete.id}`);
      setShowDeleteModal(false);
      setApplicationToDelete(null);
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete application');
      console.error('Error deleting application:', err);
    }
  };

  const getApplicantName = (app) =>
    app.applicant_name ||
    [app.first_name, app.last_name].filter(Boolean).join(' ') ||
    '-';

  const getStatusBadge = (status) => {
    const key = STATUS_COLORS[status] ? status : 'pending';
    return (
      <span
        style={{
          ...STATUS_COLORS[key],
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'capitalize',
          whiteSpace: 'nowrap',
        }}
      >
        {key}
      </span>
    );
  };

  const getActionMenuItems = (application) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#2563eb',
      onClick: () => navigate(`/hr/career/applications/view/${application.id}`),
      visible: true,
    },
    {
      icon: <FiDownload />,
      label: 'Resume',
      color: '#059669',
      onClick: () => window.open(application.resume_url, '_blank', 'noopener'),
      visible: Boolean(application.resume_url),
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => {
        setApplicationToDelete(application);
        setShowDeleteModal(true);
      },
      visible: true,
    },
  ];

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Job Applications Management"
          subtitle="Review and manage all job applications"
          showBackButton={false}
          onRefresh={fetchApplications}
          refreshing={loading}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
        />

        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          <CollapsibleFilters open={filtersOpen}>
          <div className="filters-container card">
            <div
              className="filters-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px',
                alignItems: 'end',
              }}
            >
            <SearchFilter
              filterKey="search"
              label="Search"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Name, email, phone, CNIC, job..."
            />
            <DropdownFilter
              filterKey="job_id"
              label="Job"
              data={jobOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Jobs"
            />
            <DropdownFilter
              filterKey="status"
              label="Status"
              data={STATUS_OPTIONS}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Status"
            />
            <DropdownFilter
              filterKey="gender"
              label="Gender"
              data={GENDER_OPTIONS}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Genders"
            />
            <DropdownFilter
              filterKey="has_work_experience"
              label="Work Experience"
              data={EXPERIENCE_OPTIONS}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Any"
            />
            <SearchFilter
              filterKey="city"
              label="City"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Search by city..."
            />
            <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
              <DateRangeFilter
                startKey="from_date"
                endKey="to_date"
                label="Applied Date"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
              />
            </div>
            </div>
            <div
              className="filters-actions"
              style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}
            >
              <SearchButton onClick={handleApplyFilters} text="Search" loading={loading} />
              <ClearButton onClick={handleClearFilters} text="Clear" />
            </div>
          </div>
          </CollapsibleFilters>

          {loading ? (
            <div className="loading">Loading applications...</div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Job</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th className="hide-on-mobile">City</th>
                    <th>Status</th>
                    <th className="table-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-state">
                        No applications found
                      </td>
                    </tr>
                  ) : (
                    applications.map((application) => (
                      <tr key={application.id}>
                        <td><TruncatedCell value={getApplicantName(application)} max={22} /></td>
                        <td>
                          <TruncatedCell
                            value={application.job?.title || (application.job_id ? `Job #${application.job_id}` : '')}
                            max={25}
                          />
                        </td>
                        <td><TruncatedCell value={application.email} max={28} /></td>
                        <td><TruncatedCell value={application.phone_number} max={15} /></td>
                        <td className="hide-on-mobile"><TruncatedCell value={application.city} max={15} /></td>
                        <td>{getStatusBadge(application.status)}</td>
                        <td className="table-actions">
                          <ActionMenu actions={getActionMenuItems(application)} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
              onSortChange={handleSortChange}
              sortField={sortField}
              sortOrder={sortOrder}
              sortOptions={SORT_OPTIONS}
            />
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete the application from ${
          applicationToDelete ? getApplicantName(applicationToDelete) : ''
        }?`}
        delete={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteModal(false);
          setApplicationToDelete(null);
        }}
      />
    </>
  );
};

export default AdminApplicationsList;
