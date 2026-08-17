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
import DataImport from '../../../common/DataImport';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';
import './UserList.css';

const CSV_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'user_code', label: 'User Code' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'department', label: 'Department' },
  { key: 'role', label: 'Role' },
  { key: 'gender', label: 'Gender' },
  { key: 'dob', label: 'DOB' },
  { key: 'cnic', label: 'CNIC' },
  { key: 'address', label: 'Address' },
  { key: 'joining_date', label: 'Joining Date' },
  { key: 'emergency_contact', label: 'Emergency Contact' },
  { key: 'blood_group', label: 'Blood Group' },
  { key: 'isActive', label: 'Active' },
  { key: 'manager_id', label: 'Manager ID' },
  { key: 'created_at', label: 'Created At' },
];

const escapeCsv = (value) => {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    department: '',
    role: '',
  });

  const [searchInput, setSearchInput] = useState('');
  const [isSearchPending, setIsSearchPending] = useState(false);

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
  const { permissions } = useAuth();

  const canImportCsv = useMemo(() => {
    if (!permissions) return false;
    return (
      permissions.super_admin === true ||
      hasPermission(permissions, 'admin', 'users', 'create') ||
      permissions.users?.create === true
    );
  }, [permissions]);

  const canExportCsv = useMemo(() => {
    if (!permissions) return false;
    return (
      permissions.super_admin === true ||
      hasPermission(permissions, 'admin', 'users', 'csv_xport') ||
      permissions.users?.csv_xport === true ||
      hasPermission(permissions, 'admin', 'users', 'list_view') ||
      permissions.users?.list_view === true
    );
  }, [permissions]);

  const departments = [
    'store',
    'procurement',
    'accounts_and_finance',
    'program',
    'it',
    'marketing',
    'audio_video',
    'fund_raising',
  ];

  const sortOptions = [
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'user_code', label: 'User Code' },
    { value: 'email', label: 'Email' },
    { value: 'department', label: 'Department' },
    { value: 'role', label: 'Role' },
    { value: 'joining_date', label: 'Joining Date' },
  ];

  const filterConfig = [
    {
      key: 'search',
      type: 'text',
      placeholder: isSearchPending ? 'Searching... ' : 'Search users... ',
      value: searchInput,
      width: '250px',
    },
    {
      key: 'department',
      type: 'select',
      placeholder: 'All Departments',
      value: filters.department,
      label: 'Department',
      options: departments.map((dept) => ({
        value: dept,
        label: dept
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
      })),
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
        { value: 'user', label: 'User' },
      ],
    },
  ];

  const debouncedSearch = useMemo(
    () =>
      simpleDebounce((searchValue) => {
        setFilters((prev) => ({
          ...prev,
          search: searchValue,
        }));
        setIsSearchPending(false);
      }, 3000),
    [],
  );

  const handleSearchInputChange = useCallback(
    (value) => {
      setSearchInput(value);
      setIsSearchPending(true);
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.department, filters.role]);

  useEffect(() => {
    return () => {
      if (debouncedSearch.cancel) {
        debouncedSearch.cancel();
      }
    };
  }, [debouncedSearch]);

  const fetchUsers = useCallback(async () => {
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
  }, [currentPage, pageSize, sortField, sortOrder, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleExportUsers = useCallback(async () => {
    if (!canExportCsv) return;
    setExporting(true);
    setError('');
    try {
      const response = await axiosInstance.get('/users/export', {
        params: { ...filters },
      });
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      if (rows.length === 0) {
        setError('No users to export for the current filters.');
        return;
      }
      const lines = [
        CSV_COLUMNS.map((c) => escapeCsv(c.label)).join(','),
        ...rows.map((row) =>
          CSV_COLUMNS.map((col) => escapeCsv(row[col.key])).join(','),
        ),
      ];
      const blob = new Blob([`${lines.join('\n')}\n`], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export users.');
    } finally {
      setExporting(false);
    }
  }, [canExportCsv, filters]);

  const handleFilterChange = (filterKey, value) => {
    if (filterKey === 'search') {
      handleSearchInputChange(value);
    } else {
      setFilters((prev) => ({
        ...prev,
        [filterKey]: value,
      }));
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
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

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      setUsers(users.filter((user) => user.id !== userToDelete.id));
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

  const displayUsers = users;

  const formatDepartment = (department) => {
    return department
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getActionMenuItems = (user) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => handleView(user),
      visible: true,
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => navigate(`/admin/users/edit/${user.id}`),
      visible: true,
    },
    {
      icon: <FiShield />,
      label: 'Manage Permissions',
      color: '#FF9800',
      onClick: () => {
        setUserToManagePermissions(user);
        setShowPermissionsModal(true);
      },
      visible: true,
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDeleteClick(user),
      visible: true,
    },
  ];

  const handlePermissionsSave = (updatedUser) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === updatedUser.id ? updatedUser : user,
      ),
    );
    setShowPermissionsModal(false);
    setUserToManagePermissions(null);
  };

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

        <DataFilters filters={filterConfig} onFilterChange={handleFilterChange} />

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '1rem',
            alignItems: 'center',
          }}
        >
          {canExportCsv && (
            <button
              type="button"
              className="primary_btn"
              onClick={handleExportUsers}
              disabled={exporting || loading}
            >
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          )}
          {canImportCsv && (
            <DataImport
              entityName="users"
              buttonText="Import CSV"
              disabled={loading}
              onImportComplete={() => fetchUsers()}
            />
          )}
        </div>

        {isSearchPending && (
          <div
            className="search-pending-indicator"
            style={{
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '4px',
              color: '#1976d2',
              fontSize: '0.875rem',
            }}
          >
            Search will execute in 3 seconds after you stop typing...
          </div>
        )}

        {error && (
          <div className="status-message status-message--error">{error}</div>
        )}

        <div className="user-list-table-container">
          <table className="user-list-table">
            <thead>
              <tr>
                <th>Name</th>
                <th className="hide-on-mobile">User Code</th>
                <th className="hide-on-mobile">Email</th>
                <th>Department</th>
                <th className="hide-on-mobile">Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="hide-on-mobile">{user.user_code || '—'}</td>
                  <td className="hide-on-mobile">{user.email}</td>
                  <td>{formatDepartment(user.department)}</td>
                  <td className="hide-on-mobile">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </td>
                  <td>
                    <ActionMenu actions={getActionMenuItems(user)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayUsers.length === 0 && (
          <div
            className="status-message"
            style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}
          >
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
