import React from 'react';
import DownloadCSV from './index';

/**
 * Example Usage Component
 * Shows different ways to use the DownloadCSV component
 */
const ExampleUsage = () => {
  // Example 1: Simple data with auto-generated headers
  const simpleData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
  ];

  // Example 2: Data with custom column configuration
  const donationsData = [
    { id: 1, donor_name: 'Ahmad Ali', amount: 5000, currency: 'PKR', date: '2024-01-15', status: 'completed' },
    { id: 2, donor_name: 'Fatima Khan', amount: 3000, currency: 'PKR', date: '2024-01-16', status: 'pending' },
    { id: 3, donor_name: 'Hassan Ahmed', amount: 7500, currency: 'PKR', date: '2024-01-17', status: 'completed' }
  ];

  const donationColumns = [
    { key: 'donor_name', label: 'Donor Name' },
    { key: 'amount', label: 'Amount (PKR)' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' }
  ];

  // Example 3: Data with excluded keys
  const usersData = [
    { id: 1, name: 'User 1', email: 'user1@example.com', password: 'secret123', role: 'admin' },
    { id: 2, name: 'User 2', email: 'user2@example.com', password: 'secret456', role: 'user' }
  ];

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2>DownloadCSV Component Examples</h2>

      {/* Example 1: Basic usage */}
      <div>
        <h3>Example 1: Basic Usage (Auto Headers)</h3>
        <p>Downloads all fields from data with auto-generated headers</p>
        <DownloadCSV
          data={simpleData}
          filename="users-list"
          buttonText="Download Users CSV"
        />
      </div>

      {/* Example 2: Custom columns */}
      <div>
        <h3>Example 2: Custom Column Configuration</h3>
        <p>Downloads only specified columns with custom labels</p>
        <DownloadCSV
          data={donationsData}
          filename="donations-report"
          columns={donationColumns}
          buttonText="Download Donations"
        />
      </div>

      {/* Example 3: Exclude sensitive fields */}
      <div>
        <h3>Example 3: Exclude Sensitive Fields</h3>
        <p>Downloads data while excluding password and id fields</p>
        <DownloadCSV
          data={usersData}
          filename="users-export"
          excludeKeys={['password', 'id']}
          buttonText="Export Users"
        />
      </div>

      {/* Example 4: With callbacks */}
      <div>
        <h3>Example 4: With Callbacks</h3>
        <p>Downloads data with start and complete callbacks</p>
        <DownloadCSV
          data={simpleData}
          filename="users-with-callbacks"
          buttonText="Download with Callbacks"
          onDownloadStart={() => console.log('Download started...')}
          onDownloadComplete={() => console.log('Download completed!')}
        />
      </div>

      {/* Example 5: Custom styling */}
      <div>
        <h3>Example 5: Custom Button Styling</h3>
        <p>Downloads data with custom button class</p>
        <DownloadCSV
          data={simpleData}
          filename="custom-styled"
          buttonText="Custom Download"
          buttonClass="primary_btn"
        />
      </div>

      {/* Example 6: Disabled state */}
      <div>
        <h3>Example 6: Disabled State</h3>
        <p>Shows disabled button when no data or disabled prop is true</p>
        <DownloadCSV
          data={[]}
          filename="no-data"
          buttonText="No Data Available"
        />
      </div>
    </div>
  );
};

export default ExampleUsage;
