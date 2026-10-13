import React, { useState } from 'react';
import { ConversationConstellation, ConstellationNode } from '../three/ConversationConstellation';
import { NodeSelectorBar } from './NodeSelectorBar';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  onOpenDemo: () => void;
  onExploreScroll: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenDemo,
  onExploreScroll,
}) => {
  const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);

  return (
    <section className="relative min-h-[92vh] md:min-h-screen pt-28 pb-16 px-6 md:px-12 flex items-center overflow-hidden">
      {/* Subtle background ambient noise/texture styling */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column: Asymmetric Editorial Typography & Actions */}
        <div className="lg:col-span-6 flex flex-col justify-center z-10">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D36C43]" />
            <span className="text-xs font-mono tracking-[0.16em] uppercase text-[#777D76]">
              A LOCAL NETWORK. A SHARED SPACE.
            </span>
          </div>

          {/* Large Headline */}
          <h1 className="font-serif text-5xl sm:text-6xl xl:text-7xl font-semibold leading-[1.06] tracking-[-0.02em] text-[#202522] mb-6 text-balance animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100">
            Closer connections.
            <br />
            <span className="italic font-normal text-[#294E43]">Zero distance.</span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg text-[#202522]/80 leading-relaxed max-w-xl mb-8 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-200">
            A shared place for conversations across your local network. One central server. Everyone connected.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 mb-6 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300">
            <button
              onClick={onOpenDemo}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold tracking-wide uppercase text-[#F4F1EB] bg-[#294E43] hover:bg-[#1F3C34] active:scale-[0.98] rounded-xl transition-all duration-200 shadow-[0_4px_16px_rgba(41,78,67,0.18)] cursor-pointer"
            >
              <span>Open chat demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onExploreScroll}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium text-[#202522] bg-[#E5E0D7]/60 hover:bg-[#E5E0D7] active:scale-[0.98] border border-[#202522]/10 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <span>Explore the experience</span>
              <ChevronDown className="w-4 h-4 text-[#777D76]" />
            </button>
          </div>

          {/* Restrained Technical Caption */}
          <div className="flex items-center gap-2 text-xs text-[#777D76] font-mono animate-in fade-in duration-700 delay-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#294E43]" />
            <span>Designed for a Java + WebSocket backend.</span>
          </div>

          {/* Keyboard accessible node selector bar below hero text on larger screens */}
          <div className="mt-8 hidden sm:block animate-in fade-in duration-700 delay-500">
            <NodeSelectorBar
              selectedNodeId={selectedNode ? selectedNode.id : null}
              onSelectNode={(node) => setSelectedNode(node)}
            />
          </div>
        </div>

        {/* Right Column: Interactive 3D Sculpture */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative animate-in fade-in zoom-in-95 duration-1000 delay-150">
          <div className="w-full relative">
            <ConversationConstellation
              onSelectNode={(node) => setSelectedNode(node)}
            />
          </div>

          {/* Mobile node selector for touch screens */}
          <div className="w-full sm:hidden mt-2">
            <NodeSelectorBar
              selectedNodeId={selectedNode ? selectedNode.id : null}
              onSelectNode={(node) => setSelectedNode(node)}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
