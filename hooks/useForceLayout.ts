import { useEffect, useMemo, useRef } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  SimulationNodeDatum,
} from 'd3-force';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';

interface ForceNode extends SimulationNodeDatum {
  id: string;
}

export function useForceLayout({
  nodes,
  edges,
  strength = -300,
  distance = 100,
}: {
  nodes: Node[];
  edges: Edge[];
  strength?: number;
  distance?: number;
}) {
  const { setNodes } = useReactFlow();
  const initialized = useRef(false);

  // Convert nodes to d3 format
  const simNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      // Random initial scatter to prevent overlap
      x: node.position.x || Math.random() * 500 - 250,
      y: node.position.y || Math.random() * 500 - 250,
    })) as ForceNode[];
  }, [nodes]);

  // Convert edges to d3 format
  const simEdges = useMemo(() => {
    return edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));
  }, [edges]);

  useEffect(() => {
    if (!simNodes.length) return;

    // We only want to run the initial organic layout once per graph dataset
    if (initialized.current) return;
    initialized.current = true;

    const simulation = forceSimulation<ForceNode>(simNodes)
      .force(
        'link',
        forceLink(simEdges)
          .id((d: any) => d.id)
          .distance(distance)
      )
      .force('charge', forceManyBody().strength(strength))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide().radius(40)) // Prevent nodes from overlapping entirely
      .on('tick', () => {
        // Create a lookup map for faster access
        const nodePositions = new Map(simNodes.map(sn => [sn.id, { x: sn.x, y: sn.y }]));

        // On every tick of the physics engine, update React Flow node positions
        setNodes((nds) =>
          nds.map((n) => {
            if (n.dragging) return n; // Skip if user is dragging it
            
            const pos = nodePositions.get(n.id);
            if (pos) {
              return {
                ...n,
                position: { x: pos.x || 0, y: pos.y || 0 },
              };
            }
            return n;
          })
        );
      });

    // Clean up
    return () => {
      simulation.stop();
      initialized.current = false;
    };
  }, [simNodes, simEdges, setNodes, strength, distance]);
}
