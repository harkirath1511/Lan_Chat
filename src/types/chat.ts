export type UserStatus = 'available' | 'away' | 'offline';

export type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'failed';

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface User {
  id: string;
  name: string;
  handle: string;
  status: UserStatus;
  avatarColor: string;
  role: string;
  statusMessage?: string;
  isCurrentUser?: boolean;
}

export interface MessageAttachment {
  name: string;
  size: string;
  type: string;
}

export interface Message {
  id: string;
  sequenceNum?: number;
  conversationId: string;
  senderId: string;
  senderName: string;
  clientMessageId?: string;
  content: string;
  timestamp: number;
  deliveryStatus: DeliveryStatus;
  attachment?: MessageAttachment;
  isCurrentUser?: boolean;
  error?: string;
}

export type ConversationType = 'channel' | 'dm';

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string;
  description?: string;
  topic?: string;
  memberCount?: number;
  memberIds: string[];
  unreadCount?: number;
  lastReadSeq?: number;
  dmUserId?: string;
}

export interface ServerConfig {
  host: string;
  port: number;
  displayName?: string;
  username?: string;
}

export interface ChatServiceEvents {
  message: (message: Message) => void;
  typing: (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => void;
  presence: (data: { userId: string; status: UserStatus }) => void;
  conversationUpdated: (conversation: Conversation) => void;
  connectionStateChanged: (state: ConnectionState) => void;
  authExpired: () => void;
  readUpdated: (data: { conversationId: string; userId: string; sequenceNum: number }) => void;
}

export interface ChatService {
  readonly isRealMode: boolean;
  getConnectionState(): ConnectionState;
  getCurrentUser(): User | null;
  connect(config: ServerConfig): Promise<boolean>;
  disconnect(): void;
  logout(): Promise<void>;
  sendMessage(conversationId: string, content: string, clientMessageId?: string, attachment?: MessageAttachment): Promise<Message>;
  retryMessage(conversationId: string, clientMessageId: string): Promise<void>;
  loadHistory(conversationId: string): Promise<Message[]>;
  loadOlderHistory?(conversationId: string, cursor: number): Promise<Message[]>;
  getConversations(): Conversation[];
  getUsers(): User[];
  searchUsers(query: string): Promise<User[]>;
  createChannel(name: string, description: string): Promise<Conversation>;
  openDirectConversation(targetUserId: string): Promise<Conversation>;
  joinChannel?(channelId: string): Promise<void>;
  leaveChannel?(channelId: string): Promise<void>;
  setPresence(status: 'available' | 'away'): void;
  sendTyping(conversationId: string, isTyping: boolean): void;
  markConversationRead(conversationId: string, sequenceNum: number): void;
  subscribe<K extends keyof ChatServiceEvents>(event: K, callback: ChatServiceEvents[K]): () => void;
}
