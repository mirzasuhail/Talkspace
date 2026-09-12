# Talksy — Talk without the ceremony.

> **One link. One room. Just talk.**

Talksy is a production-grade, real-time anonymous chat platform. Users can create a chat room instantly, share the room URL, join anonymously, exchange text messages and images in real time, and leave without creating an account.

---

## 🌟 Key Features

- **Instant Anonymous Chat**: Create rooms with zero signup or onboarding friction.
- **Real-Time Communication**: Instant WebSockets layer powered by Socket.IO with automatic reconnection.
- **First-Class Image Sharing**: File picker, drag & drop dropzone, clipboard image paste (`Ctrl+V`/`Cmd+V`), thumbnail generation (`sharp`), WebP optimization, EXIF stripping, and a fullscreen lightbox viewer.
- **Rich Message Experience**: Text, markdown formatting, reactions (`❤️ 😂 👍 🔥 😮 👀`), replies, inline edits, soft deletes, and XSS sanitization.
- **Presence & Typing**: Real-time online counter (`● N online`), interactive member drawer, and animated typing indicators.
- **Room Controls**: Expiration options (`1h`, `24h`, `7d`, `never`), private room access keys, and owner moderation (kick, ban, mute).
- **Dark-First Premium Design**: Styled with a curated palette (`#09090B`, `#111113`, `#18181B`, `#8B5CF6`), Geist/Inter typography, ambient background glows, and responsive layout.

---

## 🏗️ Architecture

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client.
- **Backend**: Node.js, TypeScript, Fastify, Socket.IO Server, Prisma ORM, Sharp image processing.
- **Database**: PostgreSQL (with zero-config SQLite local dev driver fallback).
- **Caching & Presence**: Redis (with in-memory fallback store).
- **Monorepo Structure**:
  - `apps/web`: Frontend React client app
  - `apps/server`: Fastify + Socket.IO server
  - `packages/shared`: Shared DTOs, entity models, and Socket event type definitions

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Step-by-Step Setup

1. **Clone & Install Dependencies**:
   ```bash
   git clone https://github.com/your-org/talksy.git
   cd talksy
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```

3. **Initialize Database Schema**:
   ```bash
   npm run db:push
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

   - **Frontend**: `http://localhost:3000`
   - **Backend API**: `http://localhost:4000`

---

## 🐳 Docker Deployment

To run PostgreSQL, Redis, backend, and frontend via Docker Compose:

```bash
docker-compose up --build -d
```

Access the application at `http://localhost:3000`.

---

## 🧪 Running Tests

```bash
npm test
```

---

## 📄 License

MIT
