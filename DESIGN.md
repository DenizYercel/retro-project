# VelaRetro — Sistem Tasarımı

## 1. Genel Mimari

```
┌──────────────────────────────────────────────────────────────┐
│               Cloudflare Pages (CDN)                         │
│                                                              │
│   React + TypeScript + Tailwind CSS (Vite — statik build)    │
│   ┌─────────────┐    ┌────────────────────────┐              │
│   │  HTTP/REST  │    │  Socket.io Client       │              │
│   │  (axios)    │    │  (real-time events)     │              │
│   └──────┬──────┘    └───────────┬────────────┘              │
└──────────┼───────────────────────┼─────────────────────────  ┘
           │ REST                  │ WebSocket
           ▼                       ▼
┌─────────────────────────────────────────────────────┐
│               Railway.app (Node.js server)           │
│                                                     │
│   Node.js + Express                                 │
│   ┌─────────────┐    ┌────────────────────────┐     │
│   │  REST API   │    │  Socket.io Server       │     │
│   │  /api/v1    │    │  room:<uuid>            │     │
│   └──────┬──────┘    └───────────┬────────────┘     │
│          │                       │                   │
│          └───────────┬───────────┘                   │
│                      │                               │
│              ┌───────▼────────┐                      │
│              │  Prisma ORM    │                      │
│              └───────┬────────┘                      │
└──────────────────────┼──────────────────────────────┘
                       │ DATABASE_URL (connection string)
                       ▼
              ┌────────────────────┐
              │  Neon.tech         │
              │  Serverless        │
              │  PostgreSQL        │
              └────────────────────┘
```

### Neden bu mimari?
- **REST**: Oda oluşturma, katılım, sayfa yükleme gibi tek seferlik işlemler
- **Socket.io**: Reveal, oylama, timer, katılımcı listesi gibi anlık broadcast işlemleri
- **Prisma**: Type-safe database erişimi, migration yönetimi
- **PostgreSQL ENUM**: Oda aşamaları (phase) DB seviyesinde korunur

