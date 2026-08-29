'use client';

/**
 * FilePreview — Code viewer with syntax highlighting via highlight.js.
 * Loads file content lazily on node selection.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCode, Copy, Check, ExternalLink, Terminal,
  ZoomIn, ZoomOut, RotateCcw, Download, Image as ImageIcon, Grid
} from 'lucide-react';
import hljs from 'highlight.js/lib/core';

// Register common languages
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import json from 'highlight.js/lib/languages/json';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import markdown from 'highlight.js/lib/languages/markdown';
import yaml from 'highlight.js/lib/languages/yaml';
import bash from 'highlight.js/lib/languages/bash';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
hljs.registerLanguage('json', json);
hljs.registerLanguage('css', css);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('bash', bash);

import { useRepoStore } from '@/store/repoStore';

const EXT_TO_LANG: Record<string, string> = {
  js: 'javascript', jsx: 'javascript', mjs: 'javascript',
  ts: 'typescript', tsx: 'typescript', mts: 'typescript',
  py: 'python', rs: 'rust', go: 'go',
  java: 'java', kt: 'java',
  json: 'json', css: 'css', scss: 'css',
  html: 'html', htm: 'html', xml: 'xml',
  md: 'markdown', yml: 'yaml', yaml: 'yaml',
  sh: 'bash', bash: 'bash', zsh: 'bash',
};

import { formatBytes, getAspectRatio } from '@/lib/utils';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'avif']);

export default function FilePreview() {
  const selectedFilePath = useRepoStore((s) => s.selectedFilePath);
  const fileContent = useRepoStore((s) => s.fileContent);
  const isLoadingContent = useRepoStore((s) => s.isLoadingContent);
  const setFileContent = useRepoStore((s) => s.setFileContent);
  const owner = useRepoStore((s) => s.owner);
  const repo = useRepoStore((s) => s.repo);
  const metadata = useRepoStore((s) => s.metadata);

  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [fileMeta, setFileMeta] = useState<{ isImage?: boolean; downloadUrl?: string | null; size?: number }>({});

  // Image viewer state
  const [imgZoom, setImgZoom] = useState(1);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  const ext = selectedFilePath?.split('.').pop()?.toLowerCase() || '';
  const isImage = IMAGE_EXTENSIONS.has(ext);

  // Fetch file content when a file is selected
  useEffect(() => {
    if (!selectedFilePath || !owner || !repo) return;

    setImgZoom(1);
    setImgDimensions(null);

    const fetchContent = async () => {
      useRepoStore.setState({ isLoadingContent: true });
      try {
        const res = await fetch(
          `/api/file?owner=${owner}&repo=${repo}&path=${encodeURIComponent(selectedFilePath)}`
        );
        const data = await res.json();
        if (data.content) {
          setFileContent(data.content);
          setFileMeta({
            isImage: !!data.isImage,
            downloadUrl: data.downloadUrl || null,
            size: data.size,
          });
        } else {
          setFileContent('// Error: Unable to access file content');
        }
      } catch {
        setFileContent('// Error: Connection timeout');
      }
    };
    fetchContent();
  }, [selectedFilePath, owner, repo, setFileContent]);

  // Apply syntax highlighting for code files
  useEffect(() => {
    if (codeRef.current && fileContent && !isImage) {
      const lang = EXT_TO_LANG[ext];
      try {
        if (lang && hljs.getLanguage(lang)) {
          codeRef.current.innerHTML = hljs.highlight(fileContent, { language: lang }).value;
        } else {
          codeRef.current.textContent = fileContent;
        }
      } catch {
        codeRef.current.textContent = fileContent;
      }
    }
  }, [fileContent, selectedFilePath, isImage, ext]);

  const handleCopy = () => {
    if (fileContent) {
      navigator.clipboard.writeText(fileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!selectedFilePath) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-8 bg-black/40 px-10 text-center">
        <div className="w-16 h-16 border border-white/5 flex items-center justify-center relative bg-white/[0.01]">
          <Terminal className="w-5 h-5 text-white/5" />
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20">Protocol: Neutral</p>
          <p className="text-[8px] font-mono text-white/10 uppercase tracking-[0.4em]">Select target node for extraction</p>
        </div>
      </div>
    );
  }

  const githubUrl = metadata
    ? `${metadata.htmlUrl}/blob/${metadata.defaultBranch}/${selectedFilePath}`
    : '#';

  const rawUrl = fileMeta.downloadUrl || (metadata
    ? `https://raw.githubusercontent.com/${owner}/${repo}/${metadata.defaultBranch}/${selectedFilePath}`
    : fileContent || '#');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-black/60 backdrop-blur-xl"
    >
      {/* Extraction Header */}
      <div className="flex flex-col border-b border-white/5 bg-white/[0.02] shrink-0">
        <div className="flex items-center justify-between px-4 py-4 md:px-6 md:py-6">
          <div className="flex flex-col min-w-0 space-y-1">
            <span className="text-[7.5px] md:text-[9px] font-black tracking-[0.4em] md:tracking-[0.5em] text-white/40 uppercase">
              {isImage ? 'Media_Preview //' : 'Source_Extraction //'}
            </span>
            <span className="text-[11px] md:text-[13px] font-black text-white truncate uppercase tracking-[0.15em] md:tracking-[0.2em]">
              {selectedFilePath}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3 ml-3 md:ml-6 shrink-0">
            {isImage ? (
              <>
                <motion.a
                  whileHover={{ backgroundColor: 'rgba(255,255,255,1)', color: '#000000' }}
                  whileTap={{ scale: 0.95 }}
                  href={fileContent || rawUrl}
                  download={selectedFilePath.split('/').pop()}
                  className="w-8 h-8 md:w-10 md:h-10 border border-white/10 flex items-center justify-center text-white/40 hover:text-black transition-all bg-black/40 rounded"
                  title="Download Image"
                >
                  <Download className="w-3.5 h-3.5" />
                </motion.a>
                <motion.a
                  whileHover={{ backgroundColor: 'rgba(255,255,255,1)', color: '#000000' }}
                  whileTap={{ scale: 0.95 }}
                  href={rawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 md:w-10 md:h-10 border border-white/10 flex items-center justify-center text-white/40 hover:text-black transition-all bg-black/40 rounded"
                  title="View Raw / Full Size"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </motion.a>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,1)', color: '#000000' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="w-8 h-8 md:w-10 md:h-10 border border-white/10 flex items-center justify-center text-white/30 transition-all bg-black/40 rounded"
                  title="Copy Code"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </motion.button>
                <motion.a
                  whileHover={{ backgroundColor: 'rgba(255,255,255,1)', color: '#000000' }}
                  whileTap={{ scale: 0.95 }}
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 md:w-10 md:h-10 border border-white/10 flex items-center justify-center text-white/30 transition-all bg-black/40 rounded"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </motion.a>
              </>
            )}
          </div>
        </div>

        <div className="px-4 py-2 md:px-6 bg-white/[0.01] border-t border-white/[0.03] flex flex-wrap items-center justify-between gap-3 md:gap-6">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-white/40 shadow-[0_0_5px_rgba(255,255,255,0.4)]" />
              <span className="text-[8px] md:text-[9px] font-mono text-white/40 uppercase tracking-widest">
                {isImage ? `Format: ${ext.toUpperCase()}` : 'Protocol: Active'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[8px] md:text-[9px] font-mono text-white/40 uppercase tracking-widest">
                {isImage && fileMeta.size ? `Size: ${formatBytes(fileMeta.size)}` : 'Encoding: UTF-8'}
              </span>
            </div>
          </div>

          {/* Image Toolbar */}
          {isImage && !isLoadingContent && fileContent && (
            <div className="flex items-center gap-1.5 border border-white/[0.08] bg-black/50 px-2 py-1 rounded-lg">
              <button
                onClick={() => setImgZoom((z) => Math.max(0.25, z - 0.25))}
                className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-[8px] font-mono font-bold text-white/80 w-8 text-center select-none">
                {Math.round(imgZoom * 100)}%
              </span>
              <button
                onClick={() => setImgZoom((z) => Math.min(4, z + 0.25))}
                className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
              <button
                onClick={() => setImgZoom(1)}
                className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`w-5 h-5 flex items-center justify-center transition-colors ${showGrid ? 'text-white' : 'text-white/20 hover:text-white/50'}`}
                title="Toggle Transparency Grid"
              >
                <Grid className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto scrollbar-thin relative selection:bg-white selection:text-black">
        {isLoadingContent ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 md:p-8 space-y-4 md:space-y-6"
          >
            {[1, 0.85, 0.9, 0.6, 0.75, 0.5, 0.85].map((w, i) => (
              <div
                key={i}
                className="h-2 bg-white/5 animate-pulse rounded"
                style={{ width: `${w * 100}%` }}
              />
            ))}
          </motion.div>
        ) : isImage ? (
          /* Rich Holographic Image Viewer */
          <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Checkerboard transparency backdrop */}
            <div
              className={`w-full max-w-lg min-h-[220px] max-h-[70vh] rounded-xl border border-white/[0.08] flex items-center justify-center p-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.8)] ${showGrid
                  ? 'bg-[linear-gradient(45deg,#121214_25%,transparent_25%),linear-gradient(-45deg,#121214_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#121214_75%),linear-gradient(-45deg,transparent_75%,#121214_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] bg-zinc-950/80'
                  : 'bg-black/80'
                }`}
            >
              {fileContent ? (
                <motion.img
                  key={selectedFilePath}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: imgZoom }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  src={fileContent}
                  alt={selectedFilePath}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setImgDimensions({
                      width: img.naturalWidth,
                      height: img.naturalHeight,
                    });
                  }}
                  className="max-w-full max-h-[50vh] object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] transition-transform duration-200 select-none rounded"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-white/30">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                  <span className="text-[9px] font-mono uppercase tracking-widest">Image unavailable</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Code Viewer with Line Numbers */
          <div className="flex min-h-full">
            <div className="py-4 md:py-10 px-2 md:px-4 text-right bg-white/[0.01] border-r border-white/5 select-none min-w-[36px] md:min-w-[50px]">
              {fileContent?.split('\n').map((_, i) => (
                <div key={i} className="text-[9px] md:text-[11px] font-mono text-white/10 leading-[1.8] md:leading-[2.2]">
                  {(i + 1).toString().padStart(2, '0')}
                </div>
              ))}
            </div>

            <motion.pre
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="flex-1 p-4 py-4 md:p-10 text-[10px] md:text-[12px] leading-[1.8] md:leading-[2.2] font-mono overflow-x-auto"
            >
              <code ref={codeRef} className="text-white/70 block">
                {fileContent || ''}
              </code>
            </motion.pre>
          </div>
        )}
      </div>

      {/* Technical Telemetry Footer */}
      <div className="px-4 py-3 md:px-6 md:py-4 border-t border-white/5 flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center justify-between bg-white/[0.01] shrink-0">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {isImage && imgDimensions ? (
            <>
              <span className="text-[8px] md:text-[9px] font-mono text-white/60 uppercase tracking-[0.2em]">
                {imgDimensions.width} × {imgDimensions.height} PX
              </span>
              <div className="hidden sm:block w-1 h-1 bg-white/20" />
              <span className="text-[8px] md:text-[9px] font-mono text-white/40 uppercase tracking-[0.2em]">
                Ratio: {getAspectRatio(imgDimensions.width, imgDimensions.height)}
              </span>
            </>
          ) : (
            <>
              <span className="text-[8px] md:text-[9px] font-mono text-white/40 uppercase tracking-[0.3em] md:tracking-[0.4em]">Checksum: 0x92AF</span>
              <div className="hidden sm:block w-1 h-1 bg-white/20" />
              <span className="text-[8px] md:text-[9px] font-mono text-white/40 uppercase tracking-[0.3em] md:tracking-[0.4em]">Entropy_Stable</span>
            </>
          )}
        </div>
        <span className="text-[8px] md:text-[9px] font-mono text-white/30 uppercase tracking-[0.3em] md:tracking-[0.4em]">
          {isImage ? 'RENDER_MODE: BITMAP_SURFACE' : 'Sync Level: 1.0'}
        </span>
      </div>
    </motion.div>
  );
}
