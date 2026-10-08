import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import { RefreshButton } from '../../../../common/filters';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import FormSelect from '../../../../common/FormSelect';
import { FiTrash2 } from 'react-icons/fi';

const SubRegionsList = () => {
  const navigate = useNavigate();
  const [subRegions, setSubRegions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subRegionToDelete, setSubRegionToDelete] = useState(null);
  const [countryFilter, setCountryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  const fetchCountries = async () => {
    try {
      const res = await axiosInstance.get('/countries');
      if (res.data.success) setCountries(res.data.data || []);
    } catch (err) {
      console.error('Failed to load countries', err);
    }
  };

  const fetchRegions = async (countryId) => {
    if (!countryId) {
      setRegions([]);
      return;
    }
    try {
      const res = await axiosInstance.get(`/regions?country_id=${countryId}`);
      if (res.data.success) setRegions(res.data.data || []);
    } catch (err) {
      setRegions([]);
    }
  };

  const fetchSubRegions = async () => {
    try {
      setLoading(true);
      let url = '/sub-regions';
      const params = [];
      if (regionFilter) params.push(`region_id=${regionFilter}`);
      else if (countryFilter) params.push(`country_id=${countryFilter}`);
      if (params.length) url += '?' + params.join('&');
      const res = await axiosInstance.get(url);
      if (res.data.success) setSubRegions(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sub regions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCountries(); }, []);
  useEffect(() => {
    if (countryFilter) fetchRegions(countryFilter);
    else setRegions([]);
  }, [countryFilter]);
  useEffect(() => { fetchSubRegions(); }, [regionFilter, countryFilter]);

  const handleBack = () => navigate('/dms/geographic/regions/list');

  const countryOptions = [
    { value: '', label: 'All countries' },
    ...(countries.map((c) => ({ value: String(c.id), label: c.name })))
  ];
  const regionOptions = [
    { value: '', label: 'All regions' },
    ...(regions.map((r) => ({ value: String(r.id), label: r.name })))
  ];

  const handleDeleteClick = (row) => {
    setSubRegionToDelete(row);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!subRegionToDelete) return;
    try {
      await axiosInstance.delete(`/sub-regions/${subRegionToDelete.id}`);
      setShowDeleteModal(false);
      setSubRegionToDelete(null);
      fetchSubRegions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete sub region');
    }
  };

  const getRegionName = (row) => row.region ? row.region.name : '—';
  const getCountryName = (row) => row.country ? row.country.name : '—';

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Sub Regions" onBack={handleBack} showAdd addPath="/dms/geographic/sub-regions/add" />
        {error && <div className="status-message status-message--error">{error}</div>}
        <div className="form-section form-grid-2">
          <FormSelect label="Filter by country" name="countryFilter" value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setRegionFilter(''); }} options={countryOptions} showDefaultOption defaultOptionText="All countries" />
          <FormSelect label="Filter by region" name="regionFilter" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} options={regionOptions} showDefaultOption defaultOptionText="All regions" />
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="list-refresh-bar">
              <RefreshButton onClick={fetchSubRegions} loading={loading} />
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Region</th>
                    <th>Country</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subRegions.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.code || '—'}</td>
                      <td>{getRegionName(row)}</td>
                      <td>{getCountryName(row)}</td>
                      <td>{row.is_active ? 'Yes' : 'No'}</td>
                      <td>
                        <button type="button" className="icon-btn danger" onClick={() => handleDeleteClick(row)} title="Delete">
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Sub Region"
        message={`Are you sure you want to delete "${subRegionToDelete?.name}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteModal(false); setSubRegionToDelete(null); }}
      />
    </>
  );
};

export default SubRegionsList;
