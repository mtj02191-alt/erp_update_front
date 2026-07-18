import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import './index.css';
import '../list/index.css';

const ViewSubprogram = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [programs, setPrograms] = useState([]);

  const getProgramTitle = (programId) => {
    const program = programs.find((p) => p.id === programId);
    return program ? program.label : programId;
  };

  useEffect(() => {
    fetchSubprogram();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await axiosInstance.get('/program/programs', {
          params: { page: 1, pageSize: 1000 },
        });
        if (response.data?.success) {
          setPrograms(response.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching programs:', err);
      }
    };
    fetchPrograms();
  }, []);

  const fetchSubprogram = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/subprograms/${id}`);
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch subprogram');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch subprogram');
      console.error('Error fetching subprogram:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-subprogram-container">
          <div className="status-message">Loading subprogram...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-subprogram-container">
          <div className="status-message status-message--error">{error}</div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <div className="view-subprogram-container">
          <div className="status-message status-message--error">Subprogram not found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="view-subprogram-container">
        <PageHeader
          title="View Subprogram"
          showBackButton={true}
          backPath="/program/subprograms"
          showEdit={true}
          editPath={`/program/subprograms/update/${id}`}
        />

        <div className="view-subprogram-content">
          <div className="view-row">
            <span className="view-label">Program</span>
            <span className="view-value">{getProgramTitle(data.program_id)}</span>
          </div>
          <div className="view-row">
            <span className="view-label">Key</span>
            <span className="view-value mono">{data.key}</span>
          </div>
          <div className="view-row">
            <span className="view-label">Label</span>
            <span className="view-value">{data.label}</span>
          </div>
          <div className="view-row">
            <span className="view-label">Status</span>
            <span className={`status-badge ${data.status === 'active' ? 'active' : 'inactive'}`}>
              {data.status}
            </span>
          </div>

          <div className="view-actions">
            <button className="secondary_btn" type="button" onClick={() => navigate('/program/subprograms')}>
              Back to list
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewSubprogram;

