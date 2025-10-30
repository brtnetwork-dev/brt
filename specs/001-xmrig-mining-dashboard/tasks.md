# Tasks: XMRig Mining Contribution Dashboard

**Input**: Design documents from `/specs/001-xmrig-mining-dashboard/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the specification, so test tasks are omitted from this implementation plan. Integration testing will be performed manually per user story checkpoints.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Desktop application**: `desktop/` (Electron + React)
- **Dashboard application**: `dashboard/` (Next.js)
- **Shared types**: `shared/` (optional, can duplicate initially)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and directory structure for both applications

- [ ] T001 Create multi-project directory structure (desktop/, dashboard/, shared/)
- [ ] T002 Initialize desktop/ Electron project with TypeScript and React dependencies (package.json, tsconfig.json)
- [ ] T003 [P] Initialize dashboard/ Next.js 14 project with TypeScript and App Router (package.json, next.config.js, tsconfig.json)
- [ ] T004 [P] Configure ESLint and Prettier for both projects (desktop/.eslintrc.json, dashboard/.eslintrc.json)
- [ ] T005 [P] Create desktop/resources/xmrig/ directory structure for platform-specific binaries (win-x64/, darwin-x64/, darwin-arm64/)
- [ ] T006 [P] Download and place XMRig binaries in desktop/resources/xmrig/ for each platform
- [ ] T007 [P] Add XMRig GPLv3 license file to desktop/resources/LICENSE-XMRIG.txt
- [ ] T008 [P] Configure electron-builder in desktop/electron-builder.config.js for Windows and macOS packaging
- [ ] T009 Create dashboard/sql/schema.sql with workers_snapshot and points_ledger table definitions
- [ ] T010 [P] Create shared/types/worker.ts with Worker, MiningSession, and snapshot types
- [ ] T011 [P] Create shared/types/api.ts with API request/response types

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T012 Setup Vercel Postgres database (provision Neon instance, configure DATABASE_URL)
- [ ] T013 Run dashboard/sql/schema.sql to initialize database tables and indexes
- [ ] T014 Create desktop/src/main/xmrig-manager.ts with XMRigManager class skeleton (spawn, stop, getStats methods)
- [ ] T015 Create desktop/src/main/api-client.ts with XMRigAPIClient class skeleton (HTTP client for 127.0.0.1:18080)
- [ ] T016 [P] Create desktop/src/main/config.ts for persistent configuration management (read/write JSON config)
- [ ] T017 [P] Setup desktop/src/preload/index.ts for IPC bridge between main and renderer processes
- [ ] T018 [P] Create dashboard/lib/db.ts with PostgreSQL client setup using @vercel/postgres
- [ ] T019 [P] Create dashboard/lib/proxy-api.ts with client for external proxy API (http://brtnetwork.duckdns.org:8080)
- [ ] T020 [P] Create dashboard/lib/rate-limiter.ts with token bucket implementation (30 req/min per IP)
- [ ] T021 Create dashboard/vercel.json with cron job configuration (*/10 * * * *)
- [ ] T022 [P] Setup environment variables template files (desktop/.env.example, dashboard/.env.local.example)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - First-Time User Onboarding (Priority: P1) 🎯 MVP

**Goal**: Enable new users to launch the app, accept terms, enter email, and begin mining automatically

**Independent Test**: Install the application, complete the onboarding flow (accept terms, enter valid email), verify mining starts and email is registered as active worker ID

### Implementation for User Story 1

- [ ] T023 [P] [US1] Create desktop/src/renderer/components/Onboarding.tsx with terms acceptance screen UI
- [ ] T024 [P] [US1] Create desktop/src/renderer/components/EmailInput.tsx with email validation form (RFC 5322 regex)
- [ ] T025 [P] [US1] Create desktop/src/renderer/components/LicenseNotice.tsx displaying XMRig GPLv3 with source link
- [ ] T026 [US1] Add email validation logic in desktop/src/renderer/components/EmailInput.tsx (validate format, show errors)
- [ ] T027 [US1] Implement desktop/src/main/config.ts methods to persist email and termsAccepted flag to config.json
- [ ] T028 [US1] Implement XMRigManager.start() in desktop/src/main/xmrig-manager.ts to spawn XMRig process with command-line arguments (-o, -u, --rig-id, --http-*)
- [ ] T029 [US1] Generate random HTTP access token in XMRigManager and pass to XMRig via --http-access-token argument
- [ ] T030 [US1] Add process lifecycle handlers in XMRigManager (on('exit'), on('error'), cleanup on app quit)
- [ ] T031 [US1] Create IPC handlers in desktop/src/main/index.ts (handle 'start-mining', 'stop-mining', 'get-config')
- [ ] T032 [US1] Connect Onboarding UI flow in desktop/src/renderer/App.tsx (show terms → email → start mining → confirmation)
- [ ] T033 [US1] Add error handling in Onboarding for invalid email, mining start failures
- [ ] T034 [US1] Display confirmation message in App.tsx after successful mining start

**Checkpoint**: User Story 1 complete - users can onboard and start mining. Mining process runs in background.

---

## Phase 4: User Story 2 - Real-Time Mining Monitoring (Priority: P1)

**Goal**: Display live mining statistics (hashrate, shares, session time) with 5-second refresh in desktop UI

**Independent Test**: Run the application with mining active, verify statistics (hashrate, accepted/rejected shares, session time) update every 5 seconds with accurate data from XMRig API

### Implementation for User Story 2

- [ ] T035 [P] [US2] Create desktop/src/renderer/components/MiningStats.tsx component to display hashrate, accepted shares, rejected shares, session duration
- [ ] T036 [P] [US2] Create desktop/src/renderer/hooks/useMiningStats.ts hook with 5-second setInterval polling
- [ ] T037 [US2] Implement XMRigAPIClient.getSummary() in desktop/src/main/api-client.ts to fetch data from http://127.0.0.1:18080/2/summary with Bearer token
- [ ] T038 [US2] Parse XMRig API response in api-client.ts and extract hashrate.total[0], results.shares_good, results.shares_total, connection.uptime
- [ ] T039 [US2] Create IPC handler 'get-stats' in desktop/src/main/index.ts that calls XMRigAPIClient.getSummary() and returns parsed data
- [ ] T040 [US2] Implement useMiningStats hook to call window.electron.getStats() via IPC every 5 seconds
- [ ] T041 [US2] Format statistics in MiningStats.tsx (hashrate in H/s, shares as integers, session time as HH:MM:SS)
- [ ] T042 [US2] Add loading and error states to MiningStats component (show "Connecting..." or error message)
- [ ] T043 [US2] Integrate MiningStats component into desktop/src/renderer/App.tsx main view
- [ ] T044 [US2] Handle mining paused/stopped state - freeze statistics at last known values

**Checkpoint**: User Story 2 complete - users see real-time mining stats updating every 5 seconds. MVP fully functional for desktop users.

---

## Phase 5: User Story 3 - Web Dashboard Contribution Tracking (Priority: P2)

**Goal**: Provide web dashboard displaying all active workers with real-time statistics and 5-second auto-refresh

**Independent Test**: Open the dashboard, verify all active workers are listed with email/hashrate/shares, confirm statistics update every 5 seconds matching proxy server data

### Implementation for User Story 3

- [ ] T045 [P] [US3] Create dashboard/app/api/proxy/summary/route.ts Edge function to proxy GET /1/summary with fallback to /
- [ ] T046 [P] [US3] Create dashboard/app/api/proxy/workers/route.ts Edge function to proxy GET /1/workers with fallback to /workers.json
- [ ] T047 [US3] Implement fetchWithFallback() helper in dashboard/lib/proxy-api.ts with primary and fallback endpoint logic
- [ ] T048 [US3] Add Authorization header with Bearer token from process.env.PROXY_API_TOKEN in proxy-api.ts
- [ ] T049 [US3] Implement rate limiting middleware in dashboard/app/api/proxy/summary/route.ts using lib/rate-limiter.ts
- [ ] T050 [US3] Implement rate limiting middleware in dashboard/app/api/proxy/workers/route.ts
- [ ] T051 [P] [US3] Create dashboard/components/WorkersTable.tsx to display worker list (email, hashrate, accepted, rejected, online status)
- [ ] T052 [P] [US3] Create dashboard/components/SummaryCard.tsx to display network-wide summary (total workers, total hashrate, total shares)
- [ ] T053 [US3] Create dashboard/app/page.tsx main dashboard page with SWR hooks for /api/proxy/summary and /api/proxy/workers
- [ ] T054 [US3] Configure SWR in page.tsx with refreshInterval: 5000 and focusThrottleInterval: 10000 for tab visibility handling
- [ ] T055 [US3] Add worker status logic in WorkersTable.tsx (mark as inactive if last_share > 1 minute ago)
- [ ] T056 [US3] Format hashrate display in WorkersTable (use 1-minute average from hashrate.total[1])
- [ ] T057 [US3] Add error handling in page.tsx for API failures (show "Unable to load data" message)
- [ ] T058 [US3] Add loading skeleton to dashboard components while data is fetching
- [ ] T059 [US3] Create dashboard/app/layout.tsx root layout with XMRig license notice in footer
- [ ] T060 [US3] Style dashboard with CSS (dashboard/app/globals.css) - clean table layout, responsive design

**Checkpoint**: User Story 3 complete - web dashboard displays all workers with real-time updates. Administrators can monitor the mining network.

---

## Phase 6: User Story 4 - Points Accumulation System (Priority: P3)

**Goal**: Automatically capture worker snapshots every 10 minutes and calculate contribution points based on accepted shares

**Independent Test**: Trigger the cron job manually or wait 10 minutes, verify database records in workers_snapshot and points_ledger show correct point calculations (delta of accepted shares)

### Implementation for User Story 4

- [ ] T061 [P] [US4] Create dashboard/app/api/cron/snapshot/route.ts POST endpoint for Vercel Cron trigger
- [ ] T062 [US4] Implement snapshot job logic in route.ts: fetch workers from proxy API via lib/proxy-api.ts
- [ ] T063 [US4] For each worker, insert snapshot record into workers_snapshot table (ts, worker, hashrate_1m, hashrate_10m, accepted, rejected, total_hashes)
- [ ] T064 [US4] Query previous snapshot from workers_snapshot for each worker to get last accepted count
- [ ] T065 [US4] Calculate points as delta: current_accepted - previous_accepted (or current_accepted if no previous snapshot)
- [ ] T066 [US4] Insert points_ledger record for each worker (ts, worker, points, reason='snapshot')
- [ ] T067 [US4] Add database transaction in snapshot job to ensure atomicity (BEGIN, INSERT workers_snapshot, INSERT points_ledger, COMMIT)
- [ ] T068 [US4] Add error handling in snapshot job - log errors but continue processing other workers
- [ ] T069 [US4] Return JSON response with success status, workers_processed count, points_awarded array, errors array
- [ ] T070 [US4] Add Vercel Cron authentication check (verify Authorization header matches process.env.CRON_SECRET)
- [ ] T071 [P] [US4] Create dashboard/components/PointsLog.tsx to display recent point accumulation (query points_ledger)
- [ ] T072 [US4] Add database query in page.tsx to fetch top workers by total points (SUM(points) GROUP BY worker)
- [ ] T073 [US4] Display accumulated points in WorkersTable.tsx alongside worker statistics
- [ ] T074 [US4] Add "Last Snapshot" timestamp display in dashboard to show when points were last updated

**Checkpoint**: User Story 4 complete - points accumulate automatically every 10 minutes. Dashboard displays historical contribution tracking.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

- [ ] T075 [P] Add desktop app icon and branding (desktop/resources/icon.png, icon.ico, icon.icns)
- [ ] T076 [P] Configure auto-updater in desktop/src/main/index.ts (optional - electron-updater integration)
- [ ] T077 [P] Add graceful shutdown handler in desktop/src/main/xmrig-manager.ts (SIGTERM → wait 5s → SIGKILL)
- [ ] T078 [P] Add desktop app "About" dialog with version info and XMRig version display
- [ ] T079 [P] Implement desktop app system tray integration (minimize to tray, show/hide, quit)
- [ ] T080 [P] Add logging framework to desktop app (main process logs to file in userData directory)
- [ ] T081 [P] Add logging to dashboard API routes (console.log for snapshot job execution, proxy API calls)
- [ ] T082 [P] Create dashboard/public/licenses/XMRIG-LICENSE.txt and link from footer
- [ ] T083 [P] Add dashboard meta tags for SEO (title, description, Open Graph tags)
- [ ] T084 [P] Configure CORS headers in dashboard API routes (can be permissive for public demo)
- [ ] T085 [P] Add dashboard loading performance optimization (lazy load components, code splitting)
- [ ] T086 [P] Create desktop/README.md with build instructions and XMRig binary placement guide
- [ ] T087 [P] Create dashboard/README.md with deployment instructions and environment variable setup
- [ ] T088 [P] Update root README.md with project overview, architecture diagram, and quickstart links
- [ ] T089 [P] Add error boundary components to desktop and dashboard apps (catch React errors)
- [ ] T090 Perform end-to-end integration test following quickstart.md validation steps
- [ ] T091 Build desktop installers for Windows (.exe) and macOS (.dmg) using electron-builder
- [ ] T092 Deploy dashboard to Vercel production with environment variables and cron job configured
- [ ] T093 Verify production deployment: test desktop app → dashboard flow with real proxy server
- [ ] T094 [P] Security review: confirm tokens in env vars only, localhost-only APIs, rate limiting active
- [ ] T095 [P] Performance validation: dashboard loads < 3s, API responses < 500ms, 5s refresh working
- [ ] T096 [P] License compliance check: GPLv3 notices visible in both desktop app and dashboard

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1) and User Story 2 (P1) should be completed first (both critical for MVP)
  - User Story 3 (P2) can start after foundational (independent of US1/US2 but integrates with proxy)
  - User Story 4 (P3) can start after foundational (independent of US1/US2/US3)
- **Polish (Phase 7)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - **REQUIRED FOR MVP**
- **User Story 2 (P1)**: Depends on User Story 1 completion (requires mining to be running) - **REQUIRED FOR MVP**
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent of desktop stories, only integrates with external proxy API
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Independent, operates on its own schedule via cron

### Within Each User Story

- Models/types before services
- Services before UI components
- Core implementation before integration
- Error handling after happy path
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1 (Setup)**: Tasks T002-T011 can all run in parallel (different projects, no dependencies)
- **Phase 2 (Foundational)**: Tasks T014-T022 can run in parallel (different files, no shared state)
- **User Story 1**: Tasks T023-T025 (UI components) can run in parallel
- **User Story 2**: Tasks T035-T036 can run in parallel
- **User Story 3**: Tasks T045-T046 (API routes), T051-T052 (UI components) can run in parallel
- **User Story 4**: Tasks T061-T071 can be split if needed (snapshot job vs UI display)
- **Phase 7 (Polish)**: Most tasks (T075-T089) can run in parallel as they touch different files

---

## Parallel Example: User Story 1 (Onboarding)

```bash
# Launch all UI components for User Story 1 together:
Task T023: "Create desktop/src/renderer/components/Onboarding.tsx with terms acceptance screen UI"
Task T024: "Create desktop/src/renderer/components/EmailInput.tsx with email validation form"
Task T025: "Create desktop/src/renderer/components/LicenseNotice.tsx displaying XMRig GPLv3"

