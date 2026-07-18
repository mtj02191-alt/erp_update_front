import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import FormSelect from '../../../../common/FormSelect';
import { FiTrash2 } from 'react-icons/fi';

const CitiesList = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cityToDelete, setCityToDelete] = useState(null);
  const [countryFilter, setCountryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [tehsilFilter, setTehsilFilter] = useState('');

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

  const fetchDistricts = async (regionId) => {
    if (!regionId) { setDistricts([]); return; }
    try {
      const res = await axiosInstance.get(`/districts?region_id=${regionId}`);
      if (res.data.success) setDistricts(res.data.data || []);
    } catch (err) { setDistricts([]); }
  };

  const fetchTehsils = async (districtId) => {
    if (!districtId) { setTehsils([]); return; }
    try {
      const res = await axiosInstance.get(`/tehsils?district_id=${districtId}`);
      if (res.data.success) setTehsils(res.data.data || []);
    } catch (err) { setTehsils([]); }
  };

  const fetchCities = async () => {
    try {
      setLoading(true);
      let url = '/cities';
      const params = [];
      if (tehsilFilter) params.push(`tehsil_id=${tehsilFilter}`);
      else if (districtFilter) params.push(`district_id=${districtFilter}`);
      else if (regionFilter) params.push(`region_id=${regionFilter}`);
      else if (countryFilter) params.push(`country_id=${countryFilter}`);
      if (params.length) url += '?' + params.join('&');
      const res = await axiosInstance.get(url);
      if (res.data.success) setCities(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCountries(); }, []);
  useEffect(() => {
    if (countryFilter) fetchRegions(countryFilter);
    else { setRegions([]); setDistricts([]); setTehsils([]); }
  }, [countryFilter]);
  useEffect(() => {
    if (regionFilter) fetchDistricts(regionFilter);
    else { setDistricts([]); setTehsils([]); }
  }, [regionFilter]);
  useEffect(() => {
    if (districtFilter) fetchTehsils(districtFilter);
    else setTehsils([]);
  }, [districtFilter]);
  useEffect(() => { fetchCities(); }, [tehsilFilter, districtFilter, regionFilter, countryFilter]);

  const handleBack = () => navigate('/dms/geographic/tehsils/list');
  const handleAdd = () => navigate('/dms/geographic/cities/add');

  const countryOptions = [{ value: '', label: 'All countries' }, ...(countries.map((c) => ({ value: String(c.id), label: c.name })))];
  const regionOptions = [{ value: '', label: 'All regions' }, ...(regions.map((r) => ({ value: String(r.id), label: r.name })))];
  const districtOptions = [{ value: '', label: 'All districts' }, ...(districts.map((d) => ({ value: String(d.id), label: d.name })))];
  const tehsilOptions = [{ value: '', label: 'All tehsils' }, ...(tehsils.map((t) => ({ value: String(t.id), label: t.name })))];

  const handleDeleteClick = (row) => {
    setCityToDelete(row);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!cityToDelete) return;
    try {
      await axiosInstance.delete(`/cities/${cityToDelete.id}`);
      setShowDeleteModal(false);
      setCityToDelete(null);
      fetchCities();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete city');
    }
  };

  const getTehsilName = (row) => row.tehsil ? row.tehsil.name : '—';
  const getDistrictName = (row) => row.district ? row.district.name : '—';
  const getRegionName = (row) => row.region ? row.region.name : '—';
  const getCountryName = (row) => row.country ? row.country.name : '—';

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Cities" onBack={handleBack} showAdd addPath="/dms/geographic/cities/add" />
        {error && <div className="status-message status-message--error">{error}</div>}
        <div className="form-section form-grid-4">
          <FormSelect label="Filter by country" name="countryFilter" value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setRegionFilter(''); setDistrictFilter(''); setTehsilFilter(''); }} options={countryOptions} showDefaultOption defaultOptionText="All countries" />
          <FormSelect label="Filter by region" name="regionFilter" value={regionFilter} onChange={(e) => { setRegionFilter(e.target.value); setDistrictFilter(''); setTehsilFilter(''); }} options={regionOptions} showDefaultOption defaultOptionText="All regions" />
          <FormSelect label="Filter by district" name="districtFilter" value={districtFilter} onChange={(e) => { setDistrictFilter(e.target.value); setTehsilFilter(''); }} options={districtOptions} showDefaultOption defaultOptionText="All districts" />
          <FormSelect label="Filter by tehsil" name="tehsilFilter" value={tehsilFilter} onChange={(e) => setTehsilFilter(e.target.value)} options={tehsilOptions} showDefaultOption defaultOptionText="All tehsils" />
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
                  <th>Tehsil</th>
                  <th>District</th>
                  <th>Region</th>
                  <th>Country</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.code || '—'}</td>
                    <td>{getTehsilName(row)}</td>
                    <td>{getDistrictName(row)}</td>
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
        )}
      </div>
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete City"
        message={`Are you sure you want to delete "${cityToDelete?.name}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteModal(false); setCityToDelete(null); }}
      />
    </>
  );
};

export default CitiesList;
