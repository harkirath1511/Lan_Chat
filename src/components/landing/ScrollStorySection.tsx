import React, { useEffect, useRef, useState } from 'react';
import { Network, Server, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

interface StoryChapter {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  description: string;
  technicalDetail: string;
  nodesActive: number;
  highlightedLine: 'none' | 'all' | 'direct';
}

const CHAPTERS: StoryChapter[] = [
  {
    id: 'ch1',
    step: '01 / 03',
    title: 'One place to connect.',
    subtitle: 'The Central Server Hub',
    description:
      'One computer on your Wi-Fi or Ethernet network hosts the lightweight COMMON server. It binds to a single port and listens for incoming client handshakes with zero cloud dependency.',
    technicalDetail: 'Java ServerSocket · NIO Selector · Non-blocking event loop on 0.0.0.0:8080',
    nodesActive: 1,
    highlightedLine: 'none',
  },
  {
    id: 'ch2',
    step: '02 / 03',
    title: 'Everyone joins the conversation.',
    subtitle: 'Zero-Configuration Discovery',
    description:
      'Peers join using the server’s local network IP. The server assigns session tokens, synchronizes presence status, and opens a bi-directional streaming conduit in milliseconds.',
    technicalDetail: 'RFC 6455 WebSocket Upgrade · Subnet 192.168.x.x · Ping/Pong heartbeats',
    nodesActive: 5,
    highlightedLine: 'all',
  },
  {
    id: 'ch3',
    step: '03 / 03',
    title: 'Messages find their people.',
    subtitle: 'Group Broadcast & Private Conduits',
    description:
      'Group messages stream instantly to all active channel listeners. When students start a direct chat, the central hub routes the payload strictly between the two client sockets.',
    technicalDetail: 'Thread-safe routing · Direct message isolation · ConcurrentHashMap session pool',
    nodesActive: 5,
    highlightedLine: 'direct',
  },
];

export const ScrollStorySection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.max(0, Math.min(1, currentScroll / totalScrollable));
      setScrollProgress(progress);

      let idx = 0;
      if (progress > 0.66) idx = 2;
      else if (progress > 0.33) idx = 1;
      setActiveChapterIndex(idx);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentChapter = CHAPTERS[activeChapterIndex];

  // Jump to chapter
  const scrollToChapter = (idx: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerTop = window.scrollY + rect.top;
    const totalScrollable = rect.height - window.innerHeight;
    const target = containerTop + (idx / 2) * totalScrollable;
    window.scrollTo({ top: target, behavior: 'smooth' });
  };

  return (
    <section id="how-it-works" className="relative bg-[#E5E0D7]/40 border-y border-[#202522]/10">
      {/* Desktop Sticky Scroll Track (~240vh) */}
      <div ref={containerRef} className="hidden md:block relative h-[250vh]">
        <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
          <div className="max-w-7xl mx-auto w-full px-8 lg:px-12 grid grid-cols-12 gap-12 items-center h-full py-16">
            {/* Left Column: Changing Explanatory Text and Progress */}
            <div className="col-span-5 flex flex-col justify-center z-10">
              {/* Progress Indicator */}
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mono text-xs font-semibold tracking-wider text-[#294E43] bg-[#E5E0D7] border border-[#202522]/10 px-2.5 py-1 rounded">
                  {currentChapter.step}
                </span>
                <div className="flex gap-1.5">
                  {CHAPTERS.map((ch, idx) => (
                    <button
                      key={ch.id}
                      onClick={() => scrollToChapter(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        activeChapterIndex === idx
                          ? 'w-8 bg-[#294E43]'
                          : 'w-2 bg-[#777D76]/40 hover:bg-[#777D76]'
                      }`}
                      aria-label={`Jump to chapter ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Subtitle tag */}
              <div className="text-xs font-mono uppercase tracking-[0.14em] text-[#D36C43] font-medium mb-2">
                {currentChapter.subtitle}
              </div>

              {/* Title with crossfade and vertical movement */}
              <h2
                key={`title_${currentChapter.id}`}
                className="font-serif text-4xl lg:text-5xl font-semibold text-[#202522] tracking-tight leading-[1.12] mb-6 animate-in fade-in slide-in-from-bottom-3 duration-300"
              >
                {currentChapter.title}
              </h2>

              {/* Description */}
              <p
                key={`desc_${currentChapter.id}`}
                className="text-base text-[#202522]/85 leading-relaxed mb-6 animate-in fade-in duration-300"
              >
                {currentChapter.description}
              </p>

              {/* Technical Detail Card */}
              <div
                key={`tech_${currentChapter.id}`}
                className="bg-[#F4F1EB] border border-[#202522]/10 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-[#294E43] mb-1">
                  <Cpu className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-wider font-mono text-[11px]">
                    Socket Architecture
                  </span>
                </div>
                <div className="font-mono text-xs text-[#202522]/80">
                  {currentChapter.technicalDetail}
                </div>
              </div>

              {/* Scroll progress cue */}
              <div className="mt-8 flex items-center gap-2 text-xs text-[#777D76]">
                <div className="w-full bg-[#202522]/10 h-[2px] rounded-full overflow-hidden">
                  <div
                    className="bg-[#294E43] h-full transition-all duration-100 ease-out"
                    style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] shrink-0">
                  {Math.round(scrollProgress * 100)}%
                </span>
              </div>
            </div>

            {/* Right Column: Visual Stage Synchronized to Scroll Progress */}
            <div className="col-span-7 h-[540px] flex items-center justify-center relative">
              <div className="w-full h-full max-w-[560px] bg-[#F4F1EB] border border-[#202522]/10 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col items-center justify-center">
                {/* SVG Visual Choreography */}
                <svg
                  viewBox="0 0 500 450"
                  className="w-full h-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Subtle grid background */}
                  <defs>
                    <pattern id="chGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                      <circle cx="12" cy="12" r="0.75" fill="#202522" opacity="0.12" />
                    </pattern>
                  </defs>
                  <rect width="500" height="450" fill="url(#chGrid)" />

                  {/* Concentric broadcast ripples from central server */}
                  <circle
                    cx="250"
                    cy="225"
                    r={activeChapterIndex >= 1 ? 160 : 70}
                    stroke="#294E43"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity={activeChapterIndex >= 1 ? 0.35 : 0.15}
                    className="transition-all duration-700"
                  />
                  <circle
                    cx="250"
                    cy="225"
                    r={activeChapterIndex >= 2 ? 120 : 45}
                    stroke="#D36C43"
                    strokeWidth="1"
                    opacity={activeChapterIndex >= 2 ? 0.4 : 0.15}
                    className="transition-all duration-700"
                  />

                  {/* Connecting conduits */}
                  {[
                    { x: 100, y: 120, label: 'Design Lab · .14', direct: true },
                    { x: 400, y: 110, label: 'Library · .28', direct: true },
                    { x: 90, y: 320, label: 'Room 204 · .05', direct: false },
                    { x: 410, y: 330, label: 'Studio · .42', direct: false },
                    { x: 250, y: 380, label: 'Commons · .99', direct: false },
                  ].map((node, i) => {
                    const isConnected = activeChapterIndex >= 1;
                    const isDirect = activeChapterIndex === 2 && node.direct;

                    return (
                      <g key={i} className="transition-all duration-500">
                        {/* Connection Line */}
                        <line
                          x1="250"
                          y1="225"
                          x2={node.x}
                          y2={node.y}
                          stroke={isDirect ? '#D36C43' : isConnected ? '#294E43' : '#777D76'}
                          strokeWidth={isDirect ? 2.5 : isConnected ? 1.75 : 1}
                          strokeDasharray={isConnected ? 'none' : '4 4'}
                          opacity={isConnected ? (isDirect ? 0.95 : 0.4) : 0.18}
                          className="transition-all duration-500"
                        />

                        {/* Animated traveling packet for active state */}
                        {activeChapterIndex === 2 && (
                          <circle
                            cx={250 + (node.x - 250) * ((scrollProgress * 4 + i * 0.2) % 1)}
                            cy={225 + (node.y - 225) * ((scrollProgress * 4 + i * 0.2) % 1)}
                            r={isDirect ? 5 : 3.5}
                            fill={isDirect ? '#D36C43' : '#294E43'}
                          />
                        )}

                        {/* Peripheral Node Device */}
                        <g
                          transform={`translate(${node.x}, ${node.y})`}
                          opacity={isConnected ? 1 : 0.3}
                          className="transition-opacity duration-500"
                        >
                          <circle
                            r="20"
                            fill={isDirect ? '#294E43' : '#F4F1EB'}
                            stroke={isDirect ? '#D36C43' : '#202522'}
                            strokeWidth="1.5"
                          />
                          <circle
                            r="6"
                            fill={isDirect ? '#D36C43' : isConnected ? '#294E43' : '#777D76'}
                          />
                          <text
                            y="34"
                            textAnchor="middle"
                            fill="#202522"
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="500"
                          >
                            {node.label}
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  {/* Central Server Hub */}
                  <g transform="translate(250, 225)">
                    {/* Shadow / Glow ring */}
                    <circle
                      r={activeChapterIndex === 0 ? 56 : 46}
                      fill="#294E43"
                      opacity="0.12"
                      className="transition-all duration-700"
                    />
                    {/* Outer hub shell */}
                    <circle
                      r={activeChapterIndex === 0 ? 46 : 38}
                      fill="#202522"
                      stroke="#294E43"
                      strokeWidth="2.5"
                      className="transition-all duration-700"
                    />
                    {/* Inner core */}
                    <circle r="18" fill="#294E43" />
                    {/* Pulsing indicator */}
                    <circle r="6" fill="#D36C43" className="animate-pulse" />
                    <text
                      y="-52"
                      textAnchor="middle"
                      fill="#202522"
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      CENTRAL SERVER :8080
                    </text>
                  </g>
                </svg>

                {/* Subtitle bottom bar */}
                <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[11px] font-mono text-[#777D76] border-t border-[#202522]/10 pt-2">
                  <span>Subnet 192.168.1.0/24</span>
                  <span className="flex items-center gap-1.5 text-[#294E43] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#294E43] animate-pulse" />
                    {activeChapterIndex === 0 && 'Awaiting Client Connections'}
                    {activeChapterIndex === 1 && '5 Sockets Authenticated'}
                    {activeChapterIndex === 2 && 'Routing Concurrent Streams'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Stacked Chapters (Section 5 requirement: Avoid long pinned sections on mobile) */}
      <div className="md:hidden py-16 px-6 space-y-12">
        <div className="text-center mb-8">
          <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#D36C43] font-medium">
            How It Works
          </span>
          <h2 className="font-serif text-3xl font-semibold text-[#202522] mt-1">
            The Local Network Story
          </h2>
        </div>

        {CHAPTERS.map((ch) => (
          <div
            key={ch.id}
            className="bg-[#F4F1EB] border border-[#202522]/10 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs font-semibold text-[#294E43] bg-[#E5E0D7] px-2.5 py-1 rounded">
                {ch.step}
              </span>
              <span className="text-xs font-mono text-[#D36C43]">{ch.subtitle}</span>
            </div>

            <h3 className="font-serif text-2xl font-semibold text-[#202522] mb-3">
              {ch.title}
            </h3>

            <p className="text-sm text-[#202522]/85 leading-relaxed mb-4">
              {ch.description}
            </p>

            <div className="bg-[#E5E0D7]/40 border border-[#202522]/10 rounded-lg p-3 text-xs font-mono text-[#202522]/80">
              <div className="text-[10px] uppercase text-[#294E43] font-semibold mb-0.5">
                Technical Specification
              </div>
              {ch.technicalDetail}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
