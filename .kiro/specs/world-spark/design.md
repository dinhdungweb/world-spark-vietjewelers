# World Spark - Design Document

## Overview

World Spark is a web-based interactive experience featuring a 3D globe visualization where user-submitted thoughts ("sparks") appear as pulsing points of light. The system prioritizes simplicity, aesthetic beauty, and privacy while providing a moderation workflow to maintain content quality.

The architecture follows a modern web stack with Next.js for both frontend and backend, React Three Fiber for 3D rendering, and PostgreSQL for data persistence. The design emphasizes performance, smooth interactions, and a calm user experience without social networking features.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Globe View   │  │ Spark Card   │  │ Submit Form  │      │
│  │ (R3F/Three)  │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────────────────────────────────────────┐      │
│  │         Admin Moderation Panel                    │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Spark API    │  │ Location API │  │ Admin API    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────────────────────────────────────────┐      │
│  │         Content Filter Middleware                 │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Spark        │  │ Location     │  │ Moderation   │      │
│  │ Service      │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer (PostgreSQL)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ sparks       │  │ categories   │  │ admin_users  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- React 18+
- React Three Fiber + Three.js (3D globe rendering)
- Drei (R3F helpers)
- Tailwind CSS (minimal styling)
- TypeScript

**Backend:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL 15+
- NextAuth.js (admin authentication only)

**Deployment:**
- Vercel (frontend + API routes)
- Vercel Postgres or Supabase (database)

**External Services:**
- Nominatim (OpenStreetMap) for reverse geocoding (free, no API key)

## Components and Interfaces

### 1. Globe Component

**Responsibility:** Render the 3D Earth with sparks and handle user interactions.

**Key Features:**
- Dark sphere with subtle texture
- Spark points rendered as instanced meshes for performance
- Orbit controls for rotation and zoom
- Raycasting for spark click detection

**Interface:**
```typescript
interface GlobeProps {
  sparks: Spark[];
  onSparkClick: (spark: Spark) => void;
  onGlobeClick?: (coordinates: { lat: number; lng: number }) => void;
}

interface Spark {
  id: string;
  text: string;
  latitude: number;
  longitude: number;
  category: string;
  locationDisplay: string;
  createdAt: Date;
}
```

### 2. Spark Card Component

**Responsibility:** Display spark details in an overlay card.

**Interface:**
```typescript
interface SparkCardProps {
  spark: Spark;
  onClose: () => void;
  onNext: () => void;
  onAddSpark: () => void;
}
```

### 3. Spark Submission Form

**Responsibility:** Collect spark data from visitors.

**Interface:**
```typescript
interface SparkFormProps {
  initialLocation?: { lat: number; lng: number };
  onSubmit: (data: SparkSubmission) => Promise<void>;
  onCancel: () => void;
}

interface SparkSubmission {
  text: string;
  latitude: number;
  longitude: number;
  category: string;
}
```

### 4. Admin Moderation Panel

**Responsibility:** Allow admins to review and approve/reject pending sparks.

**Interface:**
```typescript
interface ModerationPanelProps {
  pendingSparks: PendingSpark[];
  onApprove: (sparkId: string) => Promise<void>;
  onReject: (sparkId: string) => Promise<void>;
}

interface PendingSpark extends Spark {
  status: 'pending';
  submittedAt: Date;
}
```

### 5. Spark Service

**Responsibility:** Business logic for spark management.

**Methods:**
```typescript
class SparkService {
  async getApprovedSparks(): Promise<Spark[]>
  async getPendingSparks(): Promise<PendingSpark[]>
  async createSpark(data: SparkSubmission): Promise<PendingSpark>
  async approveSpark(sparkId: string): Promise<Spark>
  async rejectSpark(sparkId: string): Promise<void>
  async getRandomSpark(): Promise<Spark>
}
```

### 6. Location Service

**Responsibility:** Handle location approximation and geocoding.

**Methods:**
```typescript
class LocationService {
  async approximateLocation(lat: number, lng: number): Promise<ApproximateLocation>
  async reverseGeocode(lat: number, lng: number): Promise<string>
  coordinatesToApproximate(lat: number, lng: number): { lat: number; lng: number }
}

interface ApproximateLocation {
  latitude: number;  // Reduced precision
  longitude: number; // Reduced precision
  displayName: string; // "Near Berlin, Germany"
}
```

