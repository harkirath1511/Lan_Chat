import React, { useEffect, useRef, useState } from 'react';
import {
  ConnectionState,
  Conversation,
  Message,
  MessageAttachment,
  User,
  UserStatus,
} from '../../types/chat';
import { chatService, chatServiceManager } from '../../services/chatService';
import { CommonSymbol } from '../common/CommonSymbol';
import { CreateChannelModal } from './CreateChannelModal';
import { ChatPreferences, SettingsModal } from './SettingsModal';
import { EmojiPickerPopover } from './EmojiPickerPopover';
import {
  Hash,
  MessageSquare,
  Users,
  Search,
  Settings,
  ArrowLeft,
  Send,
  Paperclip,
  Smile,
  X,
  ChevronDown,
  Plus,
  ArrowDown,
  Info,
  CheckCheck,
  Check,
  PanelRightClose,
  PanelRightOpen,
  Circle,
  Menu,
  RotateCcw,
  LogOut,
  UserPlus,
  Radio,
} from 'lucide-react';
import { getSavedServerConfig } from '../../utils/apiConfig';

interface ChatWorkspaceProps {
  onNavigateHome: () => void;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({ onNavigateHome }) => {
  const isRealMode = chatService.isRealMode;
  const [connectionState, setConnectionState] = useState<ConnectionState>(() =>
    chatService.getConnectionState()
  );

  // Master lists
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    chatService.getConversations()
  );
  const [users, setUsers] = useState<User[]>(() => chatService.getUsers());
  const [activeConversationId, setActiveConversationId] = useState<string>('chan_project');

  // Messages and typing
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // { conversationId: userName }

  // Drafts per conversation
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [currentAttachment, setCurrentAttachment] = useState<MessageAttachment | null>(null);

