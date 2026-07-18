import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import axiosInstance from '../../../../../utils/axios';

const ViewHealthReport = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await axiosInstance.get(`/program/health/reports/${id}`);
        if (!response.data?.success) {
          setError(response.data?.message || 'Report not found');
          setReport(null);
          return;
        }

        const single = response.data.data;
        const date =
          single?.date instanceof Date ? single.date.toISOString().split('T')[0] : new Date(single?.date).toISOString().split('T')[0];

        const dateResponse = await axiosInstance.get(`/program/health/reports/date/${date}`);
        if (!dateResponse.data?.success) {
          setError(dateResponse.data?.message || 'Failed to fetch report details');
          setReport(null);
          return;
        }

        setReport({
          id: single.id,
          date,
          distributions: dateResponse.data.data?.distributions || [],
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch report data. Please try again.');
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReport();
  }, [id]);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const getTotal = (distribution) => Object.values(distribution || {}).reduce((total, count) => total + (Number(count) || 0), 0);

  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="View Report" showBackButton={true} backPath="/program/health/reports/list" />
          <div className="view-content">
            <div className="status-message status-message--error">{error}</div>
          </div>
        </div>
      </>
    );
  }

  if (loading || !report) return <div>Loading...</div>;

  const grandTotal = (report.distributions || []).reduce((total, dist) => total + getTotal(dist.vulnerabilities), 0);

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader
          title="View Health Report"
          showBackButton={true}
          backPath="/program/health/reports/list"
          showEdit={true}
          editPath={`/program/health/reports/update/${report.id}`}
        />
        <div className="view-content">
          <div className="view-section">
            <h3 className="view-section-title">Report Summary</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Report ID</span>
                <span className="view-item-value">HLT-{report.id}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Date</span>
                <span className="view-item-value">{formatDate(report.date)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Grand Total</span>
                <span className="view-item-value">{grandTotal}</span>
              </div>
            </div>
          </div>

          {(report.distributions || []).map((dist) => (
            <div className="view-section" key={dist.id}>
              <h3 className="view-section-title">{dist.type} Distribution</h3>
              <div className="view-grid-dynamic">
                {Object.entries(dist.vulnerabilities || {}).map(([vul, count]) => (
                  <div className="view-item" key={vul}>
                    <span className="view-item-label">{vul}</span>
                    <span className="view-item-value">{count}</span>
                  </div>
                ))}
              </div>
              <div className="view-total">
                <span className="view-item-label">Sub-Total</span>
                <span className="view-item-value">{getTotal(dist.vulnerabilities)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ViewHealthReport;

