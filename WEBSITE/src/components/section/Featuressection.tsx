import Image from 'next/image';

const features = [
  {
    title: 'Prevent knowledge gaps',
    description:
      "Don't let important details slip through the cracks. Studzee ensures you never miss a key concept, formula, or insight again.",
    image: '/images/sample.png',
  },
  {
    title: 'Improve retention',
    description:
      'Our smart summaries and spaced repetition system help you remember what matters most, making every study session count.',
    image: '/images/sample.png',
  },
  {
    title: 'Save time and energy',
    description:
      'Spend less time searching for notes and more time actually learning. Studzee streamlines your workflow so you can study smarter, not harder.',
    image: '/images/sample.png',
  },
];

const Featuressection = () => {
  return (
    <section id="features" className="relative w-full flex flex-col items-center justify-center px-4 md:px-6 py-32 mt-10">
      <div className="max-w-7xl w-full flex flex-col items-center gap-16 md:gap-24">
        {/* Header */}
        {/* Say goodbye to scattered studying */}
        <div className="text-center space-y-6">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-tight">
            Say goodbye to{' '}
            <span
              className="border-l-4 border-brand-purple pl-1.5 pr-2.5"
              style={{
                background:
                  'linear-gradient(to right, color-mix(in srgb, var(--brand-purple) 20%, transparent), transparent)',
              }}
            >
              scattered
            </span>{' '}
            studying
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop studying in chaos. Studzee puts it all in one place.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14 w-full">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center gap-8"
            >
              {/* Image Card with Fade/Blur */}
              <div className="w-full relative rounded-2xl md:rounded-[24px] overflow-hidden border-0 border-transparent bg-white/2 aspect-4/3 transition-colors">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover object-top opacity-80"
                />

                {/* Gradient fade and blur at the bottom of the image */}
                <div
                  className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none z-10"
                  style={{
                    background:
                      'linear-gradient(to top, var(--background) 5%, transparent 100%)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    maskImage:
                      'linear-gradient(to top, black 25%, transparent 100%)',
                    WebkitMaskImage:
                      'linear-gradient(to top, black 25%, transparent 100%)',
                  }}
                />
              </div>

              {/* Text Content */}
              <div className="space-y-4 px-2">
                <h3 className="text-2xl font-medium text-foreground tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-[15px] md:text-base">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Featuressection;
