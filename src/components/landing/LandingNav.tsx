import React, { useEffect, useState } from 'react';
import { CommonWordmark } from '../common/CommonWordmark';
import { Menu, X, ArrowUpRight } from 'lucide-react';

interface LandingNavProps {
  onOpenDemo: () => void;
  onNavigateHome: () => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({
  onOpenDemo,
  onNavigateHome,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'py-3 bg-[#F4F1EB]/95 backdrop-blur-md border-b border-[#202522]/10 shadow-[0_2px_12px_rgba(32,37,34,0.04)]'
            : 'py-5 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Zone 1: Brand Wordmark */}
          <CommonWordmark
            onClick={onNavigateHome}
            symbolSize={22}
            className="hover:opacity-90"
          />

          {/* Zone 2: Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-8 text-sm font-medium text-[#202522]/80"
            aria-label="Main navigation"
          >
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#294E43] transition-colors cursor-pointer py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#294E43] hover:after:w-full after:transition-all after:duration-200"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-[#294E43] transition-colors cursor-pointer py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#294E43] hover:after:w-full after:transition-all after:duration-200"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('showcase')}
              className="hover:text-[#294E43] transition-colors cursor-pointer py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#294E43] hover:after:w-full after:transition-all after:duration-200"
            >
              Architecture
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onOpenDemo}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wide uppercase text-[#F4F1EB] bg-[#294E43] hover:bg-[#1F3C34] active:scale-[0.98] rounded-lg transition-all duration-200 shadow-sm whitespace-nowrap cursor-pointer"
            >
              <span>Open demo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#202522] hover:bg-[#E5E0D7]/50 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#202522]/40 backdrop-blur-xs md:hidden">
          <div className="absolute top-[68px] left-0 right-0 bg-[#F4F1EB] border-b border-[#202522]/15 p-6 shadow-xl flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-left py-2.5 text-base font-serif font-semibold text-[#202522] border-b border-[#202522]/10"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-left py-2.5 text-base font-serif font-semibold text-[#202522] border-b border-[#202522]/10"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('showcase')}
              className="text-left py-2.5 text-base font-serif font-semibold text-[#202522] border-b border-[#202522]/10"
            >
              Architecture & Showcase
            </button>
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDemo();
                }}
                className="w-full py-3 px-4 text-center font-medium text-sm text-[#F4F1EB] bg-[#294E43] rounded-lg shadow-sm flex items-center justify-center gap-2"
              >
                <span>Open chat demo</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
