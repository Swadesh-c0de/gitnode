'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FolderTree, FileCode, BarChart3, PanelLeftClose, PanelLeftOpen, Terminal, ShieldAlert } from 'lucide-react';
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
      transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-black/30 backdrop-blur-sm z-[99] flex items-center justify-center overflow-hidden"
    >
      {/* Premium glass panel loader box */}
      <div className="relative bg-black/85 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-2xl px-8 py-5 rounded-xl flex items-center gap-6 max-w-sm w-full mx-4">
        {/* Technical corner brackets */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/20 rounded-tl" />
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-white/20 rounded-tr" />
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-white/20 rounded-bl" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/20 rounded-br" />

        {/* Minimal rotating holographic dual-spinner */}
        <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 rounded-full border border-t-white border-white/10 absolute"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 rounded-full border border-b-white border-white/5 absolute"
          />
        </div>

        {/* Text telemetry */}
        <div className="flex flex-col gap-1 overflow-hidden font-mono">
          <span className="text-[7px] font-black text-white/30 tracking-[0.3em] uppercase">SYSTEM_SCANNING</span>
          <motion.span
            key={message}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[9px] font-bold text-white/80 uppercase tracking-widest truncate"
          >
            {message || 'SYNCING DIRECTORY...'}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

export default function RepoPage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const {
    metadata, isLoading, error, sidebarTab, loadingMessage,
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
        setSidebarWidth(window.innerWidth);
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
      if (newWidth > 300 && newWidth < 800) {
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
        const data = await metaRes.json();
        if (metaRes.status === 404) {
          setError({ type: 'not_found', message: 'Repository not found' });
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
      const configNames = ['package.json', 'requirements.txt', 'Cargo.toml', 'go.mod', 'pom.xml', 'build.gradle'];

      const fileExistanceMap = new Set((treeData.tree || []).map((n: { name: string }) => n.name));
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

        if (Object.keys(configFiles).length > 0) {
          setTechStack(detectTechStack(configFiles));
        }
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
        <header className="h-16 border-b border-white/5 bg-black flex items-center justify-between px-8">
          <Link href="/" className="flex items-center gap-4 group">
            <ArrowLeft className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Back to Home</span>
          </Link>
        </header>
        <ErrorDisplay error={error} onRetry={loadRepo} />
      </div>
    );
  }

  return (
    <main className="relative w-screen h-screen bg-black text-white overflow-hidden selection:bg-white selection:text-black font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_80%)] pointer-events-none" />

      {/* Cinematic Telemetry HUD Loader */}
      <AnimatePresence>
        {isLoading && <HUDLoader message={loadingMessage} />}
      </AnimatePresence>

      {/* Main Graph Canvas */}
      <div className="absolute inset-0 z-0">
        <RepoGraph sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} sidebarWidth={sidebarWidth} />
      </div>

      {/* Floating Glassmorphic HUD Command Header */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-4 inset-x-4 h-16 bg-black/50 backdrop-blur-2xl z-50 flex items-center justify-between px-6 border border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden"
      >
        {/* Holographic grid accents inside header */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none opacity-40 rounded-xl" />

        <div className="flex items-center gap-6 relative z-10">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center group-hover:border-white/40 hover:bg-white/5 transition-all">
              <ArrowLeft className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black tracking-[0.4em] text-white/30 uppercase leading-none mb-1">OBSERVATORY</span>
              <span className="text-xs font-black tracking-widest text-white uppercase leading-none">
                {owner} <span className="text-white/30 mx-0.5 font-light">/</span> {repo}
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-6 relative z-10">
          {/* Telemetry Matrix Panel (Compact edition) */}
          <div className="hidden md:flex items-center gap-4 border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 rounded-full select-none text-[8px] font-black tracking-[0.2em] text-white/70">
            <div className="flex items-center gap-2">
              <span className="text-white/30">NODES:</span>
              <span className="font-mono text-[10px] text-white font-bold"><SlotCounter value={nodes.length} /></span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-white/30">LINKS:</span>
              <span className="font-mono text-[10px] text-white font-bold"><SlotCounter value={edges.length} /></span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-all border border-white/[0.08] bg-white/[0.01] rounded-full"
          >
            {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
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
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: isMobile ? 'calc(100% - 32px)' : sidebarWidth }}
            className="absolute z-40 top-24 lg:top-28 bottom-6 right-4 lg:right-6 rounded-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div className="w-full h-full bg-black/65 backdrop-blur-3xl flex flex-col relative overflow-hidden">
              {/* Holographic grid accents inside sidebar */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-40" />

              {/* Technical Corner Brackets for Floating Sidebar */}
              <>
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20" />
              </>

              {/* Resize Handle (Hidden on Mobile) */}
              {!isMobile && (
                <div
                  onMouseDown={startResizing}
                  className={`absolute inset-y-0 left-0 w-1.5 cursor-ew-resize z-50 hover:bg-white/10 transition-colors ${isResizing ? 'bg-white/20' : ''}`}
                />
              )}

              {/* Internal Grid Accents */}
              <div className="absolute inset-y-0 left-10 w-[1px] bg-white/[0.01] pointer-events-none" />
              <div className="absolute inset-y-0 right-10 w-[1px] bg-white/[0.01] pointer-events-none" />

              {/* Tab Navigation */}
              <div className="flex border-b border-white/[0.05] relative z-10">
                {SIDEBAR_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSidebarTab(tab.key)}
                    className={`relative flex-1 flex flex-col items-center justify-center py-4 transition-all group ${sidebarTab === tab.key ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`}
                  >
                    <tab.icon className={`w-3.5 h-3.5 mb-2 transition-opacity ${sidebarTab === tab.key ? 'opacity-100' : 'opacity-20 group-hover:opacity-40'}`} />
                    <span className={`text-[8px] font-black uppercase tracking-[0.4em] transition-colors ${sidebarTab === tab.key ? 'text-white' : 'text-white/20'}`}>
                      {tab.label}
                    </span>
                    {sidebarTab === tab.key && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 inset-x-0 h-px bg-white/40" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-hidden relative z-10">
                <div className="h-full overflow-y-auto scrollbar-none px-4 py-6">
                  {sidebarTab === 'structure' && <FileTree />}
                  {sidebarTab === 'preview' && <FilePreview />}
                  {sidebarTab === 'stats' && <RepoStats />}
                </div>
              </div>

              {/* Metadata Footer */}
              <div className="h-12 border-t border-white/[0.05] bg-black/60 flex items-center justify-between px-10 relative z-10">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.4em]">Section::{sidebarTab}</span>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </main>
  );
}
