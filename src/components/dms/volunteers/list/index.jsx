import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Pagination from '../../../common/Pagination';
import { SearchFilter, DropdownFilter } from '../../../common/filters';
import { SearchButton, ClearButton } from '../../../common/filters';
import { FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

const StatusBadge = ({ status }) => {
  const colors = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };
  const c = colors[status] || '#6b7280';
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, backgroundColor: `${c}15`, color: c, textTransform: 'capitalize' }}>
      {status || 'pending'}
    </span>
  );
};

const VolunteersList = () => {
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [volunteerToDelete, setVolunteerToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [tempFilters, setTempFilters] = useState({
    search: '', status: '', gender: '', city: '', source: '', verification_status: '',
  });

  const [appliedFilters, setAppliedFilters] = useState({
    search: '', status: '', gender: '', city: '', source: '', verification_status: '',
  });

  const handleFilterChange = (key, value) => setTempFilters(prev => ({ ...prev, [key]: value }));

  const handleApplyFilters = () => {
    const changed = JSON.stringify(appliedFilters) !== JSON.stringify(tempFilters);
    if (changed) { setAppliedFilters(tempFilters); setCurrentPage(1); } else { fetchVolunteers(); }
  };

  const handleClearFilters = () => {
    const empty = { search: '', status: '', gender: '', city: '', source: '', verification_status: '' };
    const filtersAreEmpty = JSON.stringify(appliedFilters) === JSON.stringify(empty);
    if (!filtersAreEmpty) { setTempFilters(empty); setAppliedFilters(empty); setCurrentPage(1); }
  };

  useEffect(() => { fetchVolunteers(); }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, pageSize, sortField, sortOrder, ...appliedFilters };
      Object.keys(params).forEach(k => { if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k]; });
      const response = await axiosInstance.get('/volunteers', { params });
      if (response.data.success) {
        setVolunteers(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else { setError('Failed to fetch volunteers'); }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch volunteers');
    } finally { setLoading(false); }
  };

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePageSizeChange = (newPageSize) => { setPageSize(newPageSize); setCurrentPage(1); };
  const handleSortChange = (field, order) => { setSortField(field); setSortOrder(order); setCurrentPage(1); };

  const handleDeleteClick = (v) => { setVolunteerToDelete(v); setShowDeleteModal(true); };
  const handleDeleteConfirm = async () => {
    if (!volunteerToDelete) return;
    try { await axiosInstance.delete(`/volunteers/${volunteerToDelete.id}`); setShowDeleteModal(false); setVolunteerToDelete(null); fetchVolunteers(); }
    catch (err) { setError(err.response?.data?.message || 'Failed to delete volunteer'); }
  };
  const handleDeleteCancel = () => { setShowDeleteModal(false); setVolunteerToDelete(null); };

  const getActions = (v) => [
    { icon: <FiEye />, label: 'View', color: '#2196f3', onClick: () => navigate(`/dms/volunteers/view/${v.id}`), visible: true },
    { icon: <FiEdit />, label: 'Edit', color: '#ff9800', onClick: () => navigate(`/dms/volunteers/edit/${v.id}`), visible: true },
    { icon: <FiTrash2 />, label: 'Delete', color: '#f44336', onClick: () => handleDeleteClick(v), visible: true },
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Registration Date' },
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'city', label: 'City' },
    { value: 'status', label: 'Status' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  const sourceOptions = [
    { value: 'website', label: 'Website' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'referral', label: 'Referral' },
    { value: 'walk_in', label: 'Walk-In' },
    { value: 'event', label: 'Event' },
    { value: 'other', label: 'Other' },
  ];

  const verificationOptions = [
    { value: 'unverified', label: 'Unverified' },
    { value: 'verified', label: 'Verified' },
    { value: 'in_review', label: 'In Review' },
  ];

  const formatLabel = (str) => (str || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper"><div className="loading-container"><div className="loading-spinner"></div><p>Loading volunteers...</p></div></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title="Registered Volunteers" showBackButton={false} showAdd={true} addPath="/dms/volunteers/add" />
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          <div className="filters-section" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <SearchFilter filterKey="search" label="Search" filters={tempFilters} onFilterChange={handleFilterChange} placeholder="Search by name, email, phone, CNIC..." />
            <DropdownFilter filterKey="status" label="Status" data={statusOptions} filters={tempFilters} onFilterChange={handleFilterChange} placeholder="All Statuses" />
            <DropdownFilter filterKey="gender" label="Gender" data={genderOptions} filters={tempFilters} onFilterChange={handleFilterChange} placeholder="All" />
            <DropdownFilter filterKey="source" label="Source" data={sourceOptions} filters={tempFilters} onFilterChange={handleFilterChange} placeholder="All Sources" />
            <DropdownFilter filterKey="verification_status" label="Verification" data={verificationOptions} filters={tempFilters} onFilterChange={handleFilterChange} placeholder="All" />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '20px', width: '100%' }}>
              <SearchButton onClick={handleApplyFilters} text="Search" loading={loading} />
              <ClearButton onClick={handleClearFilters} text="Clear" />
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Verification</th>
                  <th>Source</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.length === 0 ? (
                  <tr><td colSpan="9" className="no-data">No volunteers found</td></tr>
                ) : (
                  volunteers.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{v.name || '-'}</div>
                          {v.gender && <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'capitalize' }}>{v.gender}</div>}
                        </div>
                      </td>
                      <td>{v.email || '-'}</td>
                      <td>{v.phone || '-'}</td>
                      <td>{v.city || '-'}</td>
                      <td><StatusBadge status={v.status} /></td>
                      <td><StatusBadge status={v.verification_status} /></td>
                      <td><span style={{ textTransform: 'capitalize' }}>{formatLabel(v.source) || '-'}</span></td>
                      <td>{v.created_at ? new Date(v.created_at).toLocaleDateString() : '-'}</td>
                      <td><ActionMenu actions={getActions(v)} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {volunteers.length > 0 && (
            <Pagination
              currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize}
              onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange}
              onSortChange={handleSortChange} sortField={sortField} sortOrder={sortOrder} sortOptions={sortOptions}
            />
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete volunteer "${volunteerToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default VolunteersList;
