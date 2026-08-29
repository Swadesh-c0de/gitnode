<div align="center">

# GitNode

**Interactive Force-Directed Architecture & Codebase Intelligence**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![D3.js](https://img.shields.io/badge/D3.js-Force_Physics-f97316?style=flat-square&logo=d3.js&logoColor=white)](https://d3js.org/)
[![Zustand](https://img.shields.io/badge/Zustand-State_Management-4338ca?style=flat-square)](https://zustand-demo.pmnd.rs/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](LICENSE)

[**Explore Live Demo**](https://git-node.vercel.app) • [**Report Bug**](https://github.com/swadesh-c0de/gitnode/issues) • [**Request Feature**](https://github.com/swadesh-c0de/gitnode/issues)

</div>

---

## Overview

**GitNode** transforms complex GitHub repositories into interactive, force-directed architectural maps. By parsing directory trees and analyzing module import relationships, GitNode provides a visual representation of codebase topology, dependency relationships, and structural organization.

Whether you're onboarding onto a new open-source codebase, conducting an architectural audit, or exploring project structures, GitNode makes code navigation intuitive, fast, and visual.

---

## Key Features

### 🌌 Interactive Constellation Graph
- **Force-Directed Simulation**: Custom D3 physics engine modeling gravity, link constraints, charge repulsion, and collision radiuses for organic layout equilibrium.
- **Smart Throttled Rendering**: Replaces continuous rendering loops with an idle-detection cycle that suspends redraws when the physics reach equilibrium, dropping CPU/GPU utilization to near zero.
- **Automated Camera Focus**: Selecting any file or directory smoothly interpolates the viewport camera to center on that node with cubic easing transitions.
- **Extension-Color Synthesis**: Node cores, interactive halos, and visual connection links dynamically adopt file-type color profiles (e.g., TypeScript blue, Python green, Rust amber, image emerald).
- **Dual Layout Engines**: Seamlessly toggle between a spatial **Constellation Graph** and a structured hierarchical **Tree Layout**.

### ⚡ Dependency Analysis & Resolution
- **Path Alias Resolution**: Automatically resolves `@/...`, `~/...`, and `@src/...` path aliases across `src/`, `app/`, `lib/`, and `components/`.
- **Multi-Language AST Parsers**: Extracts dependency connections across TypeScript, JavaScript, Python, Rust, Go, and Java/Kotlin.
- **Batched Zipball Extraction**: In-memory repository parsing processes files in chunks of 50 to prevent memory spikes on large repositories.
- **On-Demand JIT Parsing**: For massive scale-free codebases (>100MB), imports are parsed dynamically on demand when individual nodes are selected.

### 🖼️ Studio Code & Media Viewer
- **Syntax Highlighted Code**: Clean code preview supporting over 12 languages with highlight.js, line numbering, and one-click clipboard copying.
- **Holographic Media Preview**: Safe visual rendering for `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`, `.webp`, `.ico`, `.bmp`, and `.avif` files.
- **Media Controls**: Integrated zoom (`25%` to `400%`), aspect ratio calculation, natural dimension detection, checkered transparency grid, and direct image download.

### 🛡️ API Shielding & Caching
- **In-Memory LRU Cache**: Server-side TTL cache for metadata, tree structures, and file lookups.
- **Edge Cache Headers**: Implements HTTP `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` to conserve GitHub API rate limits.

### 🔬 Minimalist Cyber HUD
- **Floating Observatory Command Bar**: Sleek glassmorphic HUD header with real-time slot-counter metrics for nodes and connection links.
- **Compact Node Inspector**: Linear/Vercel-inspired card with directory breadcrumbs, format badges, and click-to-focus dependency tags.
- **Directory Manifest**: Compact file tree with search filtering, one-click expand/collapse, and color-coded extension indicators.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router, Turbopack) | Serverless API routes and client rendering |
| **Language** | TypeScript 5.0+ | Strict type safety and schema validation |
| **Physics & Canvas** | D3.js (d3-force, d3-zoom, d3-selection) | 2D Canvas force-directed graph engine |
| **State Management** | Zustand | Global repository, graph, and UI filter state |
| **Styling & UI** | Tailwind CSS + Vanilla CSS Tokens | Glassmorphic dark theme and HUD layout |
| **Motion** | Framer Motion 12 | Layout animations, transitions, and presence |
| **Icons** | Lucide React | Clean, scalable vector iconography |
| **GitHub Integration** | Octokit REST API | Repository metadata, git trees, and file contents |

---

## 📡 API Reference

| Endpoint | Method | Params | Description |
| :--- | :--- | :--- | :--- |
| `/api/repo` | `GET` | `owner`, `repo` | Fetches repository metadata, language stats, and top contributors. |
| `/api/tree` | `GET` | `owner`, `repo`, `branch?` | Returns the complete recursive file tree of the repository. |
| `/api/file` | `GET` | `owner`, `repo`, `path` | Fetches file content (UTF-8 text or Base64 Data URL for images). |
| `/api/parse` | `GET` | `owner`, `repo`, `branch?` | Downloads repository zipball and extracts all internal module import edges. |
| `/api/parse/file` | `GET` | `owner`, `repo`, `path` | Parses import statements on-demand for a single targeted file. |

---

## 📂 Project Structure

```text
gitnode/
├── app/
│   ├── api/
│   │   ├── file/           # Single file retrieval endpoint
│   │   ├── parse/          # Full zipball parser & on-demand file parser
│   │   ├── repo/           # Repository metadata & contributor metrics
│   │   └── tree/           # Recursive git tree indexing endpoint
│   ├── repo/[owner]/[repo]/# Observatory graph & analysis interface
│   ├── globals.css         # Custom design tokens, scrollbars, and animations
│   ├── layout.tsx          # Root HTML layout and metadata
│   └── page.tsx            # Landing page with interactive search bar
├── components/
│   ├── graph/
│   │   ├── ConstellationGraph.tsx # Canvas D3-force physical simulation
│   │   ├── GraphControls.tsx      # Filter toggles, depth sliders & engine switcher
│   │   ├── NodeInspector.tsx      # Selected node details & dependency tag capsules
│   │   ├── RepoGraph.tsx          # Graph canvas wrapper
│   │   └── TreeGraph.tsx          # Hierarchical tree layout alternative
│   ├── sidebar/
│   │   ├── FilePreview.tsx        # Syntax-highlighted code & holographic image viewer
│   │   ├── FileTree.tsx           # Searchable directory manifest with extension dots
│   │   └── RepoStats.tsx          # Language distribution & contributor metrics
│   └── ui/
│       ├── ErrorBoundary.tsx      # Graceful error states and recovery
│       ├── SearchBar.tsx          # Holographic search bar with localStorage history
│       └── SlotCounter.tsx        # Animated telemetry counter
├── lib/
│   ├── buildGraph.ts       # Graph node synthesis & alias path resolution
│   ├── cache.ts            # In-memory LRU TTL caching layer
│   ├── detectStack.ts      # Framework & dependency detector
│   ├── github.ts           # Octokit wrapper with binary-safe file decoder
│   └── parseImports.ts     # Regex AST import extractors for JS, Py, Rust, Go, Java
├── store/
│   └── repoStore.ts        # Zustand global state matrices and dispatchers
└── types/
    └── index.ts            # TypeScript schemas, AST rules & color mappings
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with precision for developers exploring the universe of open-source code.</sub>
</div>
