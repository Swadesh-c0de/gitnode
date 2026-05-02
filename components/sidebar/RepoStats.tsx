'use client';

/**
 * RepoStats — Technical monochromatic repository diagnostics.
 */

import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import {
  Star, GitFork, Eye, Bug, Scale, Calendar, HardDrive, Users, Activity
} from 'lucide-react';
import { useRepoStore } from '@/store/repoStore';
import { motion } from 'framer-motion';

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
    <div className="flex flex-col gap-8 p-6 overflow-y-auto h-full scrollbar-thin bg-black/40 backdrop-blur-md">
      {/* Premium Identity Section */}
      <div className="space-y-6 pt-2 px-1">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="absolute -inset-2 border border-white/5 animate-pulse" />
            <div className="w-16 h-16 border border-white/10 flex items-center justify-center bg-white/[0.02] relative z-10">
              <img
                src={metadata.owner.avatarUrl}
                alt={metadata.owner.login}
                className="w-12 h-12 opacity-100 object-cover shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white/5 border border-white/10 flex items-center justify-center">
              <div className="w-1 h-1 bg-white/20" />
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <span className="text-[9px] font-black tracking-[0.5em] text-white/40 uppercase block mb-1">Project Info</span>
            <h3 className="text-xl font-black text-white uppercase tracking-[0.1em] truncate leading-tight">{metadata.name}</h3>
            <p className="text-[11px] font-mono text-white/40 uppercase tracking-[0.4em]">{metadata.owner.login}</p>
          </div>
        </div>

        {metadata.description && (
          <p className="text-[12px] text-white/60 leading-relaxed font-black uppercase tracking-[0.1em] italic border-l border-white/20 pl-4">
            {metadata.description}
          </p>
        )}
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Technical Metrics Grid */}
      <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5">
        <MetricItem icon={<Star className="w-3 h-3" />} label="Stars" value={formatNum(metadata.stars)} />
        <MetricItem icon={<GitFork className="w-3 h-3" />} label="Forks" value={formatNum(metadata.forks)} />
        <MetricItem icon={<Eye className="w-3 h-3" />} label="Watchers" value={formatNum(metadata.watchers)} />
        <MetricItem icon={<Bug className="w-3 h-3" />} label="Issues" value={formatNum(metadata.openIssues)} />
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Language Density Analysis */}
      {langData.length > 0 && (
        <div className="space-y-10 px-2 py-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <span className="text-[9px] font-black tracking-[0.4em] text-white/40 uppercase">Languages</span>
            <span className="text-[9px] font-mono text-white/10">{langData.length} Types</span>
          </div>

          <div className="h-48 w-full relative group">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-center">
                <span className="text-[9px] font-black text-white/10 block uppercase tracking-[0.4em] mb-1">Codebase</span>
                <span className="text-2xl font-black text-white/40 tracking-tighter tabular-nums">Total</span>
              </div>
            </div>
            <div className="relative w-full h-full flex items-center justify-center mx-auto">
                  <PieChart width={300} height={220}>
                    <Pie
                      data={langData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {langData.map((entry) => (
                        <Cell 
                            key={entry.name} 
                            fill={entry.color} 
                            fillOpacity={0.4}
                            className="outline-none hover:fill-opacity-100 transition-all cursor-crosshair" 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="px-6 py-4 bg-black/90 border border-white/20 backdrop-blur-xl shadow-2xl">
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] block mb-2">{d.name}</span>
                            <div className="flex flex-col gap-1">
                                <span className="text-[12px] font-mono text-white/80">{d.percent}% Share</span>
                                <span className="text-[9px] font-mono text-white/20">{formatNum(d.value)} Bytes</span>
                            </div>
                          </div>
                        );
                      }}
                      cursor={{ fill: 'transparent' }}
                    />
                  </PieChart>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 pt-4">
            {langData.map((lang) => (
              <div key={lang.name} className="flex flex-col gap-3 group/item">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div 
                        className="w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentColor]" 
                        style={{ color: lang.color, backgroundColor: lang.color }} 
                    />
                    <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] group-hover/item:text-white transition-colors">{lang.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/10 group-hover/item:text-white/40">{formatNum(lang.value)}B</span>
                </div>
                <div className="h-[2px] w-full bg-white/[0.02] overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${lang.percent}%` }}
                    transition={{ duration: 1.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full relative z-10"
                    style={{ backgroundColor: lang.color, opacity: 0.4 }}
                  />
                  <div className="absolute inset-0 bg-white/[0.02]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tech Stack Signature */}
      {techStack.length > 0 && (
        <div className="space-y-6">
          <span className="text-[8px] font-black tracking-[0.4em] text-white/20 uppercase border-b border-white/5 block pb-4">Technologies</span>
          <div className="flex flex-wrap gap-3">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className="px-4 py-2 border border-white/5 bg-white/[0.01] text-white/40 flex items-center gap-3 hover:bg-white/[0.03] transition-all group"
              >
                <span className="text-[9px] font-black uppercase tracking-[0.2em] group-hover:text-white transition-colors">{tech.name}</span>
                {tech.version && (
                  <span className="text-[8px] font-mono text-white/10">v.{tech.version}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contributors Matrix */}
      {contributors.length > 0 && (
        <div className="space-y-6 pb-12">
          <span className="text-[8px] font-black tracking-[0.4em] text-white/20 uppercase border-b border-white/5 block pb-4">Contributors</span>
          <div className="grid grid-cols-1 gap-px bg-white/5 border border-white/5">
            {contributors.slice(0, 5).map((c) => (
              <a
                key={c.login}
                href={c.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-5 p-4 bg-black hover:bg-white/[0.02] transition-all group"
              >
                <div className="w-8 h-8 border border-white/5 bg-white/[0.01] flex items-center justify-center overflow-hidden">
                  <img
                    src={c.avatarUrl}
                    alt={c.login}
                    className="w-full h-full opacity-80 group-hover:opacity-100 transition-all object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block group-hover:text-white transition-colors truncate">{c.login}</span>
                  <span className="text-[8px] font-mono text-white/10">{c.contributions} Commits</span>
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
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-3 p-5 bg-black group hover:bg-white/[0.01] transition-all relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-white/0 group-hover:bg-white/10 transition-all" />
      <span className="text-[9px] font-black tracking-[0.4em] text-white/40 uppercase group-hover:text-white/60 transition-colors">{label}</span>
      <div className="text-2xl font-light text-white tabular-nums tracking-widest leading-none group-hover:scale-105 transition-transform origin-left">{value}</div>
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}
