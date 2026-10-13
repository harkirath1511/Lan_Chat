import {
  ChatService,
  ChatServiceEvents,
  ConnectionState,
  Conversation,
  Message,
  MessageAttachment,
  ServerConfig,
  User,
  UserStatus,
} from '../types/chat';

const STORAGE_KEY_PREFIX = 'common_chat_';

const DEFAULT_USERS: User[] = [
  {
    id: 'user_maya',
    name: 'Maya Chen',
    handle: '@mchen',
    status: 'available',
    avatarColor: '#294E43',
    role: 'Lab Partner · CS 340',
    statusMessage: 'Benchmarking socket buffer limits',
  },
  {
    id: 'user_liam',
    name: 'Liam Patel',
    handle: '@lpatel',
    status: 'available',
    avatarColor: '#D36C43',
    role: 'Project Lead',
    statusMessage: 'Reviewing Java NIO bytebuffer slides',
  },
  {
    id: 'user_elena',
    name: 'Elena Rostova',
    handle: '@erostova',
    status: 'away',
    avatarColor: '#436155',
    role: 'Systems Architecture',
    statusMessage: 'Library 4th floor quiet study',
  },
  {
    id: 'user_marcus',
    name: 'Marcus Vance',
    handle: '@mvance',
    status: 'offline',
    avatarColor: '#6B705C',
    role: 'Network Testing',
    statusMessage: 'Back around 4 PM for lab sign-off',
  },
  {
    id: 'user_sofia',
    name: 'Sofia Alvarez',
    handle: '@salvarez',
    status: 'available',
    avatarColor: '#7A5C58',
    role: 'TA · Distributed Systems',
    statusMessage: 'Office hours in Tech Building 214',
  },
];

const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    id: 'chan_general',
    type: 'channel',
    name: 'general',
    description: 'Campus LAN commons for announcements, campus wifi updates, and quick coordination.',
    topic: 'Testing local packet broadcast on Subnet 192.168.1.0/24',
    memberCount: 28,
    memberIds: ['user_maya', 'user_liam', 'user_elena', 'user_marcus', 'user_sofia'],
    unreadCount: 0,
  },
  {
    id: 'chan_project',
    type: 'channel',
    name: 'project-team',
    description: 'Third-year capstone team workspace: Java NIO server, client protocol, and final submission demo.',
    topic: 'Milestone 3 due next Tuesday — testing multi-client concurrency',
    memberCount: 5,
    memberIds: ['user_maya', 'user_liam', 'user_elena', 'user_marcus'],
    unreadCount: 2,
  },
  {
    id: 'chan_study',
    type: 'channel',
    name: 'study-room',
    description: 'Distributed Systems midterm revision, socket programming notes, and RFC references.',
    topic: 'Chapter 6: RPC vs WebSocket message framing',
    memberCount: 14,
    memberIds: ['user_maya', 'user_elena', 'user_sofia'],
    unreadCount: 0,
  },
  {
    id: 'dm_user_maya',
    type: 'dm',
    name: 'Maya Chen',
    description: 'Direct message with Maya Chen',
    topic: 'Lab Partner · CS 340',
    memberCount: 2,
    memberIds: ['user_maya'],
    dmUserId: 'user_maya',
    unreadCount: 1,
  },
  {
    id: 'dm_user_liam',
    type: 'dm',
    name: 'Liam Patel',
    description: 'Direct message with Liam Patel',
    topic: 'Project Lead',
    memberCount: 2,
    memberIds: ['user_liam'],
    dmUserId: 'user_liam',
    unreadCount: 0,
  },
];

const NOW = Date.now();
const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;

