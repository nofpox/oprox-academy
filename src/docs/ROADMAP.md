# OPROX OS — AUTHORITATIVE ARCHITECTURAL ROADMAP & SYSTEM SPECIFICATION

## 1. System Overview & Product Execution Matrix

OPROX OS is an enterprise-grade multi-product platform engineered on Node.js/Express, TypeScript, React 18, Tailwind CSS, and Drizzle ORM.

### Master Execution Status

| Product / Module | Execution Status | Operational Scope |
|---|---|---|
| **OPROX OS Core** | **COMPLETE (LOCKED)** | Shared Auth, VFS, Terminal, Express Server, UI Layout Engine |
| **OPROX Code / AI** | **COMPLETE (LOCKED)** | Autonomous Multi-Agent Swarm, Code Reviewer, Architect, Patch Engine |
| **OPROX Studio** | **COMPLETE (LOCKED)** | Visual App Builder, IR Generator, Compiler, Flow Engine, Drizzle Schema Generator |
| **OPROX Real Estate Phase 1** | **COMPLETE (LOCKED)** | Property Foundation (Portfolio, Property, Building, Floor, Unit, Owner) |
| **OPROX Real Estate Phase 2** | **COMPLETE (LOCKED)** | Property Operations (Contacts, Tenants, Leases, Payments, Deposits, Financial Operations) |
| **OPROX Real Estate Phase 3** | **COMPLETE (LOCKED)** | Real Estate CRM (CRM, Leads, Viewings, Offers, Reservations) |
| **OPROX Real Estate Phase 4** | **ACTIVE (TARGET)** | Public PropTech Marketplace, Smart Search, AI Valuation, Developer Projects, Maps |
| **OPROX Real Estate Phase 5** | **PLANNED** | AI Design Platform (AI Architect, Interior/Exterior/Landscape, Investment ROI) |
| **OPROX Real Estate Phase 6** | **PLANNED** | Immersive Platform (3D, VR, AR, Digital Twin, Production Hardening & Acceptance) |
| **OPROX Academy** | **NOT STARTED** | Educational platform (Future Scope) |

---

## 2. OPROX Real Estate — Authoritative Scope Directive

### Core PropTech Purpose
OPROX Real Estate is exclusively a high-performance **PropTech Platform** designed for:
- Property Discovery, Buying, Selling, and Renting
- Real Estate Marketing, Developer Profiles, and Project Showcases
- Smart Search, AI Search, and AI Property Assistant
- AI Property Valuation (AVM) & Investment Intelligence
- Generative AI Design (Architectural, Interior, Exterior, Landscape, Renovation)
- 3D, VR, AR, and Digital Twin Property Experiences
- Customer Experience & Lead Capture Funnels

### Explicit Non-Scope (Facility Management Elimination)
The following domains are **permanently removed and strictly excluded** from all present and future phases:
- Facility Management (FM) & CMMS
- Maintenance Management & Maintenance Tickets
- Work Order Management & Technician Dispatch
- Spare Parts Inventory & Building Maintenance Operations
- Vendor Operational Management & IoT Maintenance Concepts

### Service Provider Discovery Rule
The platform may list service providers (Architects, Interior Designers, Engineers, Surveyors, Lawyers, Photographers) to allow direct discovery and communication. OPROX **only connects users** and does **NOT** manage provider business operations, work orders, or service execution.

---

## 3. Implementation Status & Roadmap Execution Plan

### A. COMPLETED PHASES (LOCKED)

#### Phase 1: Property Foundation (**COMPLETE - LOCKED**)
- **Portfolio**: Portfolio structures and multi-tenant entity grouping.
- **Property**: Core property records, spatial locations, and metadata.
- **Building**: Structural building entities, specifications, and attributes.
- **Floor**: Floor-level mapping and spatial layout definitions.
- **Unit**: Individual unit configurations, status, and pricing models.
- **Owner**: Owner profiles, ownership percentages, and entity linkages.

#### Phase 2: Property Operations (**COMPLETE - LOCKED**)
- **Contacts**: Unified directory for tenants, buyers, and prospects.
- **Tenants**: Active tenant profiles, occupancy records, and verification logs.
- **Leases**: Lease contract terms, renewal schedules, and lifecycle states.
- **Payments**: Transaction ledgers, rental collection logs, and payment histories.
- **Deposits**: Security deposit ledgers, escrow tracking, and refund records.
- **Financial Operations**: Property-level financial ledgers, income statements, and expense logs.

