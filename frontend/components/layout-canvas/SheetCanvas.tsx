'use client';
import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';

export interface SheetItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
  label?: string;
  sublabel?: string;
  color?: string;
}

interface SheetCanvasProps {
  sheetWidth: number;  // mm
  sheetHeight: number; // mm
  items: SheetItem[];
  sheetLabel?: string;
}

const COLORS = [
  '#4f8cf7', '#f56c6c', '#67c23a', '#e6a23c', '#909399',
  '#b37feb', '#36cfc9', '#ff85c0', '#ffd666', '#5cdbd3',
];

export default function SheetCanvas({ sheetWidth, sheetHeight, items, sheetLabel }: SheetCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Scale to fit container while maintaining aspect ratio
    const maxCanvasWidth = containerWidth - 40;
    const maxCanvasHeight = Math.min(700, maxCanvasWidth * (sheetHeight / sheetWidth));
    const scale = Math.min(maxCanvasWidth / sheetWidth, maxCanvasHeight / sheetHeight);
    const canvasWidth = sheetWidth * scale;
    const canvasHeight = sheetHeight * scale;

  return (
    <div ref={containerRef} className="w-full">
      {sheetLabel && (
        <div className="text-sm font-semibold text-gray-700 mb-2">{sheetLabel}</div>
      )}
      <div className="relative bg-white border-2 border-gray-800 shadow-lg rounded-sm" style={{ width: canvasWidth, height: canvasHeight }}>
        <Stage width={canvasWidth} height={canvasHeight} scaleX={scale} scaleY={scale}>
          <Layer>
            {/* Sheet border */}
            <Rect x={0} y={0} width={sheetWidth} height={sheetHeight} stroke="#333" strokeWidth={2} />

            {/* Grid lines (every 100mm) */}
            {Array.from({ length: Math.floor(sheetWidth / 100) }, (_, i) => (
              <Line key={`v${i}`} {...({ points: [(i + 1) * 100, 0, (i + 1) * 100, sheetHeight], stroke: "#e5e7eb", strokeWidth: 0.5 } as any)} />
            ))}
            {Array.from({ length: Math.floor(sheetHeight / 100) }, (_, i) => (
              <Line key={`h${i}`} {...({ points: [0, (i + 1) * 100, sheetWidth, (i + 1) * 100], stroke: "#e5e7eb", strokeWidth: 0.5 } as any)} />
            ))}

            {/* Pieces */}
            {items.map((item, idx) => {
              const color = item.color || COLORS[idx % COLORS.length];
              const w = item.rotated ? item.h : item.w;
              const h = item.rotated ? item.w : item.h;

              return (
                <Group
                  key={item.id}
                  x={item.x}
                  y={item.y}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    const pos = stage?.getPointerPosition();
                    if (pos) {
                      setTooltip({
                        x: pos.x / scale,
                        y: pos.y / scale,
                        text: `${item.label || ''} ${item.sublabel ? `(${item.sublabel})` : ''}\n${Math.round(w)}x${Math.round(h)}mm${item.rotated ? ' (Xoay)' : ''}`
                      });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <Rect
                    x={0}
                    y={0}
                    width={w}
                    height={h}
                    fill={color}
                    stroke="#1f2937"
                    strokeWidth={1.5}
                    opacity={0.85}
                    cornerRadius={1}
                  />
                  <Text
                    x={2}
                    y={2}
                    width={w - 4}
                    height={h - 4}
                    text={item.label || ''}
                    fontSize={Math.min(12, Math.max(6, w / 15))}
                    fill="#fff"
                    fontStyle="bold"
                    wrap="none"
                    ellipsis
                  />
                  {h > 20 && (
                    <Text
                      x={2}
                      y={h > 30 ? 16 : 14}
                      width={w - 4}
                      height={h - 18}
                      text={`${Math.round(w)}x${Math.round(h)}`}
                      fontSize={Math.min(9, Math.max(5, w / 20))}
                      fill="#fff"
                      opacity={0.8}
                      wrap="none"
                      ellipsis
                    />
                  )}
                </Group>
              );
            })}
          </Layer>
        </Stage>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none z-10 whitespace-pre-line"
            style={{
              left: tooltip.x * scale + 10,
              top: tooltip.y * scale - 10,
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  );
}