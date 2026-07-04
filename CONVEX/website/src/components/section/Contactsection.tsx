const Contactsection = () => {
  return (
    <section  id="contact" className="relative w-full flex flex-col items-center justify-center px-4 md:px-6 pt-12 pb-32 md:pb-40 -mb-16 overflow-hidden z-0">
      {/* Deep Violet/Blue Orbit Effect */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 translate-y-[20%] w-[250vw] md:w-[200vw] lg:w-[150vw] h-[800px] rounded-[100%] border-t-2 border-[#6366f1]/80 bg-linear-to-b from-[#312e81]/90 via-[#0f172a]/60 to-transparent shadow-[inset_0_30px_100px_rgba(79,70,229,0.6)] z-0 pointer-events-none" />
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 translate-y-[20%] w-screen h-[300px] rounded-[100%] bg-[#4338ca]/40 blur-[100px] z-0 pointer-events-none" />

      {/* Top Contact Promt (from design reference) */}
      <div className="text-center space-y-4 relative z-10">
        <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground">
          Still have questions?
        </h3>
        <p className="text-muted-foreground">Get in touch with our team.</p>
        <button className="mt-6 px-6 py-2.5 rounded-lg border-2 border-white/10 hover:bg-white/5 transition-colors text-sm font-medium text-foreground">
          Contact
        </button>
      </div>
    </section>
  );
};

export default Contactsection;
