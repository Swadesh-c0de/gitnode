# GitNode Codebase Architecture & Technical Deep Dive

GitNode is an architectural visual explorer designed to map, parse, and navigate complex codebases. By parsing repository structures, it generates interactive force-directed graphs and hierarchical tree views to help developers inspect codebase organization, follow dependencies, and explore files.

---

## 🗺️ System Architecture Overview

GitNode is built with a decoupled, domain-driven architecture containing distinct parser, logic, state, and presentation layers:

```text
                             [ Remote GitHub Repository ]
                                          │ 
                                          │ (Metadata check & API queries)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY & ROUTER (/app/api)                  │
│                                                                             │
│  - /api/repo        → Fetches repository metadata, stats, contributors      │
│  - /api/tree        → Retrieves full recursive file tree structure          │
│  - /api/file        → Fetches raw file text or base64 image data            │
│  - /api/parse       → Checks size, bypasses zip download for size >100MB    │
│  - /api/parse/file  → Extracts AST imports on-the-fly under 200ms           │
└─────────────────────────────────────────┬───────────────────────────────────┘
                                          │ 
                                          │ (Typed Domain Queries)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CORE BUSINESS DOMAIN (/lib)                         │
│                                                                             │
│  - /lib/github      → Octokit SDK wrapper, backoff retries & rate-limits    │
│  - /lib/parser      → Modular AST/Regex parsers (TS/JS, Py, Go, Rust, Java) │
│  - /lib/graph       → O(depth) local partitioning & graph synthesis         │
│  - /lib/detector    → Multi-manifest tech stack detection heuristics        │
│  - /lib/cache       → In-memory TTL / LRU cache with eviction safeguards    │
│  - /lib/utils       → Path alias resolvers & formatters                     │
│  - /lib/constants   → Palettes, tech definitions, and system limits         │
│  - /lib/api         → Standardized API responses & error handling           │
└─────────────────────────────────────────┬───────────────────────────────────┘
                                          │ 
                                          │ (Reactive State Hydration)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STATE MANAGEMENT (/store)                         │
│                                                                             │
│  - repoStore.ts (Zustand)                                                   │
│    Manages nodes, active edges, synapses, UI ViewModes, and viewport filters│
└─────────────────────────────────────────┬───────────────────────────────────┘
                                          │ 
                                          │ (Viewport & DOM rendering)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE (/components)                       │
│                                                                             │
│  ▶ Canvas Viewport Engine (/graph)       ▶ Explorer Sidebar Panel (/sidebar)│
│    - ConstellationGraph (D3/Culling)       - FileTree (600 DOM Safeguard)   │
│    - TreeGraph (D3-Hierarchical)           - FilePreview (Code Viewer)      │
│    - NodeInspector (Minimal details card)  - RepoStats (Stack Analytics)    │
│    - GraphControls (Filter panel)                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Scale-Free Optimization Design

To handle massive codebases without encountering Node.js heap memory exhaustion, browser DOM freezing, or server timeouts, GitNode implements a series of high-performance rendering and parsing strategies:

### 1. Scale-Free Zipball Bypass
* **The Problem**: Traditional repository explorers download and unzip the entire repository archive to parse imports. For repositories exceeding hundreds of megabytes, this triggers API timeouts, Node.js heap allocation limit overflows, and heavy server latency.
* **The Solution**: On repository query, `/api/parse` performs an instant metadata check. If the repository is larger than **100MB** (`SCALE_FREE_SIZE_THRESHOLD_KB = 100_000`), it activates **Scale-Free mode** (`isScaleFree: true`), completely bypassing zipball downloads and unzipping. The application instead switches to incremental, on-demand client-directed fetching.

### 2. On-Demand Just-in-Time (JIT) AST File Parsing
* **Endpoint**: `/api/parse/file`
* **Mechanism**: When a specific node (file) is selected in Scale-Free mode, the client dispatches a JIT request for that specific file path.
* **Result**: The endpoint fetches the isolated file content via GitHub's API, runs targeted language-specific parser regex/AST filters, and returns parsed import synapses in under **200ms**. The client then dynamically appends these edges to the active graph state.

### 3. $O(\text{depth})$ Local Partitioning & Directory Traversal
* **The Problem**: Flattening and building graph representations for tens of thousands of files triggers high client-side CPU overhead and garbage collection pauses.
* **The Solution**: In `lib/graph/builder.ts`, recursive client-side tree flattening is skipped entirely in Scale-Free mode. 
* **Mechanism**: The engine walks direct directory segments of the active node using index lookups (`findNodeByPath` in `lib/graph/treeUtils.ts`) and maps only the selected file's direct directory siblings and immediate import connections. This limits the active graph canvas size to a small local partition (usually under 300 active elements), ensuring fast calculation speeds regardless of codebase size.

### 4. Frustum Canvas Viewport Culling
* **Implementation**: Located in `components/graph/ConstellationGraph.tsx`.
* **Mechanism**: During the D3-force visual render ticks, drawing nodes and connections positioned outside the active zoom boundary is skipped.
* **Mathematical Calculation**: Let $x, y$ be node coordinates, $k$ be zoom scale, $t_x, t_y$ be viewport translations, and $w, h$ be canvas dimensions. The visible bounding coordinates are derived as:
  $$\text{left} = - \frac{t_x + \text{parallax}_x}{k}, \quad \text{right} = \text{left} + \frac{w}{k}$$
  $$\text{top} = - \frac{t_y + \text{parallax}_y}{k}, \quad \text{bottom} = \text{top} + \frac{h}{k}$$
* **Result**: Only nodes satisfying $\text{left} \le x \le \text{right}$ and $\text{top} \le y \le \text{bottom}$ are painted on the canvas, reducing canvas rendering time from $O(N)$ to $O(M)$ (where $M$ is the number of currently visible nodes).

### 5. DOM Safeguard (Capped Recursion Tree)
* **Implementation**: Located in `components/sidebar/FileTree.tsx`.
* **Mechanism**: Recursive folders are mapped incrementally. The total rendered elements list is strictly capped at **600 active nodes** (`MAX_FILE_TREE_NODES_SAFEGUARD`). When reached, it cuts off tree rendering and presents a minimalist, non-intrusive indicator warning that only the primary segments of the directory structure are displayed to protect DOM rendering speeds.

---

## 📂 Modular Domain Structure

### 1. Domain Types (`/types`)
Domain interfaces separated by architectural concern:
* **`types/github.ts`**: `RepoMetadata`, `FileTreeNode`, `LanguageStats`, `Contributor`, `FileContentData`.
* **`types/graph.ts`**: `GraphNode`, `FileGraphNode`, `FolderGraphNode`, `GraphEdge`, `GraphFilters`, `ViewMode`.
* **`types/parser.ts`**: `ImportEdge`, `ParseableLanguage`, `RawImportMatch`.
* **`types/techStack.ts`**: `TechStackItem`, `TechCategory`.
* **`types/error.ts`**: `AppError`, `AppErrorType`.
* **`types/store.ts`**: `RepoState`, `RepoActions`, `SidebarTab`.

### 2. Business Logic Layer (`/lib`)
* **`/lib/github`**: GitHub API client factory (`client.ts`), retry wrapper with exponential backoff & rate-limit parsing (`retry.ts`), typed query endpoints (`api.ts`).
* **`/lib/parser`**: Language detector and classifier (`detector.ts`), language-specific AST/Regex parsers (`languages/javascript.ts`, `languages/python.ts`, `languages/rust.ts`, `languages/go.ts`, `languages/java.ts`), unified dispatcher (`index.ts`).
* **`/lib/graph`**: Path-based node index lookups (`treeUtils.ts`), graph synthesis with Scale-Free dynamic partitioning (`builder.ts`).
* **`/lib/detector`**: Multi-file configuration analysis (`stackDetector.ts`).
* **`/lib/cache`**: In-memory LRU/TTL cache (`memoryCache.ts`).
* **`/lib/utils`**: Formatting (`formatters.ts`) and path/alias resolvers (`path.ts`).
* **`/lib/constants`**: Color palettes (`colors.ts`), technology mappings (`techMap.ts`), system limits (`limits.ts`).
* **`/lib/api`**: Standardized response helpers (`response.ts`).

### 3. State Management Layer (`/store`)
* **`store/repoStore.ts`**: Centralized Zustand store with fine-grained atomic selectors (`selectMetadata`, `selectNodes`, `selectEdges`, `selectFilters`, etc.).

### 4. User Interface Layer (`/components`)
* **`/components/graph`**: `ConstellationGraph`, `TreeGraph`, `GraphControls`, `NodeInspector`, `RepoGraph`.
* **`/components/sidebar`**: `FileTree`, `FilePreview`, `RepoStats`.
* **`/components/ui`**: `SearchBar`, `ErrorBoundary`, `SlotCounter`.
