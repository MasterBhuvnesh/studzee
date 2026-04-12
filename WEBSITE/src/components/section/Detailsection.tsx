import {
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

const details = [
  {
    icon: DevicePhoneMobileIcon,
    iconColor: 'text-orange-400',
    glowColor: 'bg-orange-500/50',
    title: 'Access your content everywhere - web, mobile, and desktop',
    description:
      "Whether you're at your desk or on the move, Studzee follows you. Our cross-platform apps sync in real time so you never lose your place - and never run out of things to study.",
    image: '/images/sample.png',
  },
  {
    icon: DocumentTextIcon,
    iconColor: 'text-blue-400',
    glowColor: 'bg-blue-500/50',
    title: 'Content that arrives structured - not dumped in your lap',
    description:
      'Studzee ingests PDFs, documents, and web content and serves it back as clean, navigable learning material. Quizzes, summaries, and structured modules - generated automatically so you can focus on learning, not organising.',
    image: '/images/sample.png',
  },
  {
    icon: SparklesIcon,
    iconColor: 'text-purple-400',
    glowColor: 'bg-purple-500/50',
    title: 'Let AI handle the heavy lifting - you just learn',
    description:
      'Our agentic AI pipeline is being built to ingest bulk PDFs, scrape educational content from the web, and auto-generate quizzes and summaries - at scale. The future of Studzee writes itself.',
    image: '/images/sample.png',
  },
];

const Detailsection = () => {
  return (
    <section id="learn" className="relative w-full flex flex-col items-center justify-center px-4 md:px-6 py-32">
      <div className="max-w-7xl w-full flex flex-col items-center gap-16 md:gap-24">
        {/* Header */}
        <div className="text-center space-y-6">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-tight">
            An ed-tech platform built for <br className="hidden md:block" />
            <span
              className="border-l-4 border-brand-orange pl-1.5 pr-2.5"
              style={{
                background:
                  'linear-gradient(to right, color-mix(in srgb, var(--brand-orange) 20%, transparent), transparent)',
              }}
            >
              learners
            </span>{' '}
            who mean it
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            More than just courses a real-time, intelligent learning
            infrastructure that scales with you.
          </p>
        </div>

        {/* Details List */}
        <div className="w-full flex flex-col gap-8 md:gap-12">
          {details.map((detail, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row items-center gap-10 md:gap-16 p-8 md:p-12 rounded-[24px] md:rounded-[32px] border border-white/5 bg-white/2 hover:bg-white/3 transition-colors"
            >
              {/* Text Side */}
              <div className="flex-1 flex flex-col items-start gap-6">
                <div className="relative w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                  {/* Subtle glow centered behind the icon */}
                  <div
                    className={`absolute inset-0 m-auto w-6 h-6 ${detail.glowColor} blur-[10px]`}
                  />
                  <detail.icon
                    className={`w-6 h-6 ${detail.iconColor} relative z-10`}
                    strokeWidth={1.5}
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl md:text-3xl font-medium text-foreground leading-snug tracking-tight">
                    {detail.title}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {detail.description}
                  </p>
                </div>
              </div>

              {/* Image Side */}
              <div className="flex-1 w-full">
                <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden  border-0 shadow-2xl bg-white/5">
                  <Image
                    src={detail.image}
                    alt={detail.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover object-top-left opacity-90"
                  />
                  {/* Subtle fade effect at the bottom matching dark UI */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to top, var(--background) 5%, transparent 100%)',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Detailsection;
