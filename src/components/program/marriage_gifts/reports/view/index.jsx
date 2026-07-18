import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';

const ViewMarriageGiftsReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchReport();
    }, [id]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/program/marriage-gifts/reports/${id}`);
            
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
    
    const getTotal = (gifts) => {
        if (!gifts) return 0;
        return Object.values(gifts).reduce((total, count) => total + count, 0);
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="view-wrapper">
                    <PageHeader 
                        title="View Marriage Gifts Report"
                        showBackButton={true}
                        backPath="/program/marriage_gifts/reports/list"
                        showEdit={true}
                        editPath={`/program/marriage_gifts/reports/update/${id}`}
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
                        title="View Marriage Gifts Report"
                        showBackButton={true}
                        backPath="/program/marriage_gifts/reports/list"
                        showEdit={true}
                        editPath={`/program/marriage_gifts/reports/update/${id}`}
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
                        title="View Marriage Gifts Report"
                        showBackButton={true}
                        backPath="/program/marriage_gifts/reports/list"
                        showEdit={true}
                        editPath={`/program/marriage_gifts/reports/update/${id}`}
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
                    title="View Marriage Gifts Report"
                    showBackButton={true}
                    backPath="/program/marriage_gifts/reports/list"
                    showEdit={true}
                    editPath={`/program/marriage_gifts/reports/update/${report.id}`}
                />
                <div className="view-content">
                    <div className="view-section">
                        <h3 className="view-section-title">Report Details</h3>
                        <div className="view-grid">
                            <div className="view-item">
                                <span className="view-item-label">Report ID</span>
                                <span className="view-item-value">MG-{report.id}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Date</span>
                                <span className="view-item-value">{formatDate(report.date)}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Total Gifts</span>
                                <span className="view-item-value">{getTotal(report.gifts)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="view-section">
                        <h3 className="view-section-title">Gift Distribution</h3>
                        <div className="view-grid-dynamic">
                            {report.gifts && Object.entries(report.gifts).map(([vul, count]) => (
                                <div className="view-item" key={vul}>
                                    <span className="view-item-label">{vul}</span>
                                    <span className="view-item-value">{count || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ViewMarriageGiftsReport; 