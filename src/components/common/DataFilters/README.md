# DataFilters Component

A reusable filter component that can be used across different modules in the ERP system.

## Features

- **Multiple Filter Types**: Text input, select dropdown, date picker, and date range
- **Responsive Design**: Works on all screen sizes
- **Consistent Styling**: Uses the application's design system
- **Flexible Configuration**: Easy to configure for different use cases

## Usage

### Basic Example

```jsx
import DataFilters from '../../../common/DataFilters';

const MyComponent = () => {
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    status: ''
  });

  const filterConfig = [
    {
      key: 'search',
      type: 'text',
      placeholder: 'Search...',
      value: filters.search,
      width: '250px'
    },
    {
      key: 'department',
      type: 'select',
      placeholder: 'All Departments',
      value: filters.department,
      label: 'Department',
      options: [
        { value: 'it', label: 'IT' },
        { value: 'hr', label: 'HR' }
      ]
    }
  ];

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  return (
    <DataFilters
      filters={filterConfig}
      onFilterChange={handleFilterChange}
    />
  );
};
```

## Filter Types

### 1. Text Input
```jsx
{
  key: 'search',
  type: 'text',
  placeholder: 'Search...',
  value: filters.search,
  width: '250px'
}
```

### 2. Select Dropdown
```jsx
{
  key: 'department',
  type: 'select',
  placeholder: 'All Departments',
  value: filters.department,
  label: 'Department',
  options: [
    { value: 'it', label: 'IT' },
    { value: 'hr', label: 'HR' }
  ]
}
```

### 3. Date Picker
```jsx
{
  key: 'date',
  type: 'date',
  value: filters.date,
  width: '150px'
}
```

### 4. Date Range
```jsx
{
  key: 'dateRange',
  type: 'dateRange',
  value: filters.dateRange, // { from: '2024-01-01', to: '2024-12-31' }
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `filters` | Array | `[]` | Array of filter configurations |
| `onFilterChange` | Function | - | Callback when filter values change |
| `className` | String | `''` | Additional CSS classes |

## Filter Configuration Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `key` | String | Yes | Unique identifier for the filter |
| `type` | String | Yes | Filter type: 'text', 'select', 'date', 'dateRange' |
| `value` | Any | Yes | Current value of the filter |
| `placeholder` | String | No | Placeholder text |
| `label` | String | No | Label for select filters |
| `options` | Array | No | Options for select filters |
| `width` | String | '200px' | Width of the filter input |

## Examples for Different Modules

### User Management
```jsx
const filterConfig = [
  {
    key: 'search',
    type: 'text',
    placeholder: 'Search users...',
    value: filters.search,
    width: '250px'
  },
  {
    key: 'department',
    type: 'select',
    placeholder: 'All Departments',
    value: filters.department,
    label: 'Department',
    options: departments.map(dept => ({
      value: dept,
      label: dept.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }))
  },
  {
    key: 'role',
    type: 'select',
    placeholder: 'All Roles',
    value: filters.role,
    label: 'Role',
    options: [
      { value: 'manager', label: 'Manager' },
      { value: 'user', label: 'User' }
    ]
  }
];
```

### Reports
```jsx
const filterConfig = [
  {
    key: 'dateRange',
    type: 'dateRange',
    value: filters.dateRange
  },
  {
    key: 'status',
    type: 'select',
    placeholder: 'All Statuses',
    value: filters.status,
    label: 'Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]
  }
];
```

## Styling

The component uses CSS variables from the application's design system:

- `--color-bg-primary`
- `--color-bg-tertiary`
- `--color-text-primary`
- `--color-text-secondary`
- `--color-primary`
- `--border-radius-md`
- `--font-size-sm`
- `--spacing-md`

## Responsive Behavior

- **Desktop**: Filters are displayed horizontally
- **Tablet**: Filters wrap to multiple lines
- **Mobile**: Filters stack vertically and take full width 