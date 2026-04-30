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
  type: string;
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

const nodeR = (n: SimNode) => Math.max(4, Math.min(16, 4 + Math.sqrt(n.connections) * 2.5));

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
      color: '#ffffff',
      glowColor: 'rgba(255,255,255,0.1)',
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
        .id(d => d.id).distance(150).strength(0.1))
      .force("charge", d3.forceManyBody<SimNode>().strength(-300).distanceMax(800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<SimNode>().radius(d => nodeR(d) + 30).strength(0.8))
      .alphaDecay(0.015)
      .velocityDecay(0.4);

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
      const activeId = selectedId ?? hovered?.id ?? null;
      const neighbors = activeId ? (adjacencyRef.current.get(activeId) ?? new Set<string>()) : new Set<string>();

      const rawMx = (parallaxTarget.current.x / -0.05) + width / 2;
      const rawMy = (parallaxTarget.current.y / -0.05) + height / 2;
      const mx = (rawMx - t.x - parallaxCurrent.current.x) / t.k;
      const my = (rawMy - t.y - parallaxCurrent.current.y) / t.k;

      // Draw links
      linksRef.current.forEach(link => {
        const sx = link.source.x!, sy = link.source.y!;
        const tx = link.target.x!, ty = link.target.y!;
        if (!isFinite(sx) || !isFinite(sy) || !isFinite(tx) || !isFinite(ty)) return;

        const isHighlit = activeId && (link.source.id === activeId || link.target.id === activeId);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        
        if (isHighlit) {
          ctx.globalAlpha = 1;
          const grad = ctx.createLinearGradient(sx, sy, tx, ty);
          grad.addColorStop(0, "rgba(255,255,255,0.02)");
          grad.addColorStop(0.5, "rgba(255,255,255,0.25)");
          grad.addColorStop(1, "rgba(255,255,255,0.02)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2;
        } else {
          ctx.globalAlpha = activeId ? 0.002 : 0.015;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 0.4;
        }
        ctx.stroke();
        ctx.restore();

        // Ethereal Particle effect
        if (isHighlit || (!activeId && Math.random() < 0.003)) {
            const time = Date.now();
            const speed = isHighlit ? 0.001 : 0.0003;
            const progress = (time * speed + (link.source.id.charCodeAt(0) * 0.2)) % 1;
            const px = sx + (tx - sx) * progress;
            const py = sy + (ty - sy) * progress;
            
            ctx.save();
            ctx.globalAlpha = isHighlit ? 0.8 : 0.15;
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = isHighlit ? 8 : 0;
            ctx.shadowColor = "white";
            ctx.beginPath();
            ctx.arc(px, py, isHighlit ? 1 : 0.6, 0, Math.PI * 2);
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

        ctx.save();
        ctx.globalAlpha = activeId ? (isActive ? 1 : isNeighbor ? 0.6 : 0.02) : 0.6;

        // Zen glow for active nodes
        if (isActive) {
          const glowR = r * 6;
          const glow = ctx.createRadialGradient(x, y, r, x, y, glowR);
          glow.addColorStop(0, "rgba(255,255,255,0.12)");
          glow.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Minimal node core
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        
        const brightness = Math.min(100, 50 + node.connections * 3);
        ctx.fillStyle = isSelected ? "#ffffff" : isHovered ? "#ffffff" : `rgba(255,255,255,${brightness/100})`;
        ctx.fill();

        // Minimal labels
        if (isActive || (t.k > 1.2 && node.connections >= 2) || (t.k > 0.6 && node.connections >= 8)) {
            const labelY = y + r + 16 / t.k;
            ctx.font = `900 ${10 / t.k}px Inter, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            
            if (isActive) {
                const labelText = node.label.toUpperCase();
                const tw = ctx.measureText(labelText).width;
                const padH = 10 / t.k;
                const padV = 5 / t.k;
                
                // Pure white label background
                ctx.fillStyle = "white";
                ctx.fillRect(x - tw/2 - padH, labelY - padV, tw + padH*2, (10/t.k) + padV*2);
                
                // Minimal label text
                ctx.fillStyle = "black";
                ctx.fillText(labelText, x, labelY);
            } else {
                ctx.fillStyle = "rgba(255,255,255,0.5)";
                ctx.fillText(node.label.toUpperCase(), x, labelY);
            }
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
      mCtx.fillStyle = "rgba(0,0,0,0.9)";
      mCtx.fillRect(0, 0, mW, mH);

      const ns = nodesRef.current;
      if (ns.length === 0) return;
      const xs = ns.map(n => n.x!), ys = ns.map(n => n.y!);
      const minX = Math.min(...xs) - 200, maxX = Math.max(...xs) + 200;
      const minY = Math.min(...ys) - 200, maxY = Math.max(...ys) + 200;
      const sc = Math.min(mW / (maxX - minX), mH / (maxY - minY)) * 0.9;
      const ox = (mW - (maxX - minX) * sc) / 2;
      const oy = (mH - (maxY - minY) * sc) / 2;

      mCtx.fillStyle = "#ffffff";
      mCtx.globalAlpha = 0.3;
      ns.forEach(n => {
        mCtx.beginPath();
        mCtx.arc((n.x! - minX) * sc + ox, (n.y! - minY) * sc + oy, 0.8, 0, Math.PI * 2);
        mCtx.fill();
      });

      const t = transformRef.current;
      const vpX = (-t.x / t.k - minX) * sc + ox;
      const vpY = (-t.y / t.k - minY) * sc + oy;
      const vpW = (width / t.k) * sc;
      const vpH = (height / t.k) * sc;
      mCtx.strokeStyle = "rgba(255,255,255,0.2)";
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

    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.05, 10])
      .on("zoom", e => { transformRef.current = e.transform; });

    d3.select(canvas).call(zoom);

    function hitTest(e: MouseEvent): SimNode | null {
      const rect = canvas!.getBoundingClientRect();
      const t = transformRef.current;
      const mx = (e.clientX - rect.left - t.x - parallaxCurrent.current.x) / t.k;
      const my = (e.clientY - rect.top - t.y - parallaxCurrent.current.y) / t.k;
      for (let i = nodesRef.current.length - 1; i >= 0; i--) {
        const n = nodesRef.current[i];
        const r = nodeR(n) + 16 / t.k;
        if ((mx - n.x!) ** 2 + (my - n.y!) ** 2 < r * r) return n;
      }
      return null;
    }

    let dragNode: SimNode | null = null;

    function onMouseDown(e: MouseEvent) {
      const n = hitTest(e);
      if (!n) return;
      dragNode = n;
      n.fx = n.x; n.fy = n.y;
      sim.alphaTarget(0.3).restart();
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      parallaxTarget.current = { x: (mx - width / 2) * -0.02, y: (my - height / 2) * -0.02 };

      if (dragNode) {
        const t = transformRef.current;
        dragNode.fx = (mx - t.x - parallaxCurrent.current.x) / t.k;
        dragNode.fy = (my - t.y - parallaxCurrent.current.y) / t.k;
        return;
      }
      hoveredRef.current = hitTest(e);
      canvas!.style.cursor = hoveredRef.current ? "pointer" : "crosshair";
    }

    function onMouseUp() {
      if (dragNode) {
        dragNode.fx = null; dragNode.fy = null;
        dragNode = null;
        sim.alphaTarget(0);
      }
    }

    function onClick(e: MouseEvent) {
      const n = hitTest(e);
      onNodeClick(n ? n.originalNode : null);
    }

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
    canvas.addEventListener("click", onClick);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      sim.stop();
      ro.disconnect();
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
      canvas.removeEventListener("click", onClick);
    };
  }, [simNodes, simLinks, adjacency]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-black selection:bg-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      {/* Cinematic Minimap */}
      <div className="absolute bottom-8 left-8 z-20 border border-white/10 bg-black/80 backdrop-blur-xl">
        <canvas ref={minimapRef} width={200} height={120} className="block" />
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-t border-white/5" />
      </div>
    </div>
  );
}
