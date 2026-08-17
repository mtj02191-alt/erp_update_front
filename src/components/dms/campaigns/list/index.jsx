import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Pagination from '../../../common/Pagination';
import { SearchFilter, DropdownFilter, DateRangeFilter, CollapsibleFilters } from '../../../common/filters';
import { SearchButton, ClearButton } from '../../../common/filters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';
import { FiEye, FiEdit, FiTrash2, FiDollarSign, FiStar, FiRepeat } from 'react-icons/fi';
import {
  TARGET_FREQUENCY_OPTIONS,
  formatTargetFrequency,
  CAMPAIGN_TYPE_OPTIONS
} from '../campaignConstants';

const CampaignsList = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [tempFilters, setTempFilters] = useState({
    search: '',
    status: '',
    from: '',
    to: '',
    campaign_type: '',
    target_frequency: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    from: '',
    to: '',
    campaign_type: '',
    target_frequency: ''
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
      fetchCampaigns();
    }
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      search: '',
      status: '',
      from: '',
      to: '',
      campaign_type: '',
      target_frequency: ''
    };
    const filtersAreEmpty = JSON.stringify(appliedFilters) === JSON.stringify(emptyFilters);
    if (!filtersAreEmpty) {
      setTempFilters(emptyFilters);
      setAppliedFilters(emptyFilters);
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [currentPage, pageSize, appliedFilters]);

  const buildQueryParams = (filters) => {
    const params = { ...filters };
    if (params.campaign_type === 'recurring') {
      params.is_recurring = true;
    } else if (params.campaign_type === 'one_time') {
      params.is_recurring = false;
    }
    delete params.campaign_type;
    Object.keys(params).forEach((k) => !params[k] && params[k] !== false && delete params[k]);
    return params;
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = buildQueryParams(appliedFilters);
      const response = await axiosInstance.get('/campaigns', { params });
      if (response.data.success) {
        const data = response.data.data || [];
        setCampaigns(data);
        setTotalItems(data.length);
        setTotalPages(Math.max(1, Math.ceil(data.length / pageSize)));
      } else {
        setError('Failed to fetch campaigns');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch campaigns');
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleDeleteClick = (campaign) => {
    setCampaignToDelete(campaign);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return;
    try {
      await axiosInstance.delete(`/campaigns/${campaignToDelete.id}`);
      setShowDeleteModal(false);
      setCampaignToDelete(null);
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete campaign');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCampaignToDelete(null);
  };

  const getCampaignActions = (campaign) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#2196f3',
      onClick: () => navigate(`/dms/campaigns/view/${campaign.id}`),
      visible: true
    },
    {
      icon: <FiEdit />,
      label: 'Edit',
      color: '#ff9800',
      onClick: () => navigate(`/dms/campaigns/edit/${campaign.id}`),
      visible: true
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDeleteClick(campaign),
      visible: true
    }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'ended', label: 'Ended' },
    { value: 'archived', label: 'Archived' }
  ];

  const getStatusBadge = (status) => {
    const colors = {
      draft: '#6b7280',
      active: '#10b981',
      paused: '#f59e0b',
      ended: '#8b5cf6',
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

  const formatAmount = (amount, currency = 'PKR') => {
    if (amount == null) return '-';
    const n = Number(amount);
    return `${currency} ${n.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading campaigns...</p>
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
          onRefresh={fetchCampaigns}
          refreshing={loading}
          title="Campaigns"
          showBackButton={false}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          showAdd={true}
          addPath="/dms/campaigns/add"
        />

        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          <CollapsibleFilters open={filtersOpen}>
          <div className="filters-section">
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

            <DropdownFilter
              filterKey="campaign_type"
              label="Campaign type"
              data={CAMPAIGN_TYPE_OPTIONS}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All types"
            />

            <DropdownFilter
              filterKey="target_frequency"
              label="Frequency"
              data={TARGET_FREQUENCY_OPTIONS}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All frequencies"
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
          </CollapsibleFilters>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Program</th>
                  <th>Frequency</th>
                  <th>Goal / Target</th>
                  <th>Currency</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="no-data">No campaigns found</td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>
                        <div className="campaign-info">
                          <div className="campaign-title" style={{ fontWeight: '500' }}>{campaign.title}</div>
                          {campaign.slug && (
                            <div style={{ fontSize: '12px', color: '#666' }}>{campaign.slug}</div>
                          )}
                        </div>
                      </td>
                      <td>{getStatusBadge(campaign.status)}</td>
                      <td>
                        {campaign.is_recurring ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                            <FiRepeat size={14} /> Recurring
                          </span>
                        ) : (
                          'One-time'
                        )}
                      </td>
                      <td>
                        {campaign.sub_program?.label
                          ? `${campaign.program?.label || 'Program'} / ${campaign.sub_program.label}`
                          : campaign.program?.label || '—'}
                      </td>
                      <td>{campaign.is_recurring ? formatTargetFrequency(campaign.target_frequency) : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiDollarSign size={14} />
                          {formatAmount(campaign.goal_amount, campaign.currency)}
                          {campaign.is_recurring && (
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>/ period</span>
                          )}
                        </div>
                      </td>
                      <td>{campaign.currency || 'PKR'}</td>
                      <td>{campaign.start_at ? new Date(campaign.start_at).toLocaleDateString() : '-'}</td>
                      <td>{campaign.end_at ? new Date(campaign.end_at).toLocaleDateString() : '-'}</td>
                      <td>
                        {campaign.is_featured ? (
                          <FiStar size={18} color="#f59e0b" fill="#f59e0b" />
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td>
                        <ActionMenu actions={getCampaignActions(campaign)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {campaigns.length > 0 && (
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
        text={`Are you sure you want to archive campaign "${campaignToDelete?.title}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default CampaignsList;
