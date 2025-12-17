# Implementation Plan

- [x] 1. Set up project structure and dependencies





  - Initialize Next.js 14 project with TypeScript and App Router
  - Install core dependencies: React Three Fiber, Drei, Three.js, Tailwind CSS
  - Install development dependencies: Vitest, React Testing Library, fast-check, Playwright
  - Set up Prisma ORM with PostgreSQL
  - Configure TypeScript with strict mode
  - Set up ESLint and Prettier
  - _Requirements: All_

- [x] 2. Create database schema and models





  - Define Prisma schema for sparks, categories, and admin_users tables
  - Create database migrations
  - Generate Prisma client
  - Seed initial categories (e.g., "Thought", "Question", "Observation", "Dream", "Memory")
  - _Requirements: 3.4, 5.1_

- [x] 3. Implement location service with approximation





  - Create LocationService class with coordinate approximation logic
  - Implement precision reduction to ~0.1 degree (city/region level)
  - Implement reverse geocoding using Nominatim API
  - Format location display as "Near [City], [Country]"
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 3.1 Write property test for coordinate approximation



  - **Property 6: Coordinate approximation**
  - **Validates: Requirements 6.1, 6.3**

- [x] 3.2 Write property test for location display format


  - **Property 5: Location display format**
  - **Validates: Requirements 2.2, 6.2**

- [x] 4. Implement content filter service





  - Create ContentFilterService class
  - Implement email detection using regex
  - Implement phone number detection using regex
  - Implement URL detection using regex
  - Return specific error messages for each violation
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4.1 Write property test for content filter detection


  - **Property 3: Content filter detection**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**


- [x] 4.2 Write property test for empty text rejection





  - **Property 4: Empty text rejection**
  - **Validates: Requirements 3.6**

- [x] 5. Implement spark service with business logic





  - Create SparkService class
  - Implement getApprovedSparks() method with status filtering
  - Implement getPendingSparks() method for admin
  - Implement createSpark() method with validation and location approximation
  - Implement approveSpark() method with status transition
  - Implement rejectSpark() method with status transition
  - Implement getRandomSpark() method for "Next spark" feature
  - _Requirements: 1.4, 3.5, 5.1, 5.2, 5.3_

- [x] 5.1 Write property test for approved sparks visibility


  - **Property 1: Approved sparks visibility**
  - **Validates: Requirements 1.4, 5.1**

- [x] 5.2 Write property test for pending spark creation

  - **Property 2: Pending spark creation**
  - **Validates: Requirements 3.5**

- [x] 5.3 Write property test for spark approval state transition

  - **Property 7: Spark approval state transition**
  - **Validates: Requirements 5.2**

- [x] 5.4 Write property test for spark rejection state transition

  - **Property 8: Spark rejection state transition**
  - **Validates: Requirements 5.3**

- [x] 6. Create API routes for public spark operations





  - Create GET /api/sparks endpoint to fetch approved sparks
  - Create GET /api/sparks/random endpoint for random spark
  - Create POST /api/sparks endpoint for spark submission
  - Integrate ContentFilterService validation
  - Integrate LocationService approximation
  - Return appropriate error responses with status codes
  - _Requirements: 1.4, 2.3, 3.1, 3.5, 3.6, 4.1, 4.2, 4.3, 8.2_

- [x] 6.1 Write property test for unauthenticated submission acceptance


  - **Property 18: Unauthenticated submission acceptance**
  - **Validates: Requirements 8.2**

- [x] 7. Set up admin authentication with NextAuth.js





  - Install and configure NextAuth.js
  - Create admin_users table with bcrypt password hashing
  - Implement credentials provider for admin login
  - Create login page at /admin/login
  - Protect admin routes with middleware
  - _Requirements: 8.4_

- [x] 8. Create API routes for admin moderation





  - Create GET /api/admin/sparks/pending endpoint (protected)
  - Create POST /api/admin/sparks/[id]/approve endpoint (protected)
  - Create POST /api/admin/sparks/[id]/reject endpoint (protected)
  - Verify admin authentication on all endpoints
  - Log moderation actions
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 9. Build globe component with Three.js





  - Create Globe component using React Three Fiber
  - Render dark sphere with subtle texture
  - Implement OrbitControls for drag rotation and zoom
  - Set up camera with appropriate initial position
  - Configure lighting for dark aesthetic
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 9.1 Write property test for globe rotation updates


  - **Property 9: Globe rotation updates state**
  - **Validates: Requirements 1.2**


- [x] 9.2 Write property test for zoom updates camera distance





  - **Property 10: Zoom updates camera distance**
  - **Validates: Requirements 1.3**

- [x] 10. Implement spark rendering on globe





  - Create Sparks component to render spark points
  - Use instanced meshes for performance (single draw call)
  - Convert lat/lng coordinates to 3D sphere positions
  - Implement pulsing animation using shaders or scale animation
  - Add hover effect with raycasting
  - Implement click detection for sparks
  - _Requirements: 1.4, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10.1 Write property test for spark positioning consistency


  - **Property 14: Spark positioning consistency**
  - **Validates: Requirements 6.4, 9.5**

