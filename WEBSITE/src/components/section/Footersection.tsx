import { GITHUB_URL, PLAY_STORE_URL } from '@/constants/store-link';
import Image from 'next/image';
import Link from 'next/link';

const Footersection = () => {
  return (
    <footer className="w-full bg-background rounded-t-[2.5rem] md:rounded-t-[3rem] border-t border-white/5 pt-16 pb-8 px-4 md:px-6 relative z-10 overflow-hidden">
      {/* Background Glow under CTA */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-[100%] pointer-events-none opacity-40 blur-[120px]"
        style={{
          background:
            'linear-gradient(to bottom, var(--brand-blue), transparent)',
        }}
      />

      <div className="w-full relative z-10 flex flex-col gap-16 md:gap-24">
        {/* Main CTA Banner */}
        {/* <div className="w-[95vw] md:w-[80vw] max-w-[1600px] mx-auto bg-[#141414] border border-white/5 rounded-[1.5rem] p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-xl bg-white/5 border border-white/10 shrink-0">
              <Image
                src="/icons/icon-dark.png"
                alt="Studzee"
                width={28}
                height={28}
              />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground">
                Get updates, early access, and nothing else.
              </h3>
              <p className="text-muted-foreground text-[14px] md:text-sm max-w-2xl mt-2">
                No spam. No noise. Just the occasional update that matters.
              </p>
            </div>
          </div>

          <button className="shrink-0 w-full sm:w-auto px-8 py-4 rounded-lg bg-white hover:bg-white/90 text-black/90 font-medium text-md transition-colors shadow-sm flex items-center justify-center gap-2">
            Join our newsletter
          </button>
        </div> */}

        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          {/* Left Side */}
          <div className="max-w-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10  flex items-center justify-center">
                <Image
                  src="/icons/icon-dark.png"
                  alt="Studzee"
                  width={28}
                  height={28}
                />
              </div>
              <span className="font-semibold text-foreground text-xl tracking-tight">
                Studzee
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Studzee · Learn smarter, every day.
              </p>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Link
                href="#"
                className="text-foreground hover:text-muted-foreground transition-colors p-3 bg-[#1f1f1f] rounded-xl hover:bg-white/10"
              >
                <span className="sr-only">Twitter</span>
                {/* Twitter Icon */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
              <Link
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="text-foreground hover:text-muted-foreground transition-colors p-3 bg-[#1f1f1f] rounded-xl hover:bg-white/10"
              >
                <span className="sr-only">GitHub</span>
                {/* GitHub Icon */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </Link>
              <Link
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noreferrer"
                className="text-foreground hover:text-muted-foreground transition-colors p-3 bg-[#1f1f1f] rounded-xl hover:bg-white/10"
              >
                <span className="sr-only">Google Play Store</span>
                {/* Google Play Icon */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                >
                  <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right Side - Links */}
          <div className="flex flex-wrap gap-x-16 gap-y-10 md:mr-10">
            <div className="flex flex-col gap-4">
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground text-[14px] transition-colors"
              >
                Features
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground text-[14px] transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground text-[14px] transition-colors"
              >
                FAQ
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground text-[14px] transition-colors"
              >
                GitHub
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground text-[14px] transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom edge */}
        <div className="w-full max-w-7xl mx-auto pt-6 pb-2 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-[13px] text-center md:text-left">
            © 2025 Studzee. All rights reserved. · studzee.in
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground text-[13px] transition-colors underline underline-offset-4 decoration-white/20"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground text-[13px] transition-colors underline underline-offset-4 decoration-white/20"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footersection;
