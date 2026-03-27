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
  {
    quote:
      "I was juggling five tabs of ML notes. Now it's all in Studzee, structured and actually readable.",
    name: 'Priya Nair',
    role: 'ML enthusiast',
    image: '/images/pfp/pfp4.jpg',
  },
  {
    quote:
      'System design prep used to feel scattered. Studzee made it feel like a proper course.',
    name: 'Rohan Desai',
    role: 'Backend developer',
    image: '/images/pfp/pfp5.jpg',
  },
  {
    quote:
      'DevOps concepts finally clicked when I stopped reading random blogs and started using Studzee.',
    name: 'Sneha Kulkarni',
    role: 'DevOps learner',
    image: '/images/pfp/pfp6.jpg',
  },
];

const Feedbacksection = () => {
  return (
    <section className="relative w-full flex flex-col items-center justify-center px-4 md:px-6 py-32 overflow-hidden">
      <div className="z-10 max-w-7xl w-full flex flex-col items-center gap-16 md:gap-24">
        {/* Header */}
        <div className="text-center space-y-6 relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-tight">
            What early users are saying
          </h2>
        </div>

        {/* Masonry Grid Wrapper containing the grid background */}
        <div className="relative w-full">
          {/* Grid Background scoped behind masonry */}
          <div
            className="absolute -top-12 -bottom-12 left-[-50vw] right-[-50vw] z-0 pointer-events-none"
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

          {/* Grid Layout for Testimonials */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="h-full flex flex-col justify-between gap-8 p-8 rounded-2xl bg-[#1f1f1f] border border-white/5 hover:bg-[#1c1c1c] transition-colors"
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
      </div>
    </section>
  );
};

export default Feedbacksection;
