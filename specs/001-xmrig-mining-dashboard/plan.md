# Implementation Plan: XMRig Mining Contribution Dashboard

**Branch**: `001-xmrig-mining-dashboard` | **Date**: 2025-10-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-xmrig-mining-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a cross-platform desktop application (Electron) that manages XMRig cryptocurrency mining processes, combined with a web dashboard (Next.js on Vercel) that visualizes real-time mining contributions. Users onboard via email, mine using their CPU, and see live statistics every 5 seconds. A backend service captures snapshots every 10 minutes to award contribution points stored in PostgreSQL.

## Technical Context

### Desktop Application

**Language/Version**: TypeScript with Node.js (via Electron)
**Framework**: Electron with React for UI
**Primary Dependencies**:
- `electron` - Cross-platform desktop framework
- `electron-builder` - Packaging for Windows (.exe) and macOS (.dmg)
- `react` + `react-dom` - UI rendering
- XMRig binaries (bundled, GPLv3) - Mining engine

**XMRig Integration**:
- Process Management: Node.js `child_process` to spawn/manage XMRig
- Communication: HTTP API (127.0.0.1:18080) for statistics polling
- Security: Local-only HTTP access with random access token
- Configuration: Command-line arguments for proxy connection

**Storage**: Local configuration files for email/settings persistence
**Testing**: Jest + React Testing Library for UI, integration tests for process management
**Target Platform**: Windows 10+ (x64), macOS 10.13+ (Intel & Apple Silicon)
**Performance Goals**:
- UI updates every 5 seconds
- XMRig process startup < 10 seconds
- Application memory footprint < 200MB (excluding XMRig)

**Constraints**:
- Must bundle platform-specific XMRig binaries
- HTTP API must be localhost-only (127.0.0.1)
- No elevated privileges required for installation

### Web Dashboard

**Language/Version**: TypeScript with Next.js 14 (App Router)
**Framework**: Next.js 14 with React
**Primary Dependencies**:
- `next` - Web framework
- `@vercel/postgres` - PostgreSQL client (Neon)
- `swr` - Client-side data fetching with auto-refresh

**API Architecture**:
- Server Routes: `/api/proxy/summary`, `/api/proxy/workers` (Edge runtime)
- External API: `http://brtnetwork.duckdns.org:8080` (proxy statistics)
- Rate Limiting: Token bucket (30 req/min per IP)
- Caching: `Cache-Control: no-store` for real-time data

**Storage**: Vercel Postgres (Neon) - Free tier
**Database Tables**:
- `workers_snapshot` - Periodic worker statistics
- `points_ledger` - Point accumulation history

**Testing**: Jest + React Testing Library, API route integration tests
**Target Platform**: Vercel serverless (Edge runtime)
**Project Type**: Web application (backend + frontend combined)

**Performance Goals**:
- Dashboard initial load < 3 seconds
- API response time < 500ms
- Real-time refresh every 5 seconds (active tab)
- Support 10+ concurrent workers without degradation

**Constraints**:
- Vercel free tier limits (function execution time, bandwidth)
- Edge runtime restrictions (no Node.js-specific APIs)
- Database connection pooling on serverless

**Scale/Scope**:
- MVP: 10-50 concurrent workers
- Database: ~1000 snapshot records/day
- Traffic: ~100-500 req/hour

### Scheduled Jobs

**Platform**: Vercel Cron Jobs
**Frequency**: Every 10 minutes
**Purpose**: Capture worker snapshots and calculate contribution points
**Storage**: Write to `workers_snapshot` and `points_ledger` tables

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: No project constitution found (`.specify/memory/constitution.md` contains template only)

