import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import '../list/index.css';
import './index.css';

const ViewProgram = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchProgram();
    // eslint-disable-next-line
  }, [id]);

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/programs/${id}`);
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch program');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch program');
      console.error('Error fetching program:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-program-container">
          <div className="status-message">Loading program...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-program-container">
          <div className="status-message status-message--error">{error}</div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <div className="view-program-container">
          <div className="status-message status-message--error">Program not found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="view-program-container">
        <PageHeader
          title="View Program"
          showBackButton={true}
          backPath="/program/programs"
          showEdit={true}
          editPath={`/program/programs/update/${id}`}
        />

        <div className="view-program-content">
          <div className="view-row">
            <span className="view-label">Key</span>
            <span className="view-value mono">{data.key}</span>
          </div>
          <div className="view-row">
            <span className="view-label">Label</span>
            <span className="view-value">{data.label}</span>
          </div>
          <div className="view-row">
            <span className="view-label">Logo</span>
            <span className="view-value">{data.logo || '-'}</span>
          </div>
          <div className="view-row">
            <span className="view-label">Status</span>
            <span className={`status-badge ${data.status === 'active' ? 'active' : 'inactive'}`}>
              {data.status}
            </span>
          </div>
          <div className="view-row">
            <span className="view-label">Application reports</span>
            <span className={`status-badge ${data.applicationable !== false ? 'active' : 'inactive'}`}>
              {data.applicationable !== false ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="view-actions">
            <button className="secondary_btn" type="button" onClick={() => navigate('/program/programs')}>
              Back to list
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewProgram;

