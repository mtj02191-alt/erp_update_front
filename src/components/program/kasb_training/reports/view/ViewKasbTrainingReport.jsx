import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../../../utils/axios';
import PageHeader from '../../../../common/PageHeader';
import './ViewKasbTrainingReport.css';
import Navbar from '../../../../Navbar';

const ViewKasbTrainingReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/program/kasb-training/reports/${id}`);
      
      if (response.data.success) {
        setReport(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch report');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching the report');
    } finally {
      setLoading(false);
    }
  };

  const getSkillLevelLabel = (skillLevel) => {
    const labels = {
      'expert': 'Expert',
      'medium_expert': 'Medium Expert',
      'new trainee': 'New Trainee'
    };
    return labels[skillLevel] || skillLevel;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return ( 
      <>
      <Navbar />
      <div className="view-kasb-training-report">
        <PageHeader 
          title="View Kasb Training Report" 
          breadcrumbs={[
            { label: 'Program', path: '/program' },
            { label: 'Kasb Training Reports', path: '/program/kasb-training/reports' },
            { label: 'View Report' }
          ]}
        />
        <div className="loading">Loading...</div>
      </div>
      </>
    );
  }

  if (error) {
    return (<>
          <Navbar />

      <div className="view-kasb-training-report">
        <PageHeader 
          title="View Kasb Training Report" 
          breadcrumbs={[
            { label: 'Program', path: '/program' },
            { label: 'Kasb Training Reports', path: '/program/kasb-training/reports' },
            { label: 'View Report' }
          ]}
        />
        <div className="error-message">{error}</div>
      </div>
      </>
    );
  }

  if (!report) {
    return (
      <div className="view-kasb-training-report">
        <PageHeader 
          title="View Kasb Training Report" 
          breadcrumbs={[
            { label: 'Program', path: '/program' },
            { label: 'Kasb Training Reports', path: '/program/kasb-training/reports' },
            { label: 'View Report' }
          ]}
        />
        <div className="no-data">Report not found</div>
      </div>
    );
  }

  const totalAll = (report.activities || []).reduce(
    (sum, a) => sum + (parseInt(a.total) || 0),
    0,
  );

  return (
  <>
        <Navbar />
    <div className="view-kasb-training-report">
      <PageHeader 
        title="View Kasb Training Report" 
        breadcrumbs={[
          { label: 'Program', path: '/program' },
          { label: 'Kasb Training Reports', path: '/program/kasb-training/reports' },
          { label: 'View Report' }
        ]}
      />
      
      <div className="report-container">
        <div className="report-header">
          <h2>Kasb Training Report Details</h2>
        </div>
        
        <div className="report-content">
          <div className="info-grid">
            <div className="info-item">
              <label>Date:</label>
              <span>{formatDate(report.date)}</span>
            </div>

            <div className="info-item">
              <label>Activities:</label>
              <span>{(report.activities || []).length}</span>
            </div>

            <div className="info-item">
              <label>Total:</label>
              <span className="total-value">{totalAll}</span>
            </div>
          </div>

          <div className="view-section" style={{ marginTop: '20px' }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Skill Level</th>
                    <th>Quantity</th>
                    <th>Addition</th>
                    <th>Left</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.activities || []).map((a) => (
                    <tr key={a.id}>
                      <td>{getSkillLevelLabel(a.skill_level)}</td>
                      <td>{a.quantity}</td>
                      <td>{a.addition}</td>
                      <td>{a.left}</td>
                      <td>{a.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="report-actions">
          <button 
            onClick={() => navigate('/program/kasb-training/reports')}
            className="btn btn-secondary"
          >
            Back to List
          </button>
          <button 
            onClick={() => navigate(`/program/kasb-training/reports/update/${id}`)}
            className="btn btn-primary"
          >
            Edit Report
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default ViewKasbTrainingReport; 