- [x] 10.2 Write property test for no clustering of nearby sparks


  - **Property 15: No clustering of nearby sparks**
  - **Validates: Requirements 9.3**

- [x] 10.3 Write property test for spark hover feedback


  - **Property 16: Spark hover feedback**
  - **Validates: Requirements 9.4**

- [x] 10.4 Write property test for spark animation properties


  - **Property 17: Spark animation properties**
  - **Validates: Requirements 9.2**

- [x] 11. Create spark card component










  - Build SparkCard component with text, category, and location display
  - Add "Next spark" button that fetches random spark
  - Add "Add your spark" button that opens submission form
  - Implement close on outside click using ref and event listener
  - Style with Tailwind CSS for minimal aesthetic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 11.1 Write property test for spark card displays required fields


  - **Property 11: Spark card displays required fields**
  - **Validates: Requirements 2.1**


- [x] 11.2 Write property test for click outside closes card

  - **Property 12: Click outside closes card**
  - **Validates: Requirements 2.5**

- [x] 12. Build spark submission form





  - Create SparkForm component with text input and category selector
  - Implement location selection by clicking globe
  - Add manual location entry option
  - Implement client-side validation (empty text, content filter preview)
  - Show loading state during submission
  - Display success confirmation after submission
  - Display validation errors inline
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 12.1 Write property test for location selection methods


  - **Property 13: Location selection methods**
  - **Validates: Requirements 3.2**

- [x] 13. Create main page with globe view





  - Build app/page.tsx with dark background
  - Integrate Globe component
  - Fetch approved sparks on load
  - Implement spark click handler to show SparkCard
  - Implement globe click handler for location selection (when form is open)
  - Add minimal footer with Viet Jewelers attribution
  - Handle loading and error states
  - _Requirements: 1.1, 1.5, 7.1, 7.3, 8.1_

- [x] 14. Implement touch controls for mobile





  - Add touch event handlers for drag (rotation)
  - Add pinch gesture handler for zoom
  - Test on mobile viewport sizes
  - Ensure touch interactions match mouse interactions
  - _Requirements: 10.4_

- [x] 14.1 Write property test for touch event handling


  - **Property 19: Touch event handling**
  - **Validates: Requirements 10.4**

- [x] 15. Build admin moderation panel





  - Create app/admin/page.tsx with authentication check
  - Fetch and display pending sparks in a list
  - Show spark text, category, location, and timestamp for each
  - Add approve and reject buttons for each spark
  - Implement optimistic updates with error rollback
  - Show empty state when no pending sparks
  - Add loading states for actions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 15.1 Write property test for moderation panel displays required fields


  - **Property 20: Moderation panel displays required fields**
  - **Validates: Requirements 5.4**

- [x] 16. Add error handling and loading states





  - Implement error boundaries for React components
  - Add try-catch blocks in API routes
  - Show user-friendly error messages for network failures
  - Implement loading spinners for async operations
  - Add WebGL detection with fallback message
  - Handle texture loading failures gracefully
  - _Requirements: All (error handling)_

- [x] 17. Implement rate limiting for spark submission





  - Add rate limiting middleware using IP address
  - Limit to 5 submissions per IP per hour
  - Return 429 status code when limit exceeded
  - Clear rate limit data after time window
  - _Requirements: 3.5 (security)_

- [x] 18. Optimize performance





  - Implement instanced rendering for sparks (if not done in step 10)
  - Add frustum culling for off-screen sparks
  - Optimize globe texture size and format (WebP)
  - Implement code splitting for admin panel
  - Add React.memo to expensive components
  - Test with 10,000 sparks to verify performance
  - _Requirements: 10.1, 10.2, 10.3_


- [x] 19. Add security measures




  - Sanitize user input to prevent XSS
  - Implement CSRF protection for admin actions
  - Use parameterized queries (Prisma handles this)
  - Set up HTTP-only cookies for admin sessions
  - Add request size limits
  - Configure CORS appropriately
  - _Requirements: All (security)_

- [x] 20. Final checkpoint - Ensure all tests pass





  - Run all unit tests and verify they pass
  - Run all property-based tests and verify they pass
  - Ensure all tests pass, ask the user if questions arise

- [x] 21. Write integration tests





  - Write Playwright test for view globe → click spark → read content flow
  - Write Playwright test for submission flow
  - Write Playwright test for admin moderation flow
  - Test mobile interactions with touch events

- [ ] 22. Set up deployment configuration
  - Configure Vercel project
  - Set up environment variables in Vercel
  - Configure database connection (Vercel Postgres or Supabase)
  - Set up custom domain if available
  - Enable automatic HTTPS
  - Configure build settings
  - _Requirements: All (deployment)_

- [x] 23. Create initial admin user





  - Write seed script to create first admin user
  - Hash password with bcrypt
  - Run seed script in production
  - Document admin credentials securely
  - _Requirements: 8.4_

- [x] 24. Polish UI and styling





  - Refine dark theme colors and spacing
  - Ensure consistent typography
  - Add smooth transitions and animations
  - Test responsive design on various screen sizes
  - Verify footer styling is subtle and minimal
  - Ensure no social features or gamification elements are present
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
