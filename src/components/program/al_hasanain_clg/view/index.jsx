import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';

// Reuse existing view styling
import '../../programs/list/index.css';

const ViewAlHasanainClg = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get(`/program/al-hasanain-clg/${id}`);
        if (res.data?.success) {
          setData(res.data?.data || null);
          setError('');
        } else {
          setError(res.data?.message || 'Not found');
        }
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

  return (
    <>
      <Navbar />
      <div className="view-program-container">
        <PageHeader
          title="Al Hasanain CLG"
          showBackButton
          backPath="/program/al_hasanain_clg"
          showEdit
          editPath={`/program/al_hasanain_clg/update/${id}`}
        />

        <div className="table-container" style={{ marginTop: '1rem' }}>
          <table className="data-table">
            <tbody>
              <tr>
                <th>Total students</th>
                <td>{data.total_students}</td>
              </tr>
              <tr>
                <th>Active teachers</th>
                <td>{data.active_teachers}</td>
              </tr>
              <tr>
                <th>Attendance %</th>
                <td>{data.attendance_percent}</td>
              </tr>
              <tr>
                <th>Dropout rate %</th>
                <td>{data.dropout_rate}</td>
              </tr>
              <tr>
                <th>Pass rate %</th>
                <td>{data.pass_rate}</td>
              </tr>
              <tr>
                <th>Fee collection</th>
                <td>{data.fee_collection}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ViewAlHasanainClg;

