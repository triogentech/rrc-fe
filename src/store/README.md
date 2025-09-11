# Redux Store Setup

This directory contains the complete Redux setup for the application, with a focus on authentication state management using Redux Toolkit.

## 📁 Structure

```
src/store/
├── store.ts                    # Main store configuration
├── index.ts                    # Export all Redux items
├── slices/
│   └── authSlice.ts           # Authentication slice
├── thunks/
│   └── authThunks.ts          # Async authentication actions
├── hooks/
│   └── useReduxAuth.ts        # Custom auth hook
└── providers/
    └── ReduxProvider.tsx      # Redux provider wrapper
```

## 🚀 Features

### Auth Slice (`authSlice.ts`)
- **State Management**: `isAuthenticated`, `user`, `token`, `isLoading`, `error`, `lastLoginTime`
- **Actions**: Login, logout, profile updates, error handling
- **localStorage Integration**: Automatic persistence and hydration
- **Session Management**: Token validation and expiration handling

### Async Thunks (`authThunks.ts`)
- `loginThunk` - User authentication
- `logoutThunk` - User logout with cleanup
- `refreshTokenThunk` - Token refresh
- `updateProfileThunk` - User profile updates
- `getCurrentUserThunk` - Fetch current user data
- `validateSessionThunk` - Session validation
- `initializeAuthThunk` - App initialization

### Custom Hook (`useReduxAuth.ts`)
Provides a comprehensive interface for authentication operations:

```typescript
const {
  // State
  isAuthenticated,
  user,
  token,
  isLoading,
  error,
  
  // Actions
  login,
  logout,
  updateProfile,
  getCurrentUser,
  validateUserSession,
  
  // Utilities
  getUserDisplayName,
  hasRole,
  getSessionDuration,
  isSessionExpired,
} = useReduxAuth();
```

## 💻 Usage

### 1. Basic Usage with Custom Hook

```typescript
import { useReduxAuth } from '@/store/hooks/useReduxAuth';

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useReduxAuth();

  const handleLogin = async () => {
    const success = await login('identifier', 'password');
    if (success) {
      console.log('Login successful!');
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.username}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### 2. Direct Redux Usage

```typescript
import { useAppDispatch, useAppSelector } from '@/store';
import { loginThunk, selectIsAuthenticated, selectUser } from '@/store';

function MyComponent() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  const handleLogin = () => {
    dispatch(loginThunk({ identifier: 'user', password: 'pass' }));
  };

  return <div>...</div>;
}
```

### 3. Legacy AuthContext (Compatibility Layer)

The existing `AuthContext` has been updated to use Redux under the hood while maintaining the same API:

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();
  // Same API as before, but now powered by Redux!
}
```

## 🔧 Configuration

### Store Setup (`store.ts`)
- **Redux Toolkit**: Modern Redux with less boilerplate
- **DevTools**: Enabled in development
- **Serializable Check**: Configured for date fields and timestamps
- **TypeScript**: Fully typed with `RootState` and `AppDispatch`

### Provider Setup (`ReduxProvider.tsx`)
- **Automatic Initialization**: Loads auth state from localStorage on app start
- **Session Validation**: Validates stored tokens on initialization
- **Error Handling**: Graceful fallback for corrupted localStorage data

## 🛡️ Security Features

1. **Token Management**: Secure JWT storage and validation
2. **Session Expiration**: Automatic logout on expired sessions
3. **Error Handling**: Comprehensive error states and messages
4. **Data Validation**: Type-safe operations with TypeScript
5. **Cleanup**: Automatic localStorage cleanup on logout

## 🔄 Migration from Context API

The Redux setup maintains backward compatibility with the existing AuthContext:

- **No Breaking Changes**: Existing components continue to work
- **Gradual Migration**: Can migrate components one by one
- **Enhanced Features**: Access to Redux DevTools and advanced state management

## 📊 State Shape

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  lastLoginTime: number | null;
}
```

## 🧪 Testing

The Redux setup provides excellent testability:

```typescript
import { store } from '@/store';
import { loginSuccess } from '@/store';

// Test actions
store.dispatch(loginSuccess({ user: mockUser, token: 'mock-token' }));

// Test selectors
const state = store.getState();
expect(state.auth.isAuthenticated).toBe(true);
```

## 🚀 Next Steps

1. **Add More Slices**: Extend with additional feature slices (UI, notifications, etc.)
2. **Middleware**: Add custom middleware for logging, analytics, etc.
3. **Persistence**: Consider redux-persist for more advanced persistence needs
4. **Testing**: Add comprehensive test coverage for slices and thunks

## 📚 Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React Redux Documentation](https://react-redux.js.org/)
- [TypeScript with Redux](https://redux.js.org/usage/usage-with-typescript)
