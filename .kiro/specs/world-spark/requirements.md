# Requirements Document

## Introduction

World Spark là một trải nghiệm web tương tác cho phép người dùng xem và chia sẻ suy nghĩ (sparks) trên một quả địa cầu 3D. Concept cốt lõi là "alien nhìn Trái Đất từ vũ trụ" - một hành tinh tối với những chấm sáng đại diện cho suy nghĩ của con người. Đây là một side project yên tĩnh, không phải social network, tập trung vào trải nghiệm thẩm mỹ và sự kết nối toàn cầu thông qua văn bản đơn giản.

## Glossary

- **World Spark System**: Hệ thống web application bao gồm globe visualization, spark management, và moderation workflow
- **Spark**: Một suy nghĩ dạng text được người dùng submit, hiển thị như một điểm sáng trên globe
- **Globe**: Quả địa cầu 3D tương tác hiển thị các sparks
- **Visitor**: Người dùng truy cập website (không cần đăng nhập)
- **Admin**: Người quản trị có quyền duyệt hoặc từ chối sparks
- **Pending Spark**: Spark đang chờ admin phê duyệt
- **Approved Spark**: Spark đã được admin phê duyệt và hiển thị công khai
- **Location Approximation**: Vị trí địa lý được làm mờ để bảo vệ privacy (ví dụ: "Near Berlin, Germany")

## Requirements

### Requirement 1: Globe Visualization

**User Story:** As a visitor, I want to see an interactive 3D globe with sparks, so that I can explore thoughts from around the world in an immersive way.

#### Acceptance Criteria

1. WHEN a visitor loads the main page THEN the World Spark System SHALL display a dark globe that appears gradually on a black background
2. WHEN a visitor drags on the globe THEN the World Spark System SHALL rotate the globe smoothly in the direction of the drag
3. WHEN a visitor uses pinch or scroll gestures THEN the World Spark System SHALL zoom in or out on the globe
4. WHEN the globe is displayed THEN the World Spark System SHALL render approved sparks as small pulsing light points on the globe surface
5. WHEN the globe is rendered THEN the World Spark System SHALL display the globe without country borders or detailed map features

### Requirement 2: Spark Interaction

**User Story:** As a visitor, I want to click on a spark to read its content, so that I can discover thoughts from people around the world.

#### Acceptance Criteria

1. WHEN a visitor clicks on a spark THEN the World Spark System SHALL display a card containing the spark text, category, and approximate location
2. WHEN a spark card is displayed THEN the World Spark System SHALL show the location in approximate format such as "Near Berlin, Germany"
3. WHEN a spark card is displayed THEN the World Spark System SHALL provide a "Next spark" button to view another random spark
4. WHEN a spark card is displayed THEN the World Spark System SHALL provide an "Add your spark" button to create a new spark
5. WHEN a visitor clicks outside the spark card THEN the World Spark System SHALL close the card and return to the globe view

### Requirement 3: Spark Submission

**User Story:** As a visitor, I want to add my own spark to the globe, so that I can share my thoughts with the world.

#### Acceptance Criteria

1. WHEN a visitor clicks "Add your spark" THEN the World Spark System SHALL display a submission form with location selector, text input, and category selector
2. WHEN a visitor selects a location THEN the World Spark System SHALL allow selection by clicking on the globe or entering an approximate location
3. WHEN a visitor enters spark text THEN the World Spark System SHALL accept text-only content without images or links
4. WHEN a visitor selects a category THEN the World Spark System SHALL provide open categories for selection
5. WHEN a visitor submits a spark THEN the World Spark System SHALL create the spark in pending status and display a confirmation message
6. WHEN a visitor submits a spark with empty text THEN the World Spark System SHALL prevent submission and display a validation message

### Requirement 4: Content Filtering

**User Story:** As the system, I want to automatically filter obvious spam content, so that the moderation queue remains manageable.

#### Acceptance Criteria

1. WHEN a visitor submits a spark containing email addresses THEN the World Spark System SHALL reject the submission and display an error message
2. WHEN a visitor submits a spark containing phone numbers THEN the World Spark System SHALL reject the submission and display an error message
3. WHEN a visitor submits a spark containing URLs THEN the World Spark System SHALL reject the submission and display an error message
4. WHEN content filtering detects prohibited content THEN the World Spark System SHALL provide clear feedback about which rule was violated

### Requirement 5: Spark Moderation

