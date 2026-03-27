import Image from 'next/image';

const testimonials = [
  {
    quote:
      "Finally an edtech app that doesn't treat me like I'm in third grade. The content structure is clean and it just works.",
    name: 'Aryan Bokde',
    role: 'Engineering student',
    image: '/images/pfp/pfp1.jpg',
  },
  {
    quote:
      'The fact that it works across my phone and laptop seamlessly is huge. I switched from three different apps to just Studzee.',
    name: 'Abhay Mishra',
    role: 'CS undergrad',
    image: '/images/pfp/pfp2.jpg',
  },
  {
    quote:
      "You can tell this was built by someone who actually studies. It's not bloated  it's exactly what you need.",
    name: 'Aarsh Vadiya',
    role: 'Self-learner',
    image: '/images/pfp/pfp3.jpg',
  },
];

const Feedbacksection = () => {
  return (
    <section className="relative w-full flex flex-col items-center justify-center px-4 md:px-6 py-32 overflow-hidden">
      {/* Grid Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage:
            'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        }}
      />
      <div className="relative z-10 max-w-7xl w-full flex flex-col items-center gap-16 md:gap-24">
        {/* Header */}
        <div className="text-center space-y-6">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-tight">
            What early users are saying
          </h2>
        </div>

        {/* Masonry Grid for Testimonials */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 w-full space-y-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="break-inside-avoid flex flex-col justify-between gap-8 p-8 rounded-2xl bg-[#1f1f1f] border border-white/5 hover:bg-[#1c1c1c] transition-colors"
            >
              <p className="text-muted-foreground/90 leading-relaxed text-[15px] md:text-[16px]">
                {testimonial.quote}
              </p>

              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-foreground font-medium text-[15px]">
                    {testimonial.name}
                  </h4>
                  <p className="text-muted-foreground text-[14px]">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Feedbacksection;
