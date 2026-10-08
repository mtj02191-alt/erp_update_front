import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye } from 'react-icons/fi';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import { canViewModule } from '../../../../../utils/permissions';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';
import Pagination from '../../../../common/Pagination';
import SearchableDropdown from '../../../../common/SearchableDropdown';
import {
  SearchFilter,
  SearchButton,
  ClearButton,
  CollapsibleFilters,
  DropdownFilter,
} from '../../../../common/filters';
import useFiltersPanel from '../../../../../hooks/useFiltersPanel';

const POC_ROLE_OPTIONS = [
  { value: 'contact', label: 'Contact' },
  { value: 'ceo', label: 'CEO' },
  { value: 'cfo', label: 'CFO' },
  { value: 'csr_head', label: 'CSR Head' },
  { value: 'branch_manager', label: 'Branch Manager' },
  { value: 'other', label: 'Other' },
];

const YES_NO_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const emptyFilters = {
  search: '',
  csr_donor_id: '',
  role: '',
  is_primary: '',
  is_active: '',
};

const CsrPocsList = () => {
  const { permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const canList =
    canViewModule(permissions, 'fund_raising', 'csr_pocs') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [tempFilters, setTempFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [selectedCsrDonor, setSelectedCsrDonor] = useState(null);

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'name', label: 'Name' },
    { value: 'role', label: 'Role' },
    { value: 'is_primary', label: 'Primary' },
    { value: 'is_active', label: 'Active' },
    { value: 'id', label: 'ID' },
  ];

  const queryParams = useMemo(() => {
    const params = {
      page: currentPage,
      pageSize,
      sortField,
      sortOrder,
    };
    if (appliedFilters.search?.trim()) params.search = appliedFilters.search.trim();
    if (appliedFilters.csr_donor_id) params.csr_donor_id = appliedFilters.csr_donor_id;
    if (appliedFilters.role) params.role = appliedFilters.role;
    if (appliedFilters.is_primary !== '') params.is_primary = appliedFilters.is_primary;
    if (appliedFilters.is_active !== '') params.is_active = appliedFilters.is_active;
    return params;
  }, [appliedFilters, currentPage, pageSize, sortField, sortOrder]);

  const fetchRows = async () => {
    if (!canList) {
      setError('You do not have permission to view CSR POCs.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/csr-pocs', { params: queryParams });
      setRows(res.data?.data || []);
      const p = res.data?.pagination;
      if (p) {
        setTotalItems(p.total || 0);
        setTotalPages(p.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load CSR POCs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const renderOrgOption = (org, _index, onSelect) => (
    <div
      key={org.id}
      className="searchable-dropdown__option"
      onClick={() => onSelect(org)}
      style={{ padding: '12px', borderBottom: '1px solid #eee', cursor: 'pointer' }}
    >
      <div style={{ fontWeight: 500 }}>{org.name}</div>
      <div style={{ fontSize: 12, color: '#666' }}>
        {[org.city, org.registration_number].filter(Boolean).join(' · ') || 'CSR Donor'}
      </div>
    </div>
  );

  const applyFilters = () => {
    setAppliedFilters({
      ...tempFilters,
      csr_donor_id: selectedCsrDonor?.id ? String(selectedCsrDonor.id) : '',
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setTempFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSelectedCsrDonor(null);
    setCurrentPage(1);
  };

  const getRowPoc = (row) => row.poc || row;

  const getRowActions = (row) => {
    const poc = getRowPoc(row);
    const csrDonorId = row.csr_donor_id || row.csr_donor?.id;
    return [
      {
        icon: <FiEye />,
        label: 'View on CSR donor',
        color: '#2196f3',
        to: csrDonorId
          ? `/dms/csr-donors/view/${csrDonorId}?person=${poc.id}`
          : undefined,
        visible: !!csrDonorId,
      },
    ];
  };

  if (!canList && !loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader
            title="CSR POCs"
            backPath="/dms/csr-donors/list"
            showBackButton
          />
          <div className="list-content">
            <div className="status-message status-message--error">
              You do not have permission to view CSR POCs.
            </div>
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
          title="CSR POCs"
          backPath="/dms/csr-donors/list"
          showBackButton
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          onRefresh={fetchRows}
          refreshing={loading}
        />

        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          {loading && <div className="loading">Loading...</div>}

          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-section">
              <SearchFilter
                filterKey="search"
                label="Search"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="Name, email, phone, CNIC, company..."
              />
              <div className="dropdown-filter-container">
                <label className="dropdown-filter-label">CSR Donor</label>
                <SearchableDropdown
                  placeholder="Filter by company..."
                  apiEndpoint="/csr-donors"
                  apiParams={{ pageSize: 20 }}
                  onSelect={(org) => {
                    setSelectedCsrDonor(org);
                    handleFilterChange('csr_donor_id', org?.id ? String(org.id) : '');
                  }}
                  onClear={() => {
                    setSelectedCsrDonor(null);
                    handleFilterChange('csr_donor_id', '');
                  }}
                  value={selectedCsrDonor}
                  displayKey="name"
                  debounceDelay={400}
                  minSearchLength={2}
                  renderOption={renderOrgOption}
                />
              </div>
              <DropdownFilter
                filterKey="role"
                label="Role"
                data={POC_ROLE_OPTIONS}
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="All roles"
              />
              <DropdownFilter
                filterKey="is_primary"
                label="Primary contact"
                data={YES_NO_OPTIONS}
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="Any"
              />
              <DropdownFilter
                filterKey="is_active"
                label="Active"
                data={YES_NO_OPTIONS}
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="Any status"
              />
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-end',
                  marginTop: '20px',
                  width: '100%',
                }}
              >
                <SearchButton onClick={applyFilters} text="Search" loading={loading} />
                <ClearButton onClick={clearFilters} text="Clear" />
              </div>
            </div>
          </CollapsibleFilters>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>CSR Donor</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Primary</th>
                  <th>Active</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="no-data">
                      No POCs found
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const poc = getRowPoc(row);
                    const company = row.csr_donor;
                    const csrDonorId = row.csr_donor_id || company?.id;
                    return (
                      <tr key={poc.id || row.poc_id}>
                        <td>
                          {csrDonorId ? (
                            <Link
                              to={`/dms/csr-donors/view/${csrDonorId}?person=${poc.id}`}
                              className="donor-name"
                              style={{ color: 'inherit', textDecoration: 'inherit' }}
                            >
                              {poc.name || '—'}
                            </Link>
                          ) : (
                            poc.name || '—'
                          )}
                        </td>
                        <td>
                          {csrDonorId ? (
                            <Link
                              to={`/dms/csr-donors/view/${csrDonorId}`}
                              style={{ color: 'inherit', textDecoration: 'inherit' }}
                            >
                              {company?.name || '—'}
                            </Link>
                          ) : (
                            company?.name || '—'
                          )}
                        </td>
                        <td>{poc.email || '—'}</td>
                        <td>{poc.phone || '—'}</td>
                        <td>{(row.role || poc.role || 'contact').replace(/_/g, ' ')}</td>
                        <td>{row.branch?.name || '—'}</td>
                        <td>{row.is_primary || poc.is_primary ? 'Yes' : 'No'}</td>
                        <td>{poc.is_active === false ? 'No' : 'Yes'}</td>
                        <td className="table-actions">
                          <ActionMenu actions={getRowActions(row)} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && (
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
              onSortChange={handleSortChange}
              sortField={sortField}
              sortOrder={sortOrder}
              sortOptions={sortOptions}
            />
          )}

          {rows.length === 0 && totalItems === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-state-text">No POCs found</div>
              <div className="empty-state-subtext">
                CSR points of contact will appear here once added to a donor company
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CsrPocsList;
