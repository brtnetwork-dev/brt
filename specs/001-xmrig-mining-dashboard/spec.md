# Feature Specification: XMRig Mining Contribution Dashboard

**Feature Branch**: `001-xmrig-mining-dashboard`
**Created**: 2025-10-30
**Status**: Draft
**Input**: User description: "이 MVP의 목표는 Windows/macOS용 XMRig 기반 클라이언트와 Vercel 대시보드를 결합하여, 각 사용자의 채굴 기여량을 실시간으로 시각화하는 'Proof-of-Contribution Demo'를 구현하는 것이다."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-Time User Onboarding (Priority: P1)

A new user downloads and launches the desktop application for the first time. They are presented with terms and conditions regarding cryptocurrency mining, CPU usage, and energy consumption. After reading and accepting the terms, they provide their email address which serves as their unique identifier. The application immediately connects to the mining infrastructure and begins contributing computational resources.

**Why this priority**: This is the critical entry point for all users. Without successful onboarding and initial mining setup, no other features can function. This delivers immediate value by getting users participating in the contribution system.

**Independent Test**: Can be fully tested by installing the application, completing the onboarding flow, and verifying that mining begins and the user's email is registered as an active worker.

**Acceptance Scenarios**:

1. **Given** the application is launched for the first time, **When** the user clicks "Accept" on the terms screen and enters a valid email address, **Then** the application connects to the mining proxy and begins mining operations
2. **Given** the user is on the email input screen, **When** they enter an invalid email format, **Then** the system displays a validation error and prevents proceeding
3. **Given** the user has accepted terms, **When** mining starts successfully, **Then** the application displays a confirmation message indicating active contribution status

---

### User Story 2 - Real-Time Mining Monitoring (Priority: P1)

While the mining process runs, users want to see their actual contribution in real-time. The application displays current hash rate, number of accepted and rejected shares, and total session duration. This information updates every 5 seconds to provide live feedback on their contribution activity.

**Why this priority**: Real-time feedback is essential for user engagement and trust. Users need to verify their system is working and see tangible proof of their contribution. This is core to the "Proof-of-Contribution" concept.

**Independent Test**: Can be tested by running the application with mining active and verifying that hash rate, share counts, and session time update at 5-second intervals with accurate data.

**Acceptance Scenarios**:

1. **Given** mining is active, **When** the application fetches new statistics, **Then** the UI displays current hash rate in H/s (hashes per second), total accepted shares, total rejected shares, and elapsed session time
2. **Given** mining has been running for several minutes, **When** statistics update, **Then** accepted share count increases when shares are successfully submitted
3. **Given** the mining process encounters issues, **When** shares are rejected, **Then** the rejected share count increments and the UI reflects this
4. **Given** mining is paused or stopped, **When** the user views the interface, **Then** statistics freeze at their last known values until mining resumes

---

### User Story 3 - Web Dashboard Contribution Tracking (Priority: P2)

Users and administrators can visit a web dashboard hosted on Vercel to see a comprehensive view of all active contributors. The dashboard displays each worker's email identifier, their current hash rate, total accumulated shares, and contribution points. Data refreshes every 5 seconds to provide near real-time visibility into the entire mining network.

**Why this priority**: This provides network-wide visibility and creates a competitive/social element. While not required for individual mining, it's important for demonstrating collective contribution and building community engagement.

**Independent Test**: Can be tested by opening the web dashboard, verifying all active workers are listed, and confirming that statistics update every 5 seconds with data matching the proxy server's worker summaries.

**Acceptance Scenarios**:

1. **Given** multiple users are mining, **When** an administrator views the dashboard, **Then** all active workers are displayed with their email, current hash rate, and contribution metrics
2. **Given** the dashboard is open, **When** 5 seconds elapse, **Then** the dashboard automatically refreshes and displays updated statistics for all workers
3. **Given** a worker has recently started mining, **When** the dashboard refreshes, **Then** the new worker appears in the list within 5 seconds
4. **Given** a worker stops mining, **When** sufficient time passes without activity, **Then** the worker is marked as inactive or removed from the active list

---

### User Story 4 - Points Accumulation System (Priority: P3)

The backend system periodically calculates and awards contribution points to users based on their mining activity. Every 10 minutes, the system takes a snapshot of each worker's contribution metrics and assigns points proportional to their hash rate and accepted shares. These points accumulate over time, providing a historical record of contribution.

**Why this priority**: While important for long-term engagement and potential reward systems, point accumulation is not critical for the immediate MVP demonstration. Users can still mine and see real-time stats without points.

