import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import { PrimaryButton } from '../../../common/buttons';
import axiosInstance from '../../../../utils/axios';
import { getStatusLabel, formatComplaintCode, getCategoryLabel } from '../shared/complaintCaseConfig';
import '../shared/complaintCase.css';
import './index.css';

export default function TrackComplaintCase() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await axiosInstance.post('/tickets/case/public/track', {
        code: formatComplaintCode(code),
      });
      setResult(response.data?.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Complaint not found for this code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="list-wrapper cc-shell">
        <PageHeader
          title="Track Complaint"
          showBackButton
          backPath="/complaints/list"
          showAdd={false}
        />
        <div className="list-content complaint-case-track">
          <div className="complaint-case-track__card cc-surface">
            <div className="complaint-case-track__intro">
              <div className="complaint-case-track__icon">
                <FiSearch />
              </div>
              <h2>Check complaint status</h2>
              <p>Enter the reference code you received when the complaint was submitted.</p>
            </div>

            <form onSubmit={handleTrack} className="complaint-case-track__form">
              <label className="form-label">
                Reference Code
                <input
                  className="form-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="CMP-XXXXXXXX"
                  required
                />
              </label>
              <PrimaryButton type="submit" disabled={loading}>
                {loading ? 'Checking…' : 'Track Status'}
              </PrimaryButton>
            </form>

            {error && <div className="complaint-case-track__error">{error}</div>}

            {result && (
              <section className="complaint-case-track__result">
                <div className="complaint-case-track__result-head">
                  <span className="cc-code">{result.complaint_code}</span>
                  <span className={`cc-status cc-status--${result.status}`}>
                    {getStatusLabel(result.status)}
                  </span>
                </div>
                <h3>{result.title}</h3>
                <div className="complaint-case-track__meta">
                  <div>
                    <strong>Category</strong>
                    <span>{getCategoryLabel(result.category)}</span>
                  </div>
                  <div>
                    <strong>Meetings held</strong>
                    <span>{result.meetings_count}</span>
                  </div>
                </div>
                {result.resolution_summary && (
                  <div className="complaint-case-track__resolution">
                    <strong>Resolution</strong>
                    <p>{result.resolution_summary}</p>
                  </div>
                )}
                {result.status_history?.length > 0 && (
                  <div className="complaint-case-track__history">
                    <h4>Status History</h4>
                    <ul>
                      {result.status_history.map((item, idx) => (
                        <li key={idx}>
                          <span>{new Date(item.created_at).toLocaleString()}</span>
                          <p>{item.remarks}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
