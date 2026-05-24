"use client";

import React, { useRef, useEffect, useMemo } from "react";
import * as d3 from "d3";
import type { GraphNode as RepoGraphNode, GraphEdge } from "@/types";

export interface ConstellationGraphProps {
  nodes: RepoGraphNode[];
  edges: GraphEdge[];
  onNodeClick: (node: RepoGraphNode | null) => void;
  selectedNodeId?: string | null;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type?: string;
  color: string;
  glowColor: string;
  connections: number;
  originalNode: RepoGraphNode;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: SimNode;
  target: SimNode;
  edgeType: string;
}

const nodeR = (n: SimNode) => Math.max(5, Math.min(18, 5 + Math.sqrt(n.connections) * 2.2));

export default function ConstellationGraph({ nodes: repoNodes, edges: repoEdges, onNodeClick, selectedNodeId }: ConstellationGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);

  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const transformRef = useRef(d3.zoomIdentity);
  const hoveredRef = useRef<SimNode | null>(null);
  const selectedRef = useRef<string | null>(selectedNodeId ?? null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const adjacencyRef = useRef<Map<string, Set<string>>>(new Map());
  const parallaxTarget = useRef({ x: 0, y: 0 });
  const parallaxCurrent = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const dragNodeRef = useRef<SimNode | null>(null);

  // Sync selectedRef
  useEffect(() => {
    selectedRef.current = selectedNodeId ?? null;
  }, [selectedNodeId]);

  // Convert Repo nodes to Sim nodes
  const { simNodes, simLinks, adjacency } = useMemo(() => {
    const connCount = new Map<string, number>();
    repoEdges.forEach(l => {
      connCount.set(l.source, (connCount.get(l.source) ?? 0) + 1);
      connCount.set(l.target, (connCount.get(l.target) ?? 0) + 1);
    });

    const sNodes: SimNode[] = repoNodes.map(n => ({
      id: n.id,
      label: n.data.label,
      type: n.type,
      color: (n.data as any).color || '#3b82f6',
      glowColor: (n.data as any).glowColor || 'rgba(59,130,246,0.15)',
      connections: connCount.get(n.id) ?? 0,
      originalNode: n,
    }));

    const nodeMap = new Map(sNodes.map(n => [n.id, n]));

    const sLinks: SimLink[] = repoEdges
      .filter(l => nodeMap.has(l.source) && nodeMap.has(l.target))
      .map(l => ({
        source: nodeMap.get(l.source)!,
        target: nodeMap.get(l.target)!,
        edgeType: l.data?.edgeType || 'local'
      }));

    const adj = new Map<string, Set<string>>();
    sLinks.forEach(l => {
      const s = l.source.id; const t = l.target.id;
      if (!adj.has(s)) adj.set(s, new Set());
      if (!adj.has(t)) adj.set(t, new Set());
      adj.get(s)!.add(t);
      adj.get(t)!.add(s);
    });

    return { simNodes: sNodes, simLinks: sLinks, adjacency: adj };
  }, [repoNodes, repoEdges]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const minimap = minimapRef.current;
    if (!container || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    nodesRef.current = simNodes;
    linksRef.current = simLinks;
    adjacencyRef.current = adjacency;

    // ── Force simulation ──
    const sim = d3.forceSimulation<SimNode>(simNodes)
      .force("link", d3.forceLink<SimNode, SimLink>(simLinks)
        .id(d => d.id)
        .distance(110)
        .strength(0.35))
      .force("charge", d3.forceManyBody<SimNode>().strength(-200).distanceMax(900))
      // Stable anchor forces pulling back to viewport center
      .force("x", d3.forceX(width / 2).strength(0.06))
      .force("y", d3.forceY(height / 2).strength(0.06))
      .force("collision", d3.forceCollide<SimNode>().radius(d => nodeR(d) + 16).strength(0.75))
      .alphaDecay(0.012)
      .velocityDecay(0.36);

    simRef.current = sim;

    const ctx = canvas.getContext("2d")!;

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      ctx.save();

      parallaxCurrent.current.x += (parallaxTarget.current.x - parallaxCurrent.current.x) * 0.05;
      parallaxCurrent.current.y += (parallaxTarget.current.y - parallaxCurrent.current.y) * 0.05;

      const t = transformRef.current;
      ctx.translate(t.x + parallaxCurrent.current.x, t.y + parallaxCurrent.current.y);
      ctx.scale(t.k, t.k);

      const hovered = hoveredRef.current;
      const selectedId = selectedRef.current;
      const dragNode = dragNodeRef.current;
      const activeId = dragNode?.id ?? selectedId ?? hovered?.id ?? null;
      const neighbors = activeId ? (adjacencyRef.current.get(activeId) ?? new Set<string>()) : new Set<string>();

      // Draw links
      linksRef.current.forEach(link => {
        const sx = link.source.x!, sy = link.source.y!;
        const tx = link.target.x!, ty = link.target.y!;
        const isHighlit = activeId && (link.source.id === activeId || link.target.id === activeId);

        // Viewport culling optimization for links to skip offscreen lines
        const sScreenX = sx * t.k + t.x + parallaxCurrent.current.x;
        const sScreenY = sy * t.k + t.y + parallaxCurrent.current.y;
        const tScreenX = tx * t.k + t.x + parallaxCurrent.current.x;
        const tScreenY = ty * t.k + t.y + parallaxCurrent.current.y;

        const sxOut = sScreenX < 0 || sScreenX > width || sScreenY < 0 || sScreenY > height;
        const txOut = tScreenX < 0 || tScreenX > width || tScreenY < 0 || tScreenY > height;

        if (!isHighlit && sxOut && txOut) return;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);

        if (isHighlit) {
          ctx.globalAlpha = 1;
          const grad = ctx.createLinearGradient(sx, sy, tx, ty);
          grad.addColorStop(0, link.source.color);
          grad.addColorStop(1, link.target.color);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2.0;
        } else {
          ctx.globalAlpha = activeId ? 0.03 : 0.16;
          ctx.strokeStyle = "rgba(255,255,255,0.2)";
          ctx.lineWidth = 0.8;
        }
        ctx.stroke();
        ctx.restore();

        // Glowing Synaptic energy pulse particle along active connection
        if (isHighlit || (!activeId && Math.random() < 0.005)) {
          const time = Date.now();
          const speed = isHighlit ? 0.0012 : 0.0004;
          const progress = (time * speed + (link.source.id.charCodeAt(0) * 0.15)) % 1;
          const px = sx + (tx - sx) * progress;
          const py = sy + (ty - sy) * progress;

          ctx.save();
          ctx.globalAlpha = isHighlit ? 1.0 : 0.5;
          ctx.fillStyle = isHighlit ? link.source.color : "#ffffff";
          ctx.beginPath();
          ctx.arc(px, py, isHighlit ? 1.6 : 0.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw nodes
      nodesRef.current.forEach(node => {
        if (!isFinite(node.x!) || !isFinite(node.y!)) return;

        const x = node.x!, y = node.y!;
        const r = nodeR(node);
        const isHovered = hovered?.id === node.id;
        const isSelected = selectedId === node.id;
        const isActive = isHovered || isSelected;
        const isNeighbor = !!activeId && neighbors.has(node.id);

        // Viewport culling optimization for nodes to skip offscreen files
        const screenX = x * t.k + t.x + parallaxCurrent.current.x;
        const screenY = y * t.k + t.y + parallaxCurrent.current.y;
        const pad = (isActive ? r * 5 : r) * t.k;

        if (
          !isActive &&
          (screenX + pad < 0 ||
            screenX - pad > width ||
            screenY + pad < 0 ||
            screenY - pad > height)
        ) {
          return;
        }

        ctx.save();
        ctx.globalAlpha = activeId ? (isActive ? 1 : isNeighbor ? 0.85 : 0.07) : 0.8;

        // Custom glow ring mapping to the node's file-type color
        if (isActive) {
          const glowR = r * 5;
          const glow = ctx.createRadialGradient(x, y, r, x, y, glowR);
          glow.addColorStop(0, `${node.color}35`);
          glow.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Sleek color node core
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Selected/Hover border ring
        if (isSelected) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2.0;
          ctx.stroke();
        } else if (isHovered) {
          ctx.strokeStyle = "rgba(255,255,255,0.75)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Clean monospace label - always visible
        const fontSize = Math.max(7, Math.min(13, 9 / t.k));
        const labelY = y + r + Math.max(6, 10 / t.k);
        ctx.font = `500 ${fontSize}px Inter, Monaco, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        if (isActive) {
          const labelText = node.label;
          const tw = ctx.measureText(labelText).width;
          const padH = 6 / t.k;
          const padV = 3 / t.k;

          // Slate dark simple tooltip background
          ctx.fillStyle = "rgba(9, 9, 11, 0.95)";
          ctx.strokeStyle = "rgba(255,255,255,0.12)";
          ctx.lineWidth = 1 / t.k;

          const rx = x - tw / 2 - padH;
          const ry = labelY - padV;
          const rw = tw + padH * 2;
          const rh = (10 / t.k) + padV * 2;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(rx, ry, rw, rh, 4 / t.k);
          } else {
            ctx.rect(rx, ry, rw, rh);
          }
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.fillText(labelText, x, labelY);
        } else {
          // Highly readable soft grey text for standard nodes
          ctx.fillStyle = "rgba(161, 161, 170, 0.85)"; // text-zinc-400
          ctx.fillText(node.label, x, labelY);
        }

        ctx.restore();
      });

      ctx.restore();
      drawMinimap();
    }

    function drawMinimap() {
      if (!minimap) return;
      const mCtx = minimap.getContext("2d")!;
      const mW = minimap.width, mH = minimap.height;
      mCtx.clearRect(0, 0, mW, mH);
      mCtx.fillStyle = "rgba(0,0,0,0.92)";
      mCtx.fillRect(0, 0, mW, mH);

      const ns = nodesRef.current;
      if (ns.length === 0) return;
      const xs = ns.map(n => n.x!), ys = ns.map(n => n.y!);
      const minX = Math.min(...xs) - 200, maxX = Math.max(...xs) + 200;
      const minY = Math.min(...ys) - 200, maxY = Math.max(...ys) + 200;
      const sc = Math.min(mW / (maxX - minX), mH / (maxY - minY)) * 0.9;
      const ox = (mW - (maxX - minX) * sc) / 2;
      const oy = (mH - (maxY - minY) * sc) / 2;

      mCtx.globalAlpha = 0.45;
      ns.forEach(n => {
        mCtx.fillStyle = n.color;
        mCtx.beginPath();
        mCtx.arc((n.x! - minX) * sc + ox, (n.y! - minY) * sc + oy, 0.9, 0, Math.PI * 2);
        mCtx.fill();
      });

      const t = transformRef.current;
      const vpX = (-t.x / t.k - minX) * sc + ox;
      const vpY = (-t.y / t.k - minY) * sc + oy;
      const vpW = (width / t.k) * sc;
      const vpH = (height / t.k) * sc;
      mCtx.strokeStyle = "rgba(255,255,255,0.15)";
      mCtx.lineWidth = 0.5;
      mCtx.strokeRect(vpX, vpY, vpW, vpH);
    }

    let running = true;
    function loop() {
      if (!running) return;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    function hitTest(e: any): SimNode | null {
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const t = transformRef.current;
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);

      const mx = (clientX - rect.left - t.x - parallaxCurrent.current.x) / t.k;
      const my = (clientY - rect.top - t.y - parallaxCurrent.current.y) / t.k;
      for (let i = nodesRef.current.length - 1; i >= 0; i--) {
        const n = nodesRef.current[i];
        const r = nodeR(n) + 12 / t.k;
        if ((mx - n.x!) ** 2 + (my - n.y!) ** 2 < r * r) return n;
      }
      return null;
    }

    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.05, 10])
      .filter((e) => {
        // Stop D3 Zoom from dragging the viewport if we are grabbing a node
        if (e.type === "mousedown" || e.type === "touchstart" || e.type === "pointerdown") {
          const hit = hitTest(e);
          return !hit;
        }
        return !e.button;
      })
      .on("zoom", e => { transformRef.current = e.transform; });

    d3.select(canvas).call(zoom);

    let hasDragged = false;
    let startX = 0;
    let startY = 0;

    function onPointerDown(e: PointerEvent) {
      const n = hitTest(e);
      if (!n) return;
      dragNodeRef.current = n;
      n.fx = n.x; n.fy = n.y;
      startX = e.clientX;
      startY = e.clientY;
      hasDragged = false;
      sim.alphaTarget(0.3).restart(); // High alpha keeps physics active
    }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Update mouse position for dynamic parallax shifts
      parallaxTarget.current = { x: (mx - width / 2) * -0.015, y: (my - height / 2) * -0.015 };

      if (dragNodeRef.current) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (dx * dx + dy * dy > 16) { // 4px distance threshold
          hasDragged = true;
        }
        const t = transformRef.current;
        dragNodeRef.current.fx = (mx - t.x - parallaxCurrent.current.x) / t.k;
        dragNodeRef.current.fy = (my - t.y - parallaxCurrent.current.y) / t.k;

        // Push small alpha changes on pointer motion to keep springs active
        sim.alpha(0.2).restart();
        return;
      }
      hoveredRef.current = hitTest(e);
      canvas!.style.cursor = hoveredRef.current ? "pointer" : "crosshair";
    }

    function onPointerUp() {
      if (dragNodeRef.current) {
        dragNodeRef.current.fx = null;
        dragNodeRef.current.fy = null;
        dragNodeRef.current = null;
        sim.alphaTarget(0); // Let it cool down to relaxation
      }
    }

    function onPointerClick(e: PointerEvent) {
      if (hasDragged) return; // Prevent selection changes if dragging was triggered
      const n = hitTest(e);
      onNodeClick(n ? n.originalNode : null);
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
    canvas.addEventListener("click", onPointerClick as any);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      sim.stop();
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      canvas.removeEventListener("click", onPointerClick as any);
    };
  }, [simNodes, simLinks, adjacency]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-black selection:bg-none">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Cinematic Minimap */}
      <div className="absolute bottom-8 left-8 z-20 border border-white/10 bg-black/80 backdrop-blur-xl rounded-lg overflow-hidden">
        <canvas ref={minimapRef} width={200} height={120} className="block" />
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-t border-white/5" />
      </div>
    </div>
  );
}