# Then sequentially: validation logic (T026), config persistence (T027), XMRig integration (T028-T030)
```

---

## Parallel Example: User Story 3 (Dashboard)

```bash
# Launch all API routes and UI components for User Story 3 together:
Task T045: "Create dashboard/app/api/proxy/summary/route.ts Edge function"
Task T046: "Create dashboard/app/api/proxy/workers/route.ts Edge function"
Task T051: "Create dashboard/components/WorkersTable.tsx"
Task T052: "Create dashboard/components/SummaryCard.tsx"

# Then sequentially: integrate in main page (T053-T054), add features (T055-T060)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

**Goal**: Deliver functional desktop mining application

1. Complete Phase 1: Setup (T001-T011) - ~2-3 hours
2. Complete Phase 2: Foundational (T012-T022) - ~3-4 hours
3. Complete Phase 3: User Story 1 (T023-T034) - ~4-6 hours
4. Complete Phase 4: User Story 2 (T035-T044) - ~3-4 hours
5. **STOP and VALIDATE**: Test end-to-end desktop flow
   - Install app → Accept terms → Enter email → Mining starts
   - Verify statistics display and update every 5 seconds
   - Test error cases (invalid email, connection failures)
6. Build and distribute desktop installers (T091)

**Result**: Functional MVP - users can mine and see real-time stats

