import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import FormSelect from '../../../../common/FormSelect';
import { FiTrash2 } from 'react-icons/fi';

const RoutesList = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [countryFilter, setCountryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const fetchCountries = async () => {
    try {
      const res = await axiosInstance.get('/countries');
      if (res.data.success) setCountries(res.data.data || []);
    } catch (err) {
      console.error('Failed to load countries', err);
    }
  };

  const fetchRegions = async (countryId) => {
    if (!countryId) { setRegions([]); return; }
    try {
      const res = await axiosInstance.get(`/regions?country_id=${countryId}`);
      if (res.data.success) setRegions(res.data.data || []);
    } catch (err) { setRegions([]); }
  };

  const fetchCities = async (regionId) => {
    if (!regionId) { setCities([]); return; }
    try {
      const res = await axiosInstance.get(`/cities?region_id=${regionId}`);
      if (res.data.success) setCities(res.data.data || []);
    } catch (err) { setCities([]); }
  };

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      let url = '/routes';
      const params = [];
      if (cityFilter) params.push(`city_id=${cityFilter}`);
      else if (regionFilter) params.push(`region_id=${regionFilter}`);
      else if (countryFilter) params.push(`country_id=${countryFilter}`);
      if (params.length) url += '?' + params.join('&');
      const res = await axiosInstance.get(url);
      if (res.data.success) setRoutes(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCountries(); }, []);
  useEffect(() => {
    if (countryFilter) fetchRegions(countryFilter);
    else { setRegions([]); setCities([]); }
  }, [countryFilter]);
  useEffect(() => {
    if (regionFilter) fetchCities(regionFilter);
    else setCities([]);
  }, [regionFilter]);
  useEffect(() => { fetchRoutes(); }, [countryFilter, regionFilter, cityFilter]);

  const handleBack = () => navigate('/dms/geographic/cities/list');
  const handleAdd = () => navigate('/dms/geographic/routes/add');

  const countryOptions = [{ value: '', label: 'All countries' }, ...(countries.map((c) => ({ value: String(c.id), label: c.name })))];
  const regionOptions = [{ value: '', label: 'All regions' }, ...(regions.map((r) => ({ value: String(r.id), label: r.name })))];
  const cityOptions = [{ value: '', label: 'All cities' }, ...(cities.map((c) => ({ value: String(c.id), label: c.name })))];

  const handleDeleteClick = (row) => {
    setRouteToDelete(row);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!routeToDelete) return;
    try {
      await axiosInstance.delete(`/routes/${routeToDelete.id}`);
      setShowDeleteModal(false);
      setRouteToDelete(null);
      fetchRoutes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete route');
    }
  };

  const getRegionName = (row) => row.region ? row.region.name : '—';
  const getCountryName = (row) => row.country ? row.country.name : '—';
  const getCitiesDisplay = (row) => {
    if (row.cities && row.cities.length) return row.cities.map((c) => c.name).join(', ');
    return '—';
  };

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Routes" onBack={handleBack} showAdd addPath="/dms/geographic/routes/add" />
        {error && <div className="status-message status-message--error">{error}</div>}
        <div className="form-section form-grid-3">
          <FormSelect label="Filter by country" name="countryFilter" value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setRegionFilter(''); setCityFilter(''); }} options={countryOptions} showDefaultOption defaultOptionText="All countries" />
          <FormSelect label="Filter by region" name="regionFilter" value={regionFilter} onChange={(e) => { setRegionFilter(e.target.value); setCityFilter(''); }} options={regionOptions} showDefaultOption defaultOptionText="All regions" />
          <FormSelect label="Filter by city" name="cityFilter" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} options={cityOptions} showDefaultOption defaultOptionText="All cities" />
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Region</th>
                  <th>Country</th>
                  <th>Cities</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.code || '—'}</td>
                    <td>{row.route_type || '—'}</td>
                    <td>{getRegionName(row)}</td>
                    <td>{getCountryName(row)}</td>
                    <td style={{ maxWidth: '200px' }}>{getCitiesDisplay(row)}</td>
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
        )}
      </div>
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Route"
        message={`Are you sure you want to delete "${routeToDelete?.name}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteModal(false); setRouteToDelete(null); }}
      />
    </>
  );
};

export default RoutesList;