#### Phase 3: Real Estate CRM (**COMPLETE - LOCKED**)
- **CRM**: Sales and leasing pipeline stages and opportunity tracking.
- **Leads**: Lead acquisition, qualification, source tracking, and scoring.
- **Viewings**: Property tour scheduling, viewing logs, and feedback capture.
- **Offers**: Purchase and lease offer tracking, counter-offers, and negotiation logs.
- **Reservations**: Unit holding reservations, deposit bonds, and booking confirmations.

---

### B. PLANNED PHASES & EXECUTION ROADMAP

#### Phase 4: PropTech Marketplace & Smart Discovery (**ACTIVE / TARGET**)
- **Public Marketplace**: Multi-tenant buying, selling, and renting listing portal with dynamic currency and pricing.
- **Property Discovery & Smart Search**: Multi-attribute filtering, saved properties, and favorites.
- **AI Search & AI Property Assistant**: Natural language query engine for conversational property matching.
- **AI Property Valuation (AVM)**: AI-assisted valuation model analyzing comparable listings, market trends, and spatial data.
- **Developers & Projects**: Dedicated Developer Profiles, master project hubs, unit inventories, and project showcases.
- **Interactive Maps & Location Intelligence**: Vector map clustering, radius search, POI overlays, and transit scoring.
- **Lead Funnels & Listing Experience**: Buyer/tenant inquiry flows and developer lead routing.
- **Property Comparison**: Side-by-side spec, financial, and spatial feature comparisons.

#### Phase 5: AI Design Platform (**PLANNED**)
- **AI Architect**: Generative 2D layout concepting, spatial planning, and zoning analysis.
- **AI Interior Designer**: AI-driven style transfer, room layout suggestions, material palettes, and virtual staging.
- **AI Exterior Designer**: Architectural facade generation and exterior finish visualizers.
- **AI Landscape Designer**: Outdoor garden, patio, and landscape layout generator.
- **AI Renovation Advisor**: Renovation scope analysis, estimated capital required, and value-add simulations.
- **Investment Intelligence**: Capital appreciation forecasting, ROI analysis, rental yield projections, and market trend heatmaps.
- **Customer Experience**: Premium luxury buyer/investor portals and tailored property feeds.

#### Phase 6: Immersive Property Platform & Production Acceptance (**PLANNED**)
- **3D Interactive Tours**: WebGL 3D property models and room-by-room virtual walk-throughs.
- **VR Experiences**: Immersive web-VR viewing mode for virtual property tours.
- **AR Experiences**: Augmented reality spatial fitting for furniture placement and room visualization.
- **Digital Twin Presentation**: High-fidelity digital twin models highlighting orientation, solar angles, and architectural details.
- **Enterprise Production Hardening**: API performance optimization, security verification, and scalability validation.
- **Final Product Acceptance**: Comprehensive end-to-end user acceptance testing and formal sign-off.

---

## 4. Shared Services & Core Architecture

- **Auth & RBAC**: Multi-tenant token and session auth (`/server/auth.ts`) with fine-grained role-based access control (`/src/lib/phase5Rbac.ts`).
- **AI Architecture**: Server-side Gemini API integration (`/server/aiService.ts`, `@google/genai`) guarded by token rate limiting, cost monitoring (`costGuard.ts`), and governance logging (`aiGovernance.ts`).
- **Database Architecture**: Drizzle ORM with PostgreSQL schemas (`/src/db/schema.ts`) and linear versioned migrations (`drizzle/0000_...` to `drizzle/0014_...`).
- **Financial Architecture**: Stripe webhook processing (`stripeWebhook.ts`), billing tiers (`plansCatalog.ts`), usage metering, AI Wallet balance management (`aiWallet.ts`), and VAT/ZATCA e-invoicing compliance hooks (`vatZatca.ts`).
- **Integration Engine**: Central event bus (`/src/integration/UIStateContext.tsx`) and navigation router handling dynamic mode transitions across IDE, AI OS, Cloud, Database, Design System, Real Estate, and Studio modes.


