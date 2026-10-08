import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ConfirmationModal from '../../../common/ConfirmationModal';
import ActionMenu from '../../../common/ActionMenu';
import './PermissionRolesList.css';

const PermissionRolesList = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/permission-roles');
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setRoles(list);
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to load permission roles';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDelete = async () => {
    if (!roleToDelete?.id) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/permission-roles/${roleToDelete.id}`);
      toast.success('Permission role archived');
      setRoleToDelete(null);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive role');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="permission-roles-list-container">
        <PageHeader
          title="Permission Roles"
          backPath="/admin/users"
          breadcrumbs={[
            { label: 'Admin', path: '/admin' },
            { label: 'Permission Roles' },
          ]}
          actions={
            <button
              type="button"
              className="primary_btn"
              onClick={() => navigate('/admin/permission-roles/create')}
            >
              <FiPlus style={{ marginRight: 6 }} />
              New Role
            </button>
          }
        />

        <p className="permission-roles-hint">
          Named permission templates used when creating users. Editing a template
          does not change existing users&apos; permissions.
        </p>

        {error && (
          <div className="status-message status-message--error">{error}</div>
        )}

        {loading ? (
          <div className="permission-roles-loading">Loading…</div>
        ) : roles.length === 0 ? (
          <div className="permission-roles-empty">
            No permission roles yet. Create one to seed ACL on new users.
          </div>
        ) : (
          <div className="permission-roles-table-wrap">
            <table className="permission-roles-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <button
                        type="button"
                        className="permission-roles-name-link"
                        onClick={() =>
                          navigate(`/admin/permission-roles/edit/${role.id}`)
                        }
                      >
                        {role.name}
                      </button>
                    </td>
                    <td className="permission-roles-desc">
                      {role.description || '—'}
                    </td>
                    <td>
                      <span
                        className={
                          role.is_active
                            ? 'permission-roles-badge permission-roles-badge--active'
                            : 'permission-roles-badge permission-roles-badge--inactive'
                        }
                      >
                        {role.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {role.updated_at
                        ? new Date(role.updated_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <ActionMenu
                        items={[
                          {
                            label: 'Edit',
                            icon: <FiEdit2 />,
                            onClick: () =>
                              navigate(
                                `/admin/permission-roles/edit/${role.id}`,
                              ),
                          },
                          {
                            label: 'Archive',
                            icon: <FiTrash2 />,
                            onClick: () => setRoleToDelete(role),
                            danger: true,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!roleToDelete}
        title="Archive permission role?"
        message={
          roleToDelete
            ? `Archive "${roleToDelete.name}"? Existing users keep their current permissions; the template will no longer appear when creating users.`
            : ''
        }
        confirmLabel={deleting ? 'Archiving…' : 'Archive'}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setRoleToDelete(null)}
        confirmDisabled={deleting}
      />
    </>
  );
};

export default PermissionRolesList;