### Neden Cloudflare Workers değil?
Cloudflare Workers stateless (durumsuz) çalışır. Socket.io'nun `room:<uuid>` yapısı sunucuda kalıcı hafıza gerektirir — Workers bunu desteklemez. Bu yüzden:
- **Frontend** → Cloudflare Pages (statik build, CDN, ücretsiz)
- **Backend** → Railway (persistent Node.js süreci, Socket.io tam destek)
- **Database** → Neon (serverless PostgreSQL, ücretsiz tier, Railway'e bağlanır)

### Deployment Platformları

| Katman | Platform | Ücret | Ne Yapar |
|---|---|---|---|
| Frontend | Cloudflare Pages | Ücretsiz | `vite build` çıktısını CDN'den serve eder |
| Backend | Railway.app | Ücretsiz tier (500 saat/ay) | Node.js + Socket.io süreci |
| Database | Neon.tech | Ücretsiz tier (0.5 GB) | Serverless PostgreSQL |

---

## 2. Proje Dizin Yapısı

```
retro-project/
├── packages/
│   ├── client/                     # → Cloudflare Pages'e deploy edilir
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Board/
│   │   │   │   │   ├── Board.tsx           # Ana board, 3 kolon
│   │   │   │   │   ├── Column.tsx          # İyi/Kötü/Aksiyon kolonu
│   │   │   │   │   ├── Card.tsx            # Bireysel kart
│   │   │   │   │   └── AddCardForm.tsx     # Kart ekleme formu
│   │   │   │   ├── Room/
│   │   │   │   │   ├── JoinRoom.tsx        # İsim girme ekranı
│   │   │   │   │   ├── RoomHeader.tsx      # Oda adı, timer, katılımcılar
│   │   │   │   │   └── ModeratorPanel.tsx  # Moderatör kontrol paneli
│   │   │   │   ├── Voting/
│   │   │   │   │   ├── VoteButton.tsx      # Oy ver/geri al
│   │   │   │   │   └── VoteCounter.tsx     # Oy sayısı göstergesi
│   │   │   │   ├── Actions/
│   │   │   │   │   ├── ActionList.tsx      # Aksiyon maddeleri listesi
│   │   │   │   │   └── ActionItem.tsx      # Tekil aksiyon maddesi
│   │   │   │   └── Timer/
│   │   │   │       └── CountdownTimer.tsx  # Geri sayım
│   │   │   ├── hooks/
│   │   │   │   ├── useSocket.ts            # Socket.io bağlantı yönetimi
│   │   │   │   ├── useRoom.ts              # Oda state yönetimi
│   │   │   │   └── useSession.ts           # localStorage token yönetimi
│   │   │   ├── pages/
│   │   │   │   ├── Home.tsx                # Oda oluştur / linke git
│   │   │   │   ├── RoomPage.tsx            # Ana retro ekranı
│   │   │   │   └── NotFound.tsx
│   │   │   ├── store/
│   │   │   │   └── roomStore.ts            # Zustand store
│   │   │   ├── types/
│   │   │   │   └── index.ts                # Paylaşılan TypeScript tipleri
│   │   │   └── lib/
│   │   │       ├── socket.ts               # Socket.io client instance
│   │   │       └── api.ts                  # Axios instance
│   │   ├── .env.production                 # VITE_API_URL=https://retro-api.railway.app
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── server/                     # → Railway.app'e deploy edilir
│       ├── src/
│       │   ├── routes/
│       │   │   ├── rooms.ts                # REST: oda işlemleri
│       │   │   └── health.ts               # GET /health
│       │   ├── socket/
│       │   │   ├── handlers/
│       │   │   │   ├── cardHandlers.ts     # Kart olayları
│       │   │   │   ├── voteHandlers.ts     # Oylama olayları
│       │   │   │   ├── roomHandlers.ts     # Oda durum olayları
│       │   │   │   └── timerHandlers.ts    # Timer olayları
│       │   │   └── index.ts                # Socket.io setup
│       │   ├── services/
│       │   │   ├── roomService.ts          # İş mantığı
│       │   │   ├── cardService.ts
│       │   │   └── voteService.ts
│       │   ├── jobs/
│       │   │   └── cleanupExpiredRooms.ts  # 7 gün sonra silme
│       │   ├── middleware/
│       │   │   └── validateRoom.ts
│       │   ├── prisma/
│       │   │   └── client.ts               # Prisma singleton
│       │   └── index.ts                    # Express + Socket.io başlangıç
│       ├── prisma/
│       │   └── schema.prisma               # Database şeması
│       ├── railway.toml                    # Railway deploy config
│       └── package.json
│
├── package.json                    # Monorepo root
└── DESIGN.md
```

---

## 3. Database Şeması (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum RoomPhase {
  WRITING   // Katılımcılar kart yazıyor, kartlar gizli
  REVEALED  // Kartlar açıldı, tartışma
  VOTING    // Oylama aşaması
  DONE      // Retro tamamlandı
}

enum CardColumn {
  WENT_WELL    // İyi Gitti
  TO_IMPROVE   // Geliştirilmeli
  ACTION_IDEA  // Aksiyon Önerisi
}

model Room {
  id            String      @id @default(uuid())
  name          String
  phase         RoomPhase   @default(WRITING)
  moderatorToken String     // Odayı kuranın localStorage token'ı
  expiresAt     DateTime    // createdAt + 7 gün
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  participants  Participant[]
  cards         Card[]
  actionItems   ActionItem[]

  @@index([expiresAt])  // Cleanup job için
}

model Participant {
  id          String    @id @default(uuid())
  roomId      String
  token       String    // localStorage UUID (pseudonymous)
  displayName String
  joinedAt    DateTime  @default(now())

  room        Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)
  votes       Vote[]

  @@unique([roomId, token])  // Aynı token aynı odada bir kez
  @@index([roomId])
}

