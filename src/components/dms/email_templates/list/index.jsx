import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import Pagination from '../../../common/Pagination';
import MultiSelect from '../../../common/MultiSelect';
import { SearchFilter, CollapsibleFilters } from '../../../common/filters';
import { SearchButton, ClearButton } from '../../../common/filters/index';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';
import { FiEdit2, FiTrash2, FiSend } from 'react-icons/fi';
import {
  TEMPLATE_CHANNELS,
  TEMPLATE_PURPOSES,
  TEMPLATE_STATUSES,
  toArray,
} from '../templateConstants';

const formatList = (value) => {
  const arr = toArray(value);
  return arr.length ? arr.join(', ') : '—';
};

const EmailTemplateList = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { filtersOpen, toggleFilters } = useFiltersPanel();
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [tempFilters, setTempFilters] = useState({
    search: '',
    channels: [],
    purposes: [],
    statuses: [],
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    channels: [],
    purposes: [],
    statuses: [],
  });

  useEffect(() => {
    fetchTemplates();
  }, [currentPage, pageSize, appliedFilters]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/email-templates', {
        params: {
          page: currentPage,
          pageSize,
          search: appliedFilters.search,
          channels: appliedFilters.channels.join(',') || undefined,
          purposes: appliedFilters.purposes.join(',') || undefined,
          statuses: appliedFilters.statuses.join(',') || undefined,
        },
      });

      if (response.data.success) {
        setTemplates(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters(tempFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    const empty = { search: '', channels: [], purposes: [], statuses: [] };
    setTempFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Archive this template?')) {
      try {
        await axiosInstance.delete(`/email-templates/${id}`);
        fetchTemplates();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to archive template');
      }
    }
  };

  const getActionMenuItems = (template) => [
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => navigate(`/dms/email_templates/edit/${template.id}`),
      visible: true,
    },
    {
      icon: <FiSend />,
      label: 'Send',
      color: '#4CAF50',
      onClick: () => navigate(`/dms/email_templates/send?template=${template.id}`),
      visible: template.status === 'active',
    },
    {
      icon: <FiTrash2 />,
      label: 'Archive',
      color: '#f44336',
      onClick: () => handleDelete(template.id),
      visible: true,
    },
  ];

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          onRefresh={fetchTemplates}
          refreshing={loading}
          title="Communication Templates"
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          showAdd
          addPath="/dms/email_templates/add"
          addTitle="Create Template"
        />

        <div className="list-content">
        <CollapsibleFilters open={filtersOpen}>
          <div className="filters-container card">
            <div className="filters-grid">
              <SearchFilter
                filterKey="search"
                label="Search Name/Subject"
                filters={tempFilters}
                onFilterChange={(key, value) =>
                  setTempFilters((prev) => ({ ...prev, [key]: value }))
                }
              />
              <MultiSelect
                label="Channels"
                options={TEMPLATE_CHANNELS}
                value={tempFilters.channels}
                onChange={(value) =>
                  setTempFilters((prev) => ({ ...prev, channels: value }))
                }
                placeholder="All channels"
              />
              <MultiSelect
                label="Purpose"
                options={TEMPLATE_PURPOSES}
                value={tempFilters.purposes}
                onChange={(value) =>
                  setTempFilters((prev) => ({ ...prev, purposes: value }))
                }
                placeholder="All purposes"
              />
              <MultiSelect
                label="Status"
                options={TEMPLATE_STATUSES}
                value={tempFilters.statuses}
                onChange={(value) =>
                  setTempFilters((prev) => ({ ...prev, statuses: value }))
                }
                placeholder="All statuses"
              />
            </div>
            <div className="filters-actions">
              <SearchButton onClick={handleApplyFilters} loading={loading} />
              <ClearButton onClick={handleClearFilters} />
              <button
                type="button"
                className="primary-btn"
                onClick={() => navigate('/dms/email_templates/send')}
              >
                Send Communication
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() =>
                  navigate('/dms/email_templates/batches?source=communication')
                }
              >
                Send History
              </button>
            </div>
          </div>
        </CollapsibleFilters>

        <div className="table-container card">
          {loading && templates.length === 0 ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              {loading && <div className="loading">Loading...</div>}
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Channels</th>
                    <th>Purpose</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.length > 0 ? (
                    templates.map((template) => (
                      <tr key={template.id}>
                        <td>{template.name}</td>
                        <td>{formatList(template.channels)}</td>
                        <td>{formatList(template.purposes || template.category)}</td>
                        <td>{template.subject || '—'}</td>
                        <td>
                          <span className={`status-badge status-${template.status || 'draft'}`}>
                            {template.status || (template.is_active ? 'active' : 'draft')}
                          </span>
                        </td>
                        <td>
                          <ActionMenu actions={getActionMenuItems(template)} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No templates found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
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
        {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </>
  );
};

export default EmailTemplateList;
