# GitNode — AI Agent & Developer Architecture Guide (AGENTS.md)

This document provides a high-density, authoritative overview of the GitNode repository architecture, invariants, data contracts, and contribution conventions. It is designed to enable any AI coding agent or human engineer to rapidly understand, navigate, and safely extend the system.

---

## 🧭 Repository Mental Model

**GitNode** is an architectural repository intelligence platform. It transforms remote GitHub repositories into interactive force-directed graph constellations and hierarchical trees, extracting dependencies, syntax structures, and tech stacks in real-time.

```text
[ Remote GitHub Repo ]
         │ (Metadata check & Tree queries)
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Gateway (/app/api)            │
│  - /api/repo         → Metadata, languages, contributors    │
│  - /api/tree         → Recursive git tree JSON              │
│  - /api/file         → Raw file text or image base64        │
│  - /api/parse        → Zipball bulk import extraction       │
│  - /api/parse/file   → JIT isolated file AST parsing        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Core Business Domain (/lib)              │
│  - /lib/github       → Octokit API client & backoff retry   │
│  - /lib/parser       → Multi-language AST/Regex dependency  │
│                        parsers (TS/JS, Py, Go, Rust, Java)  │
│  - /lib/graph        → O(depth) Partitioning & Graph layout │
│  - /lib/detector     → Tech stack heuristic inference       │
│  - /lib/cache        → In-memory TTL / LRU cache            │
│  - /lib/utils        → Path alias resolvers & formatters    │
│  - /lib/constants    → Color palettes & system limits       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Reactive State (/store)                 │
│  - repoStore.ts      → Zustand global store & JIT triggers  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Presentation Layer (/components)           │
│  - /components/graph   → D3 Constellation & Tree visualizers│
│  - /components/sidebar → FileTree, FilePreview, RepoStats   │
│  - /components/ui      → SearchBar, ErrorBoundary, Counter  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Directory Topology

| Directory | Responsibility | Key Export / Entry Point |
| :--- | :--- | :--- |
| `types/` | Domain-driven TypeScript contracts | `types/index.ts` |
| `lib/constants/` | System limits, color maps, tech definitions | `lib/constants/index.ts` |
| `lib/utils/` | Shared formatters, path & alias resolvers | `lib/utils/index.ts` |
| `lib/cache/` | In-memory caching layer with TTL | `lib/cache/index.ts` |
| `lib/github/` | GitHub REST v3 Octokit integration & retries | `lib/github/index.ts` |
| `lib/parser/` | Multi-language import & AST parsers | `lib/parser/index.ts` |
| `lib/detector/` | Heuristic tech stack detection | `lib/detector/index.ts` |
| `lib/graph/` | Graph synthesis & Scale-Free partitioning | `lib/graph/index.ts` |
| `lib/api/` | Standardized API responses & error handling | `lib/api/index.ts` |
| `store/` | Zustand centralized application state | `store/index.ts` |
| `components/graph/` | D3-force canvas & D3-tree visualization | `components/graph/index.ts` |
| `components/sidebar/`| File tree, code preview, repository diagnostics | `components/sidebar/index.ts` |
| `components/ui/` | Shared atomic UI controls & Error boundaries | `components/ui/index.ts` |
| `app/` | Next.js App Router pages and REST API handlers | `app/` |
| `tests/` | Automated test & verification suite | `tests/core.test.ts` |

---

## ⚡ Core Invariants & Performance Rules

1. **Scale-Free Bypass Threshold (`>100MB`)**:
   - Repositories larger than 100MB (`SCALE_FREE_SIZE_THRESHOLD_KB = 100_000`) **MUST NOT** be downloaded as zipballs.
   - `/api/parse` returns `{ edges: [], isScaleFree: true }`.
   - The frontend activates Just-in-Time (JIT) parsing: when a user clicks a node, `/api/parse/file` fetches and extracts imports on-demand in `<200ms`.

2. **$O(\text{depth})$ Graph Local Partitioning**:
   - In Scale-Free mode, `buildGraph` walks direct directory indices using `findNodeByPath` instead of recursive full-tree flattening.
   - Active graph elements are capped to immediate directory siblings + connected synapses (typically `<300` elements).

3. **Frustum Canvas Viewport Culling**:
   - In `ConstellationGraph.tsx`, canvas render ticks skip drawing nodes and links positioned outside the active zoom boundary:
     $$\text{left} = - \frac{t_x + \text{parallax}_x}{k}, \quad \text{right} = \text{left} + \frac{w}{k}$$
     $$\text{top} = - \frac{t_y + \text{parallax}_y}{k}, \quad \text{bottom} = \text{top} + \frac{h}{k}$$

4. **DOM Safeguard (`600 Node Cap`)**:
   - `FileTree.tsx` limits rendered flat items to 600 nodes maximum to prevent browser DOM freezing on massive monorepos.

5. **Rate-Limit Resilience**:
   - All GitHub API queries pass through `withRetry` in `lib/github/retry.ts`.
   - When a `403` rate-limit header is received, the utility reads `x-ratelimit-reset` and calculates the exact wait time before failing cleanly with a typed `AppError`.

---

## 📦 Type System Conventions (`/types`)

Always import types from `@/types` or specific domain modules:

- **`types/github.ts`**: `RepoMetadata`, `FileTreeNode`, `LanguageStats`, `Contributor`, `FileContentData`.
- **`types/graph.ts`**: `GraphNode`, `FileGraphNode`, `FolderGraphNode`, `GraphEdge`, `GraphFilters`, `ViewMode`.
- **`types/parser.ts`**: `ImportEdge`, `ParseableLanguage`.
- **`types/techStack.ts`**: `TechStackItem`, `TechCategory`.
- **`types/error.ts`**: `AppError`, `AppErrorType`.
- **`types/store.ts`**: `RepoState`, `RepoActions`.

---

## 🛠️ How to Extend the Codebase

### Adding Support for a New Programming Language:
1. Open `lib/parser/languages/` and create `<language>.ts` implementing the parser pattern `(content: string) => { path: string; raw: string }[]`.
2. Add language detection to `lib/parser/detector.ts` (`detectLanguage`).
3. Add classification rules to `classifyImport` in `lib/parser/detector.ts`.
4. Register the language parser in `lib/parser/index.ts`.
5. Add file extension colors in `lib/constants/colors.ts`.
6. Add syntax highlighting registration in `components/sidebar/FilePreview.tsx` if needed.
7. Add test cases in `tests/core.test.ts`.

### Adding a New Sidebar Tab:
1. Update `types/store.ts` to include the new tab name in `sidebarTab: 'structure' | 'preview' | 'stats' | 'newTab'`.
2. Create component in `components/sidebar/YourNewTab.tsx`.
3. Export from `components/sidebar/index.ts`.
4. Register the tab in `app/repo/[owner]/[repo]/page.tsx` (`SIDEBAR_TABS`).

---

## 🧪 Testing & Verification

Run the automated verification suite and typechecks:

```bash
# Run TypeScript compilation check
npx tsc --noEmit

# Run automated domain logic test suite
npx tsx tests/core.test.ts

# Run Next.js production build test
npm run build
```