model Card {
  id           String     @id @default(uuid())
  roomId       String
  column       CardColumn
  content      String
  authorToken  String     // Kimin yazdığı (API'dan asla dönmez)
  createdAt    DateTime   @default(now())

  room         Room       @relation(fields: [roomId], references: [id], onDelete: Cascade)
  votes        Vote[]

  @@index([roomId])
}

model Vote {
  id            String      @id @default(uuid())
  cardId        String
  participantId String
  createdAt     DateTime    @default(now())

  card          Card        @relation(fields: [cardId], references: [id], onDelete: Cascade)
  participant   Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)

  // Aynı kişi aynı karta max 3 oy verebilir → uygulama katmanında kontrol
  @@index([cardId])
  @@index([participantId])
}

model ActionItem {
  id          String    @id @default(uuid())
  roomId      String
  content     String
  assignee    String?   // Sorumlu kişinin displayName'i
  completed   Boolean   @default(false)
  createdAt   DateTime  @default(now())

  room        Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@index([roomId])
}
```

### Kritik Tasarım Kararları

| Karar | Açıklama |
|---|---|
| `authorToken` API'dan dönmez | Server, WRITING ve REVEALED fazında `authorToken` alanını response'tan çıkarır |
| `moderatorToken` room'da saklanır | Moderatör kontrolü için token karşılaştırması yeterli, ayrı tablo gerekmez |
| `Vote` ayrı tablo | Kişi başı oy sayısı ve karta verilen oy sayısı verimli sorgulanır |
| Cascade delete | Oda silindiğinde tüm veriler temizlenir |

---

## 4. REST API Endpointleri

```
Base URL: /api/v1

POST   /rooms                    → Yeni oda oluştur
GET    /rooms/:roomId            → Oda bilgisi + kartlar + aksiyonlar
POST   /rooms/:roomId/join       → Odaya katıl (isim + token)
POST   /rooms/:roomId/actions    → Aksiyon maddesi ekle
PATCH  /rooms/:roomId/actions/:id → Aksiyon tamamlandı işaretle
GET    /health                   → Sunucu sağlık kontrolü
```

### POST /rooms

**Request:**
```json
{
  "name": "Sprint 12 Retrosu",
  "moderatorToken": "uuid-v4-from-localstorage",
  "moderatorName": "Ahmet"
}
```

**Response 201:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Sprint 12 Retrosu",
  "phase": "WRITING",
  "expiresAt": "2026-05-22T10:00:00Z",
  "shareUrl": "/room/550e8400-e29b-41d4-a716-446655440000"
}
```

### GET /rooms/:roomId

**Response 200** (WRITING fazında):
```json
{
  "id": "...",
  "name": "Sprint 12 Retrosu",
  "phase": "WRITING",
  "expiresAt": "...",
  "isModerator": false,
  "participants": [
    { "displayName": "Ahmet" },
    { "displayName": "Zeynep" }
  ],
  "cards": [
    {
      "id": "...",
      "column": "WENT_WELL",
      "content": "***",        ← WRITING fazında içerik maskelenir (sadece kendi kartların görünür)
      "voteCount": 0,
      "isOwn": true
    }
  ],
  "actionItems": []
}
```

**Response 200** (REVEALED/VOTING/DONE fazında):
```json
{
  "cards": [
    {
      "id": "...",
      "column": "WENT_WELL",
      "content": "Kod review sürecimiz çok iyi işledi",  ← Gerçek içerik
      "voteCount": 3,
      "myVotes": 1,              ← Bu kullanıcının bu karta verdiği oy
      "isOwn": false             ← authorToken hiçbir zaman dönmez
    }
  ]
}
```

---

## 5. Socket.io Olayları

```
Namespace: / (default)
Room:      room:<roomId>
```

### Client → Server (Emit)