### 7. Content Filter Service

**Responsibility:** Validate spark text for prohibited content.

**Methods:**
```typescript
class ContentFilterService {
  validate(text: string): ValidationResult
  containsEmail(text: string): boolean
  containsPhone(text: string): boolean
  containsUrl(text: string): boolean
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

## Data Models

### Database Schema

```sql
-- Sparks table
CREATE TABLE sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  latitude DECIMAL(8, 5) NOT NULL,
  longitude DECIMAL(8, 5) NOT NULL,
  category VARCHAR(100) NOT NULL,
  location_display VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP,
  CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Admin users table (simple auth)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sparks_status ON sparks(status);
CREATE INDEX idx_sparks_created_at ON sparks(created_at);
CREATE INDEX idx_sparks_approved ON sparks(status, approved_at) WHERE status = 'approved';
```

### TypeScript Models

```typescript
enum SparkStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

interface Spark {
  id: string;
  text: string;
  latitude: number;
  longitude: number;
  category: string;
  locationDisplay: string;
  status: SparkStatus;
  createdAt: Date;
  approvedAt?: Date;
}

interface Category {
  id: string;
  name: string;
  createdAt: Date;
}

interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:

**Redundancies identified:**
- Properties 2.2 and 6.2 both test location display format - can be combined into one property
- Properties 6.1 and 6.3 both test coordinate approximation - can be combined
- Properties 4.1, 4.2, 4.3 test different content filters but can be combined into one comprehensive validation property
- Properties 1.4 and 5.1 both test filtering by spark status - can be combined

**Properties to combine:**
- Location display format (2.2, 6.2) → Single property about location formatting
- Coordinate approximation (6.1, 6.3) → Single property about precision reduction
- Content filtering (4.1, 4.2, 4.3) → Single property about prohibited content detection
- Status filtering (1.4, 5.1) → Single property about status-based visibility

### Core Correctness Properties

**Property 1: Approved sparks visibility**
*For any* set of sparks with mixed statuses (pending, approved, rejected), only sparks with approved status should be visible on the public globe and excluded from the moderation queue.
**Validates: Requirements 1.4, 5.1**

**Property 2: Pending spark creation**
*For any* valid spark submission (non-empty text, valid coordinates, no prohibited content), the created spark should have status set to 'pending'.
**Validates: Requirements 3.5**

**Property 3: Content filter detection**
*For any* text containing email addresses, phone numbers, or URLs, the content filter validation should return invalid with specific error messages indicating which rule was violated.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

**Property 4: Empty text rejection**
*For any* string that is empty or contains only whitespace characters, spark submission validation should fail.
**Validates: Requirements 3.6**

**Property 5: Location display format**
*For any* spark with stored coordinates, the location display string should match the pattern "Near [City], [Country]".
**Validates: Requirements 2.2, 6.2**

**Property 6: Coordinate approximation**
*For any* precise geographic coordinates (latitude, longitude), the approximation function should reduce precision to city/region level (approximately 0.1 degree precision or ~11km).
**Validates: Requirements 6.1, 6.3**

**Property 7: Spark approval state transition**
*For any* spark with pending status, when approved by admin, the spark status should change to 'approved' and the approvedAt timestamp should be set.
**Validates: Requirements 5.2**

**Property 8: Spark rejection state transition**
*For any* spark with pending status, when rejected by admin, the spark status should change to 'rejected' and the spark should not appear in public queries.
**Validates: Requirements 5.3**

**Property 9: Globe rotation updates state**
*For any* drag event on the globe with valid delta values, the globe rotation state should update proportionally to the drag direction and distance.
**Validates: Requirements 1.2**

**Property 10: Zoom updates camera distance**
*For any* zoom event (scroll or pinch), the camera distance should increase for zoom out and decrease for zoom in, within defined min/max bounds.
**Validates: Requirements 1.3**

**Property 11: Spark card displays required fields**
*For any* spark displayed in a card, the rendered output should contain the spark text, category, and location display string.
**Validates: Requirements 2.1**

**Property 12: Click outside closes card**
*For any* click event outside the spark card boundaries when a card is open, the card should close and return to globe view.
**Validates: Requirements 2.5**

**Property 13: Location selection methods**
*For any* location input (either globe click coordinates or manual entry), the submission form should accept and store the location data.
**Validates: Requirements 3.2**

