# SearchableDropdown Component

A reusable, custom-built searchable dropdown component with debouncing for efficient API calls. Perfect for user assignment, search filters, and any scenario requiring search-as-you-type functionality.

## Features

✅ **Debounced Search** - Reduces API calls with configurable delay  
✅ **Keyboard Navigation** - Arrow keys, Enter, and Escape support  
✅ **Custom Rendering** - Full control over option display (automatically wrapped with handlers)  
✅ **Loading States** - Built-in loading indicator  
✅ **Clear Selection** - Easy-to-use clear button  
✅ **Click Outside** - Closes dropdown when clicking outside  
✅ **Responsive** - Works on mobile and desktop  
✅ **Accessible** - Proper ARIA labels and keyboard support  
✅ **Smart Wrapping** - Custom renders are automatically wrapped with key, onClick, and hover handlers  

## Installation

```jsx
import SearchableDropdown from '../common/SearchableDropdown';
```

## Basic Usage

### Method 1: Using API Endpoint (Recommended)

```jsx
const [selectedUser, setSelectedUser] = useState(null);

<SearchableDropdown
  label="Assign to User"
  placeholder="Search users..."
  apiEndpoint="/users/search"
  onSelect={setSelectedUser}
  value={selectedUser}
  allowResearch={true}
/>
```

### Method 2: Custom Search Function

```jsx
const [selectedUser, setSelectedUser] = useState(null);

const handleUserSearch = async (searchTerm) => {
  const response = await axiosInstance.get('/users/search', {
    params: { q: searchTerm }
  });
  return response.data.data || [];
};

<SearchableDropdown
  label="Assign to User"
  placeholder="Search users..."
  onSearch={handleUserSearch}
  onSelect={setSelectedUser}
  value={selectedUser}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | - | Label text for the input |
| `placeholder` | string | 'Type to search...' | Placeholder text |
| `apiEndpoint` | string | - | API endpoint to call (e.g. '/users/search') |
| `apiParams` | object | {} | Additional params to send with API request |
| `searchParamName` | string | 'search' | Name of the search query parameter |
| `onSearch` | function | - | Alternative: custom async function returning results |
| `onSelect` | function | **required** | Callback when item is selected |
| `onClear` | function | - | Callback when selection is cleared |
| `value` | object | null | Currently selected item (controlled) |
| `renderOption` | function | - | Custom render function for options |
| `displayKey` | string | 'name' | Key to display in input after selection |
| `debounceDelay` | number | 500 | Delay in ms before search API call |
| `minSearchLength` | number | 2 | Minimum characters before search |
| `loadingText` | string | 'Searching...' | Text shown while loading |
| `noResultsText` | string | 'No results found' | Text when no results |
| `name` | string | - | Input name attribute |
| `required` | boolean | false | Whether field is required |
| `allowResearch` | boolean | true | Allow searching again after selection |

## Advanced Usage

### Custom Option Rendering

**Important:** The component automatically wraps your custom render with `key`, `onClick`, and `onMouseEnter` handlers. Just return the content you want to display.

```jsx
// ✅ Correct - Return content only (Fragment or div)
const renderDonationBoxOption = (box) => (
  <>
    <div style={{ fontWeight: '600', color: '#333' }}>
      Box ID: {box.box_id_no}
    </div>
    <div style={{ fontSize: '0.9em', color: '#666' }}>
      {box.shop_name} - {box.shopkeeper || 'N/A'}
    </div>
    <div style={{ fontSize: '0.85em', color: '#999' }}>
      {box.city}, {box.region} • {box.box_type}
    </div>
  </>
);

<SearchableDropdown
  label="Search Donation Box"
  apiEndpoint="/donation-box"
  onSelect={handleDonationBoxSelect}
  renderOption={renderDonationBoxOption}
  displayKey="box_id_no"
/>

// ❌ Wrong - Don't add your own wrapper with key/onClick
const renderWrong = (box) => (
  <div 
    key={box.id}  // ❌ Component adds this automatically
    onClick={() => handleSelect(box)}  // ❌ Component adds this
  >
    ...
  </div>
);
```

### With Clear Callback

```jsx
<SearchableDropdown
  label="Assigned User"
  onSearch={handleSearch}
  onSelect={handleUserSelect}
  onClear={() => {
    console.log('Selection cleared');
    // Do cleanup
  }}
  value={selectedUser}
/>
```

### Custom Configuration

```jsx
<SearchableDropdown
  label="Search Team Members"
  placeholder="Type name, email, or department..."
  onSearch={handleSearch}
  onSelect={setSelectedUser}
  displayKey="first_name"
  debounceDelay={300}        // Faster response
  minSearchLength={3}        // Require 3 chars
  loadingText="Finding users..."
  noResultsText="No team members found"
/>
```

## Keyboard Shortcuts

- **Arrow Down** - Navigate to next option
- **Arrow Up** - Navigate to previous option
- **Enter** - Select highlighted option
- **Escape** - Close dropdown

## Styling

The component uses CSS classes that can be customized:

- `.searchable-dropdown` - Main container
- `.searchable-dropdown__input` - Input field
- `.searchable-dropdown__dropdown` - Dropdown container
- `.searchable-dropdown__option` - Individual option
- `.searchable-dropdown__option--highlighted` - Highlighted option
- `.searchable-dropdown__loading` - Loading indicator
- `.searchable-dropdown__clear` - Clear button

## Backend Integration

Your search API endpoint should accept a query parameter and return an array of objects:

```javascript
// GET /users/search?search=john  (default param name: 'search')
{
  "success": true,
  "data": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "department": "Engineering",
      "role": "Developer"
    }
  ]
}
```

### Custom Search Parameter Name

If your API uses a different parameter name (e.g., `q`, `query`, `term`):

```jsx
<SearchableDropdown
  apiEndpoint="/users/search"
  searchParamName="q"  // Will call: /users/search?q=john
  onSelect={setUser}
/>
```

## Examples

See `ExampleUsage.jsx` for more detailed examples including:
- Basic user search
- Custom rendering
- Form integration
- Clear callbacks