  // Search in conversation
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Right panel user search
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);

  // UI Panels and Drawers
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileRightPanelOpen, setIsMobileRightPanelOpen] = useState(false);

  // Modals
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // User presence dropdown
  const [currentUserStatus, setCurrentUserStatus] = useState<UserStatus>('available');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Preferences
  const [preferences, setPreferences] = useState<ChatPreferences>({
    soundEnabled: true,
    compactMode: false,
    timeFormat24h: false,
  });

  // Scroll tracking
  const messageEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const isUserScrolledUpRef = useRef(false);

  // File input ref for attachment simulation
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Typing debounce timer
  const typingTimeoutRef = useRef<number | null>(null);

  // Active conversation object
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ||
    conversations[0] || {
      id: 'chan_general',
      type: 'channel',
      name: 'general',
      description: 'Campus LAN commons',
      memberIds: [],
    };

  // Current draft for active conversation
  const currentDraft = drafts[activeConversationId] || '';

  // Load message history on active conversation change
  useEffect(() => {
    let isMounted = true;
    chatService.loadHistory(activeConversationId).then((history) => {
      if (isMounted) {
        setMessages(history);

        // Mark conversation read on backend if there are messages
        if (history.length > 0) {
          const latest = history[history.length - 1];
          if (latest.sequenceNum) {
            chatService.markConversationRead(activeConversationId, latest.sequenceNum);
          }
        }

        // Reset scroll position to bottom
        setTimeout(() => {
          messageEndRef.current?.scrollIntoView({ behavior: 'auto' });
          isUserScrolledUpRef.current = false;
          setShowScrollBottomBtn(false);
        }, 50);
      }
    });

    // Mark unread as 0 for this conversation locally
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
    );

    return () => {
      isMounted = false;
      // Clear typing states if leaving
      setTypingUsers((prev) => {
        const copy = { ...prev };
        delete copy[activeConversationId];
        return copy;
      });
    };
  }, [activeConversationId]);

  // Subscribe to chat events
  useEffect(() => {
    const unsubMsg = chatService.subscribe('message', (newMsg) => {
      // If message belongs to active conversation
      if (newMsg.conversationId === activeConversationId) {
        setMessages((prev) => {
          // If we already have this message (e.g. pending reconciled with serverId or clientMessageId)
          const existingIdx = prev.findIndex(
            (m) =>
              (newMsg.clientMessageId && m.clientMessageId === newMsg.clientMessageId) ||
              (newMsg.id && m.id === newMsg.id)
          );
          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = newMsg;
            return updated;
          }
          return [...prev, newMsg];
        });

        // Mark read if viewer is on this conversation
        if (newMsg.sequenceNum) {
          chatService.markConversationRead(activeConversationId, newMsg.sequenceNum);
        }

        // If user is scrolled up, show "New messages below ↓", else auto-scroll
        if (isUserScrolledUpRef.current) {
          setShowScrollBottomBtn(true);
        } else {
          setTimeout(() => {
            messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 60);
        }
      } else {
        // Increment unread count for other conversations
        setConversations((prev) =>
          prev.map((c) =>
            c.id === newMsg.conversationId
              ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
              : c
          )
        );
      }

      // Play chime if enabled and not sent by current user
      if (preferences.soundEnabled && !newMsg.isCurrentUser) {
        try {
          const audioCtx = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
          osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.25);
        } catch {
          // Audio disabled
        }
      }
    });

    const unsubTyping = chatService.subscribe('typing', (data) => {
      setTypingUsers((prev) => {
        const copy = { ...prev };
        if (data.isTyping) {
          copy[data.conversationId] = data.userName;
        } else {
          delete copy[data.conversationId];
        }
        return copy;
      });
    });

    const unsubPresence = chatService.subscribe('presence', (data) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === data.userId ? { ...u, status: data.status } : u))
      );
    });

    const unsubConv = chatService.subscribe('conversationUpdated', (conv) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conv.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = conv;
          return updated;
        }
        return [conv, ...prev];
      });
    });

    const unsubConn = chatService.subscribe('connectionStateChanged', (state) => {
      setConnectionState(state);
      if (state === 'connected') {
        setConversations(chatService.getConversations());
        setUsers(chatService.getUsers());
      }
    });

    const unsubAuth = chatService.subscribe('authExpired', () => {
      alert('Your LAN session has expired. Please sign in again.');
      onNavigateHome();
    });

    return () => {
      unsubMsg();
      unsubTyping();
      unsubPresence();
      unsubConv();
      unsubConn();
      unsubAuth();
    };
  }, [activeConversationId, preferences.soundEnabled, onNavigateHome]);

  // Handle scroll detection
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    if (distanceFromBottom > 120) {
      isUserScrolledUpRef.current = true;
    } else {
      isUserScrolledUpRef.current = false;
      setShowScrollBottomBtn(false);
    }
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    isUserScrolledUpRef.current = false;
    setShowScrollBottomBtn(false);
  };

  // Draft update with typing indicator throttling
  const handleDraftChange = (text: string) => {
    setDrafts((prev) => ({ ...prev, [activeConversationId]: text }));

    // Send typing event
    if (text.trim().length > 0) {
      chatService.sendTyping(activeConversationId, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        chatService.sendTyping(activeConversationId, false);
      }, 2500);
    } else {
      chatService.sendTyping(activeConversationId, false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    const trimmed = currentDraft.trim();
    if (!trimmed && !currentAttachment) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    chatService.sendTyping(activeConversationId, false);

    const attachmentToSend = currentAttachment || undefined;
    setCurrentAttachment(null);
    setDrafts((prev) => ({ ...prev, [activeConversationId]: '' }));

    await chatService.sendMessage(activeConversationId, trimmed, undefined, attachmentToSend);

    // Scroll to bottom immediately
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      isUserScrolledUpRef.current = false;
      setShowScrollBottomBtn(false);
    }, 40);
  };

  // Retry failed message
  const handleRetryMessage = async (msg: Message) => {
    if (msg.clientMessageId) {
      await chatService.retryMessage(activeConversationId, msg.clientMessageId);
    }
  };

  // Handle keydown in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle simulated file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeKb = Math.round(file.size / 1024);
      setCurrentAttachment({
        name: file.name,
        size: `${sizeKb} KB`,
        type: file.type || 'file',
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle create channel
  const handleCreateChannel = async (name: string, description: string) => {
    const created = await chatService.createChannel(name, description);
    setConversations((prev) => [created, ...prev]);
    setActiveConversationId(created.id);
    return created;
  };

  // Handle user search in right panel
  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      setSearchedUsers([]);
      return;
    }
    const results = await chatService.searchUsers(query);
    setSearchedUsers(results);
  };

  // Start Direct Message with user
  const handleStartDirectMessage = async (user: User) => {
    if (user.isCurrentUser) return;
    try {
      const conv = await chatService.openDirectConversation(user.id);
      setActiveConversationId(conv.id);
      setIsMobileSidebarOpen(false);
      setIsMobileRightPanelOpen(false);
      setUserSearchQuery('');
      setSearchedUsers([]);
    } catch (err: any) {
      alert(err.message || 'Could not start direct conversation');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (window.confirm('Log out from this station?')) {
      await chatService.logout();
      onNavigateHome();
    }
  };

  // Filter messages by search query
  const displayedMessages = messages.filter((m) =>
    searchQuery.trim() === ''
      ? true
      : m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group messages by date
  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (preferences.timeFormat24h) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Get current user details
  const currentUser = chatService.getCurrentUser() || users.find((u) => u.isCurrentUser) || users[0] || {
    id: 'current_user',
    name: 'You',
    handle: '@station',
    status: 'available',
    avatarColor: '#294E43',
    role: 'Local Station',
  };

  const serverConfig = getSavedServerConfig();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F1EB] text-[#202522]">
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR: Brand, Channels, DMs, User Controls      */}
      {/* ========================================================= */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-[#E5E0D7]/70 border-r border-[#202522]/12 flex flex-col justify-between transition-transform duration-200 ease-out md:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Brand & Real Connection State Badge */}
          <div className="p-4 border-b border-[#202522]/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <CommonSymbol size={20} color="#294E43" />
              <span className="font-serif text-lg font-semibold tracking-wider text-[#202522]">
                COMMON
              </span>
            </div>

            {/* Connection Status Badge */}
            <div className="flex items-center gap-1.5">
              {isRealMode ? (
                connectionState === 'connected' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#294E43]/15 text-[#294E43] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#294E43] animate-pulse" />
                    LAN :{serverConfig.port}
                  </span>
                ) : connectionState === 'reconnecting' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#D36C43]/15 text-[#D36C43] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D36C43] animate-bounce" />
                    Reconnecting
                  </span>
                ) : connectionState === 'connecting' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#D36C43]/15 text-[#D36C43] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D36C43] animate-pulse" />
                    Connecting
                  </span>
                ) : (
                  <button
                    onClick={() => chatService.connect(serverConfig)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    Reconnect
                  </button>
                )
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#D36C43]/15 text-[#D36C43] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D36C43]" />
                  Demo Mode
                </span>
              )}

              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="md:hidden p-1 text-[#777D76] hover:text-[#202522]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current User Card + Availability Dropdown */}
          <div className="p-3 border-b border-[#202522]/10 bg-[#F4F1EB]/50 shrink-0">
            <div className="relative">
              <div
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#E5E0D7]/70 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-[#202522] text-[#F4F1EB] flex items-center justify-center text-xs font-semibold">
                      {currentUser.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#F4F1EB] ${
                        currentUserStatus === 'available' ? 'bg-[#294E43]' : 'bg-[#D36C43]'
                      }`}
                    />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-[#202522] truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-[#777D76] capitalize flex items-center gap-1">
                      <span>{currentUserStatus}</span>
                      <span>·</span>
                      <span className="font-mono truncate">{serverConfig.host}:{serverConfig.port}</span>
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#777D76]" />
              </div>

              {/* Status Dropdown */}
              {isStatusDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-[#F4F1EB] border border-[#202522]/15 rounded-xl shadow-lg p-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setCurrentUserStatus('available');
                      chatService.setPresence('available');
                      setIsStatusDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 hover:bg-[#E5E0D7] text-[#202522] cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#294E43]" />
                    <span className="font-medium">Available</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentUserStatus('away');
                      chatService.setPresence('away');
                      setIsStatusDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 hover:bg-[#E5E0D7] text-[#202522] cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#D36C43]" />
                    <span className="font-medium">Away</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Channels & DMs list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            {/* Shared Channels Section */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#777D76] px-2 mb-1.5">
                <span>Shared Channels</span>
                <button
                  onClick={() => setIsCreateChannelOpen(true)}
                  className="p-1 hover:text-[#202522] rounded transition-colors cursor-pointer"
                  title="Create channel"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-0.5">
                {conversations
                  .filter((c) => c.type === 'channel')
                  .map((channel) => {
                    const isActive = activeConversationId === channel.id;
                    return (
                      <button
                        key={channel.id}
                        onClick={() => {
                          setActiveConversationId(channel.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#294E43] text-[#F4F1EB] font-medium shadow-xs'
                            : 'text-[#202522]/80 hover:bg-[#E5E0D7] hover:text-[#202522]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Hash
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? 'text-[#F4F1EB]' : 'text-[#777D76]'
                            }`}
                          />
                          <span className="truncate">{channel.name}</span>
                        </div>
                        {channel.unreadCount && channel.unreadCount > 0 ? (
                          <span className="bg-[#D36C43] text-[#F4F1EB] text-[10px] font-mono px-1.5 py-0.2 rounded-full">
                            {channel.unreadCount}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Direct Messages Section */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#777D76] px-2 mb-1.5">
                <span>Direct Messages</span>
                <button
                  onClick={() => {
                    setIsRightPanelOpen(true);
                    setIsMobileRightPanelOpen(true);
                  }}
                  className="p-1 hover:text-[#202522] rounded transition-colors cursor-pointer"
                  title="Find peers"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-0.5">
                {conversations
                  .filter((c) => c.type === 'dm')
                  .map((dm) => {
                    const isActive = activeConversationId === dm.id;
                    const partnerUser = users.find((u) => u.id === dm.dmUserId);
                    const partnerStatus = partnerUser?.status || 'offline';

                    return (
                      <button
                        key={dm.id}
                        onClick={() => {
                          setActiveConversationId(dm.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#294E43] text-[#F4F1EB] font-medium shadow-xs'
                            : 'text-[#202522]/80 hover:bg-[#E5E0D7] hover:text-[#202522]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="relative shrink-0">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-[#F4F1EB] bg-[#436155]"
                            >
                              {dm.name.substring(0, 1).toUpperCase()}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#F4F1EB] ${
                                partnerStatus === 'available'
                                  ? 'bg-[#294E43]'
                                  : partnerStatus === 'away'
                                  ? 'bg-[#D36C43]'
                                  : 'bg-[#777D76]'
                              }`}
                            />
                          </div>
                          <span className="truncate">{dm.name}</span>
                        </div>
                        {dm.unreadCount && dm.unreadCount > 0 ? (
                          <span className="bg-[#D36C43] text-[#F4F1EB] text-[10px] font-mono px-1.5 py-0.2 rounded-full">
                            {dm.unreadCount}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Bottom Sidebar Actions: Settings, Logout, Return to Home */}
          <div className="p-3 border-t border-[#202522]/10 bg-[#E5E0D7]/50 flex items-center justify-between shrink-0">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-[#202522]/80 hover:text-[#294E43] px-2 py-1 rounded hover:bg-[#E5E0D7] transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            {isRealMode ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs text-[#D36C43] hover:text-red-700 px-2 py-1 rounded hover:bg-[#E5E0D7] transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            ) : (
              <button
                onClick={onNavigateHome}
                className="inline-flex items-center gap-1.5 text-xs text-[#777D76] hover:text-[#202522] px-2 py-1 rounded hover:bg-[#E5E0D7] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-[#202522]/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ========================================================= */}
      {/* 2. CENTER CONVERSATION: Stream, Date Separators, Composer  */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F1EB] relative">
        {/* Top Conversation Header */}
        <header className="h-16 px-4 sm:px-6 border-b border-[#202522]/10 flex items-center justify-between shrink-0 bg-[#F4F1EB]/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 truncate">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 text-[#202522] hover:bg-[#E5E0D7] rounded-lg cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 truncate">
              {activeConversation.type === 'channel' ? (
                <Hash className="w-5 h-5 text-[#294E43] shrink-0" />
              ) : (
                <MessageSquare className="w-4 h-4 text-[#D36C43] shrink-0" />
              )}
              <div className="truncate">
                <h2 className="font-serif text-base sm:text-lg font-semibold text-[#202522] leading-none truncate">
                  {activeConversation.name}
                </h2>
                <p className="text-xs text-[#777D76] truncate mt-0.5">
                  {activeConversation.topic || activeConversation.description || 'Local LAN conversation'}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons on header */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Toggle */}
            <button
              onClick={() => {
                setIsSearching(!isSearching);
                if (isSearching) setSearchQuery('');
              }}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isSearching
                  ? 'bg-[#294E43] text-[#F4F1EB]'
                  : 'text-[#777D76] hover:text-[#202522] hover:bg-[#E5E0D7]'
              }`}
              title="Search conversation"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Toggle Right Info Panel */}
            <button
              onClick={() => {
                setIsRightPanelOpen(!isRightPanelOpen);
                setIsMobileRightPanelOpen(!isMobileRightPanelOpen);
              }}
              className="p-2 text-[#777D76] hover:text-[#202522] hover:bg-[#E5E0D7] rounded-lg transition-colors cursor-pointer"
              title="Toggle details panel"
            >
              {isRightPanelOpen ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* Search Bar when expanded */}
        {isSearching && (
          <div className="px-6 py-2.5 bg-[#E5E0D7]/40 border-b border-[#202522]/10 flex items-center gap-2 animate-in slide-in-from-top-1 duration-150">
            <Search className="w-4 h-4 text-[#777D76] shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages in this conversation..."
              className="flex-1 bg-transparent text-xs text-[#202522] focus:outline-none placeholder:text-[#777D76]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-[#777D76] hover:text-[#202522]"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Message Feed Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4"
        >
          {/* Welcome announcement banner at top */}
          <div className="text-center py-4 border-b border-[#202522]/10 max-w-md mx-auto">
            <div className="w-8 h-8 rounded-full bg-[#E5E0D7] text-[#294E43] flex items-center justify-center mx-auto mb-2">
              <CommonSymbol size={16} color="#294E43" />
            </div>
            <h3 className="font-serif text-base font-semibold text-[#202522]">
              {activeConversation.type === 'channel' ? `#${activeConversation.name}` : activeConversation.name}
            </h3>
            <p className="text-xs text-[#777D76] mt-1">
              {isRealMode
                ? `Active socket connection to ${serverConfig.host}:${serverConfig.port}. Messages are persisted in database.`
                : 'Demo preview mode. Simulated peer responses active.'}
            </p>
          </div>

          {/* Date Separator */}
          <div className="flex items-center justify-center my-4">
            <span className="text-[11px] font-mono text-[#777D76] bg-[#E5E0D7]/60 border border-[#202522]/10 px-3 py-0.5 rounded-full">
              Today
            </span>
          </div>

          {/* Render Messages */}
          {displayedMessages.map((msg, idx) => {
            const isSelf = msg.isCurrentUser || (currentUser && msg.senderId === currentUser.id);
            const senderUser = users.find((u) => u.id === msg.senderId);

            return (
              <div
                key={msg.id || msg.clientMessageId || idx}
                className={`flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                  isSelf ? 'flex-row-reverse' : 'flex-row'
                } ${preferences.compactMode ? 'py-0.5' : 'py-1'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 select-none shadow-xs ${
                    isSelf ? 'bg-[#202522] text-[#F4F1EB]' : 'text-[#F4F1EB]'
                  }`}
                  style={!isSelf ? { backgroundColor: senderUser?.avatarColor || '#294E43' } : undefined}
                >
                  {isSelf
                    ? 'YOU'
                    : msg.senderName
                    ? msg.senderName.substring(0, 2).toUpperCase()
                    : 'PE'}
                </div>

                {/* Message Body */}
                <div className={`max-w-[78%] sm:max-w-[68%] ${isSelf ? 'text-right' : 'text-left'}`}>
                  {/* Sender Name & Timestamp */}
                  <div
                    className={`flex items-baseline gap-2 mb-1 ${
                      isSelf ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span className="text-xs font-semibold text-[#202522]">
                      {isSelf ? 'You' : msg.senderName}
                    </span>
                    <span className="text-[10px] text-[#777D76] font-mono">
                      {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>

                  {/* Bubble Content */}
                  <div
                    className={`inline-block rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed break-words shadow-xs ${
                      isSelf
                        ? msg.deliveryStatus === 'failed'
                          ? 'bg-red-50 text-red-900 border border-red-300 rounded-tr-xs text-left'
                          : msg.deliveryStatus === 'sending'
                          ? 'bg-[#294E43]/80 text-[#F4F1EB] rounded-tr-xs text-left'
                          : 'bg-[#294E43] text-[#F4F1EB] rounded-tr-xs text-left'
                        : 'bg-[#E5E0D7]/50 text-[#202522] border border-[#202522]/10 rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Attachment preview if present */}
                    {msg.attachment && (
                      <div
                        className={`mt-2 p-2 rounded-xl flex items-center gap-2 border ${
                          isSelf
                            ? 'bg-[#1F3C34] border-[#F4F1EB]/20 text-[#F4F1EB]'
                            : 'bg-[#F4F1EB] border-[#202522]/10 text-[#202522]'
                        }`}
                      >
                        <Paperclip className="w-3.5 h-3.5 shrink-0 opacity-80" />
                        <div className="truncate text-left">
                          <div className="text-[11px] font-medium truncate">
                            {msg.attachment.name}
                          </div>
                          <div className="text-[9px] opacity-70 font-mono">
                            {msg.attachment.size} · Preview only
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery / Failed status indicator */}
                  {isSelf && (
                    <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-[#777D76]">
                      {msg.deliveryStatus === 'sending' && (
                        <span className="italic text-[#777D76]">Sending...</span>
                      )}
                      {msg.deliveryStatus === 'delivered' && (
                        <>
                          <CheckCheck className="w-3 h-3 text-[#294E43]" />
                          <span>Delivered</span>
                        </>
                      )}
                      {msg.deliveryStatus === 'failed' && (
                        <div className="flex items-center gap-1 text-red-600">
                          <span>Send failed</span>
                          <button
                            onClick={() => handleRetryMessage(msg)}
                            className="inline-flex items-center gap-1 font-semibold underline hover:text-red-800 cursor-pointer ml-1"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            Retry
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator for active conversation */}
          {typingUsers[activeConversationId] && (
            <div className="flex items-center gap-2 text-xs text-[#777D76] pt-1 animate-in fade-in duration-200">
              <div className="flex gap-1 items-center bg-[#E5E0D7]/40 border border-[#202522]/10 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#294E43] animate-bounce" />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#294E43] animate-bounce"
                  style={{ animationDelay: '0.15s' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#294E43] animate-bounce"
                  style={{ animationDelay: '0.3s' }}
                />
                <span className="ml-1 text-[11px]">
                  {typingUsers[activeConversationId]} is typing...
                </span>
              </div>
            </div>
          )}

          <div ref={messageEndRef} />
        </div>

        {/* Floating "New messages below" indicator when scrolled up */}
        {showScrollBottomBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 right-8 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#294E43] text-[#F4F1EB] text-xs font-medium rounded-full shadow-lg hover:bg-[#1F3C34] transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <span>New messages below</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        )}

        {/* ========================================================= */}
        {/* Composer Bar Anchored at Bottom                           */}
        {/* ========================================================= */}
        <div className="p-4 bg-[#F4F1EB] border-t border-[#202522]/10 shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* Attachment preview banner */}
            {currentAttachment && (
              <div className="mb-2 p-2 bg-[#E5E0D7]/60 border border-[#202522]/12 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-3.5 h-3.5 text-[#294E43]" />
                  <span className="font-medium text-[#202522]">{currentAttachment.name}</span>
                  <span className="text-[10px] text-[#777D76]">({currentAttachment.size})</span>
                  <span className="text-[10px] text-[#D36C43] font-mono ml-2">
                    Preview only — file transfer is not connected
                  </span>
                </div>
                <button
                  onClick={() => setCurrentAttachment(null)}
                  className="p-1 text-[#777D76] hover:text-[#202522]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="relative bg-[#E5E0D7]/40 border border-[#202522]/15 rounded-2xl p-2.5 focus-within:border-[#294E43] focus-within:bg-[#F4F1EB] transition-all shadow-xs">
              <textarea
                value={currentDraft}
                onChange={(e) => handleDraftChange(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={preferences.compactMode ? 1 : 2}
                placeholder={`Message #${activeConversation.name}... (Enter to send, Shift+Enter for newline)`}
                className="w-full bg-transparent text-xs sm:text-sm text-[#202522] placeholder:text-[#777D76]/70 focus:outline-none resize-none px-2 py-1 leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2 px-1 border-t border-[#202522]/10 mt-1">
                {/* Formatting & Attachment icons */}
                <div className="flex items-center gap-1.5 text-[#777D76]">
                  {/* File Attachment trigger */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 hover:text-[#202522] hover:bg-[#E5E0D7] rounded-lg transition-colors cursor-pointer"
                    title="Attach file (preview)"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Emoji Picker trigger */}
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    className="p-1.5 hover:text-[#202522] hover:bg-[#E5E0D7] rounded-lg transition-colors cursor-pointer"
                    title="Insert emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  <span className="text-[11px] font-mono text-[#777D76]/70 hidden sm:inline ml-2">
                    Shift+Enter for newline
                  </span>
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!currentDraft.trim() && !currentAttachment}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#F4F1EB] bg-[#294E43] hover:bg-[#1F3C34] active:scale-[0.98] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Emoji Popover */}
              <EmojiPickerPopover
                isOpen={isEmojiPickerOpen}
                onClose={() => setIsEmojiPickerOpen(false)}
                onSelectEmoji={(emoji) => handleDraftChange(currentDraft + emoji)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. RIGHT PANEL: Channel Topic, Registered Peers & Presence */}
      {/* ========================================================= */}
      {isRightPanelOpen && (
        <aside className="w-72 bg-[#E5E0D7]/50 border-l border-[#202522]/12 hidden lg:flex flex-col justify-between shrink-0 overflow-hidden">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Panel Header */}
            <div className="p-4 border-b border-[#202522]/10 flex items-center justify-between shrink-0">
              <span className="font-serif text-sm font-semibold text-[#202522]">
                Conversation Details
              </span>
              <button
                onClick={() => setIsRightPanelOpen(false)}
                className="p-1 text-[#777D76] hover:text-[#202522] rounded cursor-pointer"
                title="Hide panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Channel Topic Card */}
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#777D76] block mb-1.5">
                  About Channel
                </span>
                <div className="bg-[#F4F1EB] border border-[#202522]/10 rounded-xl p-3 text-xs text-[#202522]/85 leading-relaxed">
                  <p>{activeConversation.description || 'General discussion for local peers.'}</p>
                  <div className="mt-2 text-[10px] font-mono text-[#777D76] border-t border-[#202522]/10 pt-1.5">
                    ID: {activeConversation.id}
                  </div>
                </div>
              </div>

              {/* Peer Search for Direct Messaging */}
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#777D76] block mb-1.5">
                  Start Direct Message
                </span>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#777D76]" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    placeholder="Search registered peers..."
                    className="w-full bg-[#F4F1EB] border border-[#202522]/15 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#202522] focus:outline-none focus:border-[#294E43]"
                  />
                </div>

                {searchedUsers.length > 0 && (
                  <div className="bg-[#F4F1EB] border border-[#202522]/15 rounded-xl p-1.5 space-y-1 shadow-sm mb-3">
                    {searchedUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleStartDirectMessage(u)}
                        className="w-full text-left p-1.5 rounded-lg hover:bg-[#E5E0D7] flex items-center justify-between text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              u.status === 'available'
                                ? 'bg-[#294E43]'
                                : u.status === 'away'
                                ? 'bg-[#D36C43]'
                                : 'bg-[#777D76]'
                            }`}
                          />
                          <span className="truncate font-medium">{u.name}</span>
                        </div>
                        <span className="text-[10px] text-[#294E43] font-mono">Chat →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Members List Grouped by Status */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#777D76] mb-2">
                  <span>Registered Station Peers</span>
                  <span>{users.length}</span>
                </div>

                <div className="space-y-1.5">
                  {users.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => !member.isCurrentUser && handleStartDirectMessage(member)}
                      className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                        member.isCurrentUser
                          ? 'bg-[#F4F1EB]/70 border border-[#202522]/10'
                          : 'hover:bg-[#E5E0D7] cursor-pointer'
                      }`}
                      title={!member.isCurrentUser ? `Message ${member.name}` : undefined}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="relative shrink-0">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-[#F4F1EB]"
                            style={{ backgroundColor: member.avatarColor }}
                          >
                            {member.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#F4F1EB] ${
                              member.status === 'available'
                                ? 'bg-[#294E43]'
                                : member.status === 'away'
                                ? 'bg-[#D36C43]'
                                : 'bg-[#777D76]'
                            }`}
                          />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-medium text-[#202522] truncate flex items-center gap-1">
                            <span>{member.name}</span>
                            {member.isCurrentUser && (
                              <span className="text-[10px] text-[#294E43] font-semibold">(You)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#777D76] truncate">
                            {member.role}
                          </div>
                        </div>
                      </div>

                      {!member.isCurrentUser && (
                        <MessageSquare className="w-3.5 h-3.5 text-[#777D76] opacity-0 group-hover:opacity-100 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Subnet Statistics */}
              <div className="bg-[#F4F1EB] border border-[#202522]/10 rounded-xl p-3 text-xs">
                <span className="font-mono text-[10px] uppercase text-[#294E43] font-semibold block mb-1">
                  Active LAN Link
                </span>
                <div className="text-[11px] font-mono text-[#777D76] space-y-0.5">
                  <div>Host: {serverConfig.host}</div>
                  <div>Port: {serverConfig.port}</div>
                  <div>Protocol: Spring Boot WebSocket</div>
                  <div>Mode: {isRealMode ? 'Real LAN Server' : 'Offline Demo'}</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Mobile Right Panel Drawer */}
      {isMobileRightPanelOpen && (
        <div className="fixed inset-0 z-40 bg-[#202522]/40 backdrop-blur-xs lg:hidden flex justify-end">
          <div className="w-80 h-full bg-[#F4F1EB] border-l border-[#202522]/15 p-5 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#202522]/10 mb-4">
                <span className="font-serif text-base font-semibold text-[#202522]">
                  Conversation Info
                </span>
                <button
                  onClick={() => setIsMobileRightPanelOpen(false)}
                  className="p-1 text-[#777D76]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-mono uppercase text-[#777D76] mb-1">Channel</h4>
                <p className="text-xs text-[#202522]">{activeConversation.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase text-[#777D76] mb-2">Registered Peers ({users.length})</h4>
                <div className="space-y-2">
                  {users.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => {
                        setIsMobileRightPanelOpen(false);
                        handleStartDirectMessage(member);
                      }}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#E5E0D7] text-xs cursor-pointer"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          member.status === 'available'
                            ? 'bg-[#294E43]'
                            : member.status === 'away'
                            ? 'bg-[#D36C43]'
                            : 'bg-[#777D76]'
                        }`}
                      />
                      <span className="font-medium">{member.name}</span>
                      <span className="text-[10px] text-[#777D76] ml-auto">{member.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        onCreate={handleCreateChannel}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdatePreferences={(newPrefs) => setPreferences((prev) => ({ ...prev, ...newPrefs }))}
        onResetDemoData={() => {
          chatServiceManager.getMockService().resetDemoData();
          setConversations(chatService.getConversations());
          setUsers(chatService.getUsers());
        }}
      />
    </div>
  );
};
