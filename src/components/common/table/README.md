# Table Component Documentation

## Overview
A reusable, flexible table component that uses global CSS classes and supports custom rendering, actions, and responsive design.

## Import
```javascript
import Table from '../../common/Table';
```

## Basic Usage

### Simple Table
```javascript
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' }
];

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

<Table 
  columns={columns}
  data={data}
/>
```

## Column Definition

### Column Object Structure
```javascript
{
  key: 'field_name',           // Required: Field name in data object (supports dot notation)
  label: 'Column Header',      // Required: Text shown in table header
  render: (value, row) => {},  // Optional: Custom render function
  hideOnMobile: false,         // Optional: Hide column on mobile devices
  headerClassName: '',         // Optional: Additional CSS class for header
  cellClassName: ''            // Optional: Additional CSS class for cells
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | Array | `[]` | Array of column definitions |
| `data` | Array | `[]` | Array of data objects |
| `renderActions` | Function | - | Function to render action menu (receives row item) |
| `showActions` | Boolean | `true` | Whether to show actions column |
| `emptyMessage` | String | `'No data available'` | Message shown when no data |
| `onRowClick` | Function | - | Callback when row is clicked |
| `className` | String | `''` | Additional CSS classes |
| `striped` | Boolean | `false` | Enable striped rows |
| `hoverable` | Boolean | `true` | Enable row hover effect |

## Advanced Examples

### Example 1: DonationBoxDonationsList Style Table
```javascript
import Table from '../../common/Table';
import ActionMenu from '../../common/ActionMenu';
import { FiEye, FiTrash2, FiDollarSign, FiCalendar } from 'react-icons/fi';

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
    render: (value, row) => (
      <div className="box-info">
        <div style={{ fontWeight: '600', color: '#333' }}>
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
    key: 'collection_amount', 
    label: 'Collection Amount',
    render: (value) => (
      <div style={{ fontWeight: '700', color: '#15803d', fontSize: '1.05em' }}>
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

const renderActions = (donation) => {
  const actions = [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(\`/view/\${donation.id}\`),
      visible: true
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDelete(donation),
      visible: true
    }
  ];
  return <ActionMenu actions={actions} />;
};

<Table 
  columns={columns}
  data={donations}
  renderActions={renderActions}
  showActions={true}
  emptyMessage="No collections found"
/>
```

### Example 2: Simple Data Table
```javascript
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', hideOnMobile: true },
  { key: 'status', label: 'Status', render: (value) => getStatusBadge(value) }
];

<Table 
  columns={columns}
  data={users}
  showActions={false}
/>
```

### Example 3: Nested Data Access
```javascript
const columns = [
  { key: 'user.name', label: 'User Name' },
  { key: 'user.email', label: 'Email' },
  { key: 'profile.phone', label: 'Phone' },
  { key: 'address.city', label: 'City' }
];

const data = [
  {
    user: { name: 'John', email: 'john@example.com' },
    profile: { phone: '123-456-7890' },
    address: { city: 'Karachi' }
  }
];

<Table columns={columns} data={data} />
```

### Example 4: Clickable Rows
```javascript
<Table 
  columns={columns}
  data={data}
  onRowClick={(row) => navigate(\`/view/\${row.id}\`)}
  showActions={false}
/>
```

### Example 5: Striped & Custom Styling
```javascript
<Table 
  columns={columns}
  data={data}
  striped={true}
  hoverable={true}
  className="custom-table-wrapper"
/>
```

## Features

✅ **Responsive Design** - Hide columns on mobile with `hideOnMobile`  
✅ **Custom Rendering** - Use `render` function for any cell  
✅ **Nested Data Access** - Use dot notation in `key` (e.g., 'user.profile.name')  
✅ **Action Menu Integration** - Built-in support for ActionMenu component  
✅ **Empty State** - Automatic empty state with custom message  
✅ **Flexible Styling** - Uses global CSS classes  
✅ **Row Events** - Support for row click handlers  
✅ **Striped Rows** - Optional striped row styling  
✅ **Mobile Optimized** - Automatic responsive behavior  

## Global CSS Classes Used

- `.table-container` - Wrapper for table with overflow handling
- `.data-table` - Main table styling
- `.hide-on-mobile` - Hides column on mobile devices
- `.table-actions` - Styling for actions column
- `.empty-state` - Empty state styling

## Notes

- The component uses global CSS, no component-specific CSS file needed
- All styling is inherited from the application's global styles
- Custom render functions receive both `value` and complete `row` object
- Supports nested data access using dot notation (e.g., 'donation_box.shop_name')

