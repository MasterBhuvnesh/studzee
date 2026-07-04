'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';

// ponytail: force-graph is a canvas lib with heavy generics that the dynamic()
// wrapper drops; a permissive cast avoids fighting them for a handful of callbacks.
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
}) as unknown as ComponentType<Record<string, unknown>>;

const COLORS: Record<string, string> = {
  'system-design': '#7c5cff',
  devops: '#ef7d3b',
};

type GraphNode = {
  id: string;
  title: string;
  path: string;
  x?: number;
  y?: number;
};

export function TopicGraph() {
  const data = useQuery(api.blogs.graph);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const height = 440;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Clone so the lib can freely attach x/y; memoize so it doesn't re-simulate every render.
  const graphData = useMemo(
    () =>
      data
        ? {
            nodes: data.nodes.map((n) => ({ ...n })),
            links: data.links.map((l) => ({ ...l })),
          }
        : { nodes: [], links: [] },
    [data]
  );

  return (
    <div ref={ref} style={{ height }} className="w-full">
      {data === undefined ? (
        <Skeleton className="h-full w-full" />
      ) : (
        <ForceGraph2D
          width={width}
          height={height}
          graphData={graphData}
          backgroundColor="rgba(0,0,0,0)"
          nodeRelSize={5}
          linkColor={() => 'rgba(255,255,255,0.12)'}
          linkWidth={1}
          nodeLabel={(n: GraphNode) => n.title}
          onNodeClick={(n: GraphNode) => router.push(`/blog/${n.id}`)}
          cooldownTicks={100}
          nodeCanvasObject={(
            n: GraphNode,
            ctx: CanvasRenderingContext2D,
            scale: number
          ) => {
            ctx.beginPath();
            ctx.arc(n.x ?? 0, n.y ?? 0, 5, 0, 2 * Math.PI);
            ctx.fillStyle = COLORS[n.path] ?? '#888';
            ctx.fill();
            const fontSize = Math.max(10 / scale, 2);
            ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = 'rgba(255,255,255,0.78)';
            ctx.fillText(n.title, n.x ?? 0, (n.y ?? 0) + 7);
          }}
          nodePointerAreaPaint={(
            n: GraphNode,
            color: string,
            ctx: CanvasRenderingContext2D
          ) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(n.x ?? 0, n.y ?? 0, 8, 0, 2 * Math.PI);
            ctx.fill();
          }}
        />
      )}
    </div>
  );
}
