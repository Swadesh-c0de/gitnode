'use client';

/**
 * FilePreview — Code viewer with syntax highlighting via highlight.js.
 * Loads file content lazily on node selection.
 */

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileCode, Copy, Check, ExternalLink, Terminal } from 'lucide-react';
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
  html: 'html', htm: 'html', xml: 'xml', svg: 'xml',
  md: 'markdown', yml: 'yaml', yaml: 'yaml',
  sh: 'bash', bash: 'bash', zsh: 'bash',
};

export default function FilePreview() {
  const selectedFilePath = useRepoStore((s) => s.selectedFilePath);
  const fileContent = useRepoStore((s) => s.fileContent);
  const isLoadingContent = useRepoStore((s) => s.isLoadingContent);
  const setFileContent = useRepoStore((s) => s.setFileContent);
  const owner = useRepoStore((s) => s.owner);
  const repo = useRepoStore((s) => s.repo);
  const metadata = useRepoStore((s) => s.metadata);
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Fetch file content when a file is selected
  useEffect(() => {
    if (!selectedFilePath || !owner || !repo) return;

    const fetchContent = async () => {
      useRepoStore.setState({ isLoadingContent: true });
      try {
        const res = await fetch(
          `/api/file?owner=${owner}&repo=${repo}&path=${encodeURIComponent(selectedFilePath)}`
        );
        const data = await res.json();
        if (data.content) {
          setFileContent(data.content);
        } else {
          setFileContent('// Error: Unable to access file content');
        }
      } catch {
        setFileContent('// Error: Connection timeout');
      }
    };
    fetchContent();
  }, [selectedFilePath, owner, repo, setFileContent]);

  // Apply syntax highlighting
  useEffect(() => {
    if (codeRef.current && fileContent) {
      const ext = selectedFilePath?.split('.').pop() || '';
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
  }, [fileContent, selectedFilePath]);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-black/60 backdrop-blur-xl"
    >
      {/* Zen Extraction Header */}
      <div className="flex flex-col border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between px-6 py-6">
            <div className="flex flex-col min-w-0 space-y-1.5">
                <span className="text-[9px] font-black tracking-[0.5em] text-white/40 uppercase">Source_Extraction //</span>
                <span className="text-[13px] font-black text-white truncate uppercase tracking-[0.2em]">{selectedFilePath}</span>
            </div>
            <div className="flex items-center gap-4 ml-6">
            <motion.button
                whileHover={{ backgroundColor: 'rgba(255,255,255,1)', color: '#000000' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="w-10 h-10 border border-white/10 flex items-center justify-center text-white/30 transition-all bg-black/40"
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
                className="w-10 h-10 border border-white/10 flex items-center justify-center text-white/30 transition-all bg-black/40"
                title="View on GitHub"
            >
                <ExternalLink className="w-3.5 h-3.5" />
            </motion.a>
            </div>
        </div>
        <div className="px-6 py-2 bg-white/[0.01] border-t border-white/[0.03] flex items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-white/40 shadow-[0_0_5px_rgba(255,255,255,0.4)]" />
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Protocol: Active</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Encoding: UTF-8</span>
            </div>
        </div>
      </div>

      {/* Code viewer with line numbers */}
      <div className="flex-1 overflow-auto scrollbar-thin relative selection:bg-white selection:text-black">
        {isLoadingContent ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 space-y-6"
          >
            {[1, 0.85, 0.9, 0.6, 0.75, 0.5, 0.85].map((w, i) => (
              <div
                key={i}
                className="h-2 bg-white/5 animate-pulse"
                style={{ width: `${w * 100}%` }}
              />
            ))}
          </motion.div>
        ) : (
          <div className="flex min-h-full">
            {/* Line Numbers */}
            <div className="py-10 px-4 text-right bg-white/[0.01] border-r border-white/5 select-none min-w-[50px]">
                {fileContent?.split('\n').map((_, i) => (
                    <div key={i} className="text-[11px] font-mono text-white/10 leading-[2.2]">
                        {(i + 1).toString().padStart(2, '0')}
                    </div>
                ))}
            </div>
            
            {/* Code Content */}
            <motion.pre
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="flex-1 p-10 py-10 text-[12px] leading-[2.2] font-mono overflow-x-auto"
            >
                <code ref={codeRef} className="text-white/70 block">
                {fileContent || ''}
                </code>
            </motion.pre>
          </div>
        )}
      </div>
      
      {/* Technical Footer */}
      <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-[0.4em]">Artifact_Checksum: 0x92AF</span>
            <div className="w-1 h-1 bg-white/20" />
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-[0.4em]">Entropy_Stable</span>
          </div>
          <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.4em]">Sync Level: 1.0</span>
      </div>
    </motion.div>
  );
}
