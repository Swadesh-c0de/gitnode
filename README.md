# GitNode

**Interactive, force-directed codebase visualization.**

**Live Demo:** [GitNode](https://git-node.vercel.app)

GitNode is a visual explorer designed to map and navigate directory structures and file relationships. By parsing repository structures, it generates interactive force-directed graphs and hierarchical tree views to help you inspect codebase organization, follow dependencies, and explore files seamlessly.

---

## Key Features

### 🌌 Interactive Constellation Graph
* **Force-Directed Simulation**: Powered by a custom-tuned D3-force simulation modeling gravity, charge repulsion, and collision forces for smooth, natural interactions.
* **Extension-Color Syncing**: Node cores, interactive halos, and edge vectors adapt dynamically to the file extension type (e.g. blue for TypeScript, green for Python).
* **Visual Dependency Trails**: Renders dual-ended color gradients along file links with glowing visual paths to animate active connection lines.
* **Precision Viewport Navigation**: Temporary zoom-lock filter on active drags ensures pixel-perfect file positioning without viewport sliding, utilizing path-travel thresholds to avoid accidental selection triggers.

### ⚡ Large-Repository Optimizations
* **Metadata Bypass Threshold**: Automatically bypasses heavy zipball downloads for repositories exceeding **100MB** size, preventing server-side timeouts and memory overhead.
* **On-Demand Single File Parsing**: Dynamically fetches and extracts import dependency synapses from `/api/parse/file` only when a specific file is selected.
* **O(depth) Local Partitioning**: Completely skips recursive client-side tree flattening. The engine walks directory segments directly to load only the active directory context and its synapses.
* **Canvas Viewport Culling**: Skips rendering nodes and links positioned outside the active visible viewport, reducing drawing overheads to zero during deep-zoom focus.
* **DOM Node Safeguards**: Caps recursive file tree rendering in the sidebar at exactly **600 active nodes**, protecting browser memory and rendering performance.

### 🔬 Minimalist Developer HUD
* **Obsidian-Style Panel**: Glassmorphic UI with floating control elements, allowing you to manipulate force parameters and filters in real-time.
* **Identity Inspector**: Displays a clean, Linear-inspired metadata card showcasing file extensions, formats, directory paths, and sizes.
* **Interactive Synapses List**: Renders inbound and outbound dependencies as interactive tag capsules. Clicking a synapse smoothly navigates and focuses the camera on that file.

---

## 🛠️ System Specifications

| Component | Technical Specification |
| :--- | :--- |
| **Core Framework** | Next.js 16 (App Router) / React 18 |
| **Data Fetching** | Octokit REST API / Just-in-Time Single File Stream |
| **Physics Engine** | D3-Force v7 / Canvas 2D Frustum Culling |
| **State Logic** | Zustand / Progressive Edge Merging |
| **Animations** | Framer Motion v12 / Layout Animation Underlines |
| **Design System** | Tailwind CSS / Vanilla Obsidian Glass / Monaco Typography |

---

## 🛰️ Directory Mapping

```text
root/
├── app/        # Page routes, layouts, and serverless endpoints
│   └── api/    # Repositories, metadata, tree-index, and parser endpoints
├── components/ # Visualization UI, SearchBar, sidebars, and graph canvas
│   ├── graph/  # Constellation Graph, Tree Graph, and Node Inspector
│   └── sidebar/# File Tree, Code Previews, and Analytics panels
├── lib/        # Dynamic branch traversals, tech stack detectors, AST import parsers
├── store/      # Zustand global state matrices & asynchronous API dispatchers
└── types/      # Strict TypeScript schema rules & color maps
```

---

## LICENSE

This project is licensed under the MIT License.
