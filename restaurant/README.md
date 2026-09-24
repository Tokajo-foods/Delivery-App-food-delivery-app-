# Restaurant Portal

Restaurant-side mobile app for the Food Delivery platform. Built for restaurant owners and staff to manage live orders, menus, and day-to-day operations.

Part of the monorepo at `delivery/restaurant`.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 56 · React Native 0.85 · React 19 |
| Language | TypeScript 6 (strict) |
| Routing | Expo Router |
| Styling | NativeWind v4 · Tailwind CSS 3 |
| Server State | TanStack Query v5 |
| Client State | Zustand |
| HTTP | Axios |
| Storage | AsyncStorage · Expo Secure Store |
| Icons | Lucide React Native |

---

## Project Structure

```
delivery/restaurant/
├── app/
│   ├── (app)/                 # Kitchen screens (dashboard, orders, menu, …)
│   │   └── delivery/          # Rider screens (same Expo app)
│   ├── (auth)/                # Login / register / OTP
│   └── _layout.tsx
├── components/
│   ├── dashboard|orders|menu|…   # Kitchen UI (Manager pattern)
│   └── delivery/                 # Rider UI by domain
├── lib/
│   ├── api.ts                    # Axios (_sid + CSRF)
│   ├── restaurant/               # Kitchen API + hooks
│   └── delivery-partner/         # Rider API + hooks (import deep paths)
├── store/                        # auth-store only
├── assets/                       # icons, splash, sounds/
├── constants/
└── scripts/                      # local APK build helpers
```

Import Managers + `*-api.ts` directly — do not add unused barrel `index.ts` files.
Expo Router owns `app/`; do not move route files.

---

## Getting Started

### Prerequisites

- Node.js `^20.19.4` · `^22.13.0` · `^24.3.0` · or `>= 25.0.0`
- npm 10+
- Expo Go (device testing)

### Install & run

```bash
cd delivery/restaurant
npm install
cp .env.example .env
npm start
```

| Command | Action |
|---------|--------|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS (macOS) |
| `npm run web` | Run in browser |

### Environment

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `http://10.12.14.3:4000` |

---

## Features (planned)

- Live order queue with status updates
- Menu item CRUD and availability toggles
- Restaurant profile and operating hours
- Analytics dashboard
- Staff notifications

---

## Type Checking

```bash
npx tsc --noEmit
```

---

## Troubleshooting

**NativeWind dark mode error on web** — ensure `darkMode: 'class'` is set in `tailwind.config.js`, then:

```bash
npx expo start --clear
```

**Peer dependency conflicts:**

```bash
npm install --legacy-peer-deps
```
