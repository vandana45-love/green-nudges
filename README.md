# Green Nudges — AI-Powered Carbon Footprint Tracker

**Live Demo:** https://goolge-cdc11.web.app

An intelligent, full-stack web application that helps users track, understand, and reduce their personal carbon footprint using AI-powered recommendations powered by Google Gemini.

---

## Chosen Vertical

**Climate & Sustainability** — personal carbon footprint tracking with AI-driven behavioural nudges to help individuals decarbonise their daily lives.

---

## Approach & Logic

### Core Architecture

```
User → Firebase Auth (Google Sign-In)
     → Onboarding Survey (3-step form)
     → Carbon Engine (DEFRA 2023 emission factors)
     → Firestore (stores survey + recommendations)
     → Gemini AI (generates personalised 3 recommendations)
     → Dashboard (monthly breakdown + social comparison)
     → AI Chat (streaming conversation with Gemini coach)
```

### Carbon Calculation Engine (`src/lib/carbon.ts`)

Uses DEFRA 2023 emission factors to convert survey inputs into kg CO₂/year:

| Category | Method |
|---|---|
| **Energy** | `(house_m2 × 150 kWh/m²) / occupants × grid_factor` |
| **Transport** | `km_per_year × emission_factor` + `flights × km × factor × 2` |
| **Food** | Diet-based constant (vegan: 1,300 → meat heavy: 3,300 kg/yr) |
| **Shopping** | Fixed 1,000 kg/yr baseline |

### AI Coach Logic

Google Gemini 2.0 Flash receives the user's full carbon breakdown and generates 3 ranked, actionable recommendations. Results are cached in Firestore (no re-generation on every visit).

### Decision Making

The assistant uses contextual logic to prioritise recommendations:
- Highest-emission category gets the first recommendation
- Recommendations are specific (e.g. "switch from ICE car to EV saves X kg")
- Fallback recommendations activate if Gemini API is unavailable

---

## How the Solution Works

1. **Sign In** — One-click Google authentication via Firebase Auth
2. **Onboarding** — 3-step survey (Home → Lifestyle → Vehicle)
3. **Carbon Calculation** — Instant client-side calculation using DEFRA factors
4. **AI Recommendations** — Gemini 2.0 Flash generates 3 personalised tips
5. **Dashboard** — Monthly breakdown by category with social norm comparison
6. **AI Chat** — Live streaming conversation with carbon coach "Sage"
7. **Planner** — Interactive sliders to model emission reduction scenarios

---

## Tech Stack — 100% Google, 100% Free Tier

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router, static export) |
| Styling | Tailwind CSS + Radix UI primitives |
| Auth | Firebase Authentication (Google Sign-In) |
| Database | Cloud Firestore |
| AI | Google Gemini 2.0 Flash |
| Hosting | Firebase Hosting (Spark plan — free) |
| Analytics | Firebase Analytics |
| Charts | Recharts |

---

## Security Implementation

- **Authentication**: Firebase Auth — no custom auth logic, no password storage
- **Data isolation**: Firestore security rules enforce `request.auth.uid == userId` on every collection — users can only access their own data
- **No secrets in code**: All API keys are in `.env.local` (gitignored), never committed
- **Content Security**: Security headers deployed via Firebase Hosting config (X-Frame-Options: DENY, X-Content-Type-Options, HSTS, Referrer-Policy)
- **Input validation**: All form inputs use controlled React components with type constraints

---

## Accessibility

- Skip-to-content link for keyboard users
- All interactive elements have ARIA labels
- Progress bars use `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`
- Charts wrapped in `role="img"` with descriptive `aria-label`
- `prefers-reduced-motion` media query reduces animations
- High-contrast mode support via CSS `forced-colors`
- Keyboard-navigable forms with associated labels

---

## Testing

Run the test suite:

```bash
cd apps/web
npm test              # run all tests
npm run test:coverage # with coverage report
```

**Test coverage:**
- `src/lib/carbon.ts` — 14 unit tests (diet, transport, energy, shopping)
- `src/lib/firestore.ts` — 8 integration tests (CRUD with mocked Firebase)
- `src/components/CategoryCard` — 10 tests including automated a11y (jest-axe)
- `src/components/NormChart` — 9 tests including automated a11y (jest-axe)
- `src/app/sign-in` — 7 tests including automated a11y (jest-axe)

---

## Local Development

```bash
# Prerequisites: Node.js 18+, npm

# Install dependencies
cd apps/web
npm install

# Set up environment (copy and fill in your keys)
cp .env.local.example .env.local

# Run dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## Assumptions

1. **Emission factors** are DEFRA 2023 UK averages — not personalised to specific electricity grids or regions
2. **Shopping emissions** are fixed at 1,000 kg/yr (industry average) — future improvement would integrate transaction data
3. **Annual car mileage** is assumed at 12,000 km/year — users can adjust via the Planner
4. **Flight km** are estimated: short-haul = 1,500 km, long-haul = 8,000 km per trip
5. **Gemini API key** is client-side for demo purposes — in production, this should be proxied via Firebase Functions
6. The backend FastAPI service (`apps/api/`) is scaffolded for future deployment on Cloud Run when billing is enabled

---

## Project Structure

```
green-nudges/
├── apps/
│   ├── web/                    # Next.js frontend (deployed)
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # Reusable UI components
│   │   │   └── lib/            # Firebase, Firestore, Gemini, Carbon engine
│   │   ├── firestore.rules     # Security rules
│   │   └── firebase.json       # Hosting config
│   └── api/                    # FastAPI backend (future deployment)
├── docker-compose.yml          # PostgreSQL + Redis for local dev
└── README.md
```