const INITIAL_MESSAGES: Record<string, Message[]> = {
  chan_general: [
    {
      id: 'gen_1',
      conversationId: 'chan_general',
      senderId: 'user_sofia',
      senderName: 'Sofia Alvarez',
      content: 'Reminder to all 3rd year teams: make sure your central server binds to 0.0.0.0 so clients on different dormitory access points can reach it.',
      timestamp: NOW - 3 * ONE_HOUR,
      deliveryStatus: 'delivered',
    },
    {
      id: 'gen_2',
      conversationId: 'chan_general',
      senderId: 'user_liam',
      senderName: 'Liam Patel',
      content: 'Good call Sofia! We tested from the library subnet earlier today and ping latency was under 4ms.',
      timestamp: NOW - 2 * ONE_HOUR + 15 * ONE_MINUTE,
      deliveryStatus: 'delivered',
    },
    {
      id: 'gen_3',
      conversationId: 'chan_general',
      senderId: 'user_elena',
      senderName: 'Elena Rostova',
      content: 'We also verified that message payload boundaries stay intact when clients send bursts of JSON packets.',
      timestamp: NOW - 45 * ONE_MINUTE,
      deliveryStatus: 'delivered',
    },
  ],
  chan_project: [
    {
      id: 'proj_1',
      conversationId: 'chan_project',
      senderId: 'user_liam',
      senderName: 'Liam Patel',
      content: 'Hey everyone, I just finalized the message frame protocol specification. We will use a 4-byte length prefix followed by UTF-8 payload.',
      timestamp: NOW - 5 * ONE_HOUR,
      deliveryStatus: 'delivered',
    },
    {
      id: 'proj_2',
      conversationId: 'chan_project',
      senderId: 'user_elena',
      senderName: 'Elena Rostova',
      content: 'Looks very clean. That prevents fragmented TCP packets from splitting chat messages midway.',
      timestamp: NOW - 4 * ONE_HOUR + 10 * ONE_MINUTE,
      deliveryStatus: 'delivered',
    },
    {
      id: 'proj_3',
      conversationId: 'chan_project',
      senderId: 'user_maya',
      senderName: 'Maya Chen',
      content: 'I created a quick test harness that spawns 20 concurrent simulated clients. No deadlocks observed on the concurrent hash map.',
      timestamp: NOW - 25 * ONE_MINUTE,
      deliveryStatus: 'delivered',
      attachment: {
        name: 'benchmark_results_20_clients.pdf',
        size: '240 KB',
        type: 'application/pdf',
      },
    },
    {
      id: 'proj_4',
      conversationId: 'chan_project',
      senderId: 'user_maya',
      senderName: 'Maya Chen',
      content: 'Let me know if you want me to test the direct messaging thread pool as well.',
      timestamp: NOW - 12 * ONE_MINUTE,
      deliveryStatus: 'delivered',
    },
  ],
  chan_study: [
    {
      id: 'std_1',
      conversationId: 'chan_study',
      senderId: 'user_maya',
      senderName: 'Maya Chen',
      content: 'For the question on slide 14 regarding non-blocking Selector keys: make sure we cancel keys when a socket throws EOFException.',
      timestamp: NOW - 6 * ONE_HOUR,
      deliveryStatus: 'delivered',
    },
    {
      id: 'std_2',
      conversationId: 'chan_study',
      senderId: 'user_sofia',
      senderName: 'Sofia Alvarez',
      content: 'Spot on, Maya. Otherwise the selector will spin at 100% CPU on closed channels.',
      timestamp: NOW - 5 * ONE_HOUR + 40 * ONE_MINUTE,
      deliveryStatus: 'delivered',
    },
  ],
  dm_user_maya: [
    {
      id: 'dm_m_1',
      conversationId: 'dm_user_maya',
      senderId: 'user_maya',
      senderName: 'Maya Chen',
      content: 'Hey! Did you get a chance to inspect the websocket handshake headers for the demo?',
      timestamp: NOW - 18 * ONE_MINUTE,
      deliveryStatus: 'delivered',
    },
  ],
  dm_user_liam: [
    {
      id: 'dm_l_1',
      conversationId: 'dm_user_liam',
      senderId: 'user_liam',
      senderName: 'Liam Patel',
      content: 'We are meeting in lab 3B at 2:30 PM to hook up the frontend with the local Java instance. See you there!',
      timestamp: NOW - 50 * ONE_MINUTE,
      deliveryStatus: 'delivered',
    },
  ],
};

const SIMULATED_RESPONSES: Record<string, string[]> = {
  chan_general: [
    'Echoing that! The network broadcast latency looks super stable across access points.',
    'I just checked the port bindings. Port 8080 is open across our lab subnet.',
    'Great coordination. We should test file attachment headers next.',
  ],
  chan_project: [
    'Got it! Adding this test case to the concurrency test suite.',
    'Nice! The message sequence numbers match up on the client side.',
    'I will commit the connection handler patch shortly.',
  ],
  chan_study: [
    'Good point! That matches what Professor Henderson highlighted in Monday’s lecture.',
    'I will note that in the shared study doc under Section 4.',
  ],
  dm_user_maya: [
    'Awesome, thanks for confirming! I am keeping the test server running locally if you want to send more packets.',
    'Looks good on my end. The protocol frame is parsing without errors.',
  ],
  dm_user_liam: [
    'Perfect. I will bring the printed architecture diagram to lab.',
    'Sounds like a plan. Let’s do a dry run of the full client-server demo.',
  ],
};

