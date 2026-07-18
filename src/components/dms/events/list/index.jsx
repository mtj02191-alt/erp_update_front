import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Pagination from '../../../common/Pagination';
import { SearchFilter, DropdownFilter, DateRangeFilter } from '../../../common/filters';
import { SearchButton, ClearButton } from '../../../common/filters';
import { FiEye, FiEdit, FiTrash2, FiCalendar, FiUsers } from 'react-icons/fi';

const EventsList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Filter state
  const [tempFilters, setTempFilters] = useState({
    search: '',
    status: '',
    from: '',
    to: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    from: '',
    to: ''
  });

  const handleFilterChange = (key, value) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    const filtersChanged = JSON.stringify(appliedFilters) !== JSON.stringify(tempFilters);
    if (filtersChanged) {
      setAppliedFilters(tempFilters);
      setCurrentPage(1);
    } else {
      fetchEvents();
    }
  };

  const handleClearFilters = () => {
    const emptyFilters = { search: '', status: '', from: '', to: '' };
    const filtersAreEmpty = JSON.stringify(appliedFilters) === JSON.stringify(emptyFilters);
    if (!filtersAreEmpty) {
      setTempFilters(emptyFilters);
      setAppliedFilters(emptyFilters);
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/events', {
        params: { ...appliedFilters }
      });
      if (response.data.success) {
        setEvents(response.data.data || []);
        setTotalItems(response.data.data?.length || 0);
        setTotalPages(1);
      } else {
        setError('Failed to fetch events');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    try {
      await axiosInstance.delete(`/events/${eventToDelete.id}`);
      setShowDeleteModal(false);
      setEventToDelete(null);
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setEventToDelete(null);
  };

  const getEventActions = (event) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#2196f3',
      onClick: () => navigate(`/dms/events/view/${event.id}`),
      visible: true
    },
    {
      icon: <FiEdit />,
      label: 'Edit',
      color: '#ff9800',
      onClick: () => navigate(`/dms/events/edit/${event.id}`),
      visible: true
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDeleteClick(event),
      visible: true
    }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'archived', label: 'Archived' }
  ];

  const getStatusBadge = (status) => {
    const colors = {
      draft: '#6b7280',
      upcoming: '#3b82f6',
      ongoing: '#10b981',
      completed: '#8b5cf6',
      cancelled: '#ef4444',
      archived: '#9ca3af'
    };
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        backgroundColor: colors[status] || '#6b7280',
        color: 'white',
        fontSize: '12px',
        textTransform: 'capitalize'
      }}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading events...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Events"
          showBackButton={false}
          showAdd={true}
          addPath="/dms/events/add"
        />

        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          <div className="filters-section" style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <SearchFilter
              filterKey="search"
              label="Search"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Search by title..."
            />

            <DropdownFilter
              filterKey="status"
              label="Status"
              data={statusOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Statuses"
            />

            <DateRangeFilter
              startKey="from"
              endKey="to"
              label="Date Range"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />

            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-end',
              marginTop: '20px',
              width: '100%'
            }}>
              <SearchButton onClick={handleApplyFilters} text="Search" loading={loading} />
              <ClearButton onClick={handleClearFilters} text="Clear" />
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Capacity</th>
                  <th>Attendees</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">No events found</td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <div className="event-info">
                          <div className="event-title" style={{ fontWeight: '500' }}>{event.title}</div>
                          {event.location && (
                            <div style={{ fontSize: '12px', color: '#666' }}>{event.location}</div>
                          )}
                        </div>
                      </td>
                      <td>{getStatusBadge(event.status)}</td>
                      <td style={{ textTransform: 'capitalize' }}>{event.event_type || '-'}</td>
                      <td>{new Date(event.start_at).toLocaleDateString()}</td>
                      <td>{new Date(event.end_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiUsers size={14} />
                          {event.allowed_attendees}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          color: event.attendees_count >= event.allowed_attendees ? '#ef4444' : '#10b981'
                        }}>
                          {event.attendees_count} / {event.allowed_attendees}
                        </span>
                      </td>
                      <td>
                        <ActionMenu actions={getEventActions(event)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {events.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to archive event "${eventToDelete?.title}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default EventsList;