**Note**: This project does not yet have an established constitution. If architectural principles or coding standards exist, they should be documented in the constitution file. For this MVP, we proceed with industry-standard practices:
- Clean separation between desktop and web codebases
- Testable components with clear interfaces
- Security-first approach (tokens in env vars, localhost-only APIs)
- Standard REST API patterns for dashboard backend

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
desktop/                          # Electron application
├── src/
│   ├── main/                     # Main process (Node.js)
│   │   ├── xmrig-manager.ts      # XMRig process lifecycle
│   │   ├── api-client.ts         # Local HTTP API polling
│   │   └── config.ts             # Persistent settings
│   ├── renderer/                 # Renderer process (React)
│   │   ├── components/           # React components
│   │   │   ├── Onboarding.tsx    # Terms + email input
│   │   │   ├── MiningStats.tsx   # Real-time statistics display
│   │   │   └── LicenseNotice.tsx # GPLv3 acknowledgment
│   │   ├── hooks/                # Custom React hooks
│   │   │   └── useMiningStats.ts # 5-second polling
│   │   └── App.tsx               # Main UI entry
│   └── preload/                  # Preload scripts (IPC bridge)
│       └── index.ts
├── resources/                    # Binary assets
│   ├── xmrig/                    # XMRig binaries by platform
│   │   ├── win-x64/
│   │   │   └── xmrig.exe
│   │   ├── darwin-x64/
│   │   │   └── xmrig
│   │   └── darwin-arm64/
│   │       └── xmrig
│   └── LICENSE-XMRIG.txt         # GPLv3 license file
├── tests/
│   ├── integration/              # Process management tests
│   └── unit/                     # Component tests
├── package.json
└── electron-builder.config.js    # Packaging configuration

dashboard/                        # Next.js web application
├── app/                          # Next.js 14 App Router
│   ├── api/                      # Server API routes
│   │   ├── proxy/
│   │   │   ├── summary/
│   │   │   │   └── route.ts      # GET /api/proxy/summary (Edge)
│   │   │   └── workers/
│   │   │       └── route.ts      # GET /api/proxy/workers (Edge)
│   │   └── cron/
│   │       └── snapshot/
│   │           └── route.ts      # POST /api/cron/snapshot (Vercel Cron)
│   ├── page.tsx                  # Main dashboard page
│   ├── layout.tsx                # Root layout with license notice
│   └── globals.css
├── components/
│   ├── WorkersTable.tsx          # Worker list with metrics
│   ├── SummaryCard.tsx           # Network-wide summary
│   └── PointsLog.tsx             # Recent point accumulation
├── lib/
│   ├── db.ts                     # PostgreSQL client setup
│   ├── rate-limiter.ts           # Token bucket implementation
│   └── proxy-api.ts              # External API client
├── sql/
│   └── schema.sql                # Database table definitions
├── tests/
│   ├── api/                      # API route tests
│   └── components/               # Component tests
├── package.json
├── next.config.js
└── vercel.json                   # Cron job configuration

shared/                           # Shared types (optional)
└── types/
    ├── worker.ts                 # Worker data structures
    └── api.ts                    # API response types
