import { useState } from "react";
import Navbar from "../../../Navbar"
import { FiFileText, FiDownload,  } from 'react-icons/fi';
import { ImQrcode } from "react-icons/im";

import PageHeader from "../../../common/PageHeader";
import axiosInstance from "../../../../utils/axios";

const DonationReports = () =>{
  // Report generation state
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState('');
  const [reportMessage, setReportMessage] = useState({ type: '', text: '' });
  const [showCustomReportModal, setShowCustomReportModal] = useState(false);
  const [recipientEmails, setRecipientEmails] = useState('');
  const [customReportDates, setCustomReportDates] = useState({
    startDate: '',
    endDate: '',
    type: 'daily',
    recipientEmails: ''
  });
  
  // QR Code generation state
  const [generatingQr, setGeneratingQr] = useState(false);
  const [qrFormData, setQrFormData] = useState({
    projectId: '',
    campaign: '',
    label: '',
    filename: ''
  });
  const [generatedQr, setGeneratedQr] = useState(null);
  const [qrMessage, setQrMessage] = useState({ type: '', text: '' });
  // Helper function to parse emails from comma-separated string
  const parseEmails = (emailString) => {
    if (!emailString || !emailString.trim()) {
      return undefined; // Use default emails from backend
    }
    // Split by comma, trim whitespace, filter empty strings
    const emails = emailString
      .split(',')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));
    return emails.length > 0 ? emails : undefined;
  };

  const handleGenerateWeeklyReport = async () => {
    try {
      setGeneratingReport(true);
      setReportMessage({ type: '', text: '' });
      
      const emails = parseEmails(recipientEmails);
      const response = await axiosInstance.post('/donations-report/weekly', {
        recipientEmail: emails
      });
      
      if (response.data.success) {
        setReportMessage({ 
          type: 'success', 
          text: 'Weekly report generated and sent successfully via email!' 
        });
        setTimeout(() => setReportMessage({ type: '', text: '' }), 5000);
      } else {
        setReportMessage({ 
          type: 'error', 
          text: response.data.message || 'Failed to generate weekly report' 
        });
      }
    } catch (err) {
      setReportMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to generate weekly report' 
      });
      console.error('Error generating weekly report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGenerateMonthlyReport = async () => {
    try {
      setGeneratingReport(true);
      setReportMessage({ type: '', text: '' });
      
      const emails = parseEmails(recipientEmails);
      const response = await axiosInstance.post('/donations-report/monthly', {
        recipientEmail: emails
      });
      
      if (response.data.success) {
        setReportMessage({ 
          type: 'success', 
          text: 'Monthly report generated and sent successfully via email!' 
        });
        setTimeout(() => setReportMessage({ type: '', text: '' }), 5000);
      } else {
        setReportMessage({ 
          type: 'error', 
          text: response.data.message || 'Failed to generate monthly report' 
        });
      }
    } catch (err) {
      setReportMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to generate monthly report' 
      });
      console.error('Error generating monthly report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGenerateDailyReport = async () => {
    try {
      setGeneratingReport(true);
      setReportMessage({ type: '', text: '' });
      
      const emails = parseEmails(recipientEmails);
      const response = await axiosInstance.post('/donations-report/daily', {
        recipientEmail: emails
      });
      
      if (response.data.success) {
        setReportMessage({ 
          type: 'success', 
          text: 'Daily report generated and sent successfully via email!' 
        });
        setTimeout(() => setReportMessage({ type: '', text: '' }), 5000);
      } else {
        setReportMessage({ 
          type: 'error', 
          text: response.data.message || 'Failed to generate daily report' 
        });
      }
    } catch (err) {
      setReportMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to generate daily report' 
      });
      console.error('Error generating daily report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGenerateCustomReport = async () => {
    if (!customReportDates.startDate || !customReportDates.endDate) {
      setReportMessage({ 
        type: 'error', 
        text: 'Please select both start and end dates' 
      });
      return;
    }

    try {
      setGeneratingReport(true);
      setReportMessage({ type: '', text: '' });
      
      const emails = parseEmails(customReportDates.recipientEmails);
      const response = await axiosInstance.post('/donations-report/custom', {
        startDate: customReportDates.startDate,
        endDate: customReportDates.endDate,
        type: customReportDates.type,
        recipientEmail: emails
      });
      
      if (response.data.success) {
        setReportMessage({ 
          type: 'success', 
          text: 'Custom report generated and sent successfully via email!' 
        });
        setShowCustomReportModal(false);
        setCustomReportDates({ startDate: '', endDate: '', type: 'daily', recipientEmails: '' });
        setTimeout(() => setReportMessage({ type: '', text: '' }), 5000);
      } else {
        setReportMessage({ 
          type: 'error', 
          text: response.data.message || 'Failed to generate custom report' 
        });
      }
    } catch (err) {
      setReportMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to generate custom report' 
      });
      console.error('Error generating custom report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGenerateQrCode = async () => {
    try {
      setGeneratingQr(true);
      setQrMessage({ type: '', text: '' });
      
      const payload = {};
      if (qrFormData.projectId) {
        payload.projectId = qrFormData.projectId;
      }
      if (qrFormData.campaign) {
        payload.campaign = qrFormData.campaign;
      }
      if (qrFormData.label) {
        payload.label = qrFormData.label;
      }
      
      const response = await axiosInstance.post('/qr-codes', payload);
      
      if (response.data.success) {
        setGeneratedQr(response.data.data);
        setQrMessage({ 
          type: 'success', 
          text: 'QR code generated successfully!' 
        });
        // Keep filename for next download, but user can change it
        setTimeout(() => setQrMessage({ type: '', text: '' }), 5000);
      } else {
        setQrMessage({ 
          type: 'error', 
          text: response.data.message || 'Failed to generate QR code' 
        });
      }
    } catch (err) {
      setQrMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to generate QR code' 
      });
      console.error('Error generating QR code:', err);
    } finally {
      setGeneratingQr(false);
    }
  };

  const handleDownloadQr = async (imageUrl, filename = 'qr-code.png') => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading QR code:', err);
      setQrMessage({ 
        type: 'error', 
        text: 'Failed to download QR code' 
      });
    }
  };

    return <>
          <Navbar />
          <div className="list-wrapper">
          <PageHeader 
          title="Create Donations Reports" 
        />
        <div className="list-content">
        {error && <div className="status-message status-message--error">{error}</div>}
          {/* Report Message */}
          {reportMessage.text && (
            <div className={`status-message status-message--${reportMessage.type}`} style={{ marginBottom: '15px' }}>
              {reportMessage.text}
            </div>
          )}
              {/* Email Input Section */}
          <div style={{
            padding: '15px 20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#2c5aa0',
              fontSize: '14px'
            }}>
              Recipient Email(s) <span style={{ color: '#666', fontWeight: '400', fontSize: '12px' }}>(comma-separated, leave empty for default)</span>
            </label>
            <input
              type="text"
              value={recipientEmails}
              onChange={(e) => setRecipientEmails(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Report Generation Section */}
            <div style={{
            display: 'flex',
            gap: '10px',
            padding: '15px 20px', 
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '20px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginRight: 'auto'
            }}>
              <FiFileText style={{ fontSize: '18px', color: '#2c5aa0' }} />
              <span style={{ fontWeight: '600', color: '#2c5aa0' }}>Generate Reports:</span>
            </div>
            
            <button
              onClick={handleGenerateDailyReport}
              disabled={generatingReport} 
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: generatingReport ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: generatingReport ? 0.6 : 1
              }}
            >
              {generatingReport ? 'Generating...' : 'Daily Report'}
            </button>
            
            <button
              onClick={handleGenerateWeeklyReport}
              disabled={generatingReport}
              style={{
                padding: '8px 16px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: generatingReport ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: generatingReport ? 0.6 : 1
              }}
            >
              {generatingReport ? 'Generating...' : 'Weekly Report'}
            </button>
            
            <button
              onClick={handleGenerateMonthlyReport}
              disabled={generatingReport}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: generatingReport ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: generatingReport ? 0.6 : 1
              }}
            >
              {generatingReport ? 'Generating...' : 'Monthly Report'}
            </button>
            
            <button
              onClick={() => setShowCustomReportModal(true)}
              disabled={generatingReport}
              style={{
                padding: '8px 16px',
                backgroundColor: '#fd7e14',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: generatingReport ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: generatingReport ? 0.6 : 1
              }}
            >
              <FiDownload /> Custom Report
            </button>
          </div>

          {/* QR Code Generation Section */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '20px'
            }}>
              <ImQrcode style={{ fontSize: '20px', color: '#2c5aa0' }} />
              <h3 style={{ margin: 0, color: '#2c5aa0', fontSize: '18px', fontWeight: '600' }}>
                Generate QR Code
              </h3>
            </div>

            {qrMessage.text && (
              <div className={`status-message status-message--${qrMessage.type}`} style={{ marginBottom: '15px' }}>
                {qrMessage.text}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                  Project ID <span style={{ color: '#666', fontWeight: '400', fontSize: '12px' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={qrFormData.projectId}
                  onChange={(e) => setQrFormData(prev => ({ ...prev, projectId: e.target.value }))}
                  placeholder="e.g., health, education"
                  maxLength={80}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                  Campaign (ref) <span style={{ color: '#666', fontWeight: '400', fontSize: '12px' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={qrFormData.campaign}
                  onChange={(e) => setQrFormData(prev => ({ ...prev, campaign: e.target.value }))}
                  placeholder="e.g., ramzan2026"
                  maxLength={80}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                  Label <span style={{ color: '#666', fontWeight: '400', fontSize: '12px' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={qrFormData.label}
                  onChange={(e) => setQrFormData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., BOX-001"
                  maxLength={80}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                  File Name <span style={{ color: '#666', fontWeight: '400', fontSize: '12px' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={qrFormData.filename}
                  onChange={(e) => setQrFormData(prev => ({ ...prev, filename: e.target.value }))}
                  placeholder="e.g., donation-box-001"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleGenerateQrCode}
              disabled={generatingQr}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2c5aa0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: generatingQr ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: generatingQr ? 0.6 : 1
              }}
            >
              <ImQrcode />
              {generatingQr ? 'Generating...' : 'Generate QR Code'}
            </button>

            {/* Display Generated QR Code */}
            {generatedQr && (
              <div style={{
                marginTop: '20px',
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#2c5aa0' }}>
                  Generated QR Code
                </h4>
                
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={generatedQr.imageUrl}
                      alt="QR Code"
                      style={{
                        width: '220px',
                        height: '220px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '10px',
                        backgroundColor: 'white'
                      }}
                    />
                    <div style={{ marginTop: '10px' }}>
                      <button
                        onClick={() => {
                          const filename = qrFormData.filename 
                            ? `${qrFormData.filename}.png` 
                            : `qr-${generatedQr.id || 'code'}.png`;
                          handleDownloadQr(generatedQr.imageUrl, filename);
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        <FiDownload style={{ marginRight: '4px', display: 'inline' }} />
                        Download PNG
                      </button>
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <strong style={{ color: '#666', fontSize: '12px' }}>QR Code ID:</strong>
                      <div style={{ fontSize: '14px' }}>{generatedQr.id}</div>
                    </div>
                    {generatedQr.projectId && (
                      <div style={{ marginBottom: '10px' }}>
                        <strong style={{ color: '#666', fontSize: '12px' }}>Project ID:</strong>
                        <div style={{ fontSize: '14px' }}>{generatedQr.projectId}</div>
                      </div>
                    )}
                    {generatedQr.campaign && (
                      <div style={{ marginBottom: '10px' }}>
                        <strong style={{ color: '#666', fontSize: '12px' }}>Campaign:</strong>
                        <div style={{ fontSize: '14px' }}>{generatedQr.campaign}</div>
                      </div>
                    )}
                    {generatedQr.label && (
                      <div style={{ marginBottom: '10px' }}>
                        <strong style={{ color: '#666', fontSize: '12px' }}>Label:</strong>
                        <div style={{ fontSize: '14px' }}>{generatedQr.label}</div>
                      </div>
                    )}
                    <div style={{ marginBottom: '10px' }}>
                      <strong style={{ color: '#666', fontSize: '12px' }}>Target URL:</strong>
                      <div style={{ 
                        fontSize: '12px', 
                        wordBreak: 'break-all',
                        color: '#2c5aa0',
                        marginTop: '4px'
                      }}>
                        <a href={generatedQr.targetUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2c5aa0' }}>
                          {generatedQr.targetUrl}
                        </a>
                      </div>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong style={{ color: '#666', fontSize: '12px' }}>Image URL:</strong>
                      <div style={{ 
                        fontSize: '12px', 
                        wordBreak: 'break-all',
                        color: '#666',
                        marginTop: '4px'
                      }}>
                        {generatedQr.imageUrl}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom Report Modal */}
          {showCustomReportModal && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
              onClick={() => {
                setShowCustomReportModal(false);
                setCustomReportDates({ startDate: '', endDate: '', type: 'daily', recipientEmails: '' });
              }}
            >
              <div 
                style={{
                  backgroundColor: 'white',
                  padding: '30px',
                  borderRadius: '8px',
                  width: '90%',
                  maxWidth: '500px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#2c5aa0' }}>
                  Generate Custom Report
                </h2>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customReportDates.startDate}
                    onChange={(e) => setCustomReportDates(prev => ({ ...prev, startDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customReportDates.endDate}
                    onChange={(e) => setCustomReportDates(prev => ({ ...prev, endDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Report Type
                  </label>
                  <select
                    value={customReportDates.type}
                    onChange={(e) => setCustomReportDates(prev => ({ ...prev, type: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowCustomReportModal(false);
                      setCustomReportDates({ startDate: '', endDate: '', type: 'daily' });
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateCustomReport}
                    disabled={generatingReport}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#fd7e14',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: generatingReport ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: generatingReport ? 0.6 : 1
                    }}
                  >
                    {generatingReport ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
          </div>
    </>
}

export default DonationReports;