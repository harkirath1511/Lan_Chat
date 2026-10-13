export interface SavedServerConfig {
  host: string;
  port: number;
}

const STORAGE_SERVER_CONFIG = 'common_server_config';
const SESSION_AUTH_TOKEN = 'common_auth_token';
const SESSION_AUTH_USER = 'common_auth_user';

export function getSavedServerConfig(): SavedServerConfig {
  if (typeof window === 'undefined') {
    return { host: 'localhost', port: 8080 };
  }

  try {
    const raw = localStorage.getItem(STORAGE_SERVER_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.host && parsed.port) {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }

  // If in browser and running on port 8080 (combined package), default to current host
  const defaultHost = window.location.hostname || 'localhost';
  const defaultPort = window.location.port ? Number(window.location.port) : 8080;
  return { host: defaultHost, port: defaultPort };
}

export function saveServerConfig(config: SavedServerConfig): void {
  try {
    localStorage.setItem(STORAGE_SERVER_CONFIG, JSON.stringify(config));
  } catch {
    // Ignore
  }
}

export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(SESSION_AUTH_TOKEN);
  } catch {
    return null;
  }
}

export function saveAuthToken(token: string): void {
  try {
    sessionStorage.setItem(SESSION_AUTH_TOKEN, token);
  } catch {
    // Ignore
  }
}

export function clearAuthToken(): void {
  try {
    sessionStorage.removeItem(SESSION_AUTH_TOKEN);
    sessionStorage.removeItem(SESSION_AUTH_USER);
  } catch {
    // Ignore
  }
}

export function getRestBaseUrl(host?: string, port?: number): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:8080';
  }

  const targetHost = host || getSavedServerConfig().host;
  const targetPort = port || getSavedServerConfig().port;

  // Check if same origin (combined package deployment or reverse proxy)
  const currentHost = window.location.hostname;
  const currentPort = window.location.port ? Number(window.location.port) : (window.location.protocol === 'https:' ? 443 : 80);

  if (targetHost === currentHost && targetPort === currentPort) {
    return '';
  }

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${targetHost}:${targetPort}`;
}

export function getWsUrl(host?: string, port?: number): string {
  if (typeof window === 'undefined') {
    return 'ws://localhost:8080/ws/chat';
  }

  const targetHost = host || getSavedServerConfig().host;
  const targetPort = port || getSavedServerConfig().port;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${targetHost}:${targetPort}/ws/chat`;
}
