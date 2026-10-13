import React, { useState } from 'react';
import { Search, Users, MessageSquare, CornerDownRight, CheckCheck, Clock } from 'lucide-react';

export const FeatureSection: React.FC = () => {
  // Feature 01 interactive state
  const [activeChannelTab, setActiveChannelTab] = useState<'general' | 'project'>('project');

  // Feature 02 interactive state
  const [activeSplitMode, setActiveSplitMode] = useState<'split' | 'dm'>('split');

  // Feature 03 interactive state
  const [userFilter, setUserFilter] = useState<'all' | 'available' | 'away'>('all');

  // Feature 04 interactive state
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data for feature 03
  const studentUsers = [
    { name: 'Maya Chen', role: 'Lab Partner · CS 340', status: 'available', time: 'Active now' },
    { name: 'Liam Patel', role: 'Project Lead', status: 'available', time: 'Active now' },
    { name: 'Elena Rostova', role: 'Systems Architecture', status: 'away', time: '14m ago' },
    { name: 'Marcus Vance', role: 'Network Testing', status: 'offline', time: '2h ago' },
  ];

  const filteredUsers = studentUsers.filter((u) => {
    if (userFilter === 'all') return true;
    return u.status === userFilter;
  });

  // Sample data for feature 04
  const historyMessages = [
    {
      date: 'Yesterday',
      sender: 'Liam Patel',
      time: '4:15 PM',
      text: 'Finalized the bytebuffer allocation strategy. We are pooling 16KB buffers to avoid GC pauses.',
    },
    {
      date: 'Yesterday',
      sender: 'Elena Rostova',
      time: '4:22 PM',
      text: 'Verified on macOS and Ubuntu. The Selector wakes up cleanly without lingering open channels.',
    },
    {
      date: 'Today',
      sender: 'Maya Chen',
      time: '10:05 AM',
      text: 'Running the concurrent load test now with 20 parallel threads connecting simultaneously.',
    },
    {
      date: 'Today',
      sender: 'Sofia Alvarez',
      time: '10:48 AM',
      text: 'Lab check-in scheduled for 3 PM today in Tech Hall 214. Great progress on the frame parser!',
    },
  ];

  const filteredHistory = historyMessages.filter((m) =>
    searchQuery.trim() === ''
      ? true
      : m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="mb-16">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D36C43]" />
          <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#777D76]">
            Architected for Campus Collaboration
          </span>
        </div>
        <h2 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-[#202522]">
          Built with intent. Focused on conversation.
        </h2>
        <p className="mt-3 text-base text-[#202522]/80 max-w-2xl">
          Everything you need for spontaneous group work, focused capstone debates, and quiet peer coordination across your subnet.
        </p>
      </div>

      {/* 4 Editorial Feature Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feature 01: A room for everyone */}
        <div
          className="group relative bg-[#F4F1EB] border border-[#202522]/12 rounded-2xl p-7 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          style={{ transform: 'perspective(1000px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-2xl font-light text-[#294E43]">01</span>
            <span className="text-[11px] font-mono text-[#777D76] uppercase tracking-wider">
              Product Preview · Group Workspaces
            </span>
          </div>

          <h3 className="font-serif text-2xl font-semibold text-[#202522] mb-2">
            A room for everyone.
          </h3>
          <p className="text-sm text-[#202522]/80 leading-relaxed mb-6">
            Shared channels organized by lab project, study group, or dormitory floor. Instant packet broadcast with no cloud relay.
          </p>

          {/* Interactive Preview Container */}
          <div className="bg-[#E5E0D7]/40 border border-[#202522]/10 rounded-xl p-4">
            {/* Interactive Channel Selector Bar */}
            <div className="flex items-center justify-between border-b border-[#202522]/10 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveChannelTab('project')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    activeChannelTab === 'project'
                      ? 'bg-[#294E43] text-[#F4F1EB]'
                      : 'text-[#202522]/70 hover:bg-[#E5E0D7]'
                  }`}
                >
                  # project-team
                </button>
                <button
                  onClick={() => setActiveChannelTab('general')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    activeChannelTab === 'general'
                      ? 'bg-[#294E43] text-[#F4F1EB]'
                      : 'text-[#202522]/70 hover:bg-[#E5E0D7]'
                  }`}
                >
                  # general
                </button>
              </div>
              <span className="text-[11px] text-[#777D76] font-mono">5 peers listening</span>
            </div>

            {/* Conversation Flow */}
            <div className="space-y-3">
              {activeChannelTab === 'project' ? (
                <>
                  <div className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-full bg-[#D36C43] text-[#F4F1EB] flex items-center justify-center text-xs font-semibold shrink-0">
                      LP
                    </div>
                    <div className="flex-1 bg-[#F4F1EB] border border-[#202522]/10 rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#202522]">Liam Patel</span>
                        <span className="text-[10px] text-[#777D76]">10:14 AM</span>
                      </div>
                      <p className="text-xs text-[#202522]/90">
                        Bytebuffer capacity raised to 64KB. Ready for raw audio streams next sprint.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-full bg-[#294E43] text-[#F4F1EB] flex items-center justify-center text-xs font-semibold shrink-0">
                      MC
                    </div>
                    <div className="flex-1 bg-[#F4F1EB] border border-[#202522]/10 rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#202522]">Maya Chen</span>
                        <span className="text-[10px] text-[#777D76]">10:16 AM</span>
                      </div>
                      <p className="text-xs text-[#202522]/90">
                        Tested 20 simultaneous connections on localhost. Concurrency looks rock solid!
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full bg-[#7A5C58] text-[#F4F1EB] flex items-center justify-center text-xs font-semibold shrink-0">
                    SA
                  </div>
                  <div className="flex-1 bg-[#F4F1EB] border border-[#202522]/10 rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[#202522]">Sofia Alvarez</span>
                      <span className="text-[10px] text-[#777D76]">9:30 AM</span>
                    </div>
                    <p className="text-xs text-[#202522]/90">
                      Welcome to the lab LAN network! Remember to connect to port 8080.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature 02: Take it aside */}
        <div
          className="group relative bg-[#F4F1EB] border border-[#202522]/12 rounded-2xl p-7 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          style={{ transform: 'perspective(1000px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-2xl font-light text-[#294E43]">02</span>
            <span className="text-[11px] font-mono text-[#777D76] uppercase tracking-wider">
              Product Preview · Direct Messages
            </span>
          </div>

          <h3 className="font-serif text-2xl font-semibold text-[#202522] mb-2">
            Take it aside.
          </h3>
          <p className="text-sm text-[#202522]/80 leading-relaxed mb-6">
            Pivot from a crowded channel to an encrypted 1-on-1 direct thread with a single click. Keep private discussions distinct and focused.
          </p>

          {/* Interactive Split View */}
          <div className="bg-[#E5E0D7]/40 border border-[#202522]/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 border-b border-[#202522]/10 pb-2">
              <span className="text-xs font-medium text-[#202522]">Relationship View</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveSplitMode('split')}
                  className={`px-2.5 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                    activeSplitMode === 'split' ? 'bg-[#202522] text-[#F4F1EB]' : 'text-[#777D76]'
                  }`}
                >
                  Side-by-side
                </button>
                <button
                  onClick={() => setActiveSplitMode('dm')}
                  className={`px-2.5 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                    activeSplitMode === 'dm' ? 'bg-[#202522] text-[#F4F1EB]' : 'text-[#777D76]'
                  }`}
                >
                  Direct only
                </button>
              </div>
            </div>

            <div className={`grid ${activeSplitMode === 'split' ? 'grid-cols-2 gap-2' : 'grid-cols-1'} text-xs`}>
              {activeSplitMode === 'split' && (
                <div className="bg-[#F4F1EB] border border-[#202522]/10 rounded-lg p-2.5 opacity-75">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#777D76] mb-1.5">
                    <MessageSquare className="w-3 h-3 text-[#294E43]" />
                    <span># project-team</span>
                  </div>
                  <p className="text-[11px] text-[#202522]/80 leading-normal">
                    “Can someone double-check my buffer loop implementation?”
                  </p>
                  <div className="mt-2 text-[10px] text-[#D36C43] flex items-center gap-1 font-mono">
                    <CornerDownRight className="w-3 h-3" />
                    <span>Branched to DM</span>
                  </div>
                </div>
              )}

              <div className="bg-[#F4F1EB] border-2 border-[#294E43]/40 rounded-lg p-2.5 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#202522] mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#294E43]" />
                    <span>Maya Chen (Direct)</span>
                  </div>
                  <span className="text-[10px] text-[#777D76]">10:18 AM</span>
                </div>
                <p className="text-[11px] text-[#202522] leading-normal">
                  “I saw your question in #project-team. Check lines 42–48 in SocketReader.java, you need selector.wakeup().”
                </p>
                <div className="mt-2 text-[10px] text-[#294E43] font-medium flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" />
                  <span>Delivered via direct socket</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 03: Know who's around */}
        <div
          className="group relative bg-[#F4F1EB] border border-[#202522]/12 rounded-2xl p-7 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          style={{ transform: 'perspective(1000px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-2xl font-light text-[#294E43]">03</span>
            <span className="text-[11px] font-mono text-[#777D76] uppercase tracking-wider">
              Product Preview · Presence
            </span>
          </div>

          <h3 className="font-serif text-2xl font-semibold text-[#202522] mb-2">
            Know who’s around.
          </h3>
          <p className="text-sm text-[#202522]/80 leading-relaxed mb-6">
            Real-time ping telemetry without battery drain. See instantly who is stationed in the lab, studying in the library, or away.
          </p>

          {/* Interactive User List */}
          <div className="bg-[#E5E0D7]/40 border border-[#202522]/10 rounded-xl p-4">
            <div className="flex items-center justify-between border-b border-[#202522]/10 pb-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-[#202522] font-medium">
                <Users className="w-3.5 h-3.5 text-[#294E43]" />
                <span>Stationed Peers ({filteredUsers.length})</span>
              </div>
              <div className="flex gap-1 text-[11px]">
                {(['all', 'available', 'away'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setUserFilter(filter)}
                    className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                      userFilter === filter
                        ? 'bg-[#294E43] text-[#F4F1EB]'
                        : 'text-[#777D76] hover:bg-[#E5E0D7]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.name}
                  className="flex items-center justify-between bg-[#F4F1EB] border border-[#202522]/10 rounded-lg px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        user.status === 'available'
                          ? 'bg-[#294E43]'
                          : user.status === 'away'
                          ? 'bg-[#D36C43]'
                          : 'bg-[#777D76]'
                      }`}
                    />
                    <div>
                      <div className="font-medium text-[#202522]">{user.name}</div>
                      <div className="text-[10px] text-[#777D76]">{user.role}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#777D76]">{user.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature 04: Pick up where you left off */}
        <div
          className="group relative bg-[#F4F1EB] border border-[#202522]/12 rounded-2xl p-7 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          style={{ transform: 'perspective(1000px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-2xl font-light text-[#294E43]">04</span>
            <span className="text-[11px] font-mono text-[#777D76] uppercase tracking-wider">
              Product Preview · Fast History Search
            </span>
          </div>

          <h3 className="font-serif text-2xl font-semibold text-[#202522] mb-2">
            Pick up where you left off.
          </h3>
          <p className="text-sm text-[#202522]/80 leading-relaxed mb-6">
            Fast in-session indexing with clean chronological date separators. Jump directly to socket parameters, code snippets, or team updates.
          </p>

          {/* Interactive Search Preview */}
          <div className="bg-[#E5E0D7]/40 border border-[#202522]/10 rounded-xl p-4">
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#777D76]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history (e.g. 'bytebuffer', 'selector', 'maya')..."
                className="w-full bg-[#F4F1EB] border border-[#202522]/15 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#202522] placeholder:text-[#777D76]/70 focus:outline-none focus:border-[#294E43]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#777D76] hover:text-[#202522]"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F4F1EB] border border-[#202522]/10 rounded-lg p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#777D76] mb-1">
                      <span className="font-medium text-[#202522]">{m.sender}</span>
                      <span>
                        {m.date} · {m.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#202522]/90 leading-tight">{m.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-[#777D76]">
                  No messages matched "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
