# Ota Life Mini Ticketing

> **One sentence:** A fan can always see truthful inventory, can only book tickets that actually exist, and can only enter the venue once — even under concurrent requests.

---

## 🏗️ Architecture & Technology Stack

- **API:** Node.js (v24), TypeScript, Express 4, Prisma ORM 6, MySQL 8 (InnoDB row locking)
- **Mobile App:** React Native, Expo SDK 58 (blank-typescript), `react-native-qrcode-svg`
- **Networking:** USB via ADB reverse port forwarding (`127.0.0.1:3000` API, `127.0.0.1:8081` Metro)
- **Tests:** Jest + ts-jest concurrency test suite (`api/test/oversell.test.ts`)

```
ota-life-ticketing/
├── api/
│   ├── prisma/
│   │   ├── schema.prisma         # Event, User, Ticket models with @unique code
│   │   ├── seed.ts               # 3 users, 1 event with EXACTLY 2 tickets left
│   │   └── migrations/           # Version-controlled SQL migration
│   ├── src/
│   │   ├── index.ts              # Bootstrap only (binds 0.0.0.0:3000)
│   │   ├── app.ts                # Express app, middleware pipeline, routers
│   │   ├── routes/               # events.ts, tickets.ts, checkins.ts
│   │   ├── services/             # booking.ts, checkin.ts, events.ts
│   │   ├── middleware/           # userId.ts (401 validation), errorHandler.ts, notFound.ts
│   │   └── lib/                  # prisma.ts, ticketCode.ts (CSPRNG), errors.ts
│   ├── scripts/                  # verify-rollback.ts (Attack A2)
│   ├── test/                     # oversell.test.ts (Jest parallel concurrency attack)
│   ├── .env.example
│   └── package.json
├── app/
│   ├── App.tsx                   # Safe area, User Switcher, bottom tab navigator
│   ├── src/
│   │   ├── api/
│   │   │   ├── config.ts         # API_BASE_URL = http://127.0.0.1:3000 (sole source of truth)
│   │   │   └── client.ts         # Fetch client injecting X-User-Id with typed errors
│   │   ├── screens/              # EventsScreen.tsx, MyTicketsScreen.tsx
│   │   ├── components/           # TicketCard.tsx, QtyPicker.tsx, LoadingView.tsx, ErrorView.tsx, UserSwitcher.tsx
│   │   └── types.ts
│   └── package.json
└── README.md
```

---

## 🔒 Concurrency & Invariant Mechanics

### How Overselling is Prevented (R1)
Overselling is prevented via a **single conditional atomic `UPDATE ... WHERE ticketsLeft >= ?` executed inside an ACID transaction (`prisma.$transaction`)**:
```sql
UPDATE `Event`
SET `ticketsLeft` = `ticketsLeft` - ?
WHERE `id` = ? AND `ticketsLeft` >= ?;
```
**Why this is safe:**
The `WHERE` clause check and the decrement happen in the **exact same statement under an InnoDB row-level write lock**. Concurrent transactions serialize at the row lock. The losing transaction re-evaluates `ticketsLeft >= ?` against the updated stock, finds 0 affected rows, and immediately aborts with `409 Conflict (SOLD_OUT)`. There is never an instant where a dirty or stale read occurs (no TOCTOU vulnerability). The surrounding transaction pairs decrement with ticket creation (`createMany`) so both commit or roll back together.

### How Single-Use Check-In is Enforced (R2)
Gate check-in uses a conditional atomic `updateMany` filtering on unconsumed tickets:
```sql
UPDATE `Ticket`
SET `checkedInAt` = ?
WHERE `code` = ? AND `checkedInAt` IS NULL;
```
- **Winner:** Row count is `1` -> returns `200 OK` with the check-in timestamp.
- **Loser / Replay:** Row count is `0`. The transaction performs a stable read of the ticket row:
  - If ticket doesn't exist -> `404 Not Found`.
  - If ticket already used -> `409 Conflict (ALREADY_CHECKED_IN)` returning the **exact original timestamp written by the winner**. The database alone decides the winner.

