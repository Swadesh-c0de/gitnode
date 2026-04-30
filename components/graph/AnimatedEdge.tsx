import React from 'react';
import { getBezierPath, BaseEdge, type EdgeProps } from '@xyflow/react';

export default function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isExternal = data?.edgeType === 'external';
  const color = selected ? '#3b82f6' : isExternal ? '#8b5cf6' : '#64748b';
  const opacity = selected ? 1 : 0.4;
  const strokeWidth = selected ? 3 : 1;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: color,
          opacity,
          strokeWidth,
          strokeDasharray: isExternal ? '4 4' : undefined,
          transition: 'all 0.3s ease',
        }}
      />
      {/* Animated glowing particle along the edge */}
      <circle r={selected ? "4" : "2"} fill={color} filter="drop-shadow(0 0 4px currentColor)">
        <animateMotion
          dur={isExternal ? "3s" : "2s"}
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>
    </>
  );
}
