'use client';

/**
 * RepoStats — Technical monochromatic repository diagnostics.
 */

import React, { useMemo } from 'react';
import {
  Star, GitFork, Eye, Bug
} from 'lucide-react';
import { useRepoStore } from '@/store/repoStore';
import { motion } from 'framer-motion';
import { formatNumber } from '@/lib/utils';

export default function RepoStats() {
  const metadata = useRepoStore((s) => s.metadata);
  const languages = useRepoStore((s) => s.languages);
  const contributors = useRepoStore((s) => s.contributors);
  const techStack = useRepoStore((s) => s.techStack);

  const langData = useMemo(() => {
    const total = Object.values(languages).reduce((s, v) => s + v, 0);
    if (!total) return [];

    const COLORS = [
      '#00F2FF', // Cyan
      '#FF0055', // Rose
      '#7000FF', // Purple
      '#FFB800', // Amber
      '#00FF85', // Spring Green
      '#FF4D00', // Orange
      '#0066FF', // Blue
      '#ADFF00', // Lime
    ];

    return Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, bytes], i) => ({
        name,
        value: bytes,
        percent: ((bytes / total) * 100).toFixed(1),
        color: COLORS[i % COLORS.length],
      }));
  }, [languages]);

  if (!metadata) return null;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full scrollbar-thin bg-black/40 backdrop-blur-md select-none">
      {/* Identity Section */}
      <div className="space-y-3 pt-1 px-1">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={metadata.owner.avatarUrl}
              alt={metadata.owner.login}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <span className="text-[7.5px] font-mono font-bold tracking-[0.25em] text-white/40 uppercase block">Project Info</span>
            <h3 className="text-base font-bold text-white uppercase tracking-wider truncate leading-tight">{metadata.name}</h3>
            <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest">{metadata.owner.login}</p>
          </div>
        </div>

        {metadata.description && (
          <p className="text-[10px] text-white/60 leading-relaxed font-mono border-l-2 border-white/20 pl-2.5 line-clamp-3">
            {metadata.description}
          </p>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        <MetricItem icon={<Star className="w-3 h-3 text-amber-400" />} label="Stars" value={formatNumber(metadata.stars)} />
        <MetricItem icon={<GitFork className="w-3 h-3 text-blue-400" />} label="Forks" value={formatNumber(metadata.forks)} />
        <MetricItem icon={<Eye className="w-3 h-3 text-emerald-400" />} label="Watchers" value={formatNumber(metadata.watchers)} />
        <MetricItem icon={<Bug className="w-3 h-3 text-rose-400" />} label="Issues" value={formatNumber(metadata.openIssues)} />
      </div>

      {/* Language Breakdown */}
      {langData.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono font-bold tracking-[0.2em] text-white/40 uppercase">Languages</span>
            <span className="text-[8px] font-mono text-white/30">{langData.length} detected</span>
          </div>

          <div className="space-y-2">
            {langData.map((lang) => (
              <div key={lang.name} className="space-y-1 group/item">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: lang.color, boxShadow: `0 0 6px ${lang.color}60` }}
                    />
                    <span className="text-white/70 group-hover/item:text-white transition-colors">{lang.name}</span>
                  </div>
                  <span className="text-white/40">{lang.percent}%</span>
                </div>
                <div className="h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${lang.percent}%` }}
                    transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: lang.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tech Stack */}
      {techStack.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
          <span className="text-[8px] font-mono font-bold tracking-[0.2em] text-white/40 uppercase block">Tech Stack</span>
          <div className="flex flex-wrap gap-1.5">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className="px-2 py-1 rounded border border-white/[0.08] bg-white/[0.02] text-white/60 flex items-center gap-1.5 hover:bg-white/[0.05] hover:text-white transition-all text-[8.5px] font-mono"
              >
                <span className="font-semibold">{tech.name}</span>
                {tech.version && (
                  <span className="text-[7.5px] text-white/30">v{tech.version}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Contributors */}
      {contributors.length > 0 && (
        <div className="space-y-2.5 pt-2 pb-4 border-t border-white/[0.06]">
          <span className="text-[8px] font-mono font-bold tracking-[0.2em] text-white/40 uppercase block">Contributors</span>
          <div className="space-y-1.5">
            {contributors.slice(0, 5).map((c) => (
              <a
                key={c.login}
                href={c.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] transition-all group"
              >
                <div className="w-6 h-6 rounded border border-white/10 overflow-hidden shrink-0">
                  <img
                    src={c.avatarUrl}
                    alt={c.login}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-white/60 group-hover:text-white transition-colors truncate">{c.login}</span>
                  <span className="text-[8px] font-mono text-white/30">{c.contributions} commits</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-mono text-white/40 uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="text-lg font-mono font-bold text-white tracking-tight">{value}</div>
    </div>
  );
}