### Idempotency: The Honest Position
> **"Booking is ATOMIC (concurrent requests cannot oversell) but not IDEMPOTENT (a client retry of the same request may create another booking). Recovery path: `GET /me/tickets`. This mirrors IRCTC's documented policy (retries are fresh bookings) and BookMyShow's (documented recovery via booking history). A full idempotency-key mechanism (client key + unique-key table + transactional insert, as used by Stripe) was out of scope; if payments were added it would become mandatory."**

---

## ⚡ Quickstart Setup (Reviewer Step-by-Step)

### Prerequisites
- Node.js >= 22.13 (verified with Node v24.12.0)
- MySQL Server 8.0 running locally on port `3306`
- Android phone with USB debugging enabled, or Android Emulator, with Expo Go installed

### 1. Database & Backend API Setup
```bash
# Clone and navigate to api directory
cd api

# Create the database in MySQL
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ota_life;"

# Set environment variables
cp .env.example .env
# Edit .env to set your MySQL password:
# DATABASE_URL="mysql://root:<password>@localhost:3306/ota_life"

# Install dependencies, run migrations, and seed
npm install
npx prisma migrate dev --name init
npx prisma db seed

# Run the API server (starts on http://0.0.0.0:3000)
npm run dev
```

### 2. Mobile App Setup (USB via ADB)
Plug in your phone via USB with USB debugging enabled:
```bash
# Reverse ports so device communicates over USB without Wi-Fi/LAN assumptions
adb reverse tcp:8081 tcp:8081     # Metro bundler
adb reverse tcp:3000 tcp:3000     # Express API

# Start Expo in app directory
cd ../app
npm install
npx expo start --clear
# Press 'a' in terminal to launch in Expo Go on device
```

---

## 👥 Seeded Data

### Users (Header `X-User-Id`)
| ID | Name | Role |
|:---|:---|:---|
| `1` | Alice Tanaka | Fan 1 (Primary) |
| `2` | Bob Kenji | Fan 2 |
| `3` | Charlie Sato | Fan 3 |

### Event (Seeded State)
- **ID:** `1`
- **Name:** `OTA TOKYO Fan Fest`
- **Venue:** `Tokyo Dome City Hall`
- **Capacity:** `100`
- **ticketsLeft:** **EXACTLY 2** (ready for immediate oversell race testing)

---

## 📡 API Endpoint Reference & Verification Curls

### 1. GET `/events` (Truthful Upcoming Inventory)
```bash
curl -i http://localhost:3000/events
```
**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "OTA TOKYO Fan Fest",
    "venue": "Tokyo Dome City Hall",
    "date": "2026-11-29T07:18:49.058Z",
    "price": "4500",
    "ticketsLeft": 2
  }
]
```

### 2. POST `/events/:id/book` (Book Tickets)
- Headers: `X-User-Id: 1`, `Content-Type: application/json`
- Body: `{"quantity": 1}` (policy route guard enforces integer 1–4)
```bash
curl -i -X POST http://localhost:3000/events/1/book \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d "{\"quantity\": 1}"
```
**Response (201 Created):**
```json
{
  "tickets": [
    {
      "code": "FPvr5pj37wQ",
      "createdAt": "2026-10-30T07:27:23.731Z",
      "event": {
        "id": 1,
        "name": "OTA TOKYO Fan Fest",
        "venue": "Tokyo Dome City Hall",
        "date": "2026-11-29T07:26:56.668Z"
      }
    }
  ]
}
```

### 3. GET `/me/tickets` (Reconciliation Read & User-Scoped)
- Header: `X-User-Id: 1`
```bash
curl -i http://localhost:3000/me/tickets -H "X-User-Id: 1"
```
**Response (200 OK):**
```json
[
  {
    "code": "FPvr5pj37wQ",
    "createdAt": "2026-10-30T07:27:23.731Z",
    "checkedInAt": null,
    "event": {
      "id": 1,
      "name": "OTA TOKYO Fan Fest",
      "venue": "Tokyo Dome City Hall",
      "date": "2026-11-29T07:26:56.668Z"
    }
  }
]
```

### 4. POST `/checkins` (Single-Use Gate Admission)
```bash
curl -i -X POST http://localhost:3000/checkins \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"FPvr5pj37wQ\"}"
```
**First Scan Response (200 OK):**
```json
{
  "code": "FPvr5pj37wQ",
  "checkedInAt": "2026-10-30T07:28:58.728Z"
}
```

**Second Scan Attempt (409 Conflict — returning original timestamp):**
```bash
curl -i -X POST http://localhost:3000/checkins \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"FPvr5pj37wQ\"}"
```
**Response (409 Conflict):**
```json
{
  "error": {
    "code": "ALREADY_CHECKED_IN",
    "message": "Ticket has already been checked in",
    "checkedInAt": "2026-10-30T07:28:58.728Z"
  }
}
```

---

## ⚔️ How to Verify Concurrency Yourself

### The Two-Parallel-Curls Recipe (Attack A1: Oversell Race)
When the event has 1 ticket left, launch two parallel requests at the exact same millisecond:

**In PowerShell:**
```powershell
# Reset to 1 ticket remaining:
npm run seed  # (in api/)

