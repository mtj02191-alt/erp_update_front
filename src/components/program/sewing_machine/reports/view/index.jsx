import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';

const ViewSewingMachineReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchReport();
    }, [id]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/program/sewing_machine/reports/${id}`);
            
            if (response.data.success) {
                setReport(response.data.data);
                setError('');
            } else {
                setError('Failed to fetch report data');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch report data. Please try again.');
            console.error('Error fetching report:', err);
        } finally {
            setLoading(false);
        }
    };
    
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };
    
    const getTotal = (assistance) => {
        if (!assistance) return 0;
        return Object.values(assistance).reduce((total, count) => total + count, 0);
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="view-wrapper">
                    <PageHeader 
                        title="View Sewing Machine Report"
                        showBackButton={true}
                        backPath="/program/sewing_machine/reports/list"
                    />
                    <div className="loading">Loading...</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="view-wrapper">
                    <PageHeader 
                        title="View Sewing Machine Report"
                        showBackButton={true}
                        backPath="/program/sewing_machine/reports/list"
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
                        title="View Sewing Machine Report"
                        showBackButton={true}
                        backPath="/program/sewing_machine/reports/list"
                    />
                    <div className="view-content">
                        <div className="status-message status-message--error">Report not found</div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="view-wrapper">
                <PageHeader 
                    title="View Sewing Machine Report"
                    showBackButton={true}
                    backPath="/program/sewing_machine/reports/list"
                    showEdit={true}
                    editPath={`/program/sewing_machine/reports/update/${report.id}`}
                />
                <div className="view-content">
                    <div className="view-section">
                        <h3 className="view-section-title">Report Details</h3>
                        <div className="view-grid">
                            <div className="view-item">
                                <span className="view-item-label">Report ID</span>
                                <span className="view-item-value">SM-{report.id}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Date</span>
                                <span className="view-item-value">{formatDate(report.date)}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Total Machines</span>
                                <span className="view-item-value">{getTotal(report.assistance)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="view-section">
                        <h3 className="view-section-title">Machine Distribution</h3>
                        <div className="view-grid-dynamic">
                            {report.assistance && Object.entries(report.assistance).map(([vul, count]) => (
                                <div className="view-item" key={vul}>
                                    <span className="view-item-label">{vul}</span>
                                    <span className="view-item-value">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ViewSewingMachineReport; 