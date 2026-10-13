import React from 'react';
import { CommonWordmark } from '../common/CommonWordmark';
import { ArrowRight } from 'lucide-react';

interface FooterCtaSectionProps {
  onOpenDemo: () => void;
  onNavigateHome: () => void;
}

export const FooterCtaSection: React.FC<FooterCtaSectionProps> = ({
  onOpenDemo,
  onNavigateHome,
}) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#F4F1EB] border-t border-[#202522]/10">
      {/* Spacious Final Call to Action */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-28 text-center">
        <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-semibold text-[#202522] tracking-tight leading-[1.08] mb-8 text-balance">
          Your network.
          <br />
          <span className="italic font-normal text-[#294E43]">Your common ground.</span>
        </h2>

        <p className="text-base sm:text-lg text-[#202522]/80 max-w-xl mx-auto mb-10 leading-relaxed">
          Open the browser demo to explore the interface, test simulated peer messaging, and inspect the client protocol.
        </p>

        <button
          onClick={onOpenDemo}
          className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-semibold tracking-wide uppercase text-[#F4F1EB] bg-[#294E43] hover:bg-[#1F3C34] active:scale-[0.98] rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(41,78,67,0.22)] cursor-pointer"
        >
          <span>Try the chat demo</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Minimal Footer */}
      <div className="border-t border-[#202522]/10 py-10 px-6 md:px-12 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <CommonWordmark onClick={onNavigateHome} symbolSize={20} />

        {/* Working Section Links */}
        <div className="flex items-center gap-6 text-xs text-[#202522]/75">
          <button
            onClick={() => scrollTo('how-it-works')}
            className="hover:text-[#294E43] transition-colors cursor-pointer"
          >
            How it works
          </button>
          <button
            onClick={() => scrollTo('features')}
            className="hover:text-[#294E43] transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => scrollTo('showcase')}
            className="hover:text-[#294E43] transition-colors cursor-pointer"
          >
            Architecture
          </button>
          <button
            onClick={onOpenDemo}
            className="hover:text-[#294E43] transition-colors cursor-pointer font-medium"
          >
            Chat Demo
          </button>
        </div>

        {/* Academic Project Tagline */}
        <div className="text-xs font-mono text-[#777D76]">
          COMMON — a Java LAN chat project.
        </div>
      </div>
    </footer>
  );
};
