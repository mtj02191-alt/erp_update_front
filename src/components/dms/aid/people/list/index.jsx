import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye } from 'react-icons/fi';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import { canViewModule, hasPermissionByPath } from '../../../../../utils/permissions';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import Pagination from '../../../../common/Pagination';
import {
  SearchFilter,
  SearchButton,
  ClearButton,
  CollapsibleFilters,
} from '../../../../common/filters';
import useFiltersPanel from '../../../../../hooks/useFiltersPanel';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import FormTextarea from '../../../../common/FormTextarea';
import { PrimaryButton } from '../../../../common/buttons';
import { AID_GENDERS } from '../../aidConstants';
import '../../aid.css';

const AidPeopleList = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();
  const canList =
    canViewModule(permissions, 'fund_raising', 'aid_people') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;
  const canCreate =
    hasPermissionByPath(permissions, 'fund_raising.aid_people.create') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tempFilters, setTempFilters] = useState({ search: '' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [person, setPerson] = useState({
    full_name: '',
    cnic: '',
    phone: '',
    gender: '',
    city: '',
    address: '',
    occupation: '',
    monthly_income: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchRows = async () => {
    if (!canList) {
      setError('You do not have permission to view aid people.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axiosInstance.get('/aid/people', {
        params: {
          search: appliedFilters.search || undefined,
          page: currentPage,
          pageSize,
        },
      });
      setRows(res.data?.data || []);
      setTotalItems(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load people');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, appliedFilters]);

  const createPerson = async (e) => {
    e.preventDefault();
    if (!person.full_name.trim()) {
      setError('Full name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await axiosInstance.post('/aid/people', {
        ...person,
        full_name: person.full_name.trim(),
        gender: person.gender || undefined,
        cnic: person.cnic || undefined,
      });
      setShowCreate(false);
      setPerson({
        full_name: '',
        cnic: '',
        phone: '',
        gender: '',
        city: '',
        address: '',
        occupation: '',
        monthly_income: '',
      });
      navigate(`/dms/aid/people/view/${res.data?.data?.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create person');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Aid People"
          backPath="/dms/aid/applications/list"
          showAdd={!!canCreate}
          onAddClick={() => setShowCreate((v) => !v)}
          addTitle="Add person"
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
        />
        <div className="list-content">
          {error && <div className="error-message">{error}</div>}

          {showCreate && (
            <form className="aid-card" onSubmit={createPerson} style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>New person</h3>
              <div className="form-grid">
                <FormInput
                  label="Full name"
                  required
                  value={person.full_name}
                  onChange={(e) => setPerson((p) => ({ ...p, full_name: e.target.value }))}
                />
                <FormInput
                  label="CNIC"
                  value={person.cnic}
                  onChange={(e) => setPerson((p) => ({ ...p, cnic: e.target.value }))}
                />
                <FormInput
                  label="Phone"
                  value={person.phone}
                  onChange={(e) => setPerson((p) => ({ ...p, phone: e.target.value }))}
                />
                <FormSelect
                  label="Gender"
                  value={person.gender}
                  onChange={(e) => setPerson((p) => ({ ...p, gender: e.target.value }))}
                  options={[{ value: '', label: '—' }, ...AID_GENDERS]}
                />
                <FormInput
                  label="City"
                  value={person.city}
                  onChange={(e) => setPerson((p) => ({ ...p, city: e.target.value }))}
                />
                <FormInput
                  label="Profession"
                  value={person.occupation}
                  onChange={(e) => setPerson((p) => ({ ...p, occupation: e.target.value }))}
                  placeholder="Optional"
                />
                <FormInput
                  label="Monthly income (PKR)"
                  value={person.monthly_income}
                  onChange={(e) => setPerson((p) => ({ ...p, monthly_income: e.target.value }))}
                  placeholder="Optional"
                />
                <FormTextarea
                  label="Address"
                  value={person.address}
                  onChange={(e) => setPerson((p) => ({ ...p, address: e.target.value }))}
                  rows={2}
                  placeholder="Full address"
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <PrimaryButton type="submit" loading={saving} loadingText="Saving…">
                  Create person
                </PrimaryButton>
              </div>
            </form>
          )}

          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-row">
              <SearchFilter
                filterKey="search"
                label="Search"
                filters={tempFilters}
                onFilterChange={(k, v) => setTempFilters((p) => ({ ...p, [k]: v }))}
                placeholder="Name, CNIC, phone…"
              />
              <SearchButton
                onClick={() => {
                  setCurrentPage(1);
                  setAppliedFilters({ ...tempFilters });
                }}
              />
              <ClearButton
                onClick={() => {
                  setTempFilters({ search: '' });
                  setAppliedFilters({ search: '' });
                  setCurrentPage(1);
                }}
              />
            </div>
          </CollapsibleFilters>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>CNIC</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>Loading…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No people found.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.full_name}</td>
                      <td>{row.cnic || '—'}</td>
                      <td>{row.phone || '—'}</td>
                      <td>{row.city || '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => navigate(`/dms/aid/people/view/${row.id}`)}
                        >
                          <FiEye /> View
                        </button>
                      </td>
                    </tr>
                  ))
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
              onPageSizeChange={(n) => {
                setPageSize(n);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default AidPeopleList;