**Independent Test**: Can be tested by running the scheduled job, verifying database records show point accumulation entries every 10 minutes, and confirming points are correctly calculated based on worker contribution metrics.

**Acceptance Scenarios**:

1. **Given** the 10-minute cron job executes, **When** workers have been actively mining, **Then** the system creates snapshot records and calculates points for each active worker
2. **Given** a worker has contributed consistently, **When** points are calculated, **Then** the worker's total accumulated points increase proportionally to their contribution
3. **Given** multiple workers with different hash rates, **When** points are awarded, **Then** higher-performing workers receive proportionally more points
4. **Given** a worker was inactive during an interval, **When** the cron job runs, **Then** no new points are awarded but historical points remain intact

---

### Edge Cases

- What happens when a user loses internet connection while mining? (Application should pause mining gracefully and attempt to reconnect)
- How does the system handle duplicate email addresses attempting to register? (System should either prevent duplicate registration or merge workers under same identifier)
- What happens if the proxy server becomes unavailable? (Desktop application should display connection error and retry periodically)
- How does the dashboard behave when no workers are active? (Display appropriate "No active workers" message)
- What happens when the Vercel API rate limit is exceeded? (Dashboard should implement exponential backoff and cache recent data)
- How does the system handle browser tabs being backgrounded? (Dashboard automatically adjusts refresh interval to 10-15 seconds to conserve resources)
- What happens if XMRig process crashes unexpectedly? (Desktop application should detect crash and provide option to restart mining)
- How are contribution points calculated when a worker joins mid-interval? (Points should be prorated based on actual contribution time within the 10-minute window)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Desktop application MUST display terms and conditions regarding mining activities before allowing user to proceed
- **FR-002**: Desktop application MUST accept and validate email addresses in standard format (e.g., user@domain.com)
- **FR-003**: Desktop application MUST use the provided email address as the unique worker identifier (rig-id) when connecting to the mining proxy
- **FR-004**: Desktop application MUST manage XMRig as a subprocess with configurable connection parameters (proxy server address, port, authentication)
- **FR-005**: Desktop application MUST connect to mining proxy server at brtnetwork.duckdns.org:3333
- **FR-006**: Desktop application MUST retrieve mining statistics from local XMRig HTTP API (127.0.0.1:18080) at 5-second intervals
- **FR-007**: Desktop application MUST display current hash rate, accepted shares count, rejected shares count, and session duration
- **FR-008**: Desktop application MUST secure access to local HTTP API using an authentication token
- **FR-009**: Desktop application MUST restrict HTTP API access to localhost only (127.0.0.1)
- **FR-010**: Web dashboard MUST retrieve aggregated worker data from proxy API at brtnetwork.duckdns.org:8080
- **FR-011**: Web dashboard MUST use secure token-based authentication (token: 5e4a327d3e2a) when accessing proxy API
- **FR-012**: Web dashboard MUST display worker list with email identifier, hash rate, and contribution metrics
- **FR-013**: Web dashboard MUST refresh data every 5 seconds when browser tab is active
- **FR-014**: Web dashboard MUST adjust refresh interval to 10-15 seconds when browser tab becomes inactive
- **FR-015**: Web dashboard backend API routes MUST run on Edge runtime for optimal performance
- **FR-016**: Web dashboard MUST implement CORS restrictions to prevent unauthorized access
- **FR-017**: Web dashboard MUST implement rate limiting (default 30 requests per minute per IP address)
- **FR-018**: Backend system MUST store API authentication token in environment variables only
- **FR-019**: Backend system MUST maintain database tables for worker snapshots and points ledger
- **FR-020**: Backend system MUST execute scheduled job every 10 minutes to capture worker statistics
- **FR-021**: Backend system MUST calculate and assign contribution points based on hash rate and accepted shares
- **FR-022**: Backend system MUST accumulate points over time for historical tracking
- **FR-023**: Desktop application MUST display XMRig license information (GPLv3) with source code links
- **FR-024**: Web dashboard MUST display XMRig license acknowledgment and source code links
- **FR-025**: Desktop application MUST be available for both Windows and macOS platforms
- **FR-026**: System MUST maintain worker session state across temporary disconnections, marking workers as permanently disconnected after 1 minute of inactivity

### Key Entities

- **Worker**: Represents an individual mining client identified by email address. Attributes include: worker ID (email), current hash rate, total accepted shares, total rejected shares, session start time, connection status, accumulated contribution points.

- **Mining Session**: Represents a continuous period of mining activity for a worker. Attributes include: session ID, worker ID reference, start timestamp, end timestamp, total runtime duration, final share counts.

