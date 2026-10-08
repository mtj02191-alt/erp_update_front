import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import UserPermissions from '../../user/UserPermissions';
import './PermissionRoleForm.css';

const PermissionRoleForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/permission-roles/${id}`);
        const row = res.data?.data || res.data;
        if (cancelled || !row) return;
        setForm({
          name: row.name || '',
          description: row.description || '',
          is_active: row.is_active !== false,
        });
        setPermissions(
          row.permissions && typeof row.permissions === 'object'
            ? row.permissions
            : {},
        );
      } catch (err) {
        const msg =
          err.response?.data?.message || 'Failed to load permission role';
        setError(msg);
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  };

  const permissionCount = (() => {
    let n = 0;
    const walk = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      Object.entries(obj).forEach(([k, v]) => {
        if (k === 'scope' || k === 'view_all') return;
        if (typeof v === 'boolean' && v) n += 1;
        else if (v && typeof v === 'object') walk(v);
      });
    };
    walk(permissions);
    return n;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name?.trim();
    if (!name) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError('');
    const payload = {
      name,
      description: form.description?.trim() || null,
      is_active: form.is_active !== false,
      permissions:
        permissions && typeof permissions === 'object' ? permissions : {},
    };

    try {
      if (isEdit) {
        await axiosInstance.patch(`/permission-roles/${id}`, payload);
        toast.success('Permission role updated');
      } else {
        await axiosInstance.post('/permission-roles', payload);
        toast.success('Permission role created');
      }
      navigate('/admin/permission-roles');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        `Failed to ${isEdit ? 'update' : 'create'} permission role`;
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="permission-role-form-container">
          <p>Loading…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="permission-role-form-container">
        <PageHeader
          title={isEdit ? 'Edit Permission Role' : 'Create Permission Role'}
          backPath="/admin/permission-roles"
          breadcrumbs={[
            { label: 'Admin', path: '/admin' },
            { label: 'Permission Roles', path: '/admin/permission-roles' },
            { label: isEdit ? 'Edit' : 'Create' },
          ]}
        />

        <form onSubmit={handleSubmit} className="permission-role-form">
          {error && (
            <div className="status-message status-message--error">{error}</div>
          )}

          <div className="form-grid">
            <FormInput
              name="name"
              label="Role Name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Fundraising Officer"
            />

            <div className="form-group">
              <label className="form-label" htmlFor="is_active">
                Active
              </label>
              <label className="permission-role-active-toggle">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  checked={form.is_active !== false}
                  onChange={handleChange}
                />
                Available when creating users
              </label>
            </div>
          </div>

          <FormTextarea
            name="description"
            label="Description"
            value={form.description}
            onChange={handleChange}
            placeholder="Optional notes about who this template is for"
          />

          <div className="permission-role-acl-panel">
            <div>
              <h3>Permissions template</h3>
              <p>
                {permissionCount > 0
                  ? `${permissionCount} permission flag(s) set. Changes here only affect new users seeded from this role.`
                  : 'No permissions set yet. Open the editor to configure the ACL tree.'}
              </p>
            </div>
            <button
              type="button"
              className="secondary_btn"
              onClick={() => setShowPermissionsModal(true)}
            >
              <FiShield style={{ marginRight: 6 }} />
              Edit Permissions
            </button>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary_btn"
              onClick={() => navigate('/admin/permission-roles')}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="primary_btn" disabled={saving}>
              {saving
                ? 'Saving…'
                : isEdit
                  ? 'Save Role'
                  : 'Create Role'}
            </button>
          </div>
        </form>

        <UserPermissions
          isOpen={showPermissionsModal}
          title="Role Permissions"
          saveLabel="Apply to Template"
          user={{
            first_name: form.name || 'Role',
            last_name: '',
            department: 'template',
            permissions: { permissions },
          }}
          onSave={(next) => {
            setPermissions(next && typeof next === 'object' ? next : {});
            setShowPermissionsModal(false);
            toast.success('Permissions applied to template (save role to persist)');
          }}
          onCancel={() => setShowPermissionsModal(false)}
        />
      </div>
    </>
  );
};

export default PermissionRoleForm;
