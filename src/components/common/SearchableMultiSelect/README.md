# SearchableMultiSelect Component

A powerful React component that combines API search functionality with multi-selection capability. Perfect for selecting multiple users, items, or any data that requires searching via API.

## Features

- 🔍 **API Search**: Search data via API endpoints with debouncing
- ✅ **Multi-Selection**: Select multiple items with visual tags
- 🎨 **Custom Rendering**: Custom option rendering with `renderOption` prop
- ⌨️ **Keyboard Navigation**: Full keyboard support (Arrow keys, Enter, Escape)
- 🏷️ **Tag Display**: Selected items displayed as removable tags
- 🔄 **Real-time Updates**: Live search results as you type
- 📱 **Responsive**: Mobile-friendly design
- 🌙 **Dark Mode**: Built-in dark mode support

## Basic Usage

```jsx
import SearchableMultiSelect from './common/SearchableMultiSelect';

const MyComponent = () => {
  const [selectedUsers, setSelectedUsers] = useState([]);

  return (
    <SearchableMultiSelect
      label="Assign Users"
      placeholder="Search and select users..."
      apiEndpoint="/users"
      onSelect={setSelectedUsers}
      value={selectedUsers}
      displayKey="first_name"
      valueKey="id"
    />
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label for the input field |
| `placeholder` | `string` | `'Type to search and select...'` | Placeholder text |
| `apiEndpoint` | `string` | - | API endpoint for search |
| `onSearch` | `function` | - | Custom search function (alternative to apiEndpoint) |
| `onSelect` | `function` | - | Callback when items are selected/deselected |
| `value` | `array` | `[]` | Array of selected items |
| `displayKey` | `string` | `'name'` | Key to display in tags |
| `valueKey` | `string` | `'id'` | Key to use as unique identifier |
| `debounceDelay` | `number` | `500` | Search debounce delay in ms |
| `minSearchLength` | `number` | `2` | Minimum characters before search |
| `loadingText` | `string` | `'Searching...'` | Loading text |
| `noResultsText` | `string` | `'No results found'` | No results text |
| `required` | `boolean` | `false` | Whether field is required |
| `disabled` | `boolean` | `false` | Whether component is disabled |
| `error` | `string` | `''` | Error message to display |
| `className` | `string` | `''` | Additional CSS classes |

## Advanced Usage

### Custom Search Function

```jsx
const handleSearch = async (searchTerm) => {
  const response = await fetch(`/api/users?search=${searchTerm}`);
  return response.json();
};

<SearchableMultiSelect
  label="Custom Search"
  onSearch={handleSearch}
  onSelect={setSelectedUsers}
  value={selectedUsers}
/>
```

### Custom Option Rendering

```jsx
<SearchableMultiSelect
  label="Users"
  apiEndpoint="/users"
  onSelect={setSelectedUsers}
  value={selectedUsers}
  renderOption={(user, index) => (
    <div>
      <div style={{ fontWeight: 'bold' }}>
        {user.first_name} {user.last_name}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        {user.email} • {user.department}
      </div>
    </div>
  )}
/>
```

### With API Parameters

```jsx
<SearchableMultiSelect
  label="Department Users"
  apiEndpoint="/users"
  apiParams={{ department: 'IT', active: true }}
  onSelect={setSelectedUsers}
  value={selectedUsers}
/>
```

## Event Handlers

### onSelect
Called when items are selected or deselected. Receives the updated array of selected items.

```jsx
const handleSelect = (selectedItems) => {
  console.log('Selected items:', selectedItems);
  setSelectedUsers(selectedItems);
};
```

### onClear
Called when all selections are cleared.

```jsx
const handleClear = () => {
  console.log('All selections cleared');
};
```

## Styling

The component uses CSS classes that can be customized:

```css
.searchable-multi-select__tag {
  background-color: #your-color;
  color: #your-text-color;
}

.searchable-multi-select__option--selected {
  background-color: #your-selected-color;
}
```

## Keyboard Navigation

- **Arrow Up/Down**: Navigate through options
- **Enter**: Select/deselect highlighted option
- **Escape**: Close dropdown
- **Tab**: Move to next form element

## Examples

### User Assignment for Donation Boxes

```jsx
const DonationBoxForm = () => {
  const [assignedUsers, setAssignedUsers] = useState([]);

  return (
    <SearchableMultiSelect
      label="Assigned Users"
      placeholder="Search users by name or email..."
      apiEndpoint="/users"
      onSelect={setAssignedUsers}
      value={assignedUsers}
      displayKey="first_name"
      valueKey="id"
      renderOption={(user) => (
        <div>
          <div>{user.first_name} {user.last_name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {user.email} • {user.department}
          </div>
        </div>
      )}
    />
  );
};
```

### Project Assignment

```jsx
const ProjectForm = () => {
  const [selectedProjects, setSelectedProjects] = useState([]);

  return (
    <SearchableMultiSelect
      label="Related Projects"
      placeholder="Search projects..."
      apiEndpoint="/projects"
      onSelect={setSelectedProjects}
      value={selectedProjects}
      displayKey="name"
      valueKey="id"
      minSearchLength={3}
      debounceDelay={300}
    />
  );
};
```

## API Response Format

The component expects API responses in this format:

```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

Or a simple array:

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
]
```

## Best Practices

1. **Use appropriate `minSearchLength`** to avoid too many API calls
2. **Implement proper debouncing** for better performance
3. **Handle loading states** gracefully
4. **Provide meaningful error messages**
5. **Use `displayKey` and `valueKey`** for proper data mapping
6. **Implement custom `renderOption`** for better UX with complex data

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Dependencies

- React 16.8+ (hooks required)
- Axios (for API calls)
- Custom debounce utility
