import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { PlayCircleIcon } from '@heroicons/react/24/solid';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-4xl text-center space-y-6">
        {/* Heading */}
        <h1 className="text-6xl md:text-7xl font-medium tracking-tight text-foreground leading-tight">
          The{' '}
          <span
            className="border-l-4 border-brand-purple pl-1.5 pr-2.5"
            style={{
              background:
                'linear-gradient(to right, color-mix(in srgb, var(--brand-purple) 20%, transparent), transparent)',
            }}
          >
            smartest
          </span>{' '}
          way to learn
          <br className="hidden md:block pb-2" />
          on every platform,{' '}
          <span
            className="border-l-4 border-brand-orange pl-1.5 pr-2.5"
            style={{
              background:
                'linear-gradient(to right, color-mix(in srgb, var(--brand-orange) 20%, transparent), transparent)',
            }}
          >
            effortlessly
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Structured content, instant summaries, and seamless learning all in
          one place.
        </p>

        {/* CTA */}
        <div className="flex flex-row items-center justify-center gap-4 pt-4">
          <button className="group relative flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity shadow-sm">
            <ArrowDownTrayIcon
              className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"
              strokeWidth={2}
            />
            <span className="opacity-70 group-hover:opacity-100 transition-opacity text-base">
              Try for free
            </span>
          </button>

          <button className="group flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-transparent border-2 border-border text-foreground font-medium shadow-sm hover:bg-white/5 transition-colors">
            <PlayCircleIcon
              className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity"
              strokeWidth={2}
            />
            <span className="opacity-70 group-hover:opacity-100 transition-opacity text-base">
              Watch Demo
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