# Book 1 ticket first:
curl.exe -s -X POST http://localhost:3000/events/1/book -H "X-User-Id: 1" -H "Content-Type: application/json" -d "{\"quantity\": 1}"

# Launch two parallel racing requests:
$job1 = Start-Job -ScriptBlock { curl.exe -s -i -X POST http://localhost:3000/events/1/book -H "X-User-Id: 2" -H "Content-Type: application/json" -d "{\"quantity\": 1}" }
$job2 = Start-Job -ScriptBlock { curl.exe -s -i -X POST http://localhost:3000/events/1/book -H "X-User-Id: 3" -H "Content-Type: application/json" -d "{\"quantity\": 1}" }

Receive-Job -Job $job1 -Wait
Receive-Job -Job $job2 -Wait
```
**Observed Result:**
- Exactly one job outputs `201 Created`
- Exactly one job outputs `409 Conflict` (`SOLD_OUT`)
- Database assertion: `SELECT ticketsLeft FROM Event WHERE id=1;` yields `0` (never `-1`). Total tickets created: `2` (never `3`).

### Automated Jest Concurrency Suite
Run the automated parallel race test directly:
```bash
cd api
npm test
```
The suite executes `Promise.allSettled` with concurrent bookings against an isolated test event with 1 ticket left, asserting that exactly one succeeds, one fails with `409 SoldOutError`, and `ticketsLeft` finishes at 0.

---

## 📱 Mobile App Verification Walkthrough (vivo X200)

1. **Launch App:**
   - Active identity is Alice (`X-User-Id: 1`) by default.
   - Event "OTA TOKYO Fan Fest" shows `🔥 2 TICKETS LEFT`.
2. **Book 1 Ticket:**
   - Select Quantity: `1` -> tap `BOOK 1 TICKET`.
   - Button transitions to `RESERVING...` (disabled while in flight).
   - Success banner appears, inventory immediately updates to `🔥 1 TICKET LEFT`.
3. **Switch User & Book Remaining Ticket:**
   - Tap `#2 Bob` in the top identity bar.
   - Quantity selector caps at `1` (remaining stock).
   - Tap `BOOK 1 TICKET`.
   - Event status updates to `● SOLD OUT`, and button is disabled.
4. **View Ticket & QR Code:**
   - Switch to the `🎟️ My Tickets` tab.
   - Ticket card renders with `#<random_code>`, event details, and crisp QR code.
   - Status badge shows `● ADMIT ONE`.
5. **Gate Check-in Simulation:**
   - In terminal, check in the ticket:
     ```bash
     curl -X POST http://localhost:3000/checkins -H "Content-Type: application/json" -d "{\"code\": \"<CODE_ON_SCREEN>\"}"
     ```
   - On the phone, pull down to refresh `My Tickets`.
   - Card transitions to `✓ CHECKED IN` with the exact gate scan timestamp badge.
6. **Network Resilience (Airplane Mode):**
   - Toggle Airplane mode ON.
   - Pull down to refresh -> renders dark themed `ErrorView` with `CODE: NETWORK_ERROR` and `Try Again` button (no unhandled promise rejections, crashes, or white screens).
   - Toggle Airplane mode OFF -> tap `Try Again` -> cleanly reloads ticket list.
