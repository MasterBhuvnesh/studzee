import { NAV_LINKS } from '@/constants/nav-link';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';

const Navbarsection = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/50 backdrop-blur-md border-b border-background">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <Image
          src="/images/icon.png"
          alt="Studzee icon"
          width={40}
          height={40}
          className="w-10 h-10 object-contain"
        />
        <span className="text-lg font-semibold text-foreground tracking-tight">
          Studzee
        </span>
      </div>

      {/* Navigation Links - each one in a unique box */}
      {/* <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-4">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="group flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-transparent border-2 border-border text-foreground font-medium shadow-sm hover:bg-white/5 transition-colors"
          >
            <link.icon
              className="w-4 h-4 opacity-80 group-hover:opacity-100 transition-opacity"
              strokeWidth={2}
            />
            <span className="opacity-70 group-hover:opacity-100 transition-opacity text-sm">
              {link.name}
            </span>
          </Link>
        ))}
      </nav> */}

      {/* Navigation Links  common box */}
      <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center">
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-background border-2 border-border shadow-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="group flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-foreground font-medium hover:bg-white/5 transition-colors"
            >
              <link.icon
                className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity"
                strokeWidth={2}
              />
              <span className="opacity-70 group-hover:opacity-100 transition-opacity text-sm">
                {link.name}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* CTA Side */}
      <div className="flex items-center gap-4">
        <button className="group flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-transparent border-2 border-border text-foreground font-medium shadow-sm hover:bg-white/5 transition-colors">
          <ArrowDownTrayIcon
            className="w-4 h-4 opacity-80 group-hover:opacity-100 transition-opacity"
            strokeWidth={2}
          />
          <span className="opacity-70 group-hover:opacity-100 transition-opacity text-sm">
            Try for free
          </span>
        </button>
      </div>
    </header>
  );
};

export default Navbarsection;
