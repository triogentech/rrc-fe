# API Configuration

This directory contains centralized API configuration for the application.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Production API URL (default)
NEXT_PUBLIC_API_BASE_URL=https://rrc-be.onrender.com/api

# Development API URL (fallback)
NEXT_PUBLIC_DEV_API_BASE_URL=http://localhost:1340/api
```

## Configuration Files

### `api.ts`
- Centralized API configuration
- Environment variable management
- Development/production detection
- Fallback URL handling

## Usage

```typescript
import { getApiBaseUrl, API_CONFIG } from '@/config/api';

// Get current API base URL
const apiUrl = getApiBaseUrl();

// Use in API calls
const response = await fetch(`${apiUrl}/endpoint`);
```

## Environment Detection

The configuration automatically detects the environment and uses appropriate URLs:

- **Production**: Uses `https://rrc-be.onrender.com/api`
- **Development**: Falls back to `http://localhost:1340/api` if no env var is set

## Migration from Hardcoded URLs

All hardcoded localhost URLs have been replaced with the centralized configuration:

- ✅ `src/store/api/baseApi.ts`
- ✅ `src/store/api/services.ts`
- ✅ `src/components/debug/ApiTest.tsx`
- ✅ `src/utils/testAuth.ts`
- ✅ `src/utils/debugDriverCreation.ts`

## Benefits

1. **Centralized Management**: Single source of truth for API URLs
2. **Environment Flexibility**: Easy switching between dev/prod
3. **Type Safety**: TypeScript support for configuration
4. **Fallback Handling**: Graceful degradation if env vars are missing
5. **Consistent Logging**: Debug information for API configuration
