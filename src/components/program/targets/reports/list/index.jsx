import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import Pagination from '../../../../common/Pagination';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import './index.css';
import { program_vulnerabilities, programs_list } from '../../../../../utils/program';

const TargetsList = () => {
  const navigate = useNavigate();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetToDelete, setTargetToDelete] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('year');
  const [sortOrder, setSortOrder] = useState('DESC');

  useEffect(() => {
    fetchTargets();
  }, [currentPage, pageSize, sortField, sortOrder]);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        pageSize: pageSize,
        sortField: sortField,
        sortOrder: sortOrder
      };
      
      const response = await axiosInstance.get('/program/targets', { params });
      if (response.data.success) {
        setTargets(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError('Failed to fetch targets');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch targets');
      console.error('Error fetching targets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleDeleteClick = (target) => {
    setTargetToDelete(target);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (targetToDelete) {
      try {
        await axiosInstance.delete(`/program/targets/${targetToDelete.id}`);
        // Refresh the current page after deletion
        fetchTargets();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete target');
        console.error('Error deleting target:', err);
      }
    }
    setShowDeleteModal(false);
    setTargetToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setTargetToDelete(null);
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

  const getActionMenuItems = (target) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/program/targets/reports/view/${target.id}`),
      visible: true
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => navigate(`/program/targets/reports/update/${target.id}`),
      visible: true
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDeleteClick(target),
      visible: true
    }
  ];

     const sortOptions = [
     { value: 'year', label: 'Year' },
     { value: 'program', label: 'Program' },
     { value: 'target', label: 'Target' },
     { value: 'reached', label: 'Reached' },
     { value: 'target_type', label: 'Target Type' },
     { value: 'created_at', label: 'Created At' }
   ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader 
            title="Program Targets" 
            showBackButton={false} 
            showAdd={true}
            addPath="/program/targets/reports/add"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader 
          title="Program Targets" 
          showBackButton={false} 
          showAdd={true}
          addPath="/program/targets/reports/add"
        />
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                                     <th>Year</th>
                   <th>Program</th>
                   <th>Target</th>
                   <th>Reached</th>
                   <th className="hide-on-mobile">Target Type</th>
                   <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {targets.map(target => (
                                     <tr key={target.id}>
                     <td>{target.year}</td>
                     <td>{getProgramTitle(target.program)}</td>
                     <td>{target.target}</td>
                     <td>{target.reached}</td>
                     <td className="hide-on-mobile">{getTargetTypeTitle(target.target_type)}</td>
                     <td className="table-actions">
                       <ActionMenu actions={getActionMenuItems(target)} />
                     </td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSortChange={handleSortChange}
              sortField={sortField}
              sortOrder={sortOrder}
              sortOptions={sortOptions}
            />
          )}
          
          {targets.length === 0 && totalItems === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🎯</div>
              <div className="empty-state-text">No targets found</div>
              <div className="empty-state-subtext">Create your first program target to get started.</div>
            </div>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete the target for ${targetToDelete?.program || ''} (${targetToDelete?.year || ''})?`}
        delete={true}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default TargetsList; 