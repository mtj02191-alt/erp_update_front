import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import axios from '../../../../../utils/axios';

const ViewKasbReport = () => {
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

            // If the route param isn't a date, treat it as a report row id:
            // GET /:id -> derive date -> GET /date/:date.
            if (!isDateKey) {
                const single = await axios.get(`/program/kasb/reports/${id}`);
                if (!single.data?.success) {
                    setError(single.data?.message || 'Report not found');
                    setReport(null);
                    return;
                }

                const singleData = single.data.data;
                dateKey = singleData?.date instanceof Date
                    ? singleData.date.toISOString().split('T')[0]
                    : new Date(singleData?.date).toISOString().split('T')[0];
            }

            const response = await axios.get(`/program/kasb/reports/date/${dateKey}`);
            if (response.data.success) {
                const reportData = response.data.data;
                setReport({
                    id: reportData.date, // Use date as ID for grouping/actions
                    date: reportData.date,
                    centers: reportData.centers || []
                });
            } else {
                setError(response.data.message || 'Report not found');
                setReport(null);
            }
        } catch (err) {
            console.error('Error fetching kasb report:', err);
            setError(err.response?.data?.message || 'Failed to fetch report');
            setReport(null);
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
                        backPath="/program/kasb/reports/list"
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
                        backPath="/program/kasb/reports/list"
                    />
                    <div className="view-content">
                        <div className="status-message status-message--error">Report not found</div>
                    </div>
                </div>
            </>
        );
    }

    const totalDelivery = report.centers.reduce((total, item) => total + (parseInt(item.delivery) || 0), 0);

    return (
        <>
            <Navbar />
            <div className="view-wrapper">
                <PageHeader 
                    title="View Kasb Report"
                    showBackButton={true}
                    backPath="/program/kasb/reports/list"
                    showEdit={true}
                    editPath={`/program/kasb/reports/update/${report.id}`}
                />
                <div className="view-content">
                    <div className="view-section">
                        <h3 className="view-section-title">Report Summary</h3>
                        <div className="view-grid">
                            <div className="view-item">
                                <span className="view-item-label">Report ID</span>
                                <span className="view-item-value">KASB-{report.id}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Date</span>
                                <span className="view-item-value">{formatDate(report.date)}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Total Delivery</span>
                                <span className="view-item-value">{totalDelivery}</span>
                            </div>
                        </div>
                    </div>

                    <div className="view-section">
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Center</th>
                                        <th>Delivery</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.centers.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.center}</td>
                                            <td>{item.delivery}</td>
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

export default ViewKasbReport; 