---

### Incremental Delivery (Add Dashboard + Points)

**Goal**: Add network-wide visibility and contribution tracking

1. Complete MVP (Phases 1-4) → **Desktop app working**
2. Deploy foundation to Vercel (database, base structure)
3. Add Phase 5: User Story 3 (T045-T060) - ~5-6 hours
4. **VALIDATE**: Test dashboard displays workers correctly
5. Deploy dashboard to Vercel production (T092)
6. Add Phase 6: User Story 4 (T061-T074) - ~4-5 hours
7. **VALIDATE**: Test snapshot job and point calculation
8. Configure Vercel Cron for 10-minute intervals

**Result**: Full feature set - desktop + dashboard + points

---

### Parallel Team Strategy

With 2-3 developers:

**Phase 1-2: Setup + Foundational** (Together)
- All team members work together to complete infrastructure
- Pair on complex parts (XMRig integration, database setup)

**Phase 3-6: User Stories** (Parallel)
- Developer A: Desktop (User Stories 1 + 2)
  - Focus on Electron app, XMRig integration, real-time UI
- Developer B: Dashboard (User Story 3)
  - Focus on Next.js, proxy API integration, web UI
- Developer C: Backend (User Story 4)
  - Focus on database, cron job, point calculation

**Phase 7: Polish** (Together)
- All developers integrate, test end-to-end, and polish
- Divide tasks by expertise (desktop vs web vs infrastructure)

