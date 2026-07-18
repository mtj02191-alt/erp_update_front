import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import { program_vulnerabilities, programs_list } from '../../../../../utils/program';

const ViewTarget = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [target, setTarget] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTarget();
    }, [id]);

    const fetchTarget = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/program/targets/${id}`);
            
            if (response.data.success) {
                setTarget(response.data.data);
                setError('');
            } else {
                setError('Failed to fetch target data');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch target data. Please try again.');
            console.error('Error fetching target:', err);
        } finally {
            setLoading(false);
        }
    };
    
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };
    


    const getProgramTitle = (programKey) => {
        const program = programs_list.find(p => p.key === programKey);
        return program ? program.label : programKey;
    };

    const getTargetTypeTitle = (targetTypeKey) => {
        const vulnerability = program_vulnerabilities.find(v => v.key === targetTypeKey);
        return vulnerability ? vulnerability.title : targetTypeKey;
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="view-wrapper">
                    <PageHeader 
                        title="View Program Target"
                        showBackButton={true}
                        backPath="/program/targets/reports/list"
                        showEdit={true}
                        editPath={`/program/targets/reports/update/${id}`}
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
                        title="View Program Target"
                        showBackButton={true}
                        backPath="/program/targets/reports/list"
                        showEdit={true}
                        editPath={`/program/targets/reports/update/${id}`}
                    />
                    <div className="view-content">
                        <div className="status-message status-message--error">{error}</div>
                    </div>
                </div>
            </>
        );
    }
    
    if (!target) {
        return (
            <>
                <Navbar />
                <div className="view-wrapper">
                    <PageHeader 
                        title="View Program Target"
                        showBackButton={true}
                        backPath="/program/targets/reports/list"
                        showEdit={true}
                        editPath={`/program/targets/reports/update/${id}`}
                    />
                    <div className="view-content">
                        <div className="status-message status-message--error">Target not found</div>
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
                    title="View Program Target"
                    showBackButton={true}
                    backPath="/program/targets/reports/list"
                    showEdit={true}
                    editPath={`/program/targets/reports/update/${target.id}`}
                />
                <div className="view-content">
                    <div className="view-section">
                        <h3 className="view-section-title">Target Details</h3>
                        <div className="view-grid">
                            <div className="view-item">
                                <span className="view-item-label">Target ID</span>
                                <span className="view-item-value">TGT-{target.id}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Year</span>
                                <span className="view-item-value">{target.year}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Program</span>
                                <span className="view-item-value">{getProgramTitle(target.program)}</span>
                            </div>
                                                         <div className="view-item">
                                 <span className="view-item-label">Target Type</span>
                                 <span className="view-item-value">{getTargetTypeTitle(target.target_type)}</span>
                             </div>
                        </div>
                    </div>
                    
                    <div className="view-section">
                        <h3 className="view-section-title">Target Metrics</h3>
                        <div className="view-grid">
                            <div className="view-item">
                                <span className="view-item-label">Target</span>
                                <span className="view-item-value">{target.target}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Reached</span>
                                <span className="view-item-value">{target.reached}</span>
                            </div>
                            
                            <div className="view-item">
                                <span className="view-item-label">Remaining</span>
                                <span className="view-item-value">{Math.max(0, target.target - target.reached)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="view-section">
                        <h3 className="view-section-title">Progress Information</h3>
                        <div className="view-grid">
                            <div className="view-item">
                                <span className="view-item-label">Created At</span>
                                <span className="view-item-value">{formatDate(target.created_at)}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Last Updated</span>
                                <span className="view-item-value">{formatDate(target.updated_at)}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Created By</span>
                                <span className="view-item-value">{target.created_by?.email || 'N/A'}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Status</span>
                                <span className="view-item-value">
                                    {target.is_archived ? 'Archived' : 'Active'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ViewTarget; 