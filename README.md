# Ota Life Mini Ticketing

> A fan can always see truthful inventory, can only book tickets that actually exist, and can only enter the venue once — even under concurrent requests.

---

## App Walkthrough & Visual Proof

| 1. Events & Stock | 2. Booking Flow & Banner | 3. Active Ticket & QR Code |
|:---:|:---:|:---:|
| <img src="docs/screenshots/01_events_screen.png" width="250" alt="Events Screen" /> | <img src="docs/screenshots/02_booking_flow.png" width="250" alt="Booking Flow" /> | <img src="docs/screenshots/03_my_tickets_active.png" width="250" alt="Active Ticket" /> |
| **Initial State:** Naruto (`#1`), 2 tickets left, paper theme | **Micro-Optimism:** Local decrement post-201 & slide banner | **Admission:** Matcha green `ADMIT ONE` badge & quiet-zone QR |

| 4. Gate Check-in | 5. Sold Out State | 6. Offline Error Handling |
|:---:|:---:|:---:|
| <img src="docs/screenshots/04_ticket_checked_in.png" width="250" alt="Checked In Ticket" /> | <img src="docs/screenshots/05_sold_out_state.png" width="250" alt="Sold Out State" /> | <img src="docs/screenshots/06_network_resilience.png" width="250" alt="Offline Error Pop-up" /> |
| **Entry Complete:** Amber `CHECKED IN` + gate scan timestamp | **Truthful Inventory:** `SOLD OUT` badge & disabled button | **Network Resilience:** Modal error dialog + status banner |

---

## Architecture & Technology Stack

- **API:** Node.js (v24), TypeScript, Express 4, Prisma ORM 6, MySQL 8 (InnoDB row locking)
- **Mobile App:** React Native, Expo SDK 58 (blank-typescript), `react-native-qrcode-svg`
- **Networking:** USB via ADB reverse port forwarding (`127.0.0.1:3000` API, `127.0.0.1:8081` Metro)
- **Concurrency Test Suite:** Jest + ts-jest (`api/test/oversell.test.ts`), live DB assertion suite (`api/scripts/verify-concurrency-evidence.ts`)

```
ota-life-ticketing/
├── api/
│   ├── prisma/
│   │   ├── schema.prisma         # Event, User, Ticket models with @unique code
│   │   └── seed.ts               # 3 users (Naruto, Ichigo, Luffy), 1 event with 2 tickets left
│   ├── src/
│   │   ├── index.ts              # Server bootstrap (0.0.0.0:3000)
│   │   ├── app.ts                # Express app, middleware pipeline, routers
│   │   ├── routes/               # events.ts, tickets.ts, checkins.ts
│   │   ├── services/             # booking.ts, checkin.ts, events.ts
│   │   ├── middleware/           # userId.ts (401 validation), errorHandler.ts, notFound.ts
│   │   └── lib/                  # prisma.ts, ticketCode.ts (CSPRNG), errors.ts
│   ├── scripts/                  # verify-concurrency-evidence.ts (raw SQL assertion attack)
│   ├── test/                     # oversell.test.ts (Jest parallel concurrency attack)
│   ├── .env.example
│   └── package.json
├── app/
│   ├── App.tsx                   # Safe area, User Switcher, text-only bottom tab navigator
│   ├── src/
│   │   ├── api/                  # client.ts (fetch wrapper, timeout policy), config.ts
│   │   ├── screens/              # EventsScreen.tsx, MyTicketsScreen.tsx
│   │   ├── components/           # TicketCard.tsx, QtyPicker.tsx, ErrorView.tsx, UserSwitcher.tsx, Skeletons
│   │   ├── theme.ts              # Semantic light tokens (paper, ink, vermillion, matcha, amber)
│   │   └── types.ts
│   └── package.json
└── README.md
```

---

## How Overselling is Prevented

Overselling is prevented via a **single conditional atomic `UPDATE` executed inside an ACID transaction (`prisma.$transaction`)**:

```sql
UPDATE `Event`
SET `ticketsLeft` = `ticketsLeft` - ?
WHERE `id` = ? AND `ticketsLeft` >= ?;
```

