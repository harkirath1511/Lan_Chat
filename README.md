# COMMON — Complete LAN Chat Web Application

COMMON is an editorial-grade LAN chat web application for local network collaboration. It allows multiple users stationed on the same Wi-Fi or Ethernet network to communicate via a central Java 21 Spring Boot server.

This project includes both:
1. The **React + TypeScript frontend**: A contemporary communication studio design featuring 3D procedural network choreography (Three.js / React Three Fiber), smooth scroll stories, zero-pill metadata typography, and a full-featured real-time chat workspace.
2. The **Java 21 + Spring Boot backend**: A lightweight, robust single-process server providing stateless Bearer token authentication, file-backed H2 persistence, Flyway database migrations, REST endpoints, and a native RFC 6455 JSON WebSocket conduit at `/ws/chat`.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Clients (LAN)                    │
│    (Desktop / Tablet / Mobile on 192.168.x.x or localhost)   │
└───────────────────────────┬─────────────────────────────────┘
                            │
            HTTP/REST       │        Native WebSocket
     (Bearer Token Auth)    │      (JSON Event Framing)
            /api/*          │           /ws/chat
                            ▼
┌─────────────────────────────────────────────────────────────┐
│             Central Java 21 Server (Spring Boot)             │
│                                                             │
│  ┌────────────────────┐            ┌─────────────────────┐  │
│  │  REST Controllers  │            │  WebSocket Handler  │  │
│  │ (Auth, Channels,   │            │(ConcurrentDecorator,│  │
│  │  DMs, Messages)    │            │ 5s Auth, Heartbeat) │  │
│  └─────────┬──────────┘            └──────────┬──────────┘  │
│            │                                  │             │
│            ▼                                  ▼             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Service Layer                      │  │
│  │   (Auth, Messages, Conversations, Presence, Limits)   │  │
│  └─────────────────────────┬─────────────────────────────┘  │
│                            │                                │
│                            ▼                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Spring Data JPA + Flyway Migrations        │  │
│  └─────────────────────────┬─────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────┘
                             ▼
              ┌─────────────────────────────┐
              │ File-Backed H2 Database     │
              │ (./data/common_db.mv.db)    │
              └─────────────────────────────┘
```

---

## 2. Prerequisites & Tooling

- **Java**: Java Development Kit (JDK) 21 or higher.
- **Maven**: Version 3.8+ (or use the included `./mvnw` / `mvnw.cmd` wrapper).
- **Node.js**: Node 18+ and npm for frontend development.

---

## 3. Quick Start & Execution Modes

### Mode A: Development Mode (Separate Frontend & Backend)

Run the backend and frontend development servers concurrently on your machine:

#### 1. Start the Java Backend (Port 8080)
Linux / macOS:
```bash
./backend/mvnw -f backend/pom.xml spring-boot:run
# Or using system maven:
mvn -f backend/pom.xml spring-boot:run
```

Windows (PowerShell or Command Prompt):
```cmd
backend\mvnw.cmd -f backend\pom.xml spring-boot:run
```

The server binds to `0.0.0.0:8080`.

#### 2. Start the Frontend Development Server (Port 3000)
```bash
npm install
npm run dev
```

Visit `http://localhost:3000` in your browser. On the `/join` screen, enter your credentials and leave the server address as `localhost` and port as `8080`.

---

### Mode B: Combined Local Deployment (Single Executable JAR)

The combined build compiles the frontend, embeds its static production bundle into Spring Boot's static resources, and generates a standalone executable JAR:

```bash
npm run build:combined
```

This generates `backend/target/common-chat-backend-1.0.0.jar`.

Run the self-contained server with Java alone (**no Node.js required**):
```bash
java -jar backend/target/common-chat-backend-1.0.0.jar
```

Open `http://localhost:8080` in any browser. All REST endpoints, SPA routes (`/join`, `/chat`), and WebSocket conduits (`/ws/chat`) are served from this single process.

---

## 4. Two-Computer LAN Setup & Testing

To connect two computers on the same local network:

1. **Find the Host Computer's LAN IP**:
   - macOS / Linux: Run `ip a` or `ifconfig` (look for `192.168.x.x` or `10.0.x.x`).
   - Windows: Run `ipconfig` (look for IPv4 Address on Wi-Fi or Ethernet adapter).
   - *Example host IP*: `192.168.1.100`.

2. **Start the Java Server on the Host Machine**:
   - The server binds to `0.0.0.0:8080` by default.
   - If using Mode A with frontend dev server across LAN, allow the LAN origin:
     ```bash
     COMMON_ALLOWED_ORIGINS="http://localhost:3000,http://192.168.1.100:3000,http://192.168.1.100:8080" ./backend/mvnw -f backend/pom.xml spring-boot:run
     ```
   - Ensure your firewall allows incoming TCP traffic on port `8080`.

3. **Connect from Computer 2**:
   - Open a browser on Computer 2 and navigate to `http://192.168.1.100:8080` (or `http://192.168.1.100:3000` if in dev mode).
   - On the `/join` screen:
     - Set Server Address: `192.168.1.100` (the host computer's IP, *not* localhost).
     - Set Port: `8080`.
     - Click **Create Account** to register a new station username.
   - Both users can now chat in shared channels (`#general`, `#project-team`, `#study-room`) or start private Direct Messages!

---

## 5. REST API Reference

All REST endpoints use the `/api` prefix, require JSON payloads, and return JSON responses. Protected endpoints require the HTTP header `Authorization: Bearer <session_token>`.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Log in and receive session token | No |
| `POST` | `/api/auth/logout` | Revoke session token and disconnect | Yes |
| `GET` | `/api/auth/me` | Fetch currently authenticated user | Yes |
| `GET` | `/api/users?query=...` | Search registered peers on subnet | Yes |
| `GET` | `/api/channels` | List all public channels | Yes |
| `POST` | `/api/channels` | Create a new public channel | Yes |
| `POST` | `/api/channels/{id}/join` | Join an existing public channel | Yes |
| `DELETE` | `/api/channels/{id}/membership` | Leave a non-default channel | Yes |
| `GET` | `/api/conversations` | List user's channels and direct messages | Yes |
| `POST` | `/api/conversations/direct` | Get or create direct conversation | Yes |
| `GET` | `/api/conversations/{id}/members` | View member list and presence | Yes |
| `GET` | `/api/conversations/{id}/messages` | Cursor-based message history | Yes |
| `GET` | `/api/conversations/{id}/messages/search` | Search message history by text | Yes |
| `POST` | `/api/conversations/{id}/read` | Update user's last-read sequence | Yes |
| `GET` | `/api/health` | Minimal service health check | No |

---

## 6. WebSocket Protocol (`/ws/chat`)

Clients connect via standard RFC 6455 WebSocket at `/ws/chat`. Events use a uniform JSON envelope:
```json
{
  "type": "MESSAGE_SEND",
  "requestId": "req_123",
  "payload": { ... }
}
```

### Authentication Flow
1. **Client connects**: WebSocket handshake completes.
2. **Client sends `AUTHENTICATE`** within 5 seconds:
   ```json
   { "type": "AUTHENTICATE", "payload": { "token": "raw_opaque_bearer_token" } }
   ```
3. **Server responds** with:
   - `AUTHENTICATED`: `{ "user": { "id": "...", "username": "...", "displayName": "..." } }`
   - `PRESENCE_SNAPSHOT`: `{ "presences": { "usr_1": "available", "usr_2": "away" } }`

### Message Exchange & Idempotency
- **Client sends `MESSAGE_SEND`**:
  ```json
  {
    "type": "MESSAGE_SEND",
    "requestId": "req_01",
    "payload": {
      "conversationId": "chan_project",
      "clientMessageId": "cmsg_1728148900",
      "content": "Socket buffer benchmarks ready."
    }
  }
  ```
- **Server responds with `MESSAGE_ACK` to sender**:
  ```json
  {
    "type": "MESSAGE_ACK",
    "requestId": "req_01",
    "payload": {
      "clientMessageId": "cmsg_1728148900",
      "serverMessageId": "msg_abc123",
      "sequenceNum": 42,
      "timestamp": "2026-10-05T17:21:40Z"
    }
  }
  ```
- **Server broadcasts `MESSAGE_CREATED` to all participants** in the conversation.
- If a client retries sending the same `clientMessageId`, the database unique constraint `(sender_id, client_message_id)` prevents duplicates and returns the existing message.

---

## 7. Configuration & Environment Variables

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `PORT` | `8080` | Port for the Java server |
| `COMMON_ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080` | Comma-separated list of allowed CORS and WebSocket origins |

---

## 8. Database & Persistence

- **Engine**: H2 Database running in persistent file mode.
- **Location**: `./data/common_db.mv.db` (automatically created on first launch).
- **Migrations**: Flyway manages schema versions under `src/main/resources/db/migration/`:
  - `V1__init_schema.sql`: Tables for `users`, `conversations`, `conversation_members`, `messages`, and `auth_sessions`.
  - `V2__seed_channels.sql`: Seeds the default channels (`general`, `project-team`, `study-room`).
- To reset database state, simply delete the `./data` directory while the server is stopped.
