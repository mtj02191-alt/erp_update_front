import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import FormSelect from '../../../common/FormSelect';
import { FiEye, FiEdit, FiTrash2, FiCheckCircle, FiXCircle, FiBarChart2, FiEdit3, FiRefreshCw } from 'react-icons/fi';

const QUESTION_TYPES = {
  mcq_single: 'MCQ (Single)',
  yes_no: 'Yes/No',
  rating_1_5: 'Rating 1-5',
  short_text: 'Short Text',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
];

const SurveysList = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/surveys');
      if (res.data.success) setSurveys(res.data.data || []);
      else setError('Failed to load surveys');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const filteredSurveys = statusFilter
    ? surveys.filter((s) => s.status === statusFilter)
    : surveys;

  const handleBack = () => navigate('/dms/surveys/list');
  const handleAdd = () => navigate('/dms/surveys/add');

  const handleDeleteClick = (row) => {
    setSurveyToDelete(row);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!surveyToDelete) return;
    try {
      await axiosInstance.delete(`/surveys/${surveyToDelete.id}`);
      setShowDeleteModal(false);
      setSurveyToDelete(null);
      fetchSurveys();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete survey');
    }
  };

  const handleActivate = async (survey) => {
    try {
      setActionLoading(survey.id);
      await axiosInstance.patch(`/surveys/${survey.id}/activate`);
      fetchSurveys();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to activate');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async (survey) => {
    try {
      setActionLoading(survey.id);
      await axiosInstance.patch(`/surveys/${survey.id}/close`);
      fetchSurveys();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close survey');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (survey) => {
    try {
      setActionLoading(survey.id);
      await axiosInstance.patch(`/surveys/${survey.id}/reactivate`);
      fetchSurveys();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reactivate survey');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const cls = status === 'active' ? 'status-badge--active' : status === 'closed' ? 'status-badge--closed' : 'status-badge--draft';
    return <span className={`status-badge ${cls}`}>{status}</span>;
  };

  const getActions = (survey) => {
    const actions = [
      { icon: <FiEye />, label: 'View', color: '#2196f3', onClick: () => navigate(`/dms/surveys/view/${survey.id}`), visible: true },
      { icon: <FiEdit />, label: 'Edit', color: '#ff9800', onClick: () => navigate(`/dms/surveys/edit/${survey.id}`), visible: survey.status === 'draft' },
      { icon: <FiEdit3 />, label: 'Fill', color: '#00bcd4', onClick: () => navigate(`/dms/surveys/fill/${survey.id}`), visible: survey.status === 'active' },
      { icon: <FiCheckCircle />, label: 'Activate', color: '#4caf50', onClick: () => handleActivate(survey), visible: survey.status === 'draft', disabled: actionLoading === survey.id },
      { icon: <FiXCircle />, label: 'Close', color: '#9e9e9e', onClick: () => handleClose(survey), visible: survey.status === 'active', disabled: actionLoading === survey.id },
      { icon: <FiRefreshCw />, label: 'Reactivate', color: '#4caf50', onClick: () => handleReactivate(survey), visible: survey.status === 'closed', disabled: actionLoading === survey.id },
      { icon: <FiBarChart2 />, label: 'Report', color: '#673ab7', onClick: () => navigate(`/dms/surveys/report/${survey.id}`), visible: survey.status === 'closed' },
      { icon: <FiTrash2 />, label: 'Delete', color: '#f44336', onClick: () => handleDeleteClick(survey), visible: survey.status === 'draft' },
    ];
    return actions.filter((a) => a.visible);
  };

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title="Surveys" showBackButton={false} showAdd addPath="/dms/surveys/add" />
        {error && <div className="status-message status-message--error">{error}</div>}
        <div className="list-content">
          <div className="form-section" style={{ marginBottom: '16px' }}>
            <FormSelect
              label="Status"
              name="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
              showDefaultOption
              defaultOptionText="All statuses"
            />
          </div>
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p>Loading surveys...</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Questions</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSurveys.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="no-data">No surveys found</td>
                    </tr>
                  ) : (
                    filteredSurveys.map((s) => (
                      <tr key={s.id}>
                        <td>{s.title}</td>
                        <td>{getStatusBadge(s.status)}</td>
                        <td>{s.questions?.length ?? 0}</td>
                        <td>{s.start_at ? new Date(s.start_at).toLocaleDateString() : '—'}</td>
                        <td>{s.end_at ? new Date(s.end_at).toLocaleDateString() : '—'}</td>
                        <td>
                          <ActionMenu actions={getActions(s)} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={showDeleteModal}
        text={surveyToDelete ? `Are you sure you want to delete "${surveyToDelete.title}"?` : ''}
        delete
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteModal(false); setSurveyToDelete(null); }}
      />
    </>
  );
};

export default SurveysList;
