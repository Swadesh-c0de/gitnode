# GitNode Codebase Architecture & Technical Deep Dive

GitNode is a visual explorer designed to map, parse, and navigate complex codebases. By parsing repository structures, it generates interactive force-directed graphs and hierarchical tree views to help developers inspect codebase organization, follow dependencies, and explore files.

---

## 🗺️ System Architecture Overview

GitNode is built with a decoupled architecture containing distinct parser, logic, state, and presentation layers:

```text
                             [ Remote GitHub Repository ]
                                          │ 
                                          │ (Metadata check & API queries)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API ROUTER & JIT PARSER                          │
│                                                                             │
│  - /api/parse       → Checks metadata, bypasses zip download for size >100MB│
│  - /api/parse/file  → Extracts AST imports on-the-fly under 200ms           │
└─────────────────────────────────────────┬───────────────────────────────────┘
                                          │ 
                                          │ (Incremental updates)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CORE BUSINESS LOGIC (/lib)                       │
│                                                                             │
│  - github.ts        → Fetches recursive file tree structures & raw files    │
│  - parseImports.ts  → Language-specific AST/Regex parser (TS, Py, Go, etc.) │
│  - buildGraph.ts    → O(depth) local partitioning & branch traversals       │
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
│  ▶ Canvas Viewport Engine (/graph)       ▶ Obsidian Sidebar Panel (/sidebar)│
│    - ConstellationGraph (D3/Culling)       - FileTree (600 DOM Safeguard)   │
│    - TreeGraph (D3-Hierarchical)           - FilePreview (Code Viewer)      │
│    - NodeInspector (Minimal details card)  - RepoStats (Stack Analytics)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Scale-Free Optimization Design

To handle massive codebases without encountering Node.js heap memory exhaustion, browser DOM freezing, or server timeouts, GitNode implements a series of high-performance rendering and parsing strategies:

### 1. Scale-Free Zipball Bypass
* **The Problem**: Traditional repository explorers download and unzip the entire repository archive to parse imports. For repositories exceeding hundreds of megabytes, this triggers API timeouts, Node.js heap allocation limit overflows, and heavy server latency.
* **The Solution**: On repository query, `/api/parse` performs an instant metadata check. If the repository is larger than **100MB**, it activates **Scale-Free mode** (`isScaleFree: true`), completely bypassing zipball downloads and unzipping. The application instead switches to incremental, on-demand client-directed fetching.

### 2. On-Demand Just-in-Time (JIT) AST File Parsing
* **Endpoint**: `/api/parse/file`
* **Mechanism**: When a specific node (file) is selected in Scale-Free mode, the client dispatches a JIT request for that specific file path.
* **Result**: The endpoint fetches the isolated file content via GitHub's API, runs targeted language-specific parser regex/AST filters, and returns parsed import synapses in under **200ms**. The client then dynamically appends these edges to the active graph state.

### 3. $O(\text{depth})$ Local Partitioning & Directory Traversal
* **The Problem**: Flattening and building graph representations for tens of thousands of files triggers high client-side CPU overhead and garbage collection pauses.
* **The Solution**: In `buildGraph.ts`, recursive client-side tree flattening is skipped entirely in Scale-Free mode. 
* **Mechanism**: The engine walks direct directory segments of the active node using index lookups (`findNodeByPath`) and maps only the selected file's direct directory siblings and immediate import connections. This limits the active graph canvas size to a small local partition (usually under 300 active elements), ensuring fast calculation speeds regardless of codebase size.

### 4. Frustum Canvas Viewport Culling
* **Implementation**: Located in `ConstellationGraph.tsx`.
* **Mechanism**: During the D3-force visual render ticks, drawing nodes and connections positioned outside the active zoom boundary is skipped.
* **Mathematical Calculation**: Let $x, y$ be node coordinates, $k$ be zoom scale, $t_x, t_y$ be viewport translations, and $w, h$ be canvas dimensions. The visible bounding coordinates are derived as:
  $$\text{left} = - \frac{t_x + \text{parallax}_x}{k}, \quad \text{right} = \text{left} + \frac{w}{k}$$
  $$\text{top} = - \frac{t_y + \text{parallax}_y}{k}, \quad \text{bottom} = \text{top} + \frac{h}{k}$$
* **Result**: Only nodes satisfying $\text{left} \le x \le \text{right}$ and $\text{top} \le y \le \text{bottom}$ are painted on the canvas, reducing canvas rendering time from $O(N)$ to $O(M)$ (where $M$ is the number of currently visible nodes).

### 5. DOM Safeguard (Capped Recursion Tree)
* **Implementation**: Located in `FileTree.tsx`.
* **Mechanism**: Recursive folders are mapped incrementally. The total rendered elements list is strictly capped at **600 active nodes**. When reached, it cuts off tree rendering and presents a minimalist, non-intrusive indicator warning that only the primary segments of the directory structure are displayed to protect DOM rendering speeds.

---

## 📂 Core Modules & Method Explanations

### 1. Business Logic (`/lib`)

This layer performs the heavy lifting, processing raw remote repositories into graph-friendly data structures.

#### `github.ts` (API & Telemetry)
Acts as the GitHub API wrapper using the `@octokit/rest` SDK.
* **`withRetry(fn, maxRetries)`**: A robust wrapper around API calls that implements exponential backoff. It automatically calculates sleep times if a rate limit (`403`) is hit by reading the `x-ratelimit-reset` header.
* **`fetchFileTree(owner, repo)`**: Fetches the entire repository structure recursively via the `git.getTree` endpoint. It converts GitHub's flat tree response into a deeply nested array of `FileTreeNode` objects, sorting directories before files.
* **`fetchFileContent(...)`**: Retrieves the raw base64-encoded string of a file and decodes it to `utf-8` text for parsing and previewing.

#### `parseImports.ts` (Dependency Extraction)
Responsible for analyzing raw source code to draw the connections (edges) between files.
* **`parseImports(filePath, content)`**: The main entry point. It first calls `detectLanguage` to find out if the file is JS/TS, Python, Rust, Go, or Java/Kotlin.
* **Regex Parsers (`parseJSImports`, `parsePythonImports`, etc.)**: Runs language-specific Regular Expressions over the code to extract module requirements. For example, JS/TS extracts `import x from 'y'`, `require('y')`, and dynamic `import()`.
* **`classifyImport()`**: Categorizes the matched path as either `'local'` (internal repository files) or `'external'` (third-party NPM/PyPI packages).

#### `detectStack.ts` (Heuristic Tech Detection)
Identifies the exact technologies the repository uses to populate the "RepoStats" sidebar.
* **`detectTechStack(files)`**: Looks for specific root files (e.g., `package.json`, `requirements.txt`, `Cargo.toml`, `Dockerfile`).
* **`detectFromPackageJson(content)`**: Parses the `dependencies` and `devDependencies` JSON fields and maps them against a hardcoded `TECH_MAP` to find known tools like Next.js, React, Prisma, or Tailwind.

#### `buildGraph.ts` (Graph Data Synthesis)
Transforms the logical file tree and import edges into a physical graph representation.
* **`flattenTree(tree)`**: Recursively unpacks the hierarchical file tree into a flat 1D array.
* **`buildGraph(...)`**: Iterates over the items and generates compatible `GraphNode` objects. It assigns physical visual traits to nodes, like `color` and `glowColor`, based on the file extension (`getExtensionColor`). It filters out edges that are external dependencies if the user has toggled them off in the UI.

---

### 2. State Management (`/store`)

#### `repoStore.ts` (Zustand Store)
GitNode utilizes a centralized **Flux-like architecture** via `zustand` to prevent prop-drilling and allow the D3 graph and React sidebar to communicate effortlessly.
* **Data State**: Holds arrays of `nodes`, `edges`, `importEdges`, `fileTree`, `parsedFiles`, and repository `metadata`.
* **Scale-Free Hooks**: Listens to select node change triggers. If `isScaleFree` is active, it dispatches an asynchronous JIT parser fetch to `/api/parse/file`, extracts the resulting imports, merges the new connection vectors into `importEdges`, and marks the file path as processed in `parsedFiles`.
* **Performance Selectors**: Exports atomic selectors (e.g., `selectNodes`, `selectViewMode`) so components only re-render when their specific slice of state changes.

---

### 3. User Interface & Visualizations (`/components`)

#### Graph Engine (`/components/graph`)
These components manage the actual canvas and nodes rendered to the screen.
* **`ConstellationGraph.tsx`**: Uses `d3-force` to simulate gravity, charge, and collision physics. It positions the files (nodes) dynamically so that heavily imported files attract their dependents, forming clusters.
* **`TreeGraph.tsx`**: A secondary visualization mode that structures the repository strictly hierarchically.
* **`NodeInspector.tsx`**: Stripped of heavyweight tab interfaces and replaced by a streamlined, Linear-inspired micro details card showcasing file extensions, formats, directory paths, and sizes.

#### Sidebar Shell (`/components/sidebar`)
* **`FileTree.tsx`**: An collapsible directory explorer with 600-node Safeguards. Clicking a file here updates the `selectedNode` in the Zustand store, which the Graph engine then reacts to by centering on the node.
* **`FilePreview.tsx`**: Uses Highlight.js to colorize and render the raw text content of the currently selected file.
* **`RepoStats.tsx`**: Displays the aggregated outputs from `detectStack.ts` and `github.ts`, including language density charts using `recharts`.
