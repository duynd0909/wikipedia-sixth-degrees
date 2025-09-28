'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GraphData, GraphNode, GraphEdge } from '@/types/wikipedia';

interface GraphVisualizationProps {
  graphData: GraphData;
  width?: number;
  height?: number;
}

interface Position {
  x: number;
  y: number;
}

export function GraphVisualization({
  graphData,
  width = 800,
  height = 600,
}: GraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, Position>>(new Map());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (graphData.nodes.length === 0) return;

    const positions = new Map<string, Position>();

    // Simple layout algorithm: arrange nodes by depth in concentric circles
    const nodesByDepth = new Map<number, GraphNode[]>();
    let maxDepth = 0;

    // Group nodes by depth
    graphData.nodes.forEach(node => {
      if (!nodesByDepth.has(node.depth)) {
        nodesByDepth.set(node.depth, []);
      }
      nodesByDepth.get(node.depth)!.push(node);
      maxDepth = Math.max(maxDepth, node.depth);
    });

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 50;

    // Position nodes in concentric circles
    nodesByDepth.forEach((nodes, depth) => {
      const radius = depth === 0 ? 0 : (depth / maxDepth) * maxRadius;
      const angleStep = nodes.length > 1 ? (2 * Math.PI) / nodes.length : 0;

      nodes.forEach((node, index) => {
        let x, y;

        if (depth === 0) {
          // Center node
          x = centerX;
          y = centerY;
        } else {
          // Nodes on circle
          const angle = index * angleStep;
          x = centerX + radius * Math.cos(angle);
          y = centerY + radius * Math.sin(angle);
        }

        positions.set(node.id, { x, y });
      });
    });

    setNodePositions(positions);
  }, [graphData, width, height]);

  const getNodeColor = (node: GraphNode): string => {
    if (node.isStart) return '#10b981'; // green
    if (node.isEnd) return '#ef4444'; // red
    if (node.isInPath) return '#3b82f6'; // blue
    return '#6b7280'; // gray
  };

  const getEdgeColor = (edge: GraphEdge): string => {
    return edge.isInPath ? '#3b82f6' : '#374151';
  };

  const getEdgeWidth = (edge: GraphEdge): number => {
    return edge.isInPath ? 3 : 1;
  };

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
        <p className="text-gray-400">No graph data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Connection Graph</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-300">Start</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-300">End</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-300">Path</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span className="text-gray-300">Explored</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-gray-700">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="bg-gray-900"
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Render edges first */}
          {graphData.edges.map((edge, index) => {
            const sourcePos = nodePositions.get(edge.source);
            const targetPos = nodePositions.get(edge.target);

            if (!sourcePos || !targetPos) return null;

            return (
              <line
                key={`edge-${index}`}
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke={getEdgeColor(edge)}
                strokeWidth={getEdgeWidth(edge)}
                opacity={edge.isInPath ? 0.9 : 0.3}
              />
            );
          })}

          {/* Render nodes */}
          {graphData.nodes.map((node) => {
            const position = nodePositions.get(node.id);
            if (!position) return null;

            const radius = node.isInPath ? 8 : 6;
            const strokeWidth = node.isInPath ? 3 : 2;

            return (
              <g key={node.id}>
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={radius}
                  fill={getNodeColor(node)}
                  stroke={hoveredNode === node.id ? '#ffffff' : getNodeColor(node)}
                  strokeWidth={strokeWidth}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                />

                {/* Node labels - show for path nodes or on hover */}
                {(node.isInPath || hoveredNode === node.id) && (
                  <text
                    x={position.x}
                    y={position.y - radius - 8}
                    textAnchor="middle"
                    className="fill-white text-xs font-medium pointer-events-none"
                    style={{ fontSize: '10px' }}
                  >
                    {node.title.length > 20 ? `${node.title.slice(0, 17)}...` : node.title}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {hoveredNode && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <p className="text-white font-medium">
            {graphData.nodes.find(n => n.id === hoveredNode)?.title}
          </p>
          <p className="text-gray-300 text-sm">
            Depth: {graphData.nodes.find(n => n.id === hoveredNode)?.depth}
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-700 p-3 rounded">
          <p className="text-gray-300">Total Nodes</p>
          <p className="text-white font-semibold text-lg">{graphData.nodes.length}</p>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <p className="text-gray-300">Total Connections</p>
          <p className="text-white font-semibold text-lg">{graphData.edges.length}</p>
        </div>
      </div>
    </div>
  );
}