- **Contribution Snapshot**: Represents a point-in-time capture of worker statistics. Attributes include: snapshot timestamp, worker ID reference, hash rate at snapshot time, accepted shares count, rejected shares count, calculated point value.

- **Points Ledger**: Represents the historical record of point awards. Attributes include: ledger entry ID, worker ID reference, timestamp of award, points awarded, snapshot reference, cumulative total points.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete onboarding (terms acceptance and email entry) and begin mining in under 1 minute
- **SC-002**: Desktop application displays updated mining statistics within 5 seconds of any change in hash rate or share count
- **SC-003**: New workers appear in the web dashboard within 5 seconds of connecting to the mining proxy
- **SC-004**: Web dashboard successfully displays data for at least 10 concurrent workers without performance degradation
- **SC-005**: Point calculation job completes execution for all active workers within 2 minutes of scheduled trigger time
- **SC-006**: Desktop application maintains stable mining operation for continuous 1-hour session without crashes or disconnections
- **SC-007**: Web dashboard loads initial data within 3 seconds of page access
- **SC-008**: 95% of share submissions are accepted by the mining proxy (rejection rate below 5%)
- **SC-009**: Users can visually confirm their contribution activity through real-time statistics updates
- **SC-010**: Dashboard refresh cycle maintains consistent 5-second interval with timing accuracy within ±1 second

## Scope & Boundaries *(mandatory)*

### In Scope

- Desktop application for Windows and macOS with XMRig integration
- Terms acceptance and email-based user registration flow
- Real-time mining statistics display in desktop application
- Web dashboard displaying all active workers and their contribution metrics
- Automatic data refresh on both desktop and web interfaces
- Backend snapshot and point calculation system running on 10-minute intervals
- Database persistence for worker snapshots and points ledger
- License compliance display for XMRig GPLv3 requirements
- Secure API communication with token-based authentication
- Rate limiting and CORS protection for web APIs

### Out of Scope

- Actual XMR cryptocurrency payout to users
- KYC (Know Your Customer) verification processes
- GPU mining support (CPU mining only)
- Advanced mining controls (throttling, auto-pause based on system load)
- User authentication and account management beyond email identification
- Historical analytics and reporting dashboards
- Manual control endpoints for pausing/configuring mining remotely
- Mobile application versions
- Multi-language support (English only for MVP)
- Email verification workflow
- Worker profile customization

## Assumptions *(mandatory)*

- Users have compatible Windows or macOS systems capable of running XMRig
- Users understand basic cryptocurrency mining concepts and associated risks
- Mining proxy server (brtnetwork.duckdns.org) is already operational and accessible
- Vercel Postgres (Neon) database is already provisioned and configured
- Users have stable internet connection during mining sessions
- XMRig binaries are pre-bundled with the desktop application
- The mining proxy supports standard Stratum protocol
- Default mining configuration is suitable for typical consumer CPUs
- Users consent to CPU usage and associated energy consumption
- No legal restrictions on cryptocurrency mining in user's jurisdiction

## Dependencies *(mandatory)*

### External Dependencies

- **XMRig**: Open-source CPU miner (GPLv3 licensed) - core mining engine
- **Mining Proxy Server**: Must be running at brtnetwork.duckdns.org:3333 for worker connections
- **Proxy API Server**: Must be running at brtnetwork.duckdns.org:8080 for dashboard data
- **Vercel Platform**: Required for hosting web dashboard with Edge runtime support
- **Vercel Postgres (Neon)**: Required for persistent storage of snapshots and points
- **DNS Service (DuckDNS)**: Required for proxy server domain resolution

### System Requirements

- **Windows**: Windows 10 or later (64-bit)
- **macOS**: macOS 10.13 or later (Intel or Apple Silicon)
- **Network**: Stable internet connection with ability to connect to external mining pool
- **Browser**: Modern web browser supporting ES6+ for dashboard access (Chrome, Firefox, Safari, Edge)

## Open Questions *(optional)*

1. What is the exact formula for calculating contribution points from hash rate and shares? (Linear, weighted, or tiered calculation?)
2. Should the dashboard display worker rankings/leaderboards, or just raw contribution data?
3. What happens to accumulated points if a user changes their email address?
4. Should there be a minimum contribution threshold before points start accumulating?
5. How should the system handle workers that appear to be artificially inflating hash rate metrics?
6. Is there a maximum session duration, or can users mine indefinitely?
7. Should the desktop application provide notifications for significant events (connection lost, high rejection rate, etc.)?
8. What data retention policy applies to historical snapshots - keep forever or purge after certain period?
