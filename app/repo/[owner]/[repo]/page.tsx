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
import LoadingState from '@/components/ui/LoadingState';
import ErrorDisplay from '@/components/ui/ErrorBoundary';
import { useRepoStore } from '@/store/repoStore';
import { detectTechStack } from '@/lib/detectStack';
import SlotCounter from '@/components/ui/SlotCounter';

const SIDEBAR_TABS = [
  { key: 'structure' as const, label: 'Structure', icon: FolderTree },
  { key: 'preview' as const, label: 'Preview', icon: FileCode },
  { key: 'stats' as const, label: 'Stats', icon: BarChart3 },
];

export default function RepoPage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const {
    metadata, isLoading, error, sidebarTab,
    setRepo, setMetadata, setFileTree, setLanguages,
    setContributors, setTechStack, setSidebarTab,
    setLoading, setError, reset,
    nodes, edges
  } = useRepoStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);

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
    setLoading(true, 'Initializing...');

    try {
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

      setLoading(true, 'Mapping files...');
      const treeRes = await fetch(`/api/tree?owner=${owner}&repo=${repo}`);
      if (!treeRes.ok) throw new Error('Failed to index file tree');
      const treeData = await treeRes.json();
      setFileTree(treeData.tree || []);

      setLoading(true, 'Analyzing dependencies...');
      try {
        const parseRes = await fetch(`/api/parse?owner=${owner}&repo=${repo}&branch=${metaData.metadata.defaultBranch}`);
        if (parseRes.ok) {
          const parseData = await parseRes.json();
          useRepoStore.setState({ importEdges: parseData.edges || [] });
        }
      } catch (err) {
        console.warn('Dependency mapping failed', err);
      }

      // Tech stack detection
      const configFiles: Record<string, string> = {};
      const configNames = ['package.json', 'requirements.txt', 'Cargo.toml', 'go.mod', 'pom.xml', 'build.gradle'];
      for (const name of configNames) {
        const exists = (treeData.tree || []).some(
          (n: { name: string; type: string }) => n.name === name && n.type === 'file'
        );
        if (exists) {
          try {
            const fileRes = await fetch(`/api/file?owner=${owner}&repo=${repo}&path=${encodeURIComponent(name)}`);
            if (fileRes.ok) {
              const fileData = await fileRes.json();
              configFiles[name] = fileData.content;
            }
          } catch { /* skip */ }
        }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden">
        <LoadingState message={useRepoStore.getState().loadingMessage} />
      </div>
    );
  }

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

      {/* Background Depth & Architectural Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_80%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      />

      {/* Main Graph Canvas */}
      <div className="absolute inset-0 z-0">
        <RepoGraph sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} sidebarWidth={sidebarWidth} />
      </div>

      {/* Floating Command Bar */}
      <header className="absolute top-0 inset-x-0 h-16 bg-black/40 backdrop-blur-xl z-50 flex items-center justify-between px-10 border-b border-white/[0.05]">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-6 group">
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/40 transition-all">
              <ArrowLeft className="w-3.5 h-3.5 text-white/30 group-hover:text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black tracking-[0.6em] text-white/40 uppercase">Observatory</span>
              <span className="text-sm font-black tracking-widest text-white uppercase">
                {owner} <span className="text-white/40 mx-0.5">/</span> {repo}
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-10">
          {/* Telemetry Matrix */}
          <div className="hidden lg:flex items-center gap-10 border-x border-white/5 px-10 h-16">
            <div className="flex flex-col">
              <span className="text-[8px] font-black tracking-[0.4em] text-white/40 uppercase mb-0.5">Structure_Nodes</span>
              <span className="text-sm font-mono tracking-tighter text-white/80"><SlotCounter value={nodes.length} /></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black tracking-[0.4em] text-white/40 uppercase mb-0.5">Connection_Links</span>
              <span className="text-sm font-mono tracking-tighter text-white/80"><SlotCounter value={edges.length} /></span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-all border border-white/5 rounded-full"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </motion.button>
        </div>
      </header>

      {/* Structural Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: sidebarWidth }}
            className="absolute inset-y-0 right-0 z-40 pt-16"
          >
            <div className="w-full h-full bg-black/80 backdrop-blur-3xl border-l border-white/[0.05] flex flex-col relative overflow-hidden">

              {/* Resize Handle */}
              <div
                onMouseDown={startResizing}
                className={`absolute inset-y-0 left-0 w-1.5 cursor-ew-resize z-50 hover:bg-white/10 transition-colors ${isResizing ? 'bg-white/20' : ''}`}
              />

              {/* Internal Grid Accents */}
              <div className="absolute inset-y-0 left-10 w-[1px] bg-white/[0.02] pointer-events-none" />
              <div className="absolute inset-y-0 right-10 w-[1px] bg-white/[0.02] pointer-events-none" />

              {/* Tab Navigation */}
              <div className="flex border-b border-white/[0.05]">
                {SIDEBAR_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSidebarTab(tab.key)}
                    className={`relative flex-1 flex flex-col items-center justify-center py-6 transition-all group ${sidebarTab === tab.key ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`}
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

              {/* Tab Body */}
              <div className="flex-1 overflow-hidden relative">
                <div className="h-full overflow-y-auto scrollbar-none px-6 py-8">
                  {sidebarTab === 'structure' && <FileTree />}
                  {sidebarTab === 'preview' && <FilePreview />}
                  {sidebarTab === 'stats' && <RepoStats />}
                </div>
              </div>

              {/* Metadata Footer */}
              <div className="h-12 border-t border-white/[0.05] bg-black/60 flex items-center justify-between px-10">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" />
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.4em]">Section::{sidebarTab}</span>
                </div>
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">GitNode_Observatory_v1.0</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </main>
  );
}