---

## Task Count Summary

- **Phase 1 (Setup)**: 11 tasks
- **Phase 2 (Foundational)**: 11 tasks (BLOCKING)
- **Phase 3 (User Story 1 - P1)**: 12 tasks
- **Phase 4 (User Story 2 - P1)**: 10 tasks
- **Phase 5 (User Story 3 - P2)**: 16 tasks
- **Phase 6 (User Story 4 - P3)**: 14 tasks
- **Phase 7 (Polish)**: 22 tasks

**Total**: 96 tasks

**MVP Scope** (User Stories 1 + 2): 44 tasks (Setup + Foundational + US1 + US2)
**Full Feature Set**: 74 tasks (Add US3 + US4)
**Production Ready**: 96 tasks (Add Polish)

---

## Notes

- **[P] tasks**: Different files, no dependencies, can run in parallel
- **[Story] labels**: Map tasks to specific user stories for traceability
- **Multi-project structure**: Desktop and dashboard are completely independent until integration testing
- **Independent testing**: Each user story has a clear test checkpoint before moving forward
- **Security**: All tokens managed via environment variables, never committed to repository
- **License compliance**: XMRig GPLv3 notices required in both applications (T007, T025, T059, T082)
- **Commit strategy**: Commit after completing each task or logical group of parallel tasks
- **Stop points**: Can stop and validate after any user story completion (checkpoints clearly marked)
- **No tests**: Integration testing performed manually at checkpoints; automated testing can be added later

---

## Suggested MVP Delivery Order

For fastest path to working demonstration:

1. **Week 1**: Setup + Foundational (T001-T022)
   - Multi-project structure ready
   - XMRig binaries in place
   - Database provisioned

2. **Week 2**: Desktop MVP (T023-T044)
   - User Story 1: Onboarding complete
   - User Story 2: Real-time stats working
   - **Deliverable**: Installable desktop application

3. **Week 3**: Dashboard (T045-T060)
   - User Story 3: Web dashboard live
   - **Deliverable**: Public dashboard showing all workers

4. **Week 4**: Points + Polish (T061-T096)
   - User Story 4: Point accumulation working
   - Production deployment complete
   - **Deliverable**: Full MVP with all features

**Alternative**: If prioritizing speed, complete only US1+US2 (desktop MVP) first, then iterate to add dashboard later.