export class MockChatService implements ChatService {
  public readonly isRealMode = false;

  private config: ServerConfig = {
    host: 'localhost',
    port: 8080,
    displayName: 'You (Student)',
  };

  private users: User[] = [...DEFAULT_USERS];
  private conversations: Conversation[] = [...DEFAULT_CONVERSATIONS];
  private messages: Record<string, Message[]> = { ...INITIAL_MESSAGES };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  private listeners: Map<string, Set<Function>> = new Map();
  private activeTimers: number[] = [];

  constructor() {
    this.loadFromStorage();
  }

  public getConnectionState(): ConnectionState {
    return 'connected';
  }

  public getCurrentUser(): User | null {
    return this.getUsers().find((u) => u.isCurrentUser) || null;
  }

  public async logout(): Promise<void> {
    this.clearAllTimers();
  }

  private loadFromStorage(): void {
    try {
      const storedConfig = localStorage.getItem(`${STORAGE_KEY_PREFIX}config`);
      if (storedConfig) {
        this.config = JSON.parse(storedConfig);
      }
      const storedConvs = localStorage.getItem(`${STORAGE_KEY_PREFIX}conversations`);
      if (storedConvs) {
        this.conversations = JSON.parse(storedConvs);
      }
      const storedMsgs = localStorage.getItem(`${STORAGE_KEY_PREFIX}messages`);
      if (storedMsgs) {
        this.messages = JSON.parse(storedMsgs);
      }
    } catch {
      // Storage access gracefully ignored in restricted environments
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}config`, JSON.stringify(this.config));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}conversations`, JSON.stringify(this.conversations));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}messages`, JSON.stringify(this.messages));
    } catch {
      // Storage gracefully ignored
    }
  }

  public resetDemoData(): void {
    this.clearAllTimers();
    this.users = [...DEFAULT_USERS];
    this.conversations = [...DEFAULT_CONVERSATIONS];
    this.messages = { ...INITIAL_MESSAGES };
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}config`);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}conversations`);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}messages`);
    } catch {
      // Ignore
    }
  }

  public async connect(config: ServerConfig): Promise<boolean> {
    this.config = { ...config };
    this.saveToStorage();
    // Simulate instantaneous local network handshake
    return true;
  }

  public disconnect(): void {
    this.clearAllTimers();
  }

  public getConfig(): ServerConfig {
    return this.config;
  }

  public setPresence(status: 'available' | 'away'): void {
    this.emit('presence', { userId: 'current_user', status });
  }

  public getConversations(): Conversation[] {
    return [...this.conversations];
  }

  public getUsers(): User[] {
    const currentUser: User = {
      id: 'current_user',
      name: this.config.displayName || 'You (Student)',
      handle: `@${(this.config.displayName || 'student').toLowerCase().replace(/\s+/g, '')}`,
      status: 'available',
      avatarColor: '#202522',
      role: 'Local Node · Host',
      isCurrentUser: true,
      statusMessage: `Connected to ${this.config.host}:${this.config.port}`,
    };
    return [currentUser, ...this.users];
  }

  public async loadHistory(conversationId: string): Promise<Message[]> {
    return this.messages[conversationId] ? [...this.messages[conversationId]] : [];
  }

  public async createChannel(name: string, description: string): Promise<Conversation> {
    const formattedName = name.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
    const newChan: Conversation = {
      id: `chan_${Date.now()}`,
      type: 'channel',
      name: formattedName,
      description: description || 'New team discussion channel',
      topic: 'Created in local demo mode',
      memberCount: 4,
      memberIds: ['current_user', 'user_maya', 'user_liam', 'user_elena'],
      unreadCount: 0,
    };

    this.conversations = [newChan, ...this.conversations];
    this.messages[newChan.id] = [
      {
        id: `sys_${Date.now()}`,
        conversationId: newChan.id,
        senderId: 'system',
        senderName: 'COMMON System',
        content: `Channel #${formattedName} was created. All local peers on subnet 192.168.1.0/24 can discover it.`,
        timestamp: Date.now(),
        deliveryStatus: 'delivered',
      },
    ];

    this.saveToStorage();
    this.emit('conversationUpdated', newChan);
    return newChan;
  }

  public async sendMessage(
    conversationId: string,
    content: string,
    clientMessageId?: string,
    attachment?: MessageAttachment
  ): Promise<Message> {
    const cId = clientMessageId || `cmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId,
      senderId: 'current_user',
      senderName: this.config.displayName || 'You (Student)',
      clientMessageId: cId,
      content: content.trim(),
      timestamp: Date.now(),
      deliveryStatus: 'delivered',
      attachment,
      isCurrentUser: true,
    };

    if (!this.messages[conversationId]) {
      this.messages[conversationId] = [];
    }
    this.messages[conversationId].push(newMsg);
    this.saveToStorage();
    this.emit('message', newMsg);

    // Schedule a realistic peer response in demo mode
    this.scheduleSimulatedPeerReply(conversationId);

    return newMsg;
  }

  public async retryMessage(conversationId: string, clientMessageId: string): Promise<void> {
    const list = this.messages[conversationId] || [];
    const match = list.find((m) => m.clientMessageId === clientMessageId);
    if (match) {
      match.deliveryStatus = 'delivered';
      this.emit('message', match);
    }
  }

  public async searchUsers(query: string): Promise<User[]> {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return this.users.filter(
      (u) =>
        !u.isCurrentUser &&
        (u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q))
    );
  }

  public async openDirectConversation(targetUserId: string): Promise<Conversation> {
    const targetUser = this.users.find((u) => u.id === targetUserId);
    if (!targetUser) throw new Error('User not found');

    const dmId = `dm_${targetUserId}`;
    let existing = this.conversations.find((c) => c.id === dmId);
    if (!existing) {
      existing = {
        id: dmId,
        type: 'dm',
        name: targetUser.name,
        description: `Direct message with ${targetUser.name}`,
        topic: targetUser.role,
        memberCount: 2,
        memberIds: ['current_user', targetUserId],
        dmUserId: targetUserId,
        unreadCount: 0,
      };
      this.conversations = [existing, ...this.conversations];
      this.saveToStorage();
    }
    return existing;
  }

  public sendTyping(conversationId: string, isTyping: boolean): void {
    const selfUser = this.getCurrentUser();
    this.emit('typing', {
      conversationId,
      userId: selfUser?.id || 'current_user',
      userName: selfUser?.name || 'You',
      isTyping,
    });
  }

  public markConversationRead(conversationId: string, sequenceNum: number): void {
    this.conversations = this.conversations.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0, lastReadSeq: sequenceNum } : c
    );
  }

  private scheduleSimulatedPeerReply(conversationId: string): void {
    // Choose appropriate respondent
    const conv = this.conversations.find((c) => c.id === conversationId);
    let respondent: User = this.users[0]; // Maya by default

    if (conv?.type === 'dm' && conv.dmUserId) {
      const match = this.users.find((u) => u.id === conv.dmUserId);
      if (match) respondent = match;
    } else if (conversationId === 'chan_project') {
      respondent = this.users[1]; // Liam
    } else if (conversationId === 'chan_study') {
      respondent = this.users[2]; // Elena
    }

    const responses =
      SIMULATED_RESPONSES[conversationId] ||
      SIMULATED_RESPONSES['chan_general'] || [
        'Confirmed! Received packet through the local socket.',
      ];
    const replyText = responses[Math.floor(Math.random() * responses.length)];

    // Typing start timer
    const typingTimer = window.setTimeout(() => {
      this.emit('typing', {
        conversationId,
        userId: respondent.id,
        userName: respondent.name,
        isTyping: true,
      });

      // Reply message timer
      const replyTimer = window.setTimeout(() => {
        this.emit('typing', {
          conversationId,
          userId: respondent.id,
          userName: respondent.name,
          isTyping: false,
        });

        const replyMsg: Message = {
          id: `reply_${Date.now()}`,
          conversationId,
          senderId: respondent.id,
          senderName: respondent.name,
          content: replyText,
          timestamp: Date.now(),
          deliveryStatus: 'delivered',
        };

        if (!this.messages[conversationId]) {
          this.messages[conversationId] = [];
        }
        this.messages[conversationId].push(replyMsg);
        this.saveToStorage();
        this.emit('message', replyMsg);
      }, 1600);

      this.activeTimers.push(replyTimer);
    }, 700);

    this.activeTimers.push(typingTimer);
  }

  public clearAllTimers(): void {
    for (const t of this.activeTimers) {
      clearTimeout(t);
    }
    this.activeTimers = [];
  }

  public subscribe<K extends keyof ChatServiceEvents>(
    event: K,
    callback: ChatServiceEvents[K]
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(callback);

    return () => {
      set.delete(callback);
    };
  }

  private emit<K extends keyof ChatServiceEvents>(
    event: K,
    ...args: Parameters<ChatServiceEvents[K]>
  ): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (cb as any)(...args);
        } catch {
          // Handle subscriber error gracefully
        }
      });
    }
  }
}

// Export singleton instance for the applet
export const chatService = new MockChatService();
