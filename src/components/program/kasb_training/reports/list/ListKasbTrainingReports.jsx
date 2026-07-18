import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../../../utils/axios';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';
import Pagination from '../../../../common/Pagination';
import './ListKasbTrainingReports.css';
import Navbar from '../../../../Navbar';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';

const ListKasbTrainingReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReports();
  }, [currentPage]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/program/kasb-training/reports');
      
      if (response.data.success) {
        const rows = response.data.data || [];
        setReports(rows);

        const uniqueDateKeys = new Set(rows.map((r) => getDateKey(r.date)));
        setTotalPages(Math.max(1, Math.ceil(uniqueDateKeys.size / itemsPerPage)));
      } else {
        setError(response.data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dateKey) => {
    if (window.confirm('Are you sure you want to delete this report date?')) {
      try {
        const response = await axios.delete(`/program/kasb-training/reports/date/${dateKey}`);
        
        if (response.data.success) {
          fetchReports();
        } else {
          setError(response.data.message || 'Failed to delete report');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while deleting the report');
      }
    }
  };

  const getSkillLevelLabel = (skillLevel) => {
    const labels = {
      'expert': 'Expert',
      'medium_expert': 'Medium Expert',
      'new trainee': 'New Trainee'
    };
    return labels[skillLevel] || skillLevel;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  function getDateKey(dateValue) {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return String(dateValue);
    return d.toISOString().split('T')[0];
  }

  const dateGroups = Object.values(
    reports.reduce((acc, row) => {
      const key = getDateKey(row.date);
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {}),
  )
    .map((activities) => {
      const dateKey = getDateKey(activities[0]?.date);
      const skillLevelLabels = Array.from(
        new Set(activities.map((a) => a.skill_level)),
      )
        .map((sl) => getSkillLevelLabel(sl))
        .join(', ');

      const totalQuantity = activities.reduce((sum, a) => sum + (parseInt(a.quantity) || 0), 0);
      const totalAddition = activities.reduce((sum, a) => sum + (parseInt(a.addition) || 0), 0);
      const totalLeft = activities.reduce((sum, a) => sum + (parseInt(a.left) || 0), 0);
      const totalTotal = activities.reduce((sum, a) => sum + (parseInt(a.total) || 0), 0);

      return {
        dateKey,
        activities,
        skillLevelLabels,
        totalQuantity,
        totalAddition,
        totalLeft,
        totalTotal,
      };
    })
    .sort((a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime());

  const paginatedGroups = dateGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (loading) {
    return (
      <div className="list-kasb-training-reports">
        <PageHeader 
          title="Kasb Training Reports" 
          breadcrumbs={[
            { label: 'Program', path: '/program' },
            { label: 'Kasb Training Reports' }
          ]}
          actionButton={{
            label: 'Add Report',
            onClick: () => navigate('/program/kasb-training/reports/add')
          }}
        />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <>
    <Navbar />
    <div className="list-kasb-training-reports">
              <PageHeader 
          title="Kasb Training Reports"
          showBackButton={false} 
          showAdd={true}
          addPath="/program/kasb-training/reports/add"
        />
      {error && <div className="error-message">{error}</div>}
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Skill Level</th>
              <th>Quantity</th>
              <th>Addition</th>
              <th>Left</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedGroups.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No reports found</td>
              </tr>
            ) : (
              paginatedGroups.map((group) => {
                const groupId = group.activities?.[0]?.id;
                return (
                <tr key={group.dateKey}>
                  <td>{formatDate(group.dateKey)}</td>
                  <td>{group.skillLevelLabels || '-'}</td>
                  <td>{group.totalQuantity}</td>
                  <td>{group.totalAddition}</td>
                  <td>{group.totalLeft}</td>
                  <td>{group.totalTotal}</td>
                  <td>
                    <ActionMenu
                      actions={[
                        {
                          icon: <FiEye />,
                          label: 'View',
                          color: '#4CAF50',
                          visible: true,
                          onClick: () => navigate(`/program/kasb-training/reports/view/${groupId}`),
                          disabled: !groupId,
                        },
                        {
                          icon: <FiEdit2 />,
                          label: 'Edit',
                          color: '#2196F3',
                          visible: true,
                          onClick: () => navigate(`/program/kasb-training/reports/update/${groupId}`),
                          disabled: !groupId,
                        },
                        {
                          icon: <FiTrash2 />,
                          label: 'Delete',
                          color: '#f44336',
                          visible: true,
                          onClick: () => handleDelete(group.dateKey),
                        },
                      ]}
                    />
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
    </>
  );
};

export default ListKasbTrainingReports; 