import React, { useEffect, useRef, useState } from 'react';
import { CommonSymbol } from '../common/CommonSymbol';
import { Hash, Send, Paperclip, Smile, Users, Radio } from 'lucide-react';

export const ShowcaseSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [straightenFactor, setStraightenFactor] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowH = window.innerHeight;
      // When element is centered in viewport, straightenFactor approaches 1
      const progress = 1 - Math.abs(rect.top + rect.height / 2 - windowH / 2) / (windowH * 0.8);
      setStraightenFactor(Math.max(0, Math.min(1, progress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3D perspective rotation interpolation (from ~5 deg tilt to 0 deg when centered)
  const rotX = (1 - straightenFactor) * 5;
  const rotY = (1 - straightenFactor) * -4;

  return (
    <section
      id="showcase"
      ref={containerRef}
      className="bg-[#294E43] text-[#F4F1EB] py-24 px-6 md:px-12 relative overflow-hidden"
    >
      {/* Subtle organic light accent on the forest canvas */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#3B6658]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#D36C43]" />
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-[#E5E0D7]/80">
              The Workspace Experience
            </span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-[#F4F1EB]">
            Built for actual conversations.
          </h2>
          <p className="mt-3 text-base text-[#E5E0D7]/80">
            A calm, distraction-free environment tuned for collegiate engineering teams, design critiques, and late-night lab sessions.
          </p>
        </div>

        {/* 3 Three Clean Annotations above the showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
          <div className="bg-[#1F3C34]/80 border border-[#F4F1EB]/15 rounded-xl p-3.5 text-center">
            <span className="w-2 h-2 rounded-full bg-[#D36C43] inline-block mr-2" />
            <span className="font-serif text-sm font-semibold text-[#F4F1EB]">
              Shared channels.
            </span>
            <p className="text-xs text-[#E5E0D7]/75 mt-0.5">
              Topic-segregated broadcasts across the lab
            </p>
          </div>

          <div className="bg-[#1F3C34]/80 border border-[#F4F1EB]/15 rounded-xl p-3.5 text-center">
            <span className="w-2 h-2 rounded-full bg-[#D36C43] inline-block mr-2" />
            <span className="font-serif text-sm font-semibold text-[#F4F1EB]">
              Private conversations.
            </span>
            <p className="text-xs text-[#E5E0D7]/75 mt-0.5">
              Targeted peer messaging with isolated buffers
            </p>
          </div>

          <div className="bg-[#1F3C34]/80 border border-[#F4F1EB]/15 rounded-xl p-3.5 text-center">
            <span className="w-2 h-2 rounded-full bg-[#D36C43] inline-block mr-2" />
            <span className="font-serif text-sm font-semibold text-[#F4F1EB]">
              Clear online presence.
            </span>
            <p className="text-xs text-[#E5E0D7]/75 mt-0.5">
              Instant heartbeat telemetry on who is stationed
            </p>
          </div>
        </div>

        {/* The Large Chat Window Preview with 3D perspective transition */}
        <div
          className="max-w-5xl mx-auto transition-transform duration-300 ease-out"
          style={{
            perspective: '1200px',
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${0.96 + straightenFactor * 0.04})`,
          }}
        >
          <div className="bg-[#F4F1EB] text-[#202522] rounded-2xl shadow-[0_24px_50px_rgba(0,0,0,0.35)] border border-[#202522]/15 overflow-hidden flex flex-col md:flex-row h-[520px]">
            {/* Left Workspace Sidebar */}
            <div className="w-64 bg-[#E5E0D7]/60 border-r border-[#202522]/10 p-4 flex flex-col justify-between shrink-0 hidden md:flex">
              <div>
                <div className="flex items-center gap-2 pb-4 border-b border-[#202522]/10 mb-4">
                  <CommonSymbol size={18} color="#294E43" />
                  <span className="font-serif text-sm font-semibold uppercase tracking-wider">
                    COMMON LAN
                  </span>
                  <span className="ml-auto text-[10px] font-mono bg-[#294E43] text-[#F4F1EB] px-1.5 py-0.5 rounded">
                    :8080
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#777D76] block mb-2 px-1">
                    Channels
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#294E43] text-[#F4F1EB] text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5" />
                        <span>project-team</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-80">5</span>
                    </div>
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[#202522]/70 text-xs font-medium hover:bg-[#E5E0D7]">
                      <div className="flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5" />
                        <span>general</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[#202522]/70 text-xs font-medium hover:bg-[#E5E0D7]">
                      <div className="flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5" />
                        <span>study-room</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#777D76] block mb-2 px-1">
                    Direct Messages
                  </span>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#202522]/80 hover:bg-[#E5E0D7]">
                      <span className="w-2 h-2 rounded-full bg-[#294E43]" />
                      <span>Maya Chen</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#202522]/80 hover:bg-[#E5E0D7]">
                      <span className="w-2 h-2 rounded-full bg-[#294E43]" />
                      <span>Liam Patel</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#202522]/80 hover:bg-[#E5E0D7]">
                      <span className="w-2 h-2 rounded-full bg-[#D36C43]" />
                      <span>Elena Rostova</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Host station indicator */}
              <div className="bg-[#F4F1EB] border border-[#202522]/10 rounded-lg p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#294E43] animate-pulse" />
                  <span className="font-medium text-[#202522]">Host Station</span>
                </div>
                <div className="text-[10px] font-mono text-[#777D76] mt-0.5">
                  192.168.1.100:8080
                </div>
              </div>
            </div>

            {/* Center Chat Feed */}
            <div className="flex-1 flex flex-col justify-between bg-[#F4F1EB] p-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#202522]/10 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-[#294E43]" />
                    <span className="font-serif font-semibold text-[#202522] text-base">
                      project-team
                    </span>
                  </div>
                  <span className="text-xs text-[#777D76]">
                    Capstone milestone: Concurrency & message protocol verification
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#777D76] font-mono">
                  <Users className="w-3.5 h-3.5" />
                  <span>5 members</span>
                </div>
              </div>

              {/* Message History */}
              <div className="space-y-4 overflow-y-auto pr-2">
                <div className="flex items-center justify-center my-2">
                  <span className="text-[11px] font-mono text-[#777D76] bg-[#E5E0D7] px-3 py-0.5 rounded-full">
                    Today · Lab Session 3
                  </span>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D36C43] text-[#F4F1EB] flex items-center justify-center text-xs font-semibold shrink-0">
                    LP
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#202522]">Liam Patel</span>
                      <span className="text-[10px] text-[#777D76]">2:15 PM</span>
                    </div>
                    <div className="bg-[#E5E0D7]/40 border border-[#202522]/10 rounded-xl rounded-tl-none p-3 text-xs text-[#202522] max-w-lg leading-relaxed">
                      I’ve committed the non-blocking channel loop. All incoming packets are handled by our worker pool without starving the main thread.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#294E43] text-[#F4F1EB] flex items-center justify-center text-xs font-semibold shrink-0">
                    MC
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#202522]">Maya Chen</span>
                      <span className="text-[10px] text-[#777D76]">2:18 PM</span>
                    </div>
                    <div className="bg-[#E5E0D7]/40 border border-[#202522]/10 rounded-xl rounded-tl-none p-3 text-xs text-[#202522] max-w-lg leading-relaxed">
                      Ran 500 test messages per second on our dorm subnet. Zero packet loss, roundtrip latency ~1.8ms!
                    </div>
                  </div>
                </div>

                {/* Current User Composed response */}
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-[#202522] text-[#F4F1EB] flex items-center justify-center text-xs font-semibold shrink-0">
                    YOU
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline justify-end gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#202522]">You</span>
                      <span className="text-[10px] text-[#777D76]">Just now</span>
                    </div>
                    <div className="bg-[#294E43] text-[#F4F1EB] rounded-xl rounded-tr-none p-3 text-xs text-left max-w-lg leading-relaxed shadow-xs">
                      Outstanding work team. I am testing the client frontend now. The channel switching and search are working seamlessly.
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Composed Bar */}
              <div className="mt-4 pt-3 border-t border-[#202522]/10">
                <div className="flex items-center gap-2 bg-[#E5E0D7]/50 border border-[#202522]/15 rounded-xl px-3 py-2 text-xs">
                  <input
                    type="text"
                    readOnly
                    value="Ready to test the Java WebSocket demo together..."
                    className="flex-1 bg-transparent text-[#202522] focus:outline-none cursor-default"
                  />
                  <div className="flex items-center gap-2 text-[#777D76]">
                    <Paperclip className="w-4 h-4 cursor-pointer hover:text-[#202522]" />
                    <Smile className="w-4 h-4 cursor-pointer hover:text-[#202522]" />
                    <button className="p-1.5 rounded-lg bg-[#294E43] text-[#F4F1EB]">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Technical Explanation Footer Note */}
        <div className="text-center mt-12 max-w-2xl mx-auto border-t border-[#F4F1EB]/15 pt-8">
          <p className="text-sm font-mono text-[#E5E0D7]/90 leading-relaxed">
            COMMON is a student project exploring client-server communication, concurrent connections, and real-time messaging.
          </p>
        </div>
      </div>
    </section>
  );
};
