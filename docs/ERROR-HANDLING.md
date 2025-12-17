# Error Handling and Loading States

This document describes the comprehensive error handling and loading state implementation for World Spark.

## Overview

The application now includes robust error handling at multiple levels:
- React Error Boundaries for component errors
- WebGL detection and fallback UI
- Network error handling with user-friendly messages
- Loading states for all async operations
- API error handling with proper status codes

## Components

### 1. ErrorBoundary Component

**Location:** `components/ErrorBoundary.tsx`

A React Error Boundary that catches errors in the component tree and displays a fallback UI.

**Features:**
- Catches and logs React component errors
- Displays user-friendly error message
- Provides "Try again" and "Refresh page" buttons
- Shows error details in collapsible section for debugging
- Prevents entire app from crashing

**Usage:**
```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

The ErrorBoundary is automatically applied at the root level in `app/providers.tsx`.

### 2. WebGL Detection

**Location:** `lib/webgl-detector.ts`

Utilities for detecting WebGL support in the browser.

**Functions:**
- `detectWebGL()`: Returns boolean indicating WebGL support
- `getWebGLInfo()`: Returns detailed WebGL context information

**WebGL Fallback Component**

**Location:** `components/WebGLFallback.tsx`

Displayed when WebGL is not supported or disabled.

**Features:**
- Clear explanation of the issue
- Troubleshooting steps for users
- List of supported browsers
- Link to WebGL information

### 3. LoadingSpinner Component

**Location:** `components/LoadingSpinner.tsx`

Reusable loading spinner for async operations.

**Props:**
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `message`: Optional loading message
- `fullScreen`: Boolean for full-screen overlay

**Usage:**
```tsx
<LoadingSpinner message="Loading data..." />
<LoadingSpinner size="lg" fullScreen />
```

## Error Handling by Component

### Globe Component

**Enhancements:**
- WebGL support detection on mount
- Canvas error handling
- Loading state while checking WebGL
- Fallback UI for unsupported browsers
- Graceful error display for rendering failures

**Error States:**
1. WebGL not supported → Shows WebGLFallback
2. Canvas initialization error → Shows error with reload button
3. Loading → Shows LoadingSpinner

### Main Page (app/page.tsx)

**Enhancements:**
- Network error detection for fetch failures
- User-friendly error messages
- Retry button for failed loads
- Loading spinner during data fetch
- Error handling for spark submission
- Graceful handling of "Next spark" failures

**Error Types Handled:**
- Network errors (fetch failures)
- API errors (non-200 responses)
- Empty response handling
- Timeout errors

### Admin Panel (app/admin/page.tsx)

**Enhancements:**
- Network error detection
- Optimistic updates with rollback on error
- Loading states for all actions
- Retry button for errors
- User-friendly error messages

**Error Types Handled:**
- Authentication errors
- Network failures
- Spark not found errors
- Action failures (approve/reject)

### SparkForm Component

**Enhancements:**
- Network error detection
- Validation error display
- Loading state during submission
- Success message display
- Specific error messages for different failure types

**Error Types Handled:**
- Content filter violations
- Network errors
- Validation errors
- Server errors

## API Error Handling

All API routes include comprehensive error handling:

### Error Response Format

```typescript
{
  error: string,      // User-friendly error message
  code: string,       // Error code for programmatic handling
  details?: any       // Optional additional details
}
```

### HTTP Status Codes

- `400`: Validation errors, bad requests
- `401`: Authentication required
- `404`: Resource not found
- `500`: Server errors

### API Routes

**GET /api/sparks**
- Handles database errors
- Returns 500 with error message on failure

**POST /api/sparks**
- Validates required fields
- Validates coordinate ranges
- Handles content filter errors (400)
- Handles database errors (500)

**GET /api/sparks/random**
- Returns 404 when no sparks available
- Handles database errors (500)

**GET /api/admin/sparks/pending**
- Requires authentication (401 if not authenticated)
- Handles database errors (500)
- Logs admin access for audit trail

**POST /api/admin/sparks/[id]/approve**
- Requires authentication (401)
- Returns 404 if spark not found
- Handles database errors (500)
- Logs moderation action

**POST /api/admin/sparks/[id]/reject**
- Requires authentication (401)
- Returns 404 if spark not found
- Handles database errors (500)
- Logs moderation action

## Service Layer Error Handling

### SparkService

All methods include try-catch blocks and throw meaningful errors:
- Content validation errors
- Database operation errors
- Not found errors

### LocationService

**reverseGeocode() method:**
- Handles API failures gracefully
- Falls back to coordinate display on error
- Logs errors for debugging
- Never throws errors (always returns a string)

### ContentFilterService

**validate() method:**
- Returns structured validation results
- Provides specific error messages for each violation
- Never throws errors

## Best Practices

### Client-Side Error Handling

1. **Always show user-friendly messages**
   - Avoid technical jargon
   - Provide actionable steps
   - Include retry options

2. **Distinguish error types**
   - Network errors: "Unable to connect to server"
   - Validation errors: Specific field errors
   - Server errors: "Something went wrong"

3. **Provide recovery options**
   - Retry buttons
   - Refresh page option
   - Alternative actions

4. **Log errors for debugging**
   - Use console.error for all errors
   - Include context information
   - Don't expose sensitive data

### Server-Side Error Handling

1. **Use try-catch blocks**
   - Wrap all async operations
   - Handle specific error types
   - Provide fallback responses

2. **Return consistent error format**
   - Always include error message
   - Include error code for programmatic handling
   - Add details when helpful

3. **Use appropriate status codes**
   - 400 for client errors
   - 401 for auth errors
   - 404 for not found
   - 500 for server errors

4. **Log errors with context**
   - Include request details
   - Log stack traces
   - Don't log sensitive data

## Testing Error Handling

### Manual Testing Checklist

- [ ] Disable WebGL and verify fallback UI
- [ ] Disconnect network and verify error messages
- [ ] Submit invalid data and verify validation errors
- [ ] Test with slow network (throttling)
- [ ] Test error recovery (retry buttons)
- [ ] Test optimistic updates with failures
- [ ] Verify error boundaries catch component errors

### Automated Testing

Error handling is covered by existing unit and property tests:
- API error responses
- Validation errors
- Content filter errors
- Service layer errors

## Future Improvements

Potential enhancements for error handling:

1. **Toast Notifications**
   - Non-intrusive error messages
   - Success confirmations
   - Auto-dismiss after timeout

2. **Error Reporting Service**
   - Automatic error reporting (Sentry, etc.)
   - User feedback collection
   - Error analytics

3. **Offline Support**
   - Service worker for offline detection
   - Queue failed requests
   - Sync when back online

4. **Retry Logic**
   - Automatic retry with exponential backoff
   - Configurable retry attempts
   - Circuit breaker pattern

5. **Error Recovery**
   - Partial data loading
   - Graceful degradation
   - Alternative data sources
