import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface KpiSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string; // hsl reference, e.g. "hsl(var(--primary))"
  fill?: string;
  className?: string;
}

/**
 * KpiSparkline — tiny inline sparkline used inside StatTile.
 * Pure SVG, no library, no animation.
 */
export const KpiSparkline = ({
  data,
  width = 96,
  height = 32,
  stroke = "hsl(var(--primary))",
  fill = "hsl(var(--primary) / 0.12)",
  className,
}: KpiSparklineProps) => {
  const { path, area } = useMemo(() => {
    if (!data.length) return { path: "", area: "" };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = data.length > 1 ? width / (data.length - 1) : width;
    const points = data.map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return [x, y] as const;
    });
    const path = points.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(" ");
    const area = `${path} L ${width} ${height} L 0 ${height} Z`;
    return { path, area };
  }, [data, width, height]);

  if (!data.length) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      className={cn("block", className)}
      aria-hidden
    >
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default KpiSparkline;
