# OPROX v1.0 — FINAL SYSTEM HANDOFF DOCUMENTATION

## 1. UI Architecture
OPROX uses a modular visual engine built with React 18, TypeScript, Tailwind CSS, and Lucide React icons.
- **Header Navigation**: Dynamic mode switcher with context-aware tab controls for IDE, AI OS, Cloud Platform, DB Console, Design System, Verticals, and Enterprise Governance.
- **Panels & Drawers**: Collapsible sidebars (file tree, component inspector, AI agent streams, context memory) and bottom drawer (terminal emulator, build logs, API testbench).
- **Responsive & High Performance**: Clean dark/light theme options with 60fps transitions powered by optimized CSS grid/flex structures and React hooks.

## 2. Component Architecture
- `/src/components/common`: Header navigation, bottom status bar, toast notifications, UI controls.
- `/src/components/ide`: IDE workbench (`OproxCodeIDE`), VFS tree, code editor with tab management, terminal emulator, bottom drawer, factory pipeline.
- `/src/components/ai`: `AiOperatingSystem`, `PromptWorkspace`, `MultiAgentWorkspace`, `ContextMemoryPanel`, `TaskPipelinePanel`.
- `/src/components/cloud`: `CloudInfrastructureWorkspace` for VPC, Kubernetes, Serverless, and IAM controls.
- `/src/components/database`: `DatabaseConsoleWorkspace` for schemas, migrations, SQL execution, and connection pooling.
- `/src/components/design`: `DesignSystemWorkspace` providing living design tokens, atomic components, and UI guidelines.
- `/src/components/verticals`: `MediaStudio` and `PropTechStudio` industry solutions.
- `/src/components/platform`: `EnterpriseGovernanceWorkspace` for security audit logs, RBAC matrix, and compliance frameworks.

## 3. Folder Structure
```
/
├── server.ts              # Production & Dev Express Server + API Routes
├── package.json           # Application dependencies and build scripts
├── vite.config.ts         # Vite bundler configuration
├── src/
│   ├── App.tsx            # Main application layout & mode router
│   ├── main.tsx           # React DOM root entry
│   ├── index.css          # Global CSS & Tailwind imports
│   ├── types.ts           # Shared TypeScript interfaces & types
│   ├── components/
│   │   ├── common/        # Shared header, status bar, navigation
│   │   ├── ide/           # IDE code editor, VFS, terminal, factory
│   │   ├── ai/            # Multi-agent swarm OS & prompt workspace
│   │   ├── cloud/         # Cloud & Kubernetes infrastructure
│   │   ├── database/      # Database console & SQL execution
│   │   ├── design/        # OPROX Design System showcase & token gallery
│   │   ├── verticals/     # Media Studio & PropTech domain engines
│   │   └── platform/      # Enterprise governance & compliance
```

## 4. Design System Guide
- **Color Palette**: Dark Slate Canvas (`bg-slate-950`), Border accents (`border-slate-800`), Primary Blue Accent (`bg-blue-600`), Emerald Success (`text-emerald-400`), Amber Warning (`text-amber-400`), Purple AI Accent (`text-purple-400`).
- **Typography**: Inter / Plus Jakarta Sans for UI body, Fira Code / JetBrains Mono for Code Editor & Terminal.
- **Controls**: Pill badges, tabbed panels, code blocks with syntax highlight styling, interactive status indicators.

## 5. Routing Map
- `ide`: Primary IDE Workbench (Virtual File System, Editor, Terminal, Factory Pipeline).
- `ai`: AI Operating System & Autonomous Swarm Workspace.
- `cloud`: Cloud Infrastructure & Kubernetes Management.
- `database`: Database Management, SQL Query Console & Schema Migrations.
- `design`: OPROX Living Design System & Token Explorer.
- `verticals`: Industry Vertical Solutions (Media AI & PropTech).
- `platform`: Enterprise Governance, Audit Logs & Compliance Matrix.

## 6. State Management Overview
- Local state powered by React Hooks (`useState`, `useCallback`, `useMemo`, `useEffect`).
- Persistent VFS state initialized with mock files and updated during editing.
- Dynamic tab switching and panel state persistence during workspace mode toggling.

## 7. Integration Map
- Express API endpoints in `server.ts`:
  - `POST /api/ai/agent-task`: Dispatches AI Agent pipeline tasks.
  - `POST /api/cloud/provision`: Provisions virtual cloud resources.
  - `POST /api/database/query`: Executes SQL queries and returns execution stats.
  - `GET /api/governance/compliance`: Retrieves compliance audit checks.

## 8. Developer Guide
- **Development Server**: `npm run dev` launches Express server on port 3000 with Vite middleware.
- **Building for Production**: `npm run build` compiles Vite assets and builds standalone Express server.
- **Type Checking**: `npm run lint` executes `tsc --noEmit`.

## 9. Maintenance Guide
- Adding new tabs/modes: Declare new route mode in `src/types.ts` and add corresponding nav button in `Header.tsx`.
- Adding API endpoints: Register new routes in `server.ts` before the Vite middleware layer.
- Upgrading components: Extend existing components in `/src/components/` following OPROX design system token conventions.
