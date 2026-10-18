# PhishGuard — Stay Alert. Stay Secure.

> **AI-assisted phishing and malicious link detector for URLs and QR codes, built for students and mobile users.**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ecf8e?style=flat&logo=supabase)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-3.8%20Flash-4285f4?style=flat&logo=google)](https://ai.google.dev/)
[![Production Live](https://img.shields.io/badge/Vercel-Live-success?style=flat&logo=vercel)](https://phishguard-three-rho.vercel.app)

---

## 🌐 Live Deployment & Links

- **Production URL:** [https://phishguard-three-rho.vercel.app](https://phishguard-three-rho.vercel.app)
- **GitHub Repository:** [https://github.com/madymadzz/phishguard](https://github.com/madymadzz/phishguard)
- **Keep-Alive & Health Check:** [https://phishguard-three-rho.vercel.app/api/health](https://phishguard-three-rho.vercel.app/api/health)

---

## 📱 Features

1. **Intelligent URL Scanner:**
   - Fast URL input with one-tap clipboard paste.
   - SSRF-safe unshortening with 5-hop redirect expansion and private IP blacklisting.
   - 17 structural heuristics (IP hosts, punycode/IDN, brand impersonation, high-risk TLDs, phishing keywords, suspicious path depth).
   - Real-time cloud threat intelligence (Google Safe Browsing v4, abuse.ch URLhaus, RDAP domain age).
   - Google Gemini AI security explanations crafted in plain, student-friendly language.
2. **Camera & Gallery QR Scanner:**
   - Fast live camera viewfinder with corner alignment brackets and scanning line animation.
   - Flashlight / torch toggle and mobile gallery image decode.
   - Haptic feedback vibration on successful decode.
   - Non-URL payload handler for Wi-Fi networks (`WIFI:`), phone calls (`tel:`), SMS, emails (`mailto:`), and payment deep links.
3. **Scan History & Defanged Destinations:**
   - Automatic persistent storage per authenticated user with Supabase RLS.
   - Categorized by type (All, URL, QR Code) and grouped by date (Today, Yesterday, Older).
   - Defanged display (e.g., `hxxps://...`) with single-tap clipboard copy and deletion.
4. **Anti-Phishing Academy (`/learn`):**
   - Curated educational modules covering phishing fundamentals, fake link spotting, "quishing" (QR scams), smishing, and emergency triage.
   - Rotating daily phishing tip banner on the Home dashboard.
5. **Comprehensive Admin Panel (`/admin`):**
   - Protected by `is_admin()` database policies and server-side middleware guards.
   - Executive dashboard with 6 KPIs, 30-day volume chart, and live provider diagnostics.
   - User Access Control (promote/demote, suspend/unsuspend, scan review, self-safeguards).
   - Domain Rules engine with live test bench and allowlist/blocklist CRUD.
   - User report moderation queue with one-click blocklist escalation.
   - Content Management System (CMS) with live Markdown split preview.
   - Platform feature flags and tamper-evident audit logging.
6. **Mobile PWA & Offline Support:**
   - Installable to iOS and Android home screens.
   - Offline service worker shell with network-first navigation fallback to `/offline`.
   - Native-like install prompt banner.

---

## 🧠 Benchmark & Detection Engine Performance

PhishGuard was benchmarked against 50 ground-truth URLs (`eval/urls.csv`) including official Philippine services (`tip.edu.ph`, `bdo.com.ph`, `gcash.com`, `maya.ph`, `gov.ph`), global services (`google.com`, `apple.com`, `amazon.com`), Google Safe Browsing test vectors, active typosquatting lures, and unencrypted portals.

```
=================================================================
  PHISHGUARD AI DETECTION ENGINE — BENCHMARK EVALUATION
=================================================================
  Total Evaluated Samples : 50
  True Positives (Threat) : 25
  True Negatives (Safe)   : 25
  False Positives         : 0
  False Negatives         : 0
-----------------------------------------------------------------
  Accuracy                : 100.0%
  Precision               : 100.0%
  Recall (Sensitivity)    : 100.0%
  F1-Score                : 100.0%
  False Positive Rate     : 0.0%
  Average Latency         : 708 ms
=================================================================
```

To re-run the benchmark locally:
```bash
npx tsx scripts/eval.ts
```

---

## 🛠️ Local Setup Guide

### 1. Prerequisites
- **Node.js** >= 20.x
- **npm** >= 10.x
- **Supabase Account** ([supabase.com](https://supabase.com))
- **Google AI Studio Account** ([aistudio.google.com](https://aistudio.google.com))

### 2. Clone and Install
```bash
git clone https://github.com/madymadzz/phishguard.git
cd phishguard
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the keys in `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI Engine
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.8-flash

# Threat Feeds
GOOGLE_SAFE_BROWSING_API_KEY=your-google-safe-browsing-key
URLHAUS_AUTH_KEY=your-urlhaus-auth-key
VIRUSTOTAL_API_KEY=
```

### 4. Database Setup
1. Log into your Supabase Dashboard at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** -> **New Query**.
3. Copy and run the full migration script in `supabase/migrations/0001_init.sql`.

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Admin Setup & Demo Accounts

### Creating Your First Admin
1. Sign up a new account via the app (`/signup`) with your email (e.g. `admin@phishguard.security`).
2. Open your Supabase SQL Editor and execute:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'admin@phishguard.security';
   ```
3. Refresh the app. The **Admin Console** link will appear in your **Profile** (`/profile`), and `/admin` will be accessible.

---

## 🧪 Smoke-Test URL Checklist

Use these safe test links to verify the detection pipeline in your deployment:

| URL | Expected Risk | Triggered Rules / Notes |
|---|---|---|
| `https://testsafebrowsing.appspot.com/s/phishing.html` | **HIGH RISK (100)** | Google Safe Browsing Phishing feed match |
| `https://testsafebrowsing.appspot.com/s/malware.html` | **HIGH RISK (100)** | Google Safe Browsing Malware feed match |
| `http://192.168.1.1/admin` | **HIGH RISK (100)** | SSRF guard: private IP destination blocked |
| `https://google.com@evil-phishing-site.xyz/login` | **HIGH RISK (100)** | `@` credential spoofing + suspicious TLD |
| `https://paypa1-security-verification.com/login` | **HIGH RISK (100)** | Brand impersonation (PayPal) + keywords |
| `https://bpi-online-security-update.top/login.php` | **HIGH RISK (100)** | Philippine brand typosquatting (BPI) + keywords |
| `https://bit.ly/3phish-test` | **SUSPICIOUS (25+)** | URL shortener flag + unshorten inspection |
| `https://tip.edu.ph` | **SAFE (0)** | Official educational institution domain |
| `https://www.bdo.com.ph` | **SAFE (0)** | Official banking institution domain |
| `https://www.google.com` | **SAFE (0)** | Legitimate trusted global service |

---

## ⚡ Supabase Inactivity Keep-Alive

Supabase free tier projects pause automatically after one week of inactivity. To keep your project awake before presentations:
1. Ping the automated health check route:
   ```bash
   curl -s https://phishguard-three-rho.vercel.app/api/health
   ```
2. Or configure a free recurring ping (e.g., via cron-job.org or GitHub Actions) targeting `https://phishguard-three-rho.vercel.app/api/health` once every 3 days.

---

## 🧪 Automated Testing & Verification

```bash
# Run Vitest unit tests (52 tests)
npm test -- --run

# TypeScript strict type verification
npm run type-check

# ESLint validation
npm run lint

# Production Next.js build
npm run build
```

---

## 👥 Credits

**PhishGuard** — Entrepreneurial Management Capstone Project  
Technological Institute of the Philippines (TIP) Quezon City
