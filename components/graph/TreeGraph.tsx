"use client";

import React, { useRef, useEffect, useMemo } from "react";
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
    const selectedRef = useRef<string | null>(selectedNodeId ?? null);

    // Sync selectedRef
    useEffect(() => {
        selectedRef.current = selectedNodeId ?? null;
    }, [selectedNodeId]);

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

    useEffect(() => {
        if (!rootData || !containerRef.current || !svgRef.current || !gRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const margin = { top: 40, right: 120, bottom: 40, left: 80 };
        const dx = 20; // vertical spacing
        const dy = 200; // horizontal spacing

        const tree = d3.tree<HierarchyNodeDatum>().nodeSize([dx, dy]);
        const diagonal = d3.linkHorizontal<d3.HierarchyPointLink<HierarchyNodeDatum>, d3.HierarchyPointNode<HierarchyNodeDatum>>()
            .x(d => d.y)
            .y(d => d.x);

        const svg = d3.select(svgRef.current);
        const g = d3.select(gRef.current);

        // Zoom behavior
        if (!zoomRef.current) {
            zoomRef.current = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.1, 4])
                .on("zoom", (event) => {
                    g.attr("transform", event.transform);
                });
            svg.call(zoomRef.current);

            // Initial transform to center the root perfectly
            const initialTransform = d3.zoomIdentity.translate(width / 4, height / 2).scale(1);
            svg.call(zoomRef.current.transform, initialTransform);
        }

        const root = d3.hierarchy<HierarchyNodeDatum>(rootData!, d => d.children) as D3Node;
        root.x0 = 0;
        root.y0 = 0;

        // Collapse all nodes past maxDepth by default
        root.descendants().forEach((d: any) => {
            if (d.depth >= (maxDepth || 1) && d.data.children) {
                d.data._collapsed = true;
            } else if (d.depth < (maxDepth || 1) && d.data.children) {
                d.data._collapsed = false;
            }
        });

        let i = 0;

        function update(source: D3Node) {
            // Compute the new tree layout.
            // We override the children accessor for the tree layout to respect the _collapsed state
            const treeRoot = d3.hierarchy<HierarchyNodeDatum>(rootData!, d => d._collapsed ? null : d.children) as D3Node;
            treeRoot.x0 = root.x0;
            treeRoot.y0 = root.y0;

            tree(treeRoot);

            // Map computed positions back to our main root descendants based on path
            const posMap = new Map();
            treeRoot.descendants().forEach(d => posMap.set(d.data.path, { x: d.x, y: d.y }));

            const nodes = root.descendants().filter(d => posMap.has(d.data.path));
            nodes.forEach(d => {
                const pos = posMap.get(d.data.path);
                d.x = pos.x;
                d.y = pos.y;
            });

            const links = treeRoot.links();

            // Update nodes
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
                        // Click on a file -> format as GraphNode and pass to onNodeClick
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

            // Add a glow filter for files
            const defs = svg.selectAll("defs").data([0]).join("defs");
            const filter = defs.selectAll("filter").data(["glow"]).join("filter").attr("id", "glow");
            filter.selectAll("feGaussianBlur").data([0]).join("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur");
            const feMerge = filter.selectAll("feMerge").data([0]).join("feMerge");
            feMerge.selectAll("feMergeNode").data(["coloredBlur", "SourceGraphic"]).join("feMergeNode").attr("in", d => d);

            // Nodes
            nodeEnter.append("circle")
                .attr("r", d => d.data.type === 'directory' ? 4 : 3)
                .attr("fill", d => {
                    if (d.data.type === 'directory') return d.data._collapsed ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)";
                    return getExtensionColor(d.data.extension || "").bg;
                })
                .attr("stroke", d => d.data.type === 'directory' ? "rgba(255,255,255,0.5)" : "none")
                .attr("stroke-width", 1)
                .attr("filter", d => d.data.type === 'file' ? "url(#glow)" : null);

            // Labels
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

            // Transition nodes to their new position.
            const nodeUpdate = node.merge(nodeEnter).transition().duration(400)
                .attr("transform", d => `translate(${d.y},${d.x})`)
                .attr("fill-opacity", 1)
                .attr("stroke-opacity", 1);

            // Highlight selected node
            nodeUpdate.select("text")
                .attr("fill", d => d.data.path === selectedRef.current ? "white" : (d.data.type === 'directory' ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)"));

            // Transition exiting nodes to the parent's new position.
            node.exit().transition().duration(400)
                .attr("transform", d => `translate(${source.y},${source.x})`)
                .attr("fill-opacity", 0)
                .attr("stroke-opacity", 0)
                .remove();

            // Update links
            // We use the treeRoot links because they represent the visible structure
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

            link.merge(linkEnter).transition().duration(400)
                .attr("d", diagonal as any);

            link.exit().transition().duration(400)
                .attr("d", d => {
                    const o = { x: source.x || 0, y: source.y || 0 };
                    return diagonal({ source: o, target: o } as any);
                })
                .remove();

            // Stash the old positions for transition.
            root.eachBefore((d: any) => {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        update(root);

        // Background click to deselect
        svg.on("click", () => {
            onNodeClick(null);
        });

    }, [rootData, onNodeClick, maxDepth]);

    // Update selection visually without resetting the layout
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