```

**Structure Decision**:
This is a **multi-project structure** with three separate concerns:
1. **desktop/** - Electron application with XMRig integration
2. **dashboard/** - Next.js web application for visualization
3. **shared/** - Common TypeScript types (optional, can duplicate initially)

Rationale:
- Desktop and web have completely different build processes and deployment targets
- Electron requires native modules and platform-specific binaries
- Next.js requires serverless-compatible dependencies
- Separation allows independent versioning and deployment

## Complexity Tracking

**Status**: N/A - No constitution violations (no constitution exists yet)

If complexity concerns arise during implementation, they should be documented here.

---

## Phase 0: Research (COMPLETED)

**Output**: [research.md](./research.md)

**Key Decisions**:
- Desktop: Electron + React + TypeScript (cross-platform, fast development)
- Dashboard: Next.js 14 App Router on Vercel Edge runtime (unified backend/frontend)
- Database: Vercel Postgres (Neon) - serverless-compatible, free tier sufficient
- XMRig Integration: HTTP API polling (structured JSON, non-blocking, future-proof)
- Real-time Updates: Client-side polling with SWR (5s active, 10-15s inactive tabs)
- Point Calculation: Accepted shares (simple, fair, MVP-appropriate)

**Research Areas Covered**:
- Technology stack selection and rationale
- XMRig integration patterns (HTTP API vs stdout parsing)
- Process lifecycle management best practices
- Proxy API integration with fallback handling
- Rate limiting implementation (token bucket)
- Real-time data patterns (SWR for web, React hooks for desktop)
- Testing strategies for both applications
- Deployment configurations (electron-builder, Vercel)
- License compliance (GPLv3) requirements

---

## Phase 1: Design (COMPLETED)

### Artifacts Generated

1. **[data-model.md](./data-model.md)** - Complete data model with:
   - 4 core entities: Worker, MiningSession, ContributionSnapshot, PointsLedgerEntry
   - PostgreSQL schema with constraints and indexes
   - Desktop state management structures (AppConfig, MiningState)
   - API response types for all external integrations
   - Data flow diagrams and query patterns
   - Future enhancement roadmap

2. **[contracts/](./contracts/)** - API specifications:
   - `dashboard-api.yaml` - Dashboard backend API (OpenAPI 3.0)
     - GET /api/proxy/summary
     - GET /api/proxy/workers
     - POST /api/cron/snapshot
   - `xmrig-http-api.yaml` - XMRig local HTTP API documentation
     - GET /2/summary (used in MVP)
     - Control endpoints (future phases)
   - `README.md` - Contract usage guide with code examples

3. **[quickstart.md](./quickstart.md)** - Developer onboarding guide:
   - Prerequisites and required software
   - Desktop application setup (binary download, build process)
   - Dashboard setup (database, environment variables)
   - End-to-end testing procedures
   - Development workflow and commands
   - Common issues and solutions
   - Environment variables reference
   - Production deployment checklist

### Agent Context Updated

- **File**: [CLAUDE.md](../../CLAUDE.md)
- **Added**: TypeScript, Node.js, Electron technology context
- **Purpose**: Informs AI assistant about project stack for better code suggestions

---

## Implementation Readiness

### Phase 0 ✅ COMPLETE
- All technology decisions documented
- Best practices researched
- Architectural patterns defined

### Phase 1 ✅ COMPLETE
- Data model fully specified
- API contracts documented (OpenAPI 3.0)
- Developer quickstart guide created
- Agent context updated

### Phase 2 🔜 NEXT STEP
Run `/speckit.tasks` to generate implementation task breakdown.

**What `/speckit.tasks` will create**:
- `tasks.md` - Ordered list of implementation tasks
- Task dependencies and sequencing
- Acceptance criteria per task
- Estimated complexity ratings

---

## File Summary

| File | Purpose | Status |
|------|---------|--------|
| [spec.md](./spec.md) | Feature requirements and acceptance criteria | ✅ Complete |
| [plan.md](./plan.md) | Implementation plan (this file) | ✅ Complete |
| [research.md](./research.md) | Technology decisions and research | ✅ Complete |
| [data-model.md](./data-model.md) | Database schema and entity definitions | ✅ Complete |
| [contracts/](./contracts/) | API specifications (OpenAPI) | ✅ Complete |
| [quickstart.md](./quickstart.md) | Developer setup guide | ✅ Complete |
| `tasks.md` | Implementation task breakdown | ⏳ Run `/speckit.tasks` |

---

## Next Actions

1. **Review Planning Artifacts**: Ensure all generated files align with requirements
2. **Run `/speckit.tasks`**: Generate detailed implementation task list
3. **Start Implementation**: Follow tasks.md for step-by-step development
4. **Continuous Testing**: Test integration between desktop and dashboard early and often

---

## Notes

- **Multi-project Structure**: Desktop and dashboard are separate projects with independent build/deploy
- **Security**: All tokens (HTTP API, Proxy API) managed securely (env vars, session-only)
- **License Compliance**: XMRig GPLv3 notices required in both applications
- **Testing**: Both unit and integration tests planned; mock servers available via Prism
- **Scalability**: MVP targets 10-50 workers; architecture supports scaling to 100+ with minimal changes