**User Story:** As an admin, I want to review and approve pending sparks, so that I can ensure content quality before public display.

#### Acceptance Criteria

1. WHEN an admin accesses the moderation panel THEN the World Spark System SHALL display all pending sparks with their full content, location, and category
2. WHEN an admin approves a spark THEN the World Spark System SHALL change the spark status to approved and make it visible on the public globe
3. WHEN an admin rejects a spark THEN the World Spark System SHALL remove the spark from the pending queue and prevent it from appearing on the globe
4. WHEN an admin views a pending spark THEN the World Spark System SHALL display the submission timestamp and approximate location
5. WHEN no pending sparks exist THEN the World Spark System SHALL display an empty state message in the moderation panel

### Requirement 6: Location Privacy

**User Story:** As a visitor, I want my location to be approximate rather than precise, so that my privacy is protected while still showing regional context.

#### Acceptance Criteria

1. WHEN the World Spark System stores a spark location THEN the World Spark System SHALL reduce the precision to approximate city or region level
2. WHEN the World Spark System displays a spark location THEN the World Spark System SHALL format it as "Near [City], [Country]"
3. WHEN a visitor selects a location on the globe THEN the World Spark System SHALL convert precise coordinates to approximate location before storage
4. WHEN the World Spark System renders sparks on the globe THEN the World Spark System SHALL position them using the approximate coordinates

### Requirement 7: Minimal User Interface

**User Story:** As a visitor, I want a clean and quiet interface, so that I can focus on the experience without distractions.

#### Acceptance Criteria

1. WHEN the main page loads THEN the World Spark System SHALL display only the globe and minimal UI elements on a black background
2. WHEN the World Spark System displays any interface element THEN the World Spark System SHALL use subtle styling that maintains the calm aesthetic
3. WHEN the footer is rendered THEN the World Spark System SHALL display a single small line reading "World Spark is a quiet side project by Viet Jewelers, Hanoi."
4. WHEN the World Spark System displays the interface THEN the World Spark System SHALL exclude social features such as likes, comments, or user profiles
5. WHEN the World Spark System displays the interface THEN the World Spark System SHALL exclude gamification elements such as points, badges, or leaderboards

### Requirement 8: No Authentication Required

**User Story:** As a visitor, I want to view and submit sparks without creating an account, so that I can participate freely without barriers.

#### Acceptance Criteria

1. WHEN a visitor accesses the main page THEN the World Spark System SHALL allow full viewing of sparks without requiring login
2. WHEN a visitor submits a spark THEN the World Spark System SHALL accept the submission without requiring account creation
3. WHEN the World Spark System processes spark submissions THEN the World Spark System SHALL not store user identity information beyond what is necessary for moderation
4. WHEN an admin accesses the moderation panel THEN the World Spark System SHALL require authentication to protect the admin interface

### Requirement 9: Spark Display Behavior

**User Story:** As a visitor, I want sparks to appear as gentle pulsing lights, so that the globe feels alive and inviting.

#### Acceptance Criteria

1. WHEN approved sparks are rendered on the globe THEN the World Spark System SHALL display each spark as a small point of light
2. WHEN sparks are displayed THEN the World Spark System SHALL animate each spark with a subtle pulsing effect
3. WHEN multiple sparks exist in the same region THEN the World Spark System SHALL render them as individual points without clustering
4. WHEN a visitor hovers over a spark THEN the World Spark System SHALL provide subtle visual feedback indicating the spark is interactive
5. WHEN the globe rotates THEN the World Spark System SHALL maintain spark positions relative to their geographic locations

### Requirement 10: Performance and Responsiveness

**User Story:** As a visitor, I want the globe to load quickly and respond smoothly to my interactions, so that the experience feels polished and professional.

#### Acceptance Criteria

1. WHEN the main page loads THEN the World Spark System SHALL display the initial globe view within 3 seconds on standard broadband connections
2. WHEN a visitor interacts with the globe THEN the World Spark System SHALL maintain at least 30 frames per second during rotation and zoom
3. WHEN the World Spark System renders sparks THEN the World Spark System SHALL efficiently handle up to 10,000 approved sparks without performance degradation
4. WHEN a visitor uses a mobile device THEN the World Spark System SHALL provide touch-optimized controls for rotation and zoom
5. WHEN the World Spark System loads resources THEN the World Spark System SHALL prioritize critical rendering path for the globe visualization
