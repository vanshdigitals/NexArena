# 🏟️ NexArena — AI-Powered Smart Venue Assistant

> **PromptWars Virtual Hackathon Project** — Built with Next.js 14, Gemini AI, Firebase & Google Maps

NexArena is an intelligent stadium companion that helps fans navigate large-scale sporting venues in real-time. Operators get a command-center dashboard to manage crowd density and publish alerts.

---

## 🚀 Quick Start

```bash
# 1. Clone & install
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Fill in your API keys in .env.local

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for Fan View.  
Open [http://localhost:3000/admin](http://localhost:3000/admin) for Admin Dashboard.

---

## 📁 Project Structure

```
NexArena/
├── app/
│   ├── layout.tsx             # Root layout (SEO metadata, fonts, ARIA landmarks)
│   ├── page.tsx               # 🏟️  Fan View — command center UI
│   ├── globals.css            # Design system (CSS variables, animations, utilities)
│   ├── admin/
│   │   └── page.tsx           # ⚙️  Admin Dashboard — zone density & alerts
│   └── api/
│       └── chat/
│           └── route.ts       # 🤖  Gemini API backend route (server-only)
├── components/
│   ├── ChatInterface.tsx      # Full chat UI with typing indicator & error handling
│   ├── MapWrapper.tsx         # Client boundary for next/dynamic ssr:false
│   ├── StadiumMap.tsx         # Google Maps JS API embed with zone markers
│   ├── QuickActions.tsx       # Quick action chips (Restroom, Food, Exit, etc.)
│   └── ZoneSlider.tsx         # Admin density sliders with Firestore sync indicator
├── lib/
│   ├── firebase.ts            # Firebase client singleton (Auth + Firestore)
│   └── firestore.ts           # Typed Firestore helpers (zones, alerts, events)
├── public/                    # Static assets
├── .env.local.example         # Environment variable template
├── next.config.ts             # Security headers + CSP configuration
├── tsconfig.json              # TypeScript configuration
└── package.json
```

---

## 🎯 Features

### Fan View (`/`)
- **Dark Command Center UI** — animated grid background, glassmorphism panels
- **Google Maps Embed** — zone markers for Gate A/B, Food Court, Exit (activates via env key)
- **Gemini AI Chat** — powered by backend-only `/api/chat` route; key never hits the browser
- **Quick Actions** — chip buttons: Find Restroom, Food Court, Nearest Exit, Parking, Medical Aid, My Seat
- **Live Stats** — attendance, crowd level, event timer, food court wait time
- **Mobile-first responsive** layout

### Admin Dashboard (`/admin`)
- **Zone Density Sliders** — Gate A, Gate B, Food Court, Section D (0-100%)
- **Real-time Firestore sync** — `setDoc()` on slider commit with `serverTimestamp()`
- **Color-coded density** — Green (Low) → Amber (Moderate) → Red (High)
- **Alert Management** — severity-coded alerts (info / warning / critical) with dismiss
- **Live Metrics** — progress bars for capacity, food efficiency, exit flow, AI satisfaction
- **Google Auth** — Firebase Authentication integration with Google Sign-In button
- **System Status** — real-time service health indicators

---

## 🔒 Security Architecture

| Concern | Solution |
|---------|----------|
| Gemini API Key | Server-only (`GEMINI_API_KEY`), never in browser |
| Firebase Admin | Placeholder for service-account pattern in future API routes |
| HTTP Headers | CSP, X-Frame-Options, HSTS, X-Content-Type-Options |
| Admin Access | `noindex` robots meta, Firebase Auth placeholder |
| Input Validation | Message sanitised & capped at 2,000 chars in API route |
| History Capping | Max 10 conversation turns sent to Gemini |

---

## 🔑 Environment Variables

See [`.env.local.example`](./.env.local.example) for full documentation.

| Variable | Side | Purpose |
|----------|------|---------|
| `NEXT_PUBLIC_FIREBASE_*` | Client | Firebase SDK config (safe to expose) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client | Maps JS embed |
| `GEMINI_API_KEY` | **Server only** | Gemini AI (never browser!) |
| `FIREBASE_ADMIN_*` | **Server only** | Admin SDK for future server routes |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Vanilla CSS (custom design system — no utility bloat)
- **AI**: Google Gemini 1.5 Flash via `@google/generative-ai`
- **Database**: Firebase Firestore (real-time subscriptions)
- **Auth**: Firebase Authentication (Google Sign-In)
- **Maps**: Google Maps JavaScript API
- **Fonts**: Outfit + JetBrains Mono (Google Fonts)

---

## ♿ Accessibility

- Semantic HTML5 landmarks (`<header>`, `<main>`, `<section>`, `<footer>`)
- All interactive elements have unique IDs and `aria-label` attributes
- `aria-live="polite"` region on chat message log
- `role="progressbar"` with `aria-valuenow/min/max/text` on sliders
- `role="status"` on typing indicators and save confirmations
- `role="alert"` on error messages
- `role="log"` on the chat message history
- Focus-visible outline on all keyboard-navigable elements
- Accessible colour contrast throughout (4.5:1+ ratio maintained)

---

## 📡 Google Services Integration

| Service | Integration Point |
|---------|------------------|
| **Gemini AI** | `/app/api/chat/route.ts` — `gemini-1.5-flash` with system prompt |
| **Firebase Firestore** | `lib/firestore.ts` — zones, alerts, events collections |
| **Firebase Auth** | `lib/firebase.ts` — Google Sign-In for admin |
| **Google Maps JS API** | `components/StadiumMap.tsx` — zone markers, dark theme |
| **Google Fonts** | `app/globals.css` — Outfit + JetBrains Mono |

---

## 📝 License

MIT — Built for PromptWars Hackathon 2025
