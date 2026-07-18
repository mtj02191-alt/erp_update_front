import React from 'react';
import Table from './index';
import ActionMenu from '../ActionMenu';
import { FiEye, FiTrash2, FiDollarSign, FiCalendar, FiBox } from 'react-icons/fi';

/**
 * Example: How to use Table component with DonationBoxDonationsList style
 */

const ExampleDonationBoxDonationsTable = ({ 
  donations, 
  donationBoxId,
  formatDate,
  formatAmount,
  navigate,
  handleDeleteClick 
}) => {
  
  // Define columns
  const columns = [
    { 
      key: 'id', 
      label: 'Collection ID',
      render: (value) => (
        <div style={{ fontWeight: '600', color: '#0369a1' }}>
          COL-{value}
        </div>
      )
    },
    { 
      key: 'donation_box.box_id_no', 
      label: 'Donation Box',
      // This column is conditionally rendered based on donationBoxId
      // In actual usage, filter columns array before passing to Table
      render: (value, row) => (
        <div className="box-info">
          <div style={{ fontWeight: '600', color: '#333' }}>
            <FiBox style={{ display: 'inline', marginRight: '5px' }} />
            Box ID: {value || 'N/A'}
          </div>
          {row.donation_box?.box_type && (
            <div style={{ fontSize: '0.85em', color: '#666', marginTop: '3px' }}>
              Type: {row.donation_box.box_type}
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'donation_box.shop_name', 
      label: 'Shop Details',
      render: (value, row) => (
        <div className="shop-info">
          <div style={{ fontWeight: '600', color: '#333' }}>
            {value || '-'}
          </div>
          {row.donation_box?.shopkeeper && (
            <div style={{ fontSize: '0.85em', color: '#666', marginTop: '3px' }}>
              {row.donation_box.shopkeeper}
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'donation_box.city', 
      label: 'Location',
      render: (value, row) => (
        <div className="location-info">
          {row.donation_box ? (
            <>
              <div style={{ color: '#333' }}>
                {row.donation_box.city}
              </div>
              <div style={{ fontSize: '0.85em', color: '#666', marginTop: '3px' }}>
                {row.donation_box.region}
              </div>
            </>
          ) : '-'}
        </div>
      )
    },
    { 
      key: 'collection_amount', 
      label: 'Collection Amount',
      render: (value) => (
        <div style={{ 
          fontWeight: '700', 
          color: '#15803d',
          fontSize: '1.05em'
        }}>
          <FiDollarSign style={{ display: 'inline', marginRight: '3px' }} />
          {formatAmount(value)}
        </div>
      )
    },
    { 
      key: 'collection_date', 
      label: 'Collection Date',
      render: (value) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <FiCalendar style={{ color: '#6b7280' }} />
          {formatDate(value)}
        </div>
      )
    },
    { 
      key: 'created_at', 
      label: 'Created Date',
      hideOnMobile: true,
      render: (value) => formatDate(value)
    }
  ];

  // Filter columns based on donationBoxId
  const visibleColumns = donationBoxId 
    ? columns.filter(col => !['donation_box.box_id_no', 'donation_box.shop_name', 'donation_box.city'].includes(col.key))
    : columns;

  // Render actions for each row
  const renderActions = (donation) => {
    const actions = [
      {
        icon: <FiEye />,
        label: 'View',
        color: '#4CAF50',
        onClick: () => navigate(`/dms/donation-box-donations/view/${donation.id}`),
        visible: true
      },
      {
        icon: <FiTrash2 />,
        label: 'Delete',
        color: '#f44336',
        onClick: () => handleDeleteClick(donation),
        visible: true
      }
    ];
    return <ActionMenu actions={actions} />;
  };

  return (
    <Table 
      columns={visibleColumns}
      data={donations}
      renderActions={renderActions}
      showActions={true}
      emptyMessage="No donation box collections found"
      hoverable={true}
    />
  );
};

export default ExampleDonationBoxDonationsTable;

