import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';

const SurveyReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const [surveyRes, reportRes] = await Promise.all([
        axiosInstance.get(`/surveys/${id}`),
        axiosInstance.get(`/surveys/${id}/report`),
      ]);
      if (surveyRes.data.success) setSurvey(surveyRes.data.data);
      if (reportRes.data.success) setReport(reportRes.data.data);
      if (!reportRes.data.success) setError(reportRes.data.message || 'No report found. Close the survey first.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate(`/dms/surveys/view/${id}`);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading report...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !report) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="Survey Report" onBack={handleBack} />
          <div className="status-message status-message--error">{error}</div>
          <button className="primary_btn" onClick={handleBack}>Back to Survey</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title={survey?.title ? `${survey.title} – Report` : 'Survey Report'} onBack={handleBack} />
        <div className="list-content">
          <div className="form-section" style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <strong>Total submissions:</strong> {report?.total_submissions ?? 0}
            <span style={{ marginLeft: 16, color: '#666' }}>Generated: {report?.generated_at ? new Date(report.generated_at).toLocaleString() : '—'}</span>
          </div>
          {report?.questionReports?.length > 0 ? (
            report.questionReports.map((qr) => (
              <div key={qr.id} className="form-section" style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <strong>Q: {qr.question?.question_text ?? `Question #${qr.question_id}`}</strong>
                  <span style={{ marginLeft: 8, color: '#666' }}>({qr.responses_count} responses)</span>
                </div>
                {qr.avg_rating != null && (
                  <p><strong>Average rating:</strong> {Number(qr.avg_rating).toFixed(2)}</p>
                )}
                {qr.rating_counts && Object.keys(qr.rating_counts).length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <strong>Rating distribution:</strong>
                    <ul style={{ marginTop: 4 }}>
                      {[1, 2, 3, 4, 5].map((r) => (
                        <li key={r}>Rating {r}: {qr.rating_counts[r] ?? 0}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {qr.option_counts && Object.keys(qr.option_counts).length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <strong>Option counts:</strong>
                    <ul style={{ marginTop: 4 }}>
                      {Object.entries(qr.option_counts).map(([key, count]) => (
                        <li key={key}>{key}: {count}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No question-level report data.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default SurveyReport;
