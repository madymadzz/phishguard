# PhishGuard — Stay Alert. Stay Secure.

> AI-assisted phishing and malicious link detector for URLs and QR codes, built for students and non-technical mobile users.

PhishGuard is an installable, mobile-first Progressive Web Application (PWA) with a layered deterministic detection engine, Supabase (PostgreSQL + Row-Level Security) backend, Google Gemini AI explanations, and an administrative control panel.

---

## 🚀 Locked Tech Stack

- **Framework:** Next.js (App Router, Strict TypeScript)
- **Styling & UI:** Tailwind CSS, shadcn/ui, Lucide Icons, Framer Motion
- **Database & Auth:** Supabase (PostgreSQL with RLS), `@supabase/ssr` cookie sessions
- **AI Engine:** Google Gemini API (`@google/genai`) for plain-language risk explanations
- **Threat Feeds:** Google Safe Browsing Lookup API v4, abuse.ch URLhaus, RDAP domain registration age, VirusTotal (borderline)
- **Deployment:** Vercel (Hobby) deployed via private GitHub repository

---

## 📱 Core Features

1. **URL Scanner:** Fast link scanning with unshortening, SSRF protections, heuristic analysis, and AI explanations.
2. **QR Code Scanner:** Camera viewport with torch/flash toggle, gallery image upload, and non-URL payload guidance.
3. **Scan History:** Persistent scan records grouped by date, filterable by type, with defanged destination review.
4. **Learn Section:** Interactive educational modules on phishing, social engineering, and QR scams.
5. **Admin Panel:** Moderation queue, user management, domain allow/block lists, live engine testing, and audit logs.

---

## 🛠️ Local Development

### 1. Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- Supabase CLI
- GitHub CLI (`gh`)

### 2. Environment Setup
Copy the environment variables template:
```bash
cp .env.example .env.local
```

Fill in required keys in `.env.local`:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` (optional, falls back to heuristic explanations)
- `GOOGLE_SAFE_BROWSING_API_KEY` (optional)
- `URLHAUS_AUTH_KEY` (optional)

### 3. Run Development Server
```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) on your desktop or mobile browser.

---

## 🧪 Verification & Testing
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Production build
npm run build
```

---

## 👥 Credits
**PhishGuard** — Entrepreneurial Management Project, TIP Quezon City.