- **Row-Level Serialization:** The decrement and condition check run in the exact same statement under an InnoDB row-level write lock. Concurrent requests serialize at the database row.
- **Atomic Abort on Depletion:** Losing transactions evaluate against the updated stock, affect 0 rows, and abort immediately with `409 Conflict (SOLD_OUT)`. There is never an instant where a dirty or stale read occurs.
- **Transaction Pair:** Decrementing inventory and inserting ticket records (`createMany`) commit or roll back wholly together.

### How Single Check-In is Enforced
Gate admission executes a conditional atomic update filtering on unconsumed tickets:
```sql
UPDATE `Ticket` SET `checkedInAt` = ? WHERE `code` = ? AND `checkedInAt` IS NULL;
```
- **Winner:** Affects 1 row -> returns `200 OK` with the check-in timestamp.
- **Replays:** Affect 0 rows -> queries existing record and returns `409 Conflict (ALREADY_CHECKED_IN)` with the original winner's timestamp.

---

## Quickstart Setup & Local Execution

### Prerequisites
- Node.js >= 22.13 (verified with Node v24.12.0)
- MySQL Server 8.0 running locally on port `3306`
- Android phone with USB debugging enabled (or Android emulator) with Expo Go installed

### 1. Database & Backend API Setup
```bash
# Clone and navigate to api directory
cd api

# Set up environment file
cp .env.example .env
# Edit .env to set your MySQL credentials:
# DATABASE_URL="mysql://root:<password>@localhost:3306/ota_life"

# Install dependencies, run Prisma migrations, and seed
npm install
npx prisma migrate dev --name init
npx prisma db seed

# Start the API server
npm run dev
```
*API binds to `http://0.0.0.0:3000`. The seed initializes 1 event (`OTA TOKYO Fan Fest`, `ticketsLeft: 2`, `capacity: 100`) and 3 users (`#1 Naruto`, `#2 Ichigo`, `#3 Luffy`).*

### 2. Mobile App Setup (Physical Device via USB)
Connect your Android phone via USB with USB debugging enabled:
```bash
# Reverse ports so device reaches localhost servers over USB without Wi-Fi dependencies
adb reverse tcp:8081 tcp:8081     # Metro bundler
adb reverse tcp:3000 tcp:3000     # Express API

# Navigate to app directory and install dependencies
cd ../app
npm install

# Start Expo Metro bundler
npx expo start --clear
```
- Press `a` in the terminal to launch the app directly in Expo Go on your connected device.
- The app will load pointing to `http://127.0.0.1:3000`.

---

## Systematic Manual Testing Guide

Follow these sequential scenarios to verify all functional, boundary, concurrency, and resilience paths.

### Scenario 1: Happy Path Booking
1. Open the app; active identity is **Naruto (`#1`)**.
2. On the **EVENTS** screen, verify the event card displays `2 TICKETS LEFT`, price `¥4,500`, venue, and date.
3. Select quantity `1` with the stepper `[-] 1 [+]` and tap **BOOK 1 TICKET**.
4. Observe the button scale animation, brief in-flight `RESERVING...` state, and the green confirmation banner: `CONFIRMED — Reserved 1 ticket successfully`.
5. Observe the stock immediately decrements to `1 TICKET LEFT`.
6. Switch to the **MY TICKETS** tab: verify the active pass renders with stub tear cutouts, `#<random_code>`, Matcha green `ADMIT ONE` badge, and crisp black-and-white QR code.

