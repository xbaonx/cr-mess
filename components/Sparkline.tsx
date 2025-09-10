import React, { useMemo } from 'react';

type Props = {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  colorUp?: string;
  colorDown?: string;
  up?: boolean; // optional override for color
  className?: string;
};

export default function Sparkline({
  data,
  width = 600,
  height = 120,
  strokeWidth = 2,
  colorUp = '#34d399',
  colorDown = '#f87171',
  up,
  className,
}: Props) {
  const { path, min, max } = useMemo(() => {
    const n = data.length;
    if (!n) return { path: '', min: 0, max: 0 };
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const v of data) {
      if (isFinite(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    if (!isFinite(min) || !isFinite(max) || min === max) {
      // flat line fallback
      const mid = height / 2;
      const step = width / Math.max(1, n - 1);
      let d = `M 0 ${mid}`;
      for (let i = 1; i < n; i++) d += ` L ${i * step} ${mid}`;
      return { path: d, min: 0, max: 0 };
    }
    const step = width / Math.max(1, n - 1);
    const scaleY = (v: number) => {
      const t = (v - min) / (max - min);
      return height - t * height; // invert y
    };
    let d = `M 0 ${scaleY(data[0])}`;
    for (let i = 1; i < n; i++) {
      d += ` L ${i * step} ${scaleY(data[i])}`;
    }
    return { path: d, min, max };
  }, [data, height, width]);

  const isUp = useMemo(() => {
    if (typeof up === 'boolean') return up;
    if (!data || data.length < 2) return true;
    return data[data.length - 1] >= data[0];
  }, [data, up]);

  const color = isUp ? colorUp : colorDown;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-label="sparkline">
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