| Olay | Payload | Açıklama |
|---|---|---|
| `join_room` | `{ roomId, token, displayName }` | Odaya katıl |
| `add_card` | `{ roomId, column, content, token }` | Kart ekle |
| `edit_card` | `{ cardId, content, token }` | Kart düzenle |
| `delete_card` | `{ cardId, token }` | Kart sil |
| `cast_vote` | `{ cardId, token }` | Oy ver |
| `retract_vote` | `{ cardId, token }` | Oyu geri al |
| `moderator_action` | `{ roomId, token, action }` | Moderatör komutu |

`moderator_action.action` değerleri:
- `REVEAL_CARDS` → Kartları aç
- `START_VOTING` → Oylama başlat
- `END_VOTING` → Oylama bitir
- `START_TIMER` → `{ duration: 600 }` (saniye)
- `STOP_TIMER` → Timer durdur
- `CLOSE_ROOM` → Odayı kapat

### Server → Client (Broadcast)

| Olay | Payload | Tetikleyen |
|---|---|---|
| `room_state` | Tam oda durumu | join_room sonrası (sadece katılana) |
| `participant_joined` | `{ displayName }` | Birisi katıldığında |
| `participant_left` | `{ displayName }` | Birisi ayrıldığında |
| `card_added` | `{ card }` | WRITING'de maskelenmiş, REVEALED'da gerçek |
| `card_updated` | `{ card }` | Kart düzenlendiğinde |
| `card_deleted` | `{ cardId }` | Kart silindiğinde |
| `phase_changed` | `{ phase, cards? }` | Faz geçişinde — REVEALED'da tüm kartlar açılır |
| `vote_updated` | `{ cardId, voteCount }` | Oy verildiğinde/geri alındığında |
| `timer_tick` | `{ remaining }` | Her saniye |
| `timer_ended` | `{}` | Timer bittiğinde |
| `action_added` | `{ actionItem }` | Yeni aksiyon maddesi |
| `action_updated` | `{ actionItem }` | Aksiyon tamamlandı |
| `error` | `{ code, message }` | Hata durumunda |

---

## 6. Faz Geçiş Diyagramı

```
                    ┌─────────┐
                    │ WRITING │  ← Başlangıç
                    └────┬────┘
                         │ moderator: REVEAL_CARDS
                         ▼
                    ┌──────────┐
                    │ REVEALED │  ← Tartışma
                    └────┬─────┘
                         │ moderator: START_VOTING
                         ▼
                    ┌────────┐
                    │ VOTING │  ← 5 oy/kişi
                    └───┬────┘
                        │ moderator: END_VOTING
                        ▼
                    ┌──────┐
                    │ DONE │  ← Aksiyon maddeleri, 7 gün erişim
                    └──────┘
```

**Faz Kuralları:**
- WRITING: Kartlar sadece sahibine görünür, diğerlerine `***` gösterilir
- REVEALED → VOTING geçişinde kartlar otomatik oy sayısına göre sıralanmaz (VOTING bitince sıralanır)
- VOTING: Kendi kartına oy verilemez, bir karta max 3 oy, toplam 5 oy
- DONE: Hiçbir değişiklik kabul edilmez, sadece okuma

---

## 7. Client-Side Session Kimliği

```typescript
// useSession.ts
function getOrCreateSession() {
  const TOKEN_KEY = 'retro_session_token';
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID(); // UUID v4, tarayıcı native API
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}
```

**Akış:**
1. Kullanıcı linke gelir → token localStorage'dan okunur veya oluşturulur
2. İsim giriş ekranı → `{ token, displayName }` ile `join_room` emit edilir
3. Server `participants` tablosuna upsert yapar
4. Sayfa yenilenmesinde token aynı → otomatik tekrar katılım

---

## 8. Güvenlik Kontrolleri

