import React from 'react';
import { useRouter } from './hooks/useRouter';
import { LandingNav } from './components/landing/LandingNav';
import { HeroSection } from './components/landing/HeroSection';
import { ScrollStorySection } from './components/landing/ScrollStorySection';
import { FeatureSection } from './components/landing/FeatureSection';
import { ShowcaseSection } from './components/landing/ShowcaseSection';
import { FooterCtaSection } from './components/landing/FooterCtaSection';
import { JoinScreen } from './components/join/JoinScreen';
import { ChatWorkspace } from './components/chat/ChatWorkspace';

export default function App() {
  const { currentPath, navigate } = useRouter();

  const handleOpenDemo = () => {
    navigate('/join');
  };

  const handleNavigateHome = () => {
    navigate('/');
  };

  const handleJoinSuccess = (_displayName: string) => {
    navigate('/chat');
  };

  const handleExploreScroll = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Route 1: /chat — Full workspace application
  if (currentPath === '/chat') {
    return <ChatWorkspace onNavigateHome={handleNavigateHome} />;
  }

  // Route 2: /join — Display name & connection setup screen
  if (currentPath === '/join') {
    return (
      <JoinScreen
        onJoinSuccess={handleJoinSuccess}
        onNavigateHome={handleNavigateHome}
      />
    );
  }

  // Route 3: / — Editorial product landing page
  return (
    <div className="min-h-screen bg-[#F4F1EB] text-[#202522] flex flex-col font-sans selection:bg-[#294E43] selection:text-[#F4F1EB]">
      {/* Editorial Navigation */}
      <LandingNav
        onOpenDemo={handleOpenDemo}
        onNavigateHome={handleNavigateHome}
      />

      <main className="flex-1">
        {/* Section 4: Asymmetric Hero with 3D Constellation */}
        <HeroSection
          onOpenDemo={handleOpenDemo}
          onExploreScroll={handleExploreScroll}
        />

        {/* Section 5: Scroll-Driven 3-Chapter Network Story */}
        <ScrollStorySection />

        {/* Section 6: Editorial Interactive Features Grid */}
        <FeatureSection />

        {/* Section 7: Contrasting Forest-Green Product Showcase */}
        <ShowcaseSection />

        {/* Section 8: Final Call to Action and Footer */}
        <FooterCtaSection
          onOpenDemo={handleOpenDemo}
          onNavigateHome={handleNavigateHome}
        />
      </main>
    </div>
  );
}
