import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import axios from '../../../../../utils/axios';

const ViewWaterReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, [id]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            setError('');

            let dateKey = id;
            const isDateKey = typeof id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(id);
            if (!isDateKey) {
                const single = await axios.get(`/program/water/reports/${id}`);
                if (!single.data?.success) {
                    setError(single.data?.message || 'Report not found');
                    setReport(null);
                    return;
                }
                dateKey = new Date(single.data.data?.date).toISOString().split('T')[0];
            }

            const response = await axios.get(`/program/water/reports/date/${dateKey}`);
            
            if (response.data.success) {
                const reportData = response.data.data;
                setReport({
                    id: reportData.date, // Using date as ID for grouping
                    date: reportData.date,
                    activities: reportData.activities || []
                });
            } else {
                setError(response.data.message || 'Report not found');
            }
        } catch (err) {
            console.error('Error fetching water report:', err);
            setError(err.response?.data?.message || 'Failed to fetch report');
        } finally {
            setLoading(false);
        }
    };
    
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };
    
    if (loading) {
        return <div>Loading...</div>;
    }
    
    if (error) {
        return (
            <>
                <Navbar />
                <div className="view-wrapper">
                    <PageHeader 
                        title="View Report"
                        showBackButton={true}
                        backPath="/program/water/reports/list"
                    />
                    <div className="view-content">
                        <div className="status-message status-message--error">{error}</div>
                    </div>
                </div>
            </>
        );
    }
    
    if (!report) {
        return (
            <>
                <Navbar />
                <div className="view-wrapper">
                    <PageHeader 
                        title="View Report"
                        showBackButton={true}
                        backPath="/program/water/reports/list"
                    />
                    <div className="view-content">
                        <div className="status-message status-message--error">Report not found</div>
                    </div>
                </div>
            </>
        );
    }

    const totalQuantity = report.activities.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0);

    return (
        <>
            <Navbar />
            <div className="view-wrapper">
                <PageHeader 
                    title="View Water Report"
                    showBackButton={true}
                    backPath="/program/water/reports/list"
                    showEdit={true}
                    editPath={`/program/water/reports/update/${report.id}`}
                />
                <div className="view-content">
                    <div className="view-section">
                        <h3 className="view-section-title">Report Summary</h3>
                        <div className="view-grid">
                            <div className="view-item">
                                <span className="view-item-label">Report ID</span>
                                <span className="view-item-value">WTR-{report.id}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Date</span>
                                <span className="view-item-value">{formatDate(report.date)}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Total Quantity</span>
                                <span className="view-item-value">{totalQuantity}</span>
                            </div>
                        </div>
                    </div>

                    <div className="view-section">
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Activity</th>
                                        <th>System</th>
                                        <th>Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.activities.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.activity}</td>
                                            <td>{item.system}</td>
                                            <td>{item.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ViewWaterReport; 