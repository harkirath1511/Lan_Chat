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
import {
  clearAuthToken,
  getAuthToken,
  getRestBaseUrl,
  getSavedServerConfig,
  getWsUrl,
  saveAuthToken,
  saveServerConfig,
} from '../utils/apiConfig';

export class JavaChatService implements ChatService {
  public readonly isRealMode = true;

  private connectionState: ConnectionState = 'disconnected';
  private currentUser: User | null = null;
  private serverConfig: ServerConfig = getSavedServerConfig();

  private ws: WebSocket | null = null;
  private pingTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private isExplicitDisconnect = false;

  private conversations: Conversation[] = [];
  private users: User[] = [];
  private conversationMessages: Record<string, Message[]> = {};
  private knownMessageIds = new Set<string>();
  private knownClientMessageIds = new Set<string>();

  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.serverConfig = getSavedServerConfig();
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public async register(
    host: string,
    port: number,
    username: string,
    displayName: string,
    password: string,
    confirmPassword: string
  ): Promise<boolean> {
    this.serverConfig = { host, port, username, displayName };
    saveServerConfig({ host, port });

    const baseUrl = getRestBaseUrl(host, port);
    const resp = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, displayName, password, confirmPassword }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(err.message || 'Registration failed');
    }

    const data = await resp.json();
    saveAuthToken(data.token);
    this.currentUser = {
      id: data.user.id,
      name: data.user.displayName,
      handle: `@${data.user.username}`,
      status: 'available',
      avatarColor: '#294E43',
      role: 'Local Station',
      isCurrentUser: true,
      statusMessage: `Connected to ${host}:${port}`,
    };

    return this.connect(this.serverConfig);
  }

  public async login(
    host: string,
    port: number,
    username: string,
    password: string
  ): Promise<boolean> {
    this.serverConfig = { host, port, username };
    saveServerConfig({ host, port });

    const baseUrl = getRestBaseUrl(host, port);
    const resp = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: 'Invalid username or password' }));
      throw new Error(err.message || 'Invalid username or password');
    }

    const data = await resp.json();
    saveAuthToken(data.token);
    this.currentUser = {
      id: data.user.id,
      name: data.user.displayName,
      handle: `@${data.user.username}`,
      status: 'available',
      avatarColor: '#294E43',
      role: 'Local Station',
      isCurrentUser: true,
      statusMessage: `Connected to ${host}:${port}`,
    };

    return this.connect(this.serverConfig);
  }

  public async logout(): Promise<void> {
    this.isExplicitDisconnect = true;
    const token = getAuthToken();
    if (token) {
      try {
        const baseUrl = getRestBaseUrl(this.serverConfig.host, this.serverConfig.port);
        await fetch(`${baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Ignore network errors on logout
      }
    }

    this.disconnect();
    clearAuthToken();
    this.currentUser = null;
    this.conversations = [];
    this.conversationMessages = {};
  }

  public async connect(config: ServerConfig): Promise<boolean> {
    this.serverConfig = config;
    saveServerConfig({ host: config.host, port: config.port });
    this.isExplicitDisconnect = false;

    const token = getAuthToken();
    if (!token) {
      this.setConnectionState('disconnected');
      return false;
    }

    // Load initial user and conversation data via REST first
    try {
      await this.refreshUserAndConversations();
    } catch {
      // Continue to attempt WebSocket connection
    }

    this.initWebSocket();
    return true;
  }

  public disconnect(): void {
    this.isExplicitDisconnect = true;
    this.clearTimers();
    if (this.ws) {
      try {
        this.ws.close(1000, 'Client disconnected');
      } catch {
        // Ignore
      }
      this.ws = null;
    }
    this.setConnectionState('disconnected');
  }

  private setConnectionState(newState: ConnectionState): void {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      this.emit('connectionStateChanged', newState);
    }
  }

  private initWebSocket(): void {
    const token = getAuthToken();
    if (!token || this.isExplicitDisconnect) return;

    this.clearTimers();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignore
      }
      this.ws = null;
    }

    const wsUrl = getWsUrl(this.serverConfig.host, this.serverConfig.port);
    this.setConnectionState(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Send AUTHENTICATE as first event
        this.sendWsEvent('AUTHENTICATE', { token });
      };

      this.ws.onmessage = (event) => {
        this.handleWsMessage(event.data);
      };

      this.ws.onclose = (event) => {
        this.handleWsClose(event);
      };

      this.ws.onerror = () => {
        // Errors trigger onclose
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private handleWsClose(event: CloseEvent): void {
    this.clearPingTimer();
    this.ws = null;

    if (this.isExplicitDisconnect) {
      this.setConnectionState('disconnected');
      return;
    }

    // 4401 or 4403 means token is expired or invalid
    if (event.code === 4401 || event.code === 4403) {
      clearAuthToken();
      this.setConnectionState('disconnected');
      this.emit('authExpired');
      return;
    }

    // Otherwise, schedule exponential backoff reconnect
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.isExplicitDisconnect) return;

    this.setConnectionState('reconnecting');
    this.reconnectAttempts++;

    // Exponential backoff with jitter: 1s, 2s, 4s, 8s, 16s, capped at 30s
    const baseDelay = Math.min(30000, 1000 * Math.pow(2, Math.min(this.reconnectAttempts - 1, 5)));
    const jitter = Math.floor(Math.random() * 800);
    const delay = baseDelay + jitter;

    this.reconnectTimer = window.setTimeout(() => {
      this.initWebSocket();
    }, delay);
  }

  private handleWsMessage(raw: string): void {
    try {
      const envelope = JSON.parse(raw);
      const { type, payload } = envelope;

      switch (type) {
        case 'AUTHENTICATED': {
          this.reconnectAttempts = 0;
          this.setConnectionState('connected');
          this.startPingTimer();

          // Catch up with conversations and missed messages
          this.catchUpAfterReconnect();
          break;
        }

        case 'PRESENCE_SNAPSHOT': {
          if (payload && payload.presences) {
            const presences = payload.presences as Record<string, UserStatus>;
            this.users = this.users.map((u) => {
              if (presences[u.id]) {
                return { ...u, status: presences[u.id] };
              }
              return u;
            });
          }
          break;
        }

        case 'PRESENCE_UPDATED': {
          if (payload && payload.userId) {
            const { userId, status } = payload;
            this.users = this.users.map((u) =>
              u.id === userId ? { ...u, status: status as UserStatus } : u
            );
            this.emit('presence', { userId, status: status as UserStatus });
          }
          break;
        }

        case 'MESSAGE_ACK': {
          if (payload && payload.clientMessageId) {
            const { clientMessageId, serverMessageId, sequenceNum } = payload;
            this.reconcileMessageAck(clientMessageId, serverMessageId, sequenceNum);
          }
          break;
        }

        case 'MESSAGE_CREATED': {
          if (payload && payload.id) {
            this.handleIncomingMessage(payload);
          }
          break;
        }

        case 'TYPING_UPDATED': {
          if (payload && payload.conversationId) {
            this.emit('typing', payload);
          }
          break;
        }

        case 'READ_UPDATED': {
          if (payload && payload.conversationId) {
            const { conversationId, userId, sequenceNum } = payload;
            if (this.currentUser && userId === this.currentUser.id) {
              this.conversations = this.conversations.map((c) =>
                c.id === conversationId ? { ...c, unreadCount: 0, lastReadSeq: sequenceNum } : c
              );
            }
            this.emit('readUpdated', payload);
          }
          break;
        }

        case 'CONVERSATION_UPDATED': {
          if (payload && payload.id) {
            this.updateConversationFromDto(payload);
          }
          break;
        }

        case 'PONG': {
          // Heartbeat acknowledged
          break;
        }

        case 'ERROR': {
          if (payload && payload.code === 'UNAUTHENTICATED') {
            clearAuthToken();
            this.emit('authExpired');
          }
          break;
        }
      }
    } catch {
      // Ignore malformed payloads
    }
  }

  private reconcileMessageAck(
    clientMessageId: string,
    serverMessageId: string,
    sequenceNum: number
  ): void {
    for (const convId of Object.keys(this.conversationMessages)) {
      const list = this.conversationMessages[convId];
      const matchIdx = list.findIndex((m) => m.clientMessageId === clientMessageId);
      if (matchIdx !== -1) {
        const updated: Message = {
          ...list[matchIdx],
          id: serverMessageId,
          sequenceNum,
          deliveryStatus: 'delivered',
        };
        list[matchIdx] = updated;
        this.knownMessageIds.add(serverMessageId);
        this.emit('message', updated);
        return;
      }
    }
  }

  private handleIncomingMessage(rawDto: any): void {
    const serverId = rawDto.id;
    const clientMessageId = rawDto.clientMessageId;
    const conversationId = rawDto.conversationId;

    // Deduplication check
    if (this.knownMessageIds.has(serverId)) {
      return;
    }
    this.knownMessageIds.add(serverId);

    const isSelf = this.currentUser ? rawDto.senderId === this.currentUser.id : false;

    // If sent by self, check if we have a pending optimistic message with matching clientMessageId
    if (isSelf && clientMessageId) {
      const list = this.conversationMessages[conversationId] || [];
      const pendingIdx = list.findIndex((m) => m.clientMessageId === clientMessageId);
      if (pendingIdx !== -1) {
        list[pendingIdx] = {
          ...list[pendingIdx],
          id: serverId,
          sequenceNum: rawDto.sequenceNum,
          deliveryStatus: 'delivered',
        };
        this.emit('message', list[pendingIdx]);
        return;
      }
    }

    const newMsg: Message = {
      id: serverId,
      sequenceNum: rawDto.sequenceNum,
      conversationId,
      senderId: rawDto.senderId,
      senderName: rawDto.senderName || 'Peer',
      clientMessageId,
      content: rawDto.content,
      timestamp: new Date(rawDto.createdAt).getTime(),
      deliveryStatus: 'delivered',
      isCurrentUser: isSelf,
    };

    if (!this.conversationMessages[conversationId]) {
      this.conversationMessages[conversationId] = [];
    }
    this.conversationMessages[conversationId].push(newMsg);

    // Update conversation's unreadCount if not from self
    if (!isSelf) {
      this.conversations = this.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
      );
    }

    this.emit('message', newMsg);
  }

  private startPingTimer(): void {
    this.clearPingTimer();
    this.pingTimer = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendWsEvent('PING', { timestamp: Date.now() });
      }
    }, 20000);
  }

  private clearPingTimer(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private clearTimers(): void {
    this.clearPingTimer();
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private sendWsEvent(type: string, payload: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      this.ws.send(JSON.stringify({ type, payload }));
      return true;
    } catch {
      return false;
    }
  }

  private async refreshUserAndConversations(): Promise<void> {
    const token = getAuthToken();
    if (!token) return;

    const baseUrl = getRestBaseUrl(this.serverConfig.host, this.serverConfig.port);

    // 1. Get Me
    const meResp = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (meResp.ok) {
      const meData = await meResp.json();
      this.currentUser = {
        id: meData.id,
        name: meData.displayName,
        handle: `@${meData.username}`,
        status: 'available',
        avatarColor: '#294E43',
        role: 'Local Station',
        isCurrentUser: true,
      };
    }

    // 2. Get Conversations
    const convResp = await fetch(`${baseUrl}/api/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (convResp.ok) {
      const convData = await convResp.json();
      this.conversations = convData.map((c: any) => this.mapConversationDto(c));
    }

    // 3. Get Registered Users
    const usersResp = await fetch(`${baseUrl}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (usersResp.ok) {
      const usersData = await usersResp.json();
      this.users = usersData.map((u: any) => ({
        id: u.id,
        name: u.displayName,
        handle: `@${u.username}`,
        status: (u.status as UserStatus) || 'offline',
        avatarColor: this.generateAvatarColor(u.id),
        role: 'Registered Peer',
      }));
    }
  }

  private async catchUpAfterReconnect(): Promise<void> {
    try {
      await this.refreshUserAndConversations();

      // For each cached conversation, fetch newer messages starting from highest known sequence
      for (const convId of Object.keys(this.conversationMessages)) {
        const messages = this.conversationMessages[convId];
        let highestSeq = 0;
        for (const m of messages) {
          if (m.sequenceNum && m.sequenceNum > highestSeq) {
            highestSeq = m.sequenceNum;
          }
        }

        if (highestSeq > 0) {
          const baseUrl = getRestBaseUrl(this.serverConfig.host, this.serverConfig.port);
          const token = getAuthToken();
          const resp = await fetch(
            `${baseUrl}/api/conversations/${convId}/messages?cursor=${highestSeq}&direction=newer&limit=50`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (resp.ok) {
            const page = await resp.json();
            for (const dto of page.messages || []) {
              this.handleIncomingMessage(dto);
            }
          }
        }
      }
    } catch {
      // Ignore catch-up errors
    }
  }

  public async sendMessage(
    conversationId: string,
    content: string,
    clientMessageId?: string,
    attachment?: MessageAttachment
  ): Promise<Message> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const cId = clientMessageId || `cmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.knownClientMessageIds.add(cId);

    // Optimistic message displayed immediately with 'sending' status
    const optimisticMsg: Message = {
      id: `pending_${cId}`,
      conversationId,
      senderId: this.currentUser ? this.currentUser.id : 'me',
      senderName: this.currentUser ? this.currentUser.name : 'You',
      clientMessageId: cId,
      content: content.trim(),
      timestamp: Date.now(),
      deliveryStatus: 'sending',
      attachment,
      isCurrentUser: true,
    };

    if (!this.conversationMessages[conversationId]) {
      this.conversationMessages[conversationId] = [];
    }
    this.conversationMessages[conversationId].push(optimisticMsg);
    this.emit('message', optimisticMsg);

    // Try sending over WebSocket first
    const sentWs = this.sendWsEvent('MESSAGE_SEND', {
      conversationId,
      clientMessageId: cId,
      content: content.trim(),
    });

    if (!sentWs) {
      // Mark as failed if socket is not open
      optimisticMsg.deliveryStatus = 'failed';
      optimisticMsg.error = 'Connection unavailable. Click to retry.';
      this.emit('message', optimisticMsg);
    }

    return optimisticMsg;
  }

  public async retryMessage(conversationId: string, clientMessageId: string): Promise<void> {
    const list = this.conversationMessages[conversationId] || [];
    const match = list.find((m) => m.clientMessageId === clientMessageId);
    if (!match) return;

    match.deliveryStatus = 'sending';
    match.error = undefined;
    this.emit('message', match);

    const sent = this.sendWsEvent('MESSAGE_SEND', {
      conversationId,
      clientMessageId,
      content: match.content,
    });

    if (!sent) {
      match.deliveryStatus = 'failed';
      match.error = 'Connection unavailable. Click to retry.';
      this.emit('message', match);
    }
  }

  public async loadHistory(conversationId: string): Promise<Message[]> {
    const token = getAuthToken();
    if (!token) return [];

    const baseUrl = getRestBaseUrl(this.serverConfig.host, this.serverConfig.port);
    const resp = await fetch(`${baseUrl}/api/conversations/${conversationId}/messages?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) {
      return this.conversationMessages[conversationId] || [];
    }

    const page = await resp.json();
    const serverMessages: Message[] = (page.messages || []).map((dto: any) => {
      this.knownMessageIds.add(dto.id);
      return {
        id: dto.id,
        sequenceNum: dto.sequenceNum,
        conversationId: dto.conversationId,
        senderId: dto.senderId,
        senderName: dto.senderName || 'Peer',
        clientMessageId: dto.clientMessageId,
        content: dto.content,
        timestamp: new Date(dto.createdAt).getTime(),
        deliveryStatus: 'delivered',
        isCurrentUser: this.currentUser ? dto.senderId === this.currentUser.id : false,
      };
    });

    this.conversationMessages[conversationId] = serverMessages;
    return [...serverMessages];
  }

  public async loadOlderHistory(conversationId: string, cursor: number): Promise<Message[]> {
    const token = getAuthToken();
    if (!token) return [];

    const baseUrl = getRestBaseUrl(this.serverConfig.host, this.serverConfig.port);
    const resp = await fetch(
      `${baseUrl}/api/conversations/${conversationId}/messages?cursor=${cursor}&direction=older&limit=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!resp.ok) return [];

    const page = await resp.json();
    const olderMessages: Message[] = (page.messages || []).map((dto: any) => {
      this.knownMessageIds.add(dto.id);
      return {
        id: dto.id,
        sequenceNum: dto.sequenceNum,
        conversationId: dto.conversationId,
        senderId: dto.senderId,
        senderName: dto.senderName || 'Peer',
        clientMessageId: dto.clientMessageId,
        content: dto.content,
        timestamp: new Date(dto.createdAt).getTime(),
        deliveryStatus: 'delivered',
        isCurrentUser: this.currentUser ? dto.senderId === this.currentUser.id : false,
      };
    });

    const currentList = this.conversationMessages[conversationId] || [];
    const merged = [...olderMessages, ...currentList];
    this.conversationMessages[conversationId] = merged;
    return olderMessages;
  }

  public getConversations(): Conversation[] {
    return [...this.conversations];
  }

  public getUsers(): User[] {
    const selfUser = this.currentUser;
    const others = this.users.filter((u) => u.id !== selfUser?.id);
    return selfUser ? [selfUser, ...others] : [...this.users];
  }

  public async searchUsers(query: string): Promise<User[]> {
    const token = getAuthToken();
    if (!token) return [];

    const baseUrl = getRestBaseUrl(this.serverConfig.host, this.serverConfig.port);
    const resp = await fetch(`${baseUrl}/api/users?query=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) return [];
    const data = await resp.json();
    return data.map((u: any) => ({
      id: u.id,
      name: u.displayName,
      handle: `@${u.username}`,
      status: (u.status as UserStatus) || 'offline',
      avatarColor: this.generateAvatarColor(u.id),
      role: 'Registered Peer',
    }));
  }

  public async createChannel(name: string, description: string): Promise<Conversation> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const baseUrl = getRestBaseUrl(this.serverConfig.host, this.serverConfig.port);
    const resp = await fetch(`${baseUrl}/api/channels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: 'Failed to create channel' }));
      throw new Error(err.message || 'Failed to create channel');
    }

    const data = await resp.json();
    const conv = this.mapConversationDto(data);
    this.conversations = [conv, ...this.conversations];
    this.emit('conversationUpdated', conv);
    return conv;
  }

  public async openDirectConversation(targetUserId: string): Promise<Conversation> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const baseUrl = getRestBaseUrl(this.serverConfig.host, this.serverConfig.port);
    const resp = await fetch(`${baseUrl}/api/conversations/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetUserId }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: 'Failed to open direct conversation' }));
      throw new Error(err.message || 'Failed to open direct conversation');
    }

    const data = await resp.json();
    const conv = this.mapConversationDto(data);
    if (!this.conversations.some((c) => c.id === conv.id)) {
      this.conversations = [conv, ...this.conversations];
    }
    this.emit('conversationUpdated', conv);
    return conv;
  }

  public async joinChannel(channelId: string): Promise<void> {
    const token = getAuthToken();
    if (!token) return;

    const baseUrl = getRestBaseUrl(this.serverConfig.host, this.serverConfig.port);
    await fetch(`${baseUrl}/api/channels/${channelId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    await this.refreshUserAndConversations();
  }

  public async leaveChannel(channelId: string): Promise<void> {
    const token = getAuthToken();
    if (!token) return;

    const baseUrl = getRestBaseUrl(this.serverConfig.host, this.serverConfig.port);
    await fetch(`${baseUrl}/api/channels/${channelId}/membership`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    this.conversations = this.conversations.filter((c) => c.id !== channelId);
  }

  public setPresence(status: 'available' | 'away'): void {
    if (this.currentUser) {
      this.currentUser.status = status;
    }
    this.sendWsEvent('PRESENCE_SET', { status });
  }

  public sendTyping(conversationId: string, isTyping: boolean): void {
    this.sendWsEvent(isTyping ? 'TYPING_START' : 'TYPING_STOP', { conversationId });
  }

  public markConversationRead(conversationId: string, sequenceNum: number): void {
    this.sendWsEvent('READ_UPDATE', { conversationId, sequenceNum });
    this.conversations = this.conversations.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0, lastReadSeq: sequenceNum } : c
    );
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
          (cb as any)(...args);
        } catch {
          // Ignore subscriber error
        }
      });
    }
  }

  private mapConversationDto(dto: any): Conversation {
    const isDm = dto.type === 'DIRECT';
    let dmUserId: string | undefined;
    let name = dto.name;

    if (isDm && dto.directPartner) {
      dmUserId = dto.directPartner.id;
      name = dto.directPartner.displayName;
    }

    return {
      id: dto.id,
      type: isDm ? 'dm' : 'channel',
      name: name || 'Channel',
      description: dto.description || '',
      topic: dto.description || (isDm ? 'Direct message' : 'Channel discussion'),
      memberCount: dto.memberCount || dto.memberIds?.length || 0,
      memberIds: dto.memberIds || [],
      unreadCount: dto.unreadCount || 0,
      lastReadSeq: dto.lastReadSeq || 0,
      dmUserId,
    };
  }

  private updateConversationFromDto(dto: any): void {
    const conv = this.mapConversationDto(dto);
    const existingIdx = this.conversations.findIndex((c) => c.id === conv.id);
    if (existingIdx !== -1) {
      this.conversations[existingIdx] = conv;
    } else {
      this.conversations = [conv, ...this.conversations];
    }
    this.emit('conversationUpdated', conv);
  }

  private generateAvatarColor(id: string): string {
    const palette = ['#294E43', '#D36C43', '#436155', '#6B705C', '#7A5C58', '#3D5A80'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
    }
    return palette[Math.abs(hash) % palette.length];
  }
}
