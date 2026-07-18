import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import '../../programs/list/index.css';

const ViewAasCollectionCentersReport = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get(`/program/aas-collection-centers-reports/${id}`);
        if (res.data.success) setData(res.data.data);
        else setError(res.data.message || 'Not found');
      } catch (err) {
        setError(err.response?.data?.message || 'Not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-program-container">
          <div className="status-message">Loading…</div>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Navbar />
        <div className="view-program-container">
          <div className="status-message status-message--error">{error || 'Not found'}</div>
        </div>
      </>
    );
  }

  const camps = Array.isArray(data.camp_wise_patients) ? data.camp_wise_patients : [];

  return (
    <>
      <Navbar />
      <div className="view-program-container">
        <PageHeader
          title="AAS Lab — Collection Centers Report"
          showBackButton
          backPath="/program/aas_collection_centers_reports"
          showEdit
          editPath={`/program/aas_collection_centers_reports/update/${id}`}
        />
        <div className="table-container" style={{ marginTop: '1rem' }}>
          <table className="data-table">
            <tbody>
              <tr>
                <th>Total patients</th>
                <td>{data.total_patients}</td>
              </tr>
              <tr>
                <th>Tests conducted</th>
                <td>{data.tests_conducted}</td>
              </tr>
              <tr>
                <th>Pending tests</th>
                <td>{data.pending_tests}</td>
              </tr>
              <tr>
                <th>Revenue</th>
                <td>{data.revenue}</td>
              </tr>
              <tr>
                <th>On-time delivery %</th>
                <td>{data.on_time_delivery_percent}</td>
              </tr>
              <tr>
                <th>Total camps</th>
                <td>{data.total_camps}</td>
              </tr>
            </tbody>
          </table>
          {camps.length > 0 && (
            <>
              <h3 style={{ marginTop: '1.25rem' }}>Patients camp-wise</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Camp</th>
                    <th>Patients</th>
                  </tr>
                </thead>
                <tbody>
                  {camps.map((c, i) => (
                    <tr key={i}>
                      <td>{c.camp_name}</td>
                      <td>{c.patients}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ViewAasCollectionCentersReport;