### Scenario 2: Identity Isolation & User Switching
1. Tap **#2 Ichigo** in the top identity bar.
2. Under **MY TICKETS**, verify the screen shows `NO TICKETS FOUND` with a clean ticket glyph and `BROWSE EVENTS` button (Naruto's ticket is strictly isolated and invisible to Ichigo).
3. Switch back to **#1 Naruto**: verify Naruto's ticket reappears immediately.

### Scenario 3: Stock Depletion & Sold Out State
1. Switch active identity to **#2 Ichigo**.
2. On the **EVENTS** screen, verify the card shows `1 TICKET LEFT`.
3. Notice the quantity stepper automatically clamps the maximum selectable quantity to `1`.
4. Tap **BOOK 1 TICKET**.
5. Once confirmed, observe the event status badge and button flip to `SOLD OUT` in inkSoft, and the button becomes fully disabled.
6. Switch active identity to **#3 Luffy**: verify Luffy also sees `SOLD OUT` with no booking controls available.

### Scenario 4: Gate Check-in Simulation (Happy Path)
1. Switch to **#1 Naruto** and view the active ticket on the **MY TICKETS** screen.
2. Note the ticket code displayed on screen (e.g. `LAupKs3-VLg`).
3. In a terminal, simulate the gate scanner admission request:
   ```bash
   curl -i -X POST http://localhost:3000/checkins \
     -H "Content-Type: application/json" \
     -d "{\"code\": \"<CODE_ON_SCREEN>\"}"
   ```
4. Verify the terminal outputs `200 OK` with `{ "code": "...", "checkedInAt": "<ISO_TIMESTAMP>" }`.
5. On the phone, pull down to refresh the ticket list.
6. Observe the badge cross-fades to Amber `CHECKED IN`, the exact gate scan timestamp appears in the admission stamp box, and the QR code wrapper dims to 0.55 opacity.

### Scenario 5: Check-in Replay Attack Defense
1. In the terminal, execute the exact same check-in command a second time with the already-used code:
   ```bash
   curl -i -X POST http://localhost:3000/checkins \
     -H "Content-Type: application/json" \
     -d "{\"code\": \"<CODE_ON_SCREEN>\"}"
   ```
2. Verify the server returns `409 Conflict` with error code `ALREADY_CHECKED_IN` containing the exact, byte-identical timestamp from the initial check-in.

### Scenario 6: Network Resilience & Offline Error Handling
1. Temporarily sever the API connection by removing port forwarding:
   ```bash
   adb reverse --remove tcp:3000
   ```
2. On the phone, pull down to refresh on either the **EVENTS** or **MY TICKETS** screen.
3. Observe the immediate native modal pop-up:
   - Title: `Connection Offline`
   - Message: `Network connection failed. Verify API server is running and ADB reverse is active.`
   - Dismiss button: `[ OK ]`
4. Tap `OK` to dismiss. Observe the red slide-down failure banner and notice zero crashes or unhandled rejections.
5. Restore the port forwarding:
   ```bash
   adb reverse tcp:3000 tcp:3000
   ```
6. Pull down to refresh again: verify the app cleanly recovers and reloads truthful inventory.

### Scenario 7: Concurrency Oversell Attack
When an event has only 1 ticket remaining, simulate two fans booking simultaneously:
```powershell
# Reset to clean seeded state
cd api
npm run seed

# Book 1 ticket first as Naruto
curl.exe -s -X POST http://localhost:3000/events/1/book -H "X-User-Id: 1" -H "Content-Type: application/json" -d "{\"quantity\": 1}"

# Launch two parallel racing requests at the same millisecond
$job1 = Start-Job -ScriptBlock { curl.exe -s -i -X POST http://localhost:3000/events/1/book -H "X-User-Id: 2" -H "Content-Type: application/json" -d "{\"quantity\": 1}" }
$job2 = Start-Job -ScriptBlock { curl.exe -s -i -X POST http://localhost:3000/events/1/book -H "X-User-Id: 3" -H "Content-Type: application/json" -d "{\"quantity\": 1}" }

Receive-Job -Job $job1 -Wait
Receive-Job -Job $job2 -Wait
```
- Observe: exactly one job receives `201 Created` and the other receives `409 Conflict (SOLD_OUT)`.
- Database verification:
  ```sql
  SELECT ticketsLeft FROM Event WHERE id = 1;  -- Returns 0 (never -1)
  SELECT COUNT(*) FROM Ticket WHERE eventId = 1; -- Returns 2 (never 3)
  ```

---

## Automated Concurrency Verification Suites

### 1. Automated Jest Concurrency Suite
```bash
cd api
npm test
```
*Executes `Promise.allSettled` concurrent booking races on an isolated test event, asserting exactly one succeeds, one fails with `409 SoldOutError`, and `ticketsLeft` reaches 0.*

### 2. End-to-End Database Assertion Suite
```bash
cd api
npm run verify:concurrency
```
*Executes live parallel oversell and replay attacks against the running API and prints raw SQL query assertions before resetting seed state:*
```text
=== ATTACK A1 — TWO PARALLEL OVERSELL REQUESTS (ICHIGO vs LUFFY) ===
Ichigo HTTP Result: 409 {"error":{"code":"SOLD_OUT"}}
Luffy HTTP Result:  201 {"tickets":[{"code":"X8tQ6XNX3pc", ...}]}

=== RAW DATABASE ASSERTIONS POST-ATTACK A1 ===
DB ASSERTION 1 - ticketsLeft: 0 (EXACTLY 0, NEVER -1)
DB ASSERTION 2 - total tickets created in DB: 2 (EXACTLY 2, NEVER 3)

=== ATTACK A4 — TWO PARALLEL CHECK-INS FOR TICKET 1 ===
Check-in Request A: 409 {"error":{"code":"ALREADY_CHECKED_IN","checkedInAt":"2026-10-30T10:56:25.304Z"}}
Check-in Request B: 200 {"code":"LAupKs3-VLg","checkedInAt":"2026-10-30T10:56:25.304Z"}

=== RAW DATABASE ASSERTIONS POST-ATTACK A4 ===
DB Ticket checkedInAt:                  2026-10-30T10:56:25.304Z
Winner 200 returned timestamp:          2026-10-30T10:56:25.304Z
Loser 409 returned checkedInAt:         2026-10-30T10:56:25.304Z
Byte-identical comparison (Winner/Loser): true
Byte-identical comparison (Loser/DB):    true
```

---

## API Reference & cURL Requests

### 1. `GET /events` — Upcoming Events
```bash
curl -i http://localhost:3000/events
```
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

### 2. `POST /events/:id/book` — Book Tickets
Header `X-User-Id` specifies fan identity (`1`, `2`, or `3`). Body `quantity` is 1 to 4.
```bash
curl -i -X POST http://localhost:3000/events/1/book \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d "{\"quantity\": 1}"
```
```json
{
  "tickets": [
    {
      "code": "LAupKs3-VLg",
      "createdAt": "2026-10-30T10:56:25.254Z",
      "event": {
        "id": 1,
        "name": "OTA TOKYO Fan Fest",
        "venue": "Tokyo Dome City Hall",
        "date": "2026-11-29T10:46:09.859Z"
      }
    }
  ]
}
```

### 3. `GET /me/tickets` — View My Tickets
```bash
curl -i http://localhost:3000/me/tickets -H "X-User-Id: 1"
```
```json
[
  {
    "code": "LAupKs3-VLg",
    "createdAt": "2026-10-30T10:56:25.254Z",
    "checkedInAt": null,
    "event": {
      "id": 1,
      "name": "OTA TOKYO Fan Fest",
      "venue": "Tokyo Dome City Hall",
      "date": "2026-11-29T10:46:09.859Z"
    }
  }
]
```

### 4. `POST /checkins` — Gate Admission
```bash
curl -i -X POST http://localhost:3000/checkins \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"LAupKs3-VLg\"}"
```
**First Scan (200 OK):**
```json
{
  "code": "LAupKs3-VLg",
  "checkedInAt": "2026-10-30T10:56:25.304Z"
}
```
**Second Scan (409 Conflict with original timestamp):**
```json
{
  "error": {
    "code": "ALREADY_CHECKED_IN",
    "message": "Ticket has already been checked in",
    "checkedInAt": "2026-10-30T10:56:25.304Z"
  }
}
```

---

## Deliberate Scope & Technical Decisions

- **Optional Features Deferred:** `expo-camera` scanner and `i18next` localization. The `POST /checkins` API is scanner-ready; gate check-in was verified via terminal simulation and live pull-to-refresh badge transition.
- **Idempotency Position:** Booking is atomic (cannot oversell) but retries are fresh bookings; fans reconcile via `GET /me/tickets`.
- **Client Timeout Policy:** Read requests enforce an aggressive 10s timeout to fail fast on severed connections; non-idempotent write requests (`POST /book`) await authoritative server resolution under database lock to avoid false-negative client aborts.
