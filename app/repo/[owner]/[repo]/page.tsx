'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FolderTree, FileCode, BarChart3, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';

import RepoGraph from '@/components/graph/RepoGraph';
import FileTree from '@/components/sidebar/FileTree';
import FilePreview from '@/components/sidebar/FilePreview';
import RepoStats from '@/components/sidebar/RepoStats';
import ErrorDisplay from '@/components/ui/ErrorBoundary';
import { useRepoStore } from '@/store/repoStore';
import { detectTechStack } from '@/lib/detectStack';
import SlotCounter from '@/components/ui/SlotCounter';

const SIDEBAR_TABS = [
  { key: 'structure' as const, label: 'Structure', icon: FolderTree },
  { key: 'preview' as const, label: 'Preview', icon: FileCode },
  { key: 'stats' as const, label: 'Stats', icon: BarChart3 },
];

/** Minimal Glassmorphic HUD Telemetry Loader */
function HUDLoader({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 bg-black/40 backdrop-blur-md z-[99] flex items-center justify-center overflow-hidden p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative bg-zinc-950/90 border border-white/[0.1] shadow-[0_16px_48px_rgba(0,0,0,0.9)] backdrop-blur-2xl px-6 py-4 rounded-xl flex items-center gap-4 max-w-xs w-full"
      >
        {/* Holographic dual-spinner */}
        <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 rounded-full border border-t-white border-white/15 absolute"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            className="w-3.5 h-3.5 rounded-full border border-b-white border-white/10 absolute"
          />
        </div>

        {/* Telemetry text */}
        <div className="flex flex-col gap-0.5 overflow-hidden font-mono min-w-0">
          <span className="text-[7.5px] font-bold text-white/40 tracking-[0.25em] uppercase">SYSTEM_SCANNING</span>
          <motion.span
            key={message}
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-bold text-white uppercase tracking-wider truncate"
          >
            {message || 'SYNCING DIRECTORY...'}
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function RepoPage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const {
    isLoading, error, sidebarTab, loadingMessage,
    setRepo, setMetadata, setFileTree, setLanguages,
    setContributors, setTechStack, setSidebarTab,
    setLoading, setError, reset,
    nodes, edges
  } = useRepoStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarWidth(window.innerWidth - 24);
      } else {
        setSidebarWidth(360);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 280 && newWidth < 700) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  // Fetch repo data
  const loadRepo = useCallback(async () => {
    reset();
    setRepo(owner, repo);
    setLoading(true, 'Initializing Connection...');

    try {
      // 1. Fetch Metadata (Critical Path)
      const metaRes = await fetch(`/api/repo?owner=${owner}&repo=${repo}`);
      if (!metaRes.ok) {
        const data = await metaRes.json().catch(() => ({}));
        if (metaRes.status === 404) {
          setError({ type: 'not_found', message: data.error || 'Repository not found' });
          return;
        }
        if (metaRes.status === 429) {
          setError({ type: 'rate_limit', message: data.error || 'Rate limit exceeded', retryAfter: data.retryAfter });
          return;
        }
        if (metaRes.status === 401 || metaRes.status === 403) {
          setError({ type: 'private_repo', message: data.error || 'Access denied' });
          return;
        }
        throw new Error(data.error || 'Unexpected error occurred');
      }

      const metaData = await metaRes.json();
      setMetadata(metaData.metadata);
      setLanguages(metaData.languages || {});
      setContributors(metaData.contributors || []);

      setLoading(true, 'Synthesizing Architecture...');

      // 2. Parallelize independent data fetches
      const [treeRes, parseRes] = await Promise.all([
        fetch(`/api/tree?owner=${owner}&repo=${repo}`),
        fetch(`/api/parse?owner=${owner}&repo=${repo}&branch=${metaData.metadata.defaultBranch}`).catch(() => null)
      ]);

      if (!treeRes.ok) throw new Error('Failed to index file tree');
      const treeData = await treeRes.json();
      setFileTree(treeData.tree || []);

      if (parseRes && parseRes.ok) {
        const parseData = await parseRes.json();
        useRepoStore.setState({
          importEdges: parseData.edges || [],
          isScaleFree: !!parseData.isScaleFree
        });
      }

      // 3. Optimized Tech Stack Detection
      const configFiles: Record<string, string> = {};
      const configNames = [
        'package.json',
        'requirements.txt',
        'Cargo.toml',
        'go.mod',
        'pom.xml',
        'build.gradle',
        'build.gradle.kts',
        'Dockerfile',
        'docker-compose.yml',
        'docker-compose.yaml'
      ];

      const treeItems = treeData.tree || [];
      if (treeItems.some((n: { name?: string; path?: string }) => n.name === '.github' || n.path === '.github' || n.path?.startsWith('.github/'))) {
        configFiles['.github'] = 'true';
      }

      const fileExistanceMap = new Set(treeItems.map((n: { name: string }) => n.name));
      const filesToFetch = configNames.filter(name => fileExistanceMap.has(name));

      if (filesToFetch.length > 0) {
        const fileContents = await Promise.all(
          filesToFetch.map(async (name) => {
            try {
              const res = await fetch(`/api/file?owner=${owner}&repo=${repo}&path=${encodeURIComponent(name)}`);
              if (res.ok) {
                const data = await res.json();
                return { name, content: data.content };
              }
            } catch { /* skip */ }
            return null;
          })
        );

        fileContents.forEach(fc => {
          if (fc) configFiles[fc.name] = fc.content;
        });
      }

      if (Object.keys(configFiles).length > 0) {
        setTechStack(detectTechStack(configFiles));
      }

      setLoading(false);
    } catch (err) {
      setError({
        type: 'unknown',
        message: err instanceof Error ? err.message : 'An unknown error occurred',
      });
    }
  }, [owner, repo, reset, setRepo, setMetadata, setFileTree, setLanguages, setContributors, setTechStack, setLoading, setError]);

  useEffect(() => {
    loadRepo();
  }, [loadRepo]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        <header className="h-14 border-b border-white/5 bg-black flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <ArrowLeft className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Back to Home</span>
          </Link>
        </header>
        <ErrorDisplay error={error} onRetry={loadRepo} />
      </div>
    );
  }

  return (
    <main className="relative w-screen h-screen bg-black text-white overflow-hidden selection:bg-white selection:text-black font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.015)_0%,transparent_80%)] pointer-events-none" />

      {/* Telemetry HUD Loader */}
      <AnimatePresence>
        {isLoading && <HUDLoader message={loadingMessage} />}
      </AnimatePresence>

      {/* Main Graph Canvas */}
      <div className="absolute inset-0 z-0">
        <RepoGraph sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} sidebarWidth={sidebarWidth} />
      </div>

      {/* Floating Glassmorphic HUD Command Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-3 inset-x-3 md:top-4 md:inset-x-4 h-14 md:h-16 bg-zinc-950/70 backdrop-blur-2xl z-50 flex items-center justify-between px-4 md:px-6 border border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden"
      >
        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center group-hover:border-white/30 group-hover:bg-white/[0.05] transition-all">
              <ArrowLeft className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[7px] font-black tracking-[0.3em] text-white/30 uppercase leading-none mb-1">OBSERVATORY</span>
              <span className="text-[11px] md:text-xs font-black tracking-wider text-white uppercase leading-none truncate">
                {owner} <span className="text-white/30 mx-0.5 font-light">/</span> {repo}
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3 md:gap-4 relative z-10 shrink-0">
          {/* Telemetry Matrix Pill */}
          <div className="hidden sm:flex items-center gap-3 border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 rounded-lg select-none text-[8px] font-black tracking-[0.15em] text-white/70">
            <div className="flex items-center gap-1.5">
              <span className="text-white/30">NODES:</span>
              <span className="font-mono text-[9px] text-white font-bold"><SlotCounter value={nodes.length} /></span>
            </div>
            <div className="w-[1px] h-2.5 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <span className="text-white/30">LINKS:</span>
              <span className="font-mono text-[9px] text-white font-bold"><SlotCounter value={edges.length} /></span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.06)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-all border border-white/[0.08] bg-white/[0.02] rounded-lg"
            title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </motion.button>
        </div>
      </motion.header>

      {/* Floating Structural Sidebar Panel */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '110%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '110%', opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: isMobile ? 'calc(100% - 24px)' : sidebarWidth }}
            className="absolute z-40 top-20 md:top-24 bottom-3 md:bottom-4 right-3 md:right-4 rounded-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.85)] overflow-hidden"
          >
            <div className="w-full h-full bg-zinc-950/80 backdrop-blur-3xl flex flex-col relative overflow-hidden">
              {/* Resize Handle (Hidden on Mobile) */}
              {!isMobile && (
                <div
                  onMouseDown={startResizing}
                  className={`absolute inset-y-0 left-0 w-1 cursor-ew-resize z-50 hover:bg-white/20 transition-colors ${isResizing ? 'bg-white/30' : ''}`}
                />
              )}

              {/* Tab Navigation */}
              <div className="flex border-b border-white/[0.06] relative z-10 bg-white/[0.01]">
                {SIDEBAR_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSidebarTab(tab.key)}
                    className={`relative flex-1 flex flex-col items-center justify-center py-3 transition-all group ${sidebarTab === tab.key ? 'bg-white/[0.03]' : 'hover:bg-white/[0.01]'
                      }`}
                  >
                    <tab.icon className={`w-3.5 h-3.5 mb-1.5 transition-opacity ${sidebarTab === tab.key ? 'opacity-100 text-white' : 'opacity-30 text-white/50 group-hover:opacity-60'
                      }`} />
                    <span className={`text-[8px] font-black uppercase tracking-[0.25em] transition-colors ${sidebarTab === tab.key ? 'text-white' : 'text-white/30 group-hover:text-white/60'
                      }`}>
                      {tab.label}
                    </span>
                    {sidebarTab === tab.key && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-white/60" />
                    )}
                  </button>
                ))}
              </div>

              {/* Main Tab Content */}
              <div className="flex-1 overflow-hidden relative z-10">
                <div className="h-full overflow-y-auto scrollbar-thin">
                  {sidebarTab === 'structure' && <FileTree />}
                  {sidebarTab === 'preview' && <FilePreview />}
                  {sidebarTab === 'stats' && <RepoStats />}
                </div>
              </div>

              {/* Minimal Footer */}
              <div className="h-9 border-t border-white/[0.05] bg-black/40 flex items-center justify-between px-4 relative z-10 select-none">
                <span className="text-[8px] font-mono font-bold text-white/30 uppercase tracking-widest">
                  PANEL::{sidebarTab.toUpperCase()}
                </span>
                <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">
                  GITNODE CORE
                </span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </main>
  );
}
