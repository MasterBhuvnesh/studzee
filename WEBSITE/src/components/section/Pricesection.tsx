import Image from 'next/image';

const Pricesection = () => {
  return (
    <section className="relative w-full flex flex-col items-center justify-center px-4 md:px-6 py-32 overflow-hidden">
      <div className="z-10 max-w-7xl w-full flex flex-col items-center gap-16 md:gap-20">
        {/* Header & Toggle */}
        <div className="text-center space-y-6 flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-tight">
            Built for learners{' '}
            <span
              className="border-l-4 border-brand-orange pl-1.5 pr-2.5"
              style={{
                background:
                  'linear-gradient(to right, color-mix(in srgb, var(--brand-orange) 20%, transparent), transparent)',
              }}
            >
              priced
            </span>{' '}
            like it.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Pricing tiers
          </p>

          {/* <div className="flex items-center p-1 mt-6 bg-[#1f1f1f]/50 border border-white/10 rounded-lg">
            <button className="px-6 py-2 bg-white text-black font-medium text-sm rounded-md shadow-sm">
              Monthly
            </button>
            <button className="px-6 py-2 text-muted-foreground hover:text-foreground font-medium text-sm rounded-md transition-colors">
              Yearly
            </button>
          </div> */}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {/* Card 1 */}
          <div className="flex flex-col gap-6 p-8 rounded-2xl bg-[#141414] border border-white/5 hover:border-white/10 transition-colors">
            <div className="space-y-2 border-b border-white/5 pb-8">
              <h3 className="text-2xl font-medium text-foreground tracking-tight">
                Explorer
              </h3>
              <p className="text-muted-foreground text-sm">Free during beta</p>
            </div>

            <div className="flex items-end gap-1 my-2">
              <span className="text-5xl font-medium text-foreground tracking-tight">
                Free
              </span>
            </div>

            <p className="text-muted-foreground text-[14px] leading-relaxed mb-4">
              Access core content, mobile app, and notifications. No card
              required.
            </p>

            <button className="mt-auto w-full py-3 px-4 rounded-lg border border-white/10 hover:bg-white/5 text-foreground font-medium text-sm transition-colors">
              Get Started
            </button>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col gap-6 p-8 rounded-2xl bg-[#141414] border border-white/5 hover:border-white/10 transition-colors shadow-2xl relative">
            {/* Subtle glow effect for middle card if desired, left out for exactly matching image */}
            <div className="space-y-2 border-b border-white/5 pb-8">
              <h3 className="text-2xl font-medium text-foreground tracking-tight">
                Learner
              </h3>
              <p className="text-muted-foreground text-sm">Starter</p>
            </div>

            <div className="flex items-end gap-1 my-2">
              <span className="text-5xl font-medium text-foreground tracking-tight">
                ₹19
              </span>
              <span className="text-muted-foreground mb-1">/mo</span>
            </div>

            <p className="text-muted-foreground text-[14px] leading-relaxed mb-4">
              Full content library, quiz generation, cross-platform sync, and
              priority support.
            </p>

            <button className="mt-auto w-full py-3 px-4 rounded-lg bg-white hover:bg-white/90 text-black font-medium text-sm transition-colors shadow-sm">
              Subscribe
            </button>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col gap-6 p-8 rounded-2xl bg-[#141414] border border-white/5 hover:border-white/10 transition-colors">
            <div className="space-y-2 border-b border-white/5 pb-8">
              <h3 className="text-2xl font-medium text-foreground tracking-tight">
                Pro
              </h3>
              <p className="text-muted-foreground text-sm">Advanced</p>
            </div>

            <div className="flex items-end gap-1 my-2">
              <span className="text-5xl font-medium text-foreground tracking-tight">
                ₹69
              </span>
              <span className="text-muted-foreground mb-1">/mo</span>
            </div>

            <p className="text-muted-foreground text-[14px] leading-relaxed mb-4">
              Everything in Learner, plus AI-powered summaries, bulk PDF
              ingestion, and early access to new features.
            </p>

            <button className="mt-auto w-full py-3 px-4 rounded-lg border border-white/10 hover:bg-white/5 text-foreground font-medium text-sm transition-colors">
              Subscribe
            </button>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="relative w-full max-w-5xl rounded-2xl bg-[#141414] border border-white/5 overflow-hidden flex flex-col sm:flex-row items-center justify-between p-8 md:p-10 gap-6">
          {/* Grid Background scoped behind banner */}
          <div
            className="absolute inset-0 z-0 pointer-events-none opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              maskImage: 'linear-gradient(to right, transparent 50%, black)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 50%, black)',
            }}
          />

          <div className="relative z-10 space-y-2 text-center sm:text-left">
            <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground">
              Get started for free
            </h3>
            <p className="text-muted-foreground text-sm md:text-base">
              No credit card needed.
            </p>
          </div>

          <button className="relative z-10 shrink-0 w-full sm:w-auto py-3 px-6 rounded-lg bg-white hover:bg-white/90 text-black font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2">
            <Image src="/icons/icon.png" alt="Studzee" width={20} height={20} />
            Try for free
          </button>
        </div>
      </div>
    </section>
  );
};

export default Pricesection;
