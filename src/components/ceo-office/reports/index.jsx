import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../../utils/axios';
import Navbar from '../../Navbar';
import {
  FaPrint, FaFileAlt, FaBullhorn, FaCheckCircle, FaUsers,
  FaHourglassHalf, FaClipboardList, FaHandshake, FaTasks,
  FaExclamationTriangle, FaDownload
} from 'react-icons/fa';
import './index.css';

const reportTypes = [
  { value: 'daily_dashboard', label: 'Daily CEO Dashboard', icon: <FaFileAlt /> },
  { value: 'direct_orders', label: 'Direct Orders', icon: <FaBullhorn /> },
  { value: 'approval_records', label: 'Approval Records', icon: <FaCheckCircle /> },
  { value: 'visitor_logs', label: 'Visitor Logs', icon: <FaUsers /> },
  { value: 'waiting_responses', label: 'Waiting Responses', icon: <FaHourglassHalf /> },
  { value: 'project_command_sheets', label: 'Project Command Sheets', icon: <FaClipboardList /> },
  { value: 'meeting_notes', label: 'Meeting Notes', icon: <FaHandshake /> },
  { value: 'completed_work', label: 'Completed Work', icon: <FaTasks /> },
  { value: 'unprocessed_notes', label: 'Unprocessed Notes', icon: <FaExclamationTriangle /> },
];

const Reports = () => {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const generateReport = async () => {
    if (!selectedReport) {
      toast.error('Please select a report type');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`/ceo-notes/reports/${selectedReport}`, {
        params: { start_date: startDate, end_date: endDate },
      });
      setReportData(response.data);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    const records = reportData.records || reportData.today_notes || [];
    const isDailyDashboard = selectedReport === 'daily_dashboard';

    return (
      <div className="report-content">
        <div className="report-header">
          <h2>{reportData.title || 'Report'}</h2>
          <div className="report-meta">
            <span>From: {formatDate(reportData.date_range?.start)}</span>
            <span>To: {formatDate(reportData.date_range?.end)}</span>
            <span>Generated: {new Date().toLocaleString()}</span>
          </div>
        </div>

        {isDailyDashboard && reportData.summary && (
          <div className="report-summary-grid">
            <div className="report-summary-card">
              <div className="report-summary-label">Total Notes</div>
              <div className="report-summary-value">{reportData.summary.total_notes}</div>
            </div>
            <div className="report-summary-card warning">
              <div className="report-summary-label">Pending Approvals</div>
              <div className="report-summary-value">{reportData.summary.pending_approvals}</div>
            </div>
            <div className="report-summary-card danger">
              <div className="report-summary-label">Overdue Follow-ups</div>
              <div className="report-summary-value">{reportData.summary.overdue_follow_ups}</div>
            </div>
            <div className="report-summary-card">
              <div className="report-summary-label">Waiting Responses</div>
              <div className="report-summary-value">{reportData.summary.waiting_responses}</div>
            </div>
            <div className="report-summary-card">
              <div className="report-summary-label">Unprocessed</div>
              <div className="report-summary-value">{reportData.summary.unprocessed_notes}</div>
            </div>
          </div>
        )}

        {!isDailyDashboard && reportData.total !== undefined && (
          <div className="report-total">Total Records: {reportData.total}</div>
        )}

        <table className="report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title / Name</th>
              <th>Department</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map((record, idx) => (
                <tr key={record.id || idx}>
                  <td>{idx + 1}</td>
                  <td>{record.title || record.visitor_name || record.caller_name || record.contact_name || record.project_name || '-'}</td>
                  <td>{record.department || '-'}</td>
                  <td>{record.priority || '-'}</td>
                  <td>{record.status || '-'}</td>
                  <td>{formatDate(record.date || record.date_time || record.created_at)}</td>
                  <td>{formatDate(record.due_date || record.end_date)}</td>
                  <td>{record.assigned_to || record.created_by || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="reports-page">
        <div className="reports-header">
          <h2>CEO Office Reports</h2>
          <button onClick={() => navigate('/ceo-office/dashboard')} className="note-view-btn note-view-btn-secondary">
            Back to Dashboard
          </button>
        </div>

        <div className="reports-controls">
          <div className="report-type-grid">
            {reportTypes.map(rt => (
              <button
                key={rt.value}
                className={`report-type-card ${selectedReport === rt.value ? 'selected' : ''}`}
                onClick={() => setSelectedReport(rt.value)}
              >
                <span className="report-type-icon">{rt.icon}</span>
                <span className="report-type-label">{rt.label}</span>
              </button>
            ))}
          </div>

          <div className="report-date-controls">
            <div className="report-date-group">
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="report-date-group">
              <label>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <button onClick={generateReport} className="report-generate-btn" disabled={loading || !selectedReport}>
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            {/* {reportData && (
              <button onClick={handlePrint} className="report-print-btn">
                <FaPrint /> Print / Export PDF
              </button>
            )} */}
          </div>
        </div>

        <div className="report-preview">
          {loading ? (
            <div className="loading-container">Generating report...</div>
          ) : reportData ? (
            renderReportContent()
          ) : (
            <div className="report-empty">Select a report type and date range, then click Generate Report</div>
          )}
        </div>
      </div>
    </>
  );
};

export default Reports;