**Property 14: Spark positioning consistency**
*For any* spark with stored coordinates, the rendered position on the globe should correspond to those geographic coordinates regardless of globe rotation.
**Validates: Requirements 6.4, 9.5**

**Property 15: No clustering of nearby sparks**
*For any* set of sparks with coordinates within close proximity (< 1 degree), each spark should render as an individual point without being combined or clustered.
**Validates: Requirements 9.3**

**Property 16: Spark hover feedback**
*For any* spark on the globe, when a hover event occurs, the spark should display visual feedback (e.g., scale increase, brightness change).
**Validates: Requirements 9.4**

**Property 17: Spark animation properties**
*For any* rendered spark, the spark mesh should have pulsing animation applied with defined period and amplitude.
**Validates: Requirements 9.2**

**Property 18: Unauthenticated submission acceptance**
*For any* valid spark submission made without authentication credentials, the system should accept and create the spark in pending status.
**Validates: Requirements 8.2**

**Property 19: Touch event handling**
*For any* touch-based drag or pinch event on mobile devices, the globe should respond with rotation or zoom equivalent to mouse-based interactions.
**Validates: Requirements 10.4**

**Property 20: Moderation panel displays required fields**
*For any* pending spark in the moderation panel, the displayed data should include text, category, location, and submission timestamp.
**Validates: Requirements 5.4**

## Error Handling

### Client-Side Error Handling

**Form Validation Errors:**
- Display inline validation messages for empty text
- Show specific error messages for content filter violations (email, phone, URL detected)
- Highlight invalid fields with visual indicators
- Prevent form submission until all validations pass

**Network Errors:**
- Display user-friendly error messages for failed API calls
- Implement retry logic for transient failures
- Show loading states during async operations
- Gracefully degrade if globe fails to load (show 2D fallback or error message)

**3D Rendering Errors:**
- Detect WebGL support and show fallback message if unavailable
- Handle texture loading failures gracefully
- Catch and log Three.js errors without crashing the app
- Implement error boundaries for React components

### Server-Side Error Handling

**API Error Responses:**
- Return consistent error format: `{ error: string, code: string, details?: any }`
- Use appropriate HTTP status codes (400 for validation, 401 for auth, 500 for server errors)
- Log errors with context for debugging
- Never expose sensitive information in error messages

**Database Errors:**
- Handle connection failures with retry logic
- Catch constraint violations (unique, foreign key)
- Implement transaction rollback for failed operations
- Log database errors for monitoring

**Content Filter Errors:**
- Return specific validation errors for each filter rule
- Handle regex errors gracefully
- Provide clear feedback about which content is prohibited

### Admin Panel Error Handling

**Authentication Errors:**
- Redirect to login on 401 responses
- Show clear error messages for invalid credentials
- Handle session expiration gracefully

**Moderation Action Errors:**
- Show error messages if approve/reject fails
- Implement optimistic updates with rollback on failure
- Prevent duplicate actions on the same spark

## Testing Strategy

### Unit Testing

**Framework:** Vitest + React Testing Library

**Unit Test Coverage:**
- Content filter validation functions (email, phone, URL detection)
- Location approximation logic
- Coordinate conversion utilities
- Spark status filtering logic
- Form validation functions
- API route handlers (mocked database)

**Example Unit Tests:**
- Test that content filter correctly identifies "contact@example.com" as email
- Test that location approximation reduces 52.520008 to 52.5
- Test that empty string fails validation
- Test that approved sparks are included in public API response

### Property-Based Testing

