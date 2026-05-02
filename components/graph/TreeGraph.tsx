"use client";

import React, { useRef, useEffect, useMemo, useCallback } from "react";
import * as d3 from "d3";
import type { FileTreeNode, GraphNode } from "@/types";
import { getExtensionColor } from "@/types";

export interface TreeGraphProps {
    fileTree: FileTreeNode[];
    onNodeClick: (node: GraphNode | null) => void;
    selectedNodeId?: string | null;
    maxDepth?: number;
}

interface HierarchyNodeDatum extends FileTreeNode {
    _collapsed?: boolean;
}

interface D3Node extends d3.HierarchyPointNode<HierarchyNodeDatum> {
    x0?: number;
    y0?: number;
}

export default function TreeGraph({ fileTree, onNodeClick, selectedNodeId, maxDepth }: TreeGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const gRef = useRef<SVGGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const rootRef = useRef<D3Node | null>(null);

    // Convert FileTree to a single root if needed
    const rootData = useMemo(() => {
        if (fileTree.length === 0) return null;
        if (fileTree.length === 1) return fileTree[0];
        return {
            name: "Root",
            path: "root",
            type: "directory",
            children: fileTree,
            sha: "root",
        } as FileTreeNode;
    }, [fileTree]);

    // Update function (internal D3 logic)
    const update = useCallback((source: D3Node) => {
        if (!rootRef.current || !gRef.current || !svgRef.current) return;

        const g = d3.select(gRef.current);
        const svg = d3.select(svgRef.current);
        const tree = d3.tree<HierarchyNodeDatum>().nodeSize([20, 200]);
        const diagonal = d3.linkHorizontal<d3.HierarchyPointLink<HierarchyNodeDatum>, d3.HierarchyPointNode<HierarchyNodeDatum>>()
            .x(d => d.y)
            .y(d => d.x);

        const root = rootRef.current;

        // Compute new tree layout
        const treeRoot = d3.hierarchy<HierarchyNodeDatum>(root.data, d => d._collapsed ? null : d.children) as D3Node;
        treeRoot.x0 = root.x0;
        treeRoot.y0 = root.y0;

        tree(treeRoot);

        const posMap = new Map();
        treeRoot.descendants().forEach(d => posMap.set(d.data.path, { x: d.x, y: d.y }));

        const nodes = root.descendants().filter(d => posMap.has(d.data.path));
        nodes.forEach(d => {
            const pos = posMap.get(d.data.path);
            d.x = pos.x;
            d.y = pos.y;
        });

        const links = treeRoot.links();
        let i = 0;

        // Nodes
        const node = g.selectAll<SVGGElement, D3Node>("g.node")
            .data(nodes, d => d.data.path || (d.data.path = `node-${++i}`));

        const nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${source.y0 || 0},${source.x0 || 0})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0)
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                event.stopPropagation();
                if (d.data.type === 'directory') {
                    d.data._collapsed = !d.data._collapsed;
                    update(d);
                } else {
                    const colors = getExtensionColor(d.data.extension || "");
                    const graphNode: GraphNode = {
                        id: d.data.path,
                        type: "cyber",
                        position: { x: d.y || 0, y: d.x || 0 },
                        data: {
                            label: d.data.name,
                            filePath: d.data.path,
                            extension: d.data.extension || "",
                            size: d.data.size,
                            type: "file",
                            color: colors.bg,
                            glowColor: colors.glow
                        }
                    };
                    onNodeClick(graphNode);
                }
            });

        // Glow Filter
        const defs = svg.selectAll("defs").data([0]).join("defs");
        const filter = defs.selectAll("filter").data(["glow"]).join("filter").attr("id", "glow");
        filter.selectAll("feGaussianBlur").data([0]).join("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur");
        const feMerge = filter.selectAll("feMerge").data([0]).join("feMerge");
        feMerge.selectAll("feMergeNode").data(["coloredBlur", "SourceGraphic"]).join("feMergeNode").attr("in", d => d);

        nodeEnter.append("circle")
            .attr("r", d => d.data.type === 'directory' ? 4 : 3)
            .attr("fill", d => {
                if (d.data.type === 'directory') return d.data._collapsed ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)";
                return getExtensionColor(d.data.extension || "").bg;
            })
            .attr("stroke", d => d.data.type === 'directory' ? "rgba(255,255,255,0.5)" : "none")
            .attr("stroke-width", 1)
            .attr("filter", d => d.data.type === 'file' ? "url(#glow)" : null);

        nodeEnter.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.data.children ? -8 : 8)
            .attr("text-anchor", d => d.data.children ? "end" : "start")
            .text(d => d.data.name)
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "10px")
            .style("font-weight", d => d.data.type === 'directory' ? "800" : "400")
            .style("letter-spacing", "0.05em")
            .attr("fill", d => d.data.type === 'directory' ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)")
            .clone(true).lower()
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .attr("stroke", "black");

        const nodeUpdate = node.merge(nodeEnter).transition().duration(400)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1);

        nodeUpdate.select("text")
            .attr("fill", d => d.data.path === selectedNodeId ? "white" : (d.data.type === 'directory' ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)"));

        node.exit().transition().duration(400)
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0)
            .remove();

        // Links
        const link = g.selectAll<SVGPathElement, d3.HierarchyPointLink<HierarchyNodeDatum>>("path.link")
            .data(links, d => d.target.data.path || "");

        const linkEnter = link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", d => {
                const o = { x: source.x0 || 0, y: source.y0 || 0 };
                return diagonal({ source: o, target: o } as any);
            })
            .attr("fill", "none")
            .attr("stroke", "rgba(255,255,255,0.15)")
            .attr("stroke-width", 1);

        link.merge(linkEnter).transition().duration(400).attr("d", diagonal as any);

        link.exit().transition().duration(400)
            .attr("d", d => {
                const o = { x: source.x || 0, y: source.y || 0 };
                return diagonal({ source: o, target: o } as any);
            })
            .remove();

        root.eachBefore((d: any) => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }, [onNodeClick, selectedNodeId]);

    // 1. Initial Setup (Zoom & Refs)
    useEffect(() => {
        if (!svgRef.current || !gRef.current || !containerRef.current) return;

        const svg = d3.select(svgRef.current);
        const g = d3.select(gRef.current);
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        if (!zoomRef.current) {
            zoomRef.current = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.1, 4])
                .on("zoom", (event) => {
                    g.attr("transform", event.transform);
                });
            svg.call(zoomRef.current);

            // Initial position
            const initialTransform = d3.zoomIdentity.translate(width / 4, height / 2).scale(1);
            svg.call(zoomRef.current.transform, initialTransform);
        }

        svg.on("click", () => onNodeClick(null));
    }, [onNodeClick]);

    // 2. Data Initialization & Filter Update
    useEffect(() => {
        if (!rootData) return;
        
        // Always recreate hierarchy from rootData to ensure fresh state
        const root = d3.hierarchy<HierarchyNodeDatum>(rootData, d => d.children) as D3Node;
        root.x0 = 0;
        root.y0 = 0;
        rootRef.current = root;
        
        // Apply maxDepth filters
        root.descendants().forEach((d: any) => {
            if (d.depth >= (maxDepth || 1) && d.data.children) {
                d.data._collapsed = true;
            } else if (d.depth < (maxDepth || 1) && d.data.children) {
                d.data._collapsed = false;
            }
        });

        update(root);
    }, [rootData, update, maxDepth]);

    // 3. Selection Visual Update (No layout change)
    useEffect(() => {
        if (!gRef.current) return;
        const g = d3.select(gRef.current);
        g.selectAll("g.node").select("text")
            .attr("fill", (d: any) => d.data.path === selectedNodeId ? "white" : (d.data.type === 'directory' ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)"));
    }, [selectedNodeId]);

    return (
        <div ref={containerRef} className="w-full h-full bg-black selection:bg-none relative">
            <svg ref={svgRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing">
                <g ref={gRef}></g>
            </svg>
        </div>
    );
}
