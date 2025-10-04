# Toast Notification Helper

This document explains how to use toast notifications across the dashboard with automatic Strapi error handling.

## Setup

Toast notifications are already configured in the main layout (`src/app/layout.tsx`) with `react-toastify`.

## Usage

Import the helper functions in your component:

```typescript
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast, 
  showInfoToast,
  showLoadingToast,
  updateToast,
  dismissToast,
  showValidationErrorToast,
  showErrorToastWithPrefix
} from '@/utils/toastHelper';
```

## Basic Examples

### Success Notification

```typescript
// Simple success message
showSuccessToast('Operation completed successfully!');

// With custom options
showSuccessToast('Data saved!', { autoClose: 2000 });
```

### Error Notification (with Strapi Error Handling)

```typescript
try {
  await someApiCall();
} catch (error) {
  // Automatically extracts and displays Strapi error messages
  showErrorToast(error);
}

// Or with a custom error message
showErrorToast('Custom error message');
```

### Warning Notification

```typescript
showWarningToast('This action cannot be undone');
```

### Info Notification

```typescript
showInfoToast('Please note: Changes will take effect after refresh');
```

### Loading Toast (for long operations)

```typescript
const toastId = showLoadingToast('Processing your request...');

try {
  await longRunningOperation();
  
  // Update to success
  updateToast(toastId, 'Operation completed!', 'success');
} catch (error) {
  // Update to error
  updateToast(toastId, 'Operation failed!', 'error');
}
```

## Strapi Error Formats Supported

The `showErrorToast` function automatically handles various Strapi error formats:

- **Strapi v4 format**: `{ error: { message: "Error message" } }`
- **Nested format**: `{ data: { error: { message: "Error message" } } }`
- **Validation errors**: `{ error: { details: { errors: [...] } } }`
- **Response errors**: `{ response: { data: { error: { message: "Error message" } } } }`
- **Standard errors**: `{ message: "Error message" }`
- **Status codes**: `{ response: { status: 404 } }` → "Not Found: The requested resource was not found"
- **Error strings**: `{ response: { data: { error: "Error message" } } }`
- **Named errors**: `{ error: { name: "ValidationError", message: "..." } }`

### Advanced Error Handling

#### Validation Errors with Field Details

Use `showValidationErrorToast` for detailed field-by-field validation errors:

```typescript
try {
  await createUser(formData);
} catch (error) {
  // Shows each field error on a separate line
  showValidationErrorToast(error);
}
```

Example output:
```
Validation Errors:
• email: Email is required
• password: Password must be at least 8 characters
• username: Username is already taken
```

#### Errors with Custom Prefix

Use `showErrorToastWithPrefix` to add context to error messages:

```typescript
try {
  await deleteRecord(id);
} catch (error) {
  showErrorToastWithPrefix(error, 'Failed to delete record');
}
```

Example output: `Failed to delete record: Record not found`

## Complete Example in a Form Component

```typescript
import { showSuccessToast, showErrorToast } from '@/utils/toastHelper';
import { useVehicles } from '@/store/hooks/useVehicles';

export default function VehicleForm() {
  const { createVehicle, isLoading } = useVehicles();

  const handleSubmit = async (data) => {
    try {
      const newVehicle = await createVehicle(data);
      
      // Show success notification
      showSuccessToast(`Vehicle ${newVehicle.vehicleNumber} created successfully!`);
      
      // Close modal or navigate
      onSuccess(newVehicle);
    } catch (error) {
      // Automatically extracts and shows Strapi error
      showErrorToast(error);
    }
  };

  return (
    // Your form JSX
  );
}
```

## Using in API Thunks (Redux)

```typescript
import { showErrorToast, showSuccessToast } from '@/utils/toastHelper';

export const fetchData = createAsyncThunk(
  'data/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const response = await apiCall(params);
      showSuccessToast('Data loaded successfully');
      return response;
    } catch (error) {
      showErrorToast(error);
      return rejectWithValue(error);
    }
  }
);
```

## Configuration Options

You can customize toast behavior by passing options:

```typescript
showSuccessToast('Message', {
  position: "top-center",
  autoClose: 3000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
});
```

Available positions:
- `top-right` (default)
- `top-center`
- `top-left`
- `bottom-right`
- `bottom-center`
- `bottom-left`

## Advanced: Dismiss Toasts

```typescript
// Dismiss all toasts
dismissToast();

// Dismiss specific toast
const toastId = showLoadingToast('Processing...');
dismissToast(toastId);
```

## Debugging Strapi Errors

### Development Mode Console Logging

In development mode, all errors are automatically logged to the console with detailed information:

```
🔴 Error Toast Details
  Displayed message: "Email is required"
  Full error object: { error: { ... } }
  Response status: 400
  Response data: { ... }
```

### Test Strapi Error Formats

You can test how different error formats are handled:

```typescript
import { testStrapiErrorFormats } from '@/utils/toastHelper';

// In development mode only
testStrapiErrorFormats();
```

This will test all supported Strapi error formats and show you how each is extracted and displayed.

## Best Practices

1. **Always use error helper for API errors**: Let the helper extract Strapi errors automatically
2. **Use validation error toast for forms**: Use `showValidationErrorToast` for detailed field errors
3. **Keep messages concise**: Use clear, actionable messages
4. **Use appropriate types**: Success for completions, Error for failures, Warning for cautions
5. **Don't overuse**: Only show toasts for important user actions
6. **Add custom prefixes for context**: Use `showErrorToastWithPrefix` when the error needs context
7. **Check console in development**: Detailed error info is logged for debugging
8. **Test error scenarios**: Ensure Strapi errors display correctly

## Styling

Toast notifications automatically adapt to your theme. They use the default toast styles from `react-toastify` which are already imported in the main layout.

To customize styles globally, you can override the CSS in `globals.css`:

```css
.Toastify__toast--success {
  background-color: #10b981;
}

.Toastify__toast--error {
  background-color: #ef4444;
}
```