| Kontrol | Nerede | Nasıl |
|---|---|---|
| Moderatör yetkisi | Server (Socket handler) | `room.moderatorToken === socket.data.token` |
| Kendi kartına oy | Server (voteService) | `card.authorToken !== participant.token` |
| Max 5 toplam oy | Server (voteService) | `COUNT(votes WHERE participantId)` |
| Max 3 oy aynı karta | Server (voteService) | `COUNT(votes WHERE cardId AND participantId)` |
| DONE fazında yazma engeli | Server (her handler) | `room.phase !== 'DONE'` kontrolü |
| Oda erişimi | Server (validateRoom middleware) | `room.expiresAt > NOW()` |
| authorToken gizleme | Server (cardService) | Prisma `select` ile alan dışarıda bırakılır |

---

## 9. Frontend State Yönetimi

```
Zustand Store (roomStore.ts)

state: {
  room: Room | null
  participants: Participant[]
  cards: Card[]
  actionItems: ActionItem[]
  myToken: string
  myVotes: Record<cardId, number>  // cardId → verilen oy sayısı
  remainingVotes: number           // 5 - toplam verilen oy
  timer: { active: boolean, remaining: number }
  phase: RoomPhase
}

actions:
  setRoom, addCard, updateCard, deleteCard,
  revealCards, castVote, retractVote,
  setPhase, tickTimer, addActionItem
```

**Socket olayları doğrudan store'u günceller:**
```
Socket Event → Zustand Action → React Re-render
```

---

## 10. Temizleme Job'u

```typescript
// jobs/cleanupExpiredRooms.ts
// Her gece 03:00'da çalışır

async function cleanupExpiredRooms() {
  await prisma.room.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  });
}
```

Cascade delete ile oda silindiğinde: `participants`, `cards`, `votes`, `actionItems` otomatik silinir.

---

## 11. Deployment Rehberi

### Environment Değişkenleri

**Backend (Railway — Environment Variables panelinden girilir):**
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/retro?sslmode=require
PORT=3000
CLIENT_ORIGIN=https://retro.pages.dev   # Cloudflare Pages URL'i
NODE_ENV=production
```

**Frontend (Cloudflare Pages — Settings > Environment Variables):**
```env
VITE_API_URL=https://retro-api.up.railway.app
VITE_WS_URL=https://retro-api.up.railway.app
```

### railway.toml (Backend)
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npx prisma generate && npx prisma migrate deploy && npm run build"

[deploy]
startCommand = "node dist/index.js"
healthcheckPath = "/health"
restartPolicyType = "ON_FAILURE"
```

### Cloudflare Pages Ayarları
```
Build command:    npm run build
Build output:     dist
Root directory:   packages/client
```

### CORS Ayarı (Backend — index.ts)
```typescript
// Railway'de çalışırken Cloudflare Pages URL'ini kabul et
app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true
}));

// Socket.io CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    methods: ["GET", "POST"]
  }
});
```

### Deploy Sırası
1. Neon.tech → proje oluştur → `DATABASE_URL` al
2. Railway → repo bağla → env değişkenlerini gir → deploy
3. Railway URL'ini kopyala (`https://xxx.up.railway.app`)
4. Cloudflare Pages → repo bağla → `VITE_API_URL` gir → deploy
5. Cloudflare URL'ini Railway'e `CLIENT_ORIGIN` olarak ekle

---

## Sonraki Adım

Tasarım onaylandıktan sonra implementasyon sırası:

1. `prisma/schema.prisma` → `npx prisma migrate dev`
2. Express + Socket.io sunucu iskeleti
3. REST route'ları (rooms, join)
4. Socket handler'ları (card, vote, moderator)
5. React sayfaları (Home, RoomPage)
6. Board bileşenleri (Column, Card, AddCardForm)
7. Moderatör paneli + Timer
8. Aksiyon maddeleri
9. Cleanup job
10. `railway.toml` + Cloudflare Pages ayarları

Başlamak için: `/sc:implement` veya "koda geçelim" yaz.
