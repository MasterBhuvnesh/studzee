import { cn } from '@/lib';
import type { PathSlug } from '@/constants/paths';

// Tiled fractal-noise texture, layered over the gradient for a bit of grain.
const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Glow = { color: string; x: number; y: number; size: number };

// Per-path palettes tuned to the reference art:
//   System Design — cyan highlight → royal blue → near-black navy
//   DevOps        — cream top → warm orange → deep maroon/black
const PALETTES: Record<PathSlug, { base: string; glows: Glow[] }> = {
  'system-design': {
    base: '#04060d',
    glows: [
      { color: 'hsla(206, 96%, 62%, 0.95)', x: 14, y: 24, size: 60 },
      { color: 'hsla(222, 92%, 50%, 0.90)', x: 44, y: 54, size: 64 },
      { color: 'hsla(230, 85%, 20%, 0.85)', x: 84, y: 84, size: 55 },
    ],
  },
  devops: {
    base: '#0a0604',
    glows: [
      { color: 'hsla(34, 48%, 90%, 0.90)', x: 50, y: 8, size: 52 },
      { color: 'hsla(23, 92%, 55%, 0.95)', x: 60, y: 46, size: 60 },
      { color: 'hsla(12, 78%, 18%, 0.90)', x: 16, y: 92, size: 58 },
    ],
  },
};

/** Deterministic soft mesh gradient — on-brand per path, slight per-seed jitter. */
function meshStyle(seed: string, path: PathSlug): React.CSSProperties {
  const h = hash(seed);
  const jitter = (shift: number, amt: number) =>
    ((h >> shift) % (amt * 2 + 1)) - amt;
  const pal = PALETTES[path];
  const image = pal.glows
    .map((g, i) => {
      const x = Math.max(2, Math.min(98, g.x + jitter(i * 5, 7)));
      const y = Math.max(2, Math.min(98, g.y + jitter(i * 5 + 3, 7)));
      return `radial-gradient(circle at ${x}% ${y}%, ${g.color} 0%, transparent ${g.size}%)`;
    })
    .join(', ');
  return { backgroundColor: pal.base, backgroundImage: image };
}

export function BlogBanner({
  title,
  path,
  seed,
  bannerImg,
  showTitle = true,
  className,
}: {
  title: string;
  path: PathSlug;
  seed?: string;
  bannerImg?: string;
  showTitle?: boolean;
  className?: string;
}) {
  // A non-empty bannerImg means the user uploaded their own — use it.
  if (bannerImg) {
    return (
      <div className={cn('relative overflow-hidden bg-muted', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bannerImg} alt="" className="h-full w-full object-cover" />
        {showTitle && <BannerTitle title={title} />}
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={meshStyle(seed ?? title, path)}
    >
      <div
        className="absolute inset-0 opacity-25 mix-blend-soft-light"
        style={{ backgroundImage: `url("${NOISE}")`, backgroundSize: '180px 180px' }}
      />
      {showTitle && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-white/55 via-white/10 to-transparent" />
          <BannerTitle title={title} />
        </>
      )}
    </div>
  );
}

function BannerTitle({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
      <h1
        className="text-2xl font-normal  leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] md:text-4xl"
        // style={{ fontFamily: 'var(--font-syne)' }}
      >
        {title}
      </h1>
    </div>
  );
}
