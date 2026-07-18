import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import '../../programs/list/index.css';
import './ViewReport.css';

const ViewDreamSchoolReport = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get(`/program/dream-school-reports/${id}`);
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

  const lines = Array.isArray(data.lines) ? data.lines : [];

  return (
    <>
      <Navbar />
      <div className="view-program-container">
        <PageHeader
          title="Dream School Report"
          showBackButton={true}
          backPath="/program/dream_school_reports"
          showEdit={true}
          editPath={`/program/dream_school_reports/edit/${id}`}
        />
        <div className="dsr-view">
          <p className="dsr-view__month">Month: {data.report_month}</p>
          {lines.map((line) => (
            <article key={line.id} className="dsr-block">
              <table className="dsr-block__table">
                <thead>
                  <tr className="dsr-block__header-row">
                    <th>Month</th>
                    <th>No. of Students</th>
                    <th>Monitoring visit</th>
                    <th>Teacher performance</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{data.report_month}</td>
                    <td>{line.student_count ?? '—'}</td>
                    <td>
                      {line.visits}{' '}
                      {line.visits === 1 ? 'Time' : 'Times'}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{line.teacher_performance}</td>
                    <td>{line.remarks || '—'}</td>
                  </tr>
                  <tr className="dsr-block__footer-row">
                    <td colSpan={2}>
                      <span className="dsr-block__footer-label">School ID</span>
                      {line.school_code}
                    </td>
                    <td colSpan={2}>
                      <span className="dsr-block__footer-label">Location</span>
                      {line.location}
                    </td>
                    <td>
                      <span className="dsr-block__footer-label">Kawish ID</span>
                      {line.kawish_id}
                    </td>
                  </tr>
                </tbody>
              </table>
            </article>
          ))}
        </div>
      </div>
    </>
  );
};

export default ViewDreamSchoolReport;
