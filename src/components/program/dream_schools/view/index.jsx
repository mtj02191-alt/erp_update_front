import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import '../../programs/list/index.css';

const ViewDreamSchool = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get(`/program/dream-schools/${id}`);
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

  return (
    <>
      <Navbar />
      <div className="view-program-container">
        <PageHeader
          title="Dream School"
          showBackButton={true}
          backPath="/program/dream_schools"
          showEdit={true}
          editPath={`/program/dream_schools/update/${id}`}
        />
        <div className="table-container" style={{ marginTop: '1rem' }}>
          <table className="data-table">
            <tbody>
              <tr>
                <th>School ID</th>
                <td className="mono">{data.school_code}</td>
              </tr>
              <tr>
                <th>No. of students</th>
                <td>{data.student_count}</td>
              </tr>
              <tr>
                <th>Location</th>
                <td>{data.location}</td>
              </tr>
              <tr>
                <th>Kawish ID</th>
                <td>{data.kawish_id}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ViewDreamSchool;