**Framework:** fast-check (JavaScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Use appropriate generators for each data type
- Seed random generation for reproducibility

**Property Test Requirements:**
- Each property test MUST be tagged with format: `// Feature: world-spark, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test
- Tests should use smart generators that constrain to valid input space

**Property Test Coverage:**
- Property 1: Generate mixed-status sparks, verify only approved visible
- Property 2: Generate valid submissions, verify pending status
- Property 3: Generate text with emails/phones/URLs, verify rejection
- Property 4: Generate whitespace strings, verify rejection
- Property 5: Generate coordinates, verify "Near [City], [Country]" format
- Property 6: Generate precise coordinates, verify precision reduction
- Property 7-8: Generate pending sparks, verify state transitions
- Property 9-10: Generate drag/zoom events, verify state updates
- Property 11: Generate sparks, verify card contains required fields
- Property 14: Generate coordinates, verify consistent positioning
- Property 15: Generate nearby coordinates, verify no clustering
- Property 18: Generate valid submissions without auth, verify acceptance

**Example Property Test:**
```typescript
// Feature: world-spark, Property 3: Content filter detection
test('Property 3: Content filter detects prohibited content', () => {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.emailAddress(),
        fc.string().map(s => `Call me at ${s.slice(0,10).replace(/\D/g, '')}`),
        fc.webUrl()
      ),
      (prohibitedText) => {
        const result = contentFilter.validate(prohibitedText);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**Framework:** Playwright (E2E testing)

**Integration Test Coverage:**
- Full user flow: view globe → click spark → read content → close card
- Submission flow: click add spark → fill form → submit → see confirmation
- Admin flow: login → view pending → approve spark → verify on globe
- Mobile interaction: touch drag, pinch zoom

### Performance Testing

**Metrics to Monitor:**
- Initial page load time (target: < 3s)
- Time to interactive (target: < 5s)
- Frame rate during globe interaction (target: 30+ FPS)
- API response times (target: < 500ms)

**Load Testing:**
- Test rendering with 10,000 sparks
- Test API with concurrent requests
- Monitor memory usage during extended sessions

## Security Considerations

### Content Security

- Sanitize all user-submitted text to prevent XSS
- Implement rate limiting on spark submission (e.g., 5 per IP per hour)
- Use parameterized queries to prevent SQL injection
- Validate all input on both client and server

### Admin Security

- Use bcrypt for password hashing (min 10 rounds)
- Implement CSRF protection for admin actions
- Use HTTP-only cookies for session management
- Require strong passwords for admin accounts
- Log all moderation actions for audit trail

### Privacy

- Don't store IP addresses beyond rate limiting window
- Approximate coordinates before storage (no precise location tracking)
- No user tracking or analytics beyond basic page views
- Clear privacy policy about data collection

### API Security

- Implement rate limiting on all public endpoints
- Validate request payloads against schemas
- Use CORS to restrict API access to known domains
- Implement request size limits to prevent DoS

## Performance Optimizations

### Frontend Optimizations

**3D Rendering:**
- Use instanced meshes for spark rendering (single draw call for all sparks)
- Implement level-of-detail (LOD) for distant sparks
- Use texture atlases to reduce texture switching
- Implement frustum culling to skip off-screen sparks
- Use Web Workers for heavy computations

**React Optimizations:**
- Memoize expensive components with React.memo
- Use useMemo for derived data
- Implement virtual scrolling for moderation panel
- Code-split admin panel (separate bundle)
- Lazy load Three.js components

**Asset Optimization:**
- Compress globe textures (WebP format)
- Use CDN for static assets
- Implement progressive loading for globe texture
- Minimize JavaScript bundle size
- Use font subsetting for custom fonts

### Backend Optimizations

**Database:**
- Index on status and created_at columns
- Use connection pooling
- Implement query result caching for approved sparks
- Use database-level pagination for large result sets

**API:**
- Implement HTTP caching headers for approved sparks
- Use compression (gzip/brotli) for API responses
- Batch database queries where possible
- Implement API response caching with short TTL

## Deployment Architecture

### Vercel Deployment

**Frontend:**
- Deploy Next.js app to Vercel
- Use Edge Functions for API routes where possible
- Enable automatic HTTPS
- Configure custom domain

**Database:**
- Use Vercel Postgres or Supabase
- Enable connection pooling
- Set up automated backups
- Configure read replicas for scaling

**Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for admin authentication
- `NEXTAUTH_URL`: Application URL
- `ADMIN_EMAIL`: Initial admin email
- `ADMIN_PASSWORD`: Initial admin password (hashed)

### Monitoring

- Use Vercel Analytics for basic metrics
- Implement error tracking (Sentry or similar)
- Monitor API response times
- Set up alerts for high error rates
- Track spark submission and approval rates

## Future Enhancements (Post-MVP)

- Multi-language support
- Advanced filtering (by category, date range)
- Spark search functionality
- Export sparks as data visualization
- Collaborative moderation (multiple admins)
- Spark editing (before approval)
- Anonymous reporting of inappropriate content
- Time-based spark visualization (show sparks over time)
- Mobile native apps (React Native)
