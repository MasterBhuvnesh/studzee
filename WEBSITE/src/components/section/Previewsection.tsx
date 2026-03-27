import Image from 'next/image';

const Previewsection = () => {
  return (
    <section className="relative w-full flex items-center justify-center px-4 md:px-6 pt-10 pb-20 mt-10 overflow-hidden">
      {/* Background Grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundSize: '60px 60px',
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          maskImage:
            'linear-gradient(to bottom, transparent, black 10%, black 80%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent, black 10%, black 80%, transparent)',
        }}
      />

      {/* Blue Glow Effect */}
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[80%] md:w-[60%] h-[30%] bg-blue-600/30 blur-[100px] md:blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center">
        {/* The Image Wrapper with glassmorphism border treatment */}
        <div className="w-full rounded-2xl md:rounded-[32px] overflow-hidden border border-white/5 bg-white/1 shadow-2xl shadow-blue-500/10 backdrop-blur-md  md:p-2">
          <div className="rounded-xl md:rounded-[24px] overflow-hidden border border-white/10 relative">
            <Image
              src="/images/sample.png"
              alt="Preview"
              width={1600}
              height={900}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="w-full h-auto object-cover relative z-10"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Previewsection;
