import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiEye, FiShield } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import { simpleDebounce } from '../../../../utils/debounce';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Pagination from '../../../common/Pagination';
import DataFilters from '../../../common/DataFilters';
import ConfirmationModal from '../../../common/ConfirmationModal';
import ActionMenu from '../../../common/ActionMenu';
import UserPermissions from '../UserPermissions';
import './UserList.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    role: ''
  });
  
  // Separate state for search input (for immediate UI updates)
  const [searchInput, setSearchInput] = useState('');
  const [isSearchPending, setIsSearchPending] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('first_name');
  const [sortOrder, setSortOrder] = useState('ASC');
  
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [userToManagePermissions, setUserToManagePermissions] = useState(null);
  const navigate = useNavigate();

  const departments = [
    'store',
    'procurement',
    'accounts_and_finance',
    'program',
    'it',
    'marketing',
    'audio_video',
    'fund_raising'
  ];

  const sortOptions = [
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'department', label: 'Department' },
    { value: 'role', label: 'Role' },
    { value: 'joining_date', label: 'Joining Date' }
  ];

  // Filter configuration
  const filterConfig = [
    {
      key: 'search',
      type: 'text',
      placeholder: isSearchPending ? 'Searching... ' : 'Search users... ',
      value: searchInput, // Use searchInput for immediate UI updates
      width: '250px'
    },
    {
      key: 'department',
      type: 'select',
      placeholder: 'All Departments',
      value: filters.department,
      label: 'Department',
      options: departments.map(dept => ({
        value: dept,
        label: dept.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      }))
    },
    {
      key: 'role',
      type: 'select',
      placeholder: 'All Roles',
      value: filters.role,
      label: 'Role',
      options: [
        { value: 'manager', label: 'Manager' },
        { value: 'assistant_manager', label: 'Assistant Manager' },
        { value: 'user', label: 'User' }
      ]
    }
  ];

  // Create debounced search function (3 second delay)
  const debouncedSearch = useMemo(
    () => simpleDebounce((searchValue) => {
      setFilters(prev => ({
        ...prev,
        search: searchValue
      }));
      setIsSearchPending(false);
    }, 3000), // 3 seconds delay
    []
  );

  // Handle search input changes with debouncing
  const handleSearchInputChange = useCallback((value) => {
    setSearchInput(value);
    setIsSearchPending(true);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.department, filters.role]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      if (debouncedSearch.cancel) {
        debouncedSearch.cancel();
      }
    };
  }, [debouncedSearch]);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {
          page: currentPage,
          pageSize,
          sortField,
          sortOrder,
          ...filters,
        };
        const response = await axiosInstance.get('/users', { params });
        setUsers(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentPage, pageSize, sortField, sortOrder, filters]);

  // Filter change handler
  const handleFilterChange = (filterKey, value) => {
    if (filterKey === 'search') {
      // Handle search input with debouncing
      handleSearchInputChange(value);
    } else {
      // Handle other filters immediately
      setFilters(prev => ({
        ...prev,
        [filterKey]: value
      }));
    }
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      // Comment out the API call since we're using dummy data
      // await axiosInstance.delete(`/users/${userToDelete.id}`);
      setUsers(users.filter(user => user.id !== userToDelete.id));
    }
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleView = (user) => {
    navigate(`/users/${user.id}`);
  };

  // Use the users directly from API response (already filtered, sorted, and paginated by server)
  const displayUsers = users;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDepartment = (department) => {
    return department.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getActionMenuItems = (user) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => handleView(user),
      visible: true
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => navigate(`/admin/users/edit/${user.id}`),
      visible: true
    },
    {
      icon: <FiShield />,
      label: 'Manage Permissions',
      color: '#FF9800',
      onClick: () => {
        setUserToManagePermissions(user);
        setShowPermissionsModal(true);
      },
      visible: true
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDeleteClick(user),
      visible: true
    }
  ];

  // Handle manage permissions
  const handleManagePermissions = (user) => {
    setUserToManagePermissions(user);
    setShowPermissionsModal(true);
  };

  // Handle permissions save
  const handlePermissionsSave = (updatedUser) => {
    // Update the user in the list with new permissions
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      )
    );
    setShowPermissionsModal(false);
    setUserToManagePermissions(null);
  };

  // Handle permissions cancel
  const handlePermissionsCancel = () => {
    setShowPermissionsModal(false);
    setUserToManagePermissions(null);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="user-list-container">
          <div className="status-message">Loading users...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="user-list-container">
        <PageHeader 
          title="User Management"
          showBackButton={false}
          showAdd={true}
          addPath="/admin/users/create"
        />

        <DataFilters 
          filters={filterConfig}
          onFilterChange={handleFilterChange}
        />
        
        {isSearchPending && (
          <div className="search-pending-indicator" style={{ 
            marginBottom: '1rem', 
            padding: '0.5rem', 
            backgroundColor: '#e3f2fd', 
            border: '1px solid #2196f3', 
            borderRadius: '4px',
            color: '#1976d2',
            fontSize: '0.875rem'
          }}>
            🔍 Search will execute in 3 seconds after you stop typing...
          </div>
        )}

        {error && <div className="status-message status-message--error">{error}</div>}

        <div className="user-list-table-container">
          <table className="user-list-table">
            <thead>
              <tr>
                <th>Name</th>
                <th className="hide-on-mobile">Email</th>
                <th>Department</th>
                <th className="hide-on-mobile">Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.first_name} {user.last_name}</td>
                  <td className="hide-on-mobile">{user.email}</td>
                  <td>{formatDepartment(user.department)}</td>
                  <td className="hide-on-mobile">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
                  <td>
                    <ActionMenu actions={getActionMenuItems(user)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayUsers.length === 0 && (
          <div className="status-message" style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
            No users found
          </div>
        )}

        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSortChange={handleSortChange}
            sortField={sortField}
            sortOrder={sortOrder}
            sortOptions={sortOptions}
          />
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete ${userToDelete?.first_name} ${userToDelete?.last_name}?`}
        delete={true}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Permissions Modal */}
      {showPermissionsModal && userToManagePermissions && (
        <UserPermissions
          user={userToManagePermissions}
          onSave={handlePermissionsSave}
          onCancel={handlePermissionsCancel}
          isOpen={showPermissionsModal}
        />
      )}
    </>
  );
};

export default UserList; 