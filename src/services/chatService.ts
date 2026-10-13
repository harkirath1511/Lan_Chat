import { ChatService } from '../types/chat';
import { JavaChatService } from './javaChatService';
import { MockChatService } from './mockChatService';

const STORAGE_DEMO_MODE = 'common_is_demo_mode';

class ChatServiceManager {
  private javaService: JavaChatService;
  private mockService: MockChatService;
  private isDemo: boolean;

  constructor() {
    this.javaService = new JavaChatService();
    this.mockService = new MockChatService();
    this.isDemo = this.readDemoModePreference();
  }

  private readDemoModePreference(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(STORAGE_DEMO_MODE) === 'true';
    } catch {
      return false;
    }
  }

  public setDemoMode(demo: boolean): void {
    this.isDemo = demo;
    try {
      localStorage.setItem(STORAGE_DEMO_MODE, String(demo));
    } catch {
      // Ignore
    }
  }

  public isDemoMode(): boolean {
    return this.isDemo;
  }

  public getService(): ChatService {
    return this.isDemo ? this.mockService : this.javaService;
  }

  public getJavaService(): JavaChatService {
    return this.javaService;
  }

  public getMockService(): MockChatService {
    return this.mockService;
  }
}

export const chatServiceManager = new ChatServiceManager();

// Dynamic proxy forwarding calls to the active service (JavaChatService by default, or MockChatService if user explicitly chose demo mode)
export const chatService: ChatService = new Proxy({} as ChatService, {
  get(_target, prop) {
    const service = chatServiceManager.getService();
    const val = (service as any)[prop];
    if (typeof val === 'function') {
      return val.bind(service);
    }
    return val;
  },
});
