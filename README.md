# 🏏 Cricket Guru — IPL AI Session Analyst

Live IPL scores + AI-powered YES/NO session analysis. Built with Next.js 14, deployed on Vercel.

---

## ⚡ Setup in 10 minutes

### Step 1 — Get your free CricAPI key
1. Go to **https://cricapi.com**
2. Sign up (free) → you get **100 API calls/day** free
3. Copy your API key from the dashboard

### Step 2 — Get your Anthropic API key
1. Go to **https://console.anthropic.com**
2. API Keys → Create new key
3. Copy it

### Step 3 — Deploy to Vercel

**Option A: GitHub (recommended)**
1. Push this folder to a GitHub repo
2. Go to **vercel.com** → New Project → Import your repo
3. Add environment variables (see below)
4. Deploy → done!

**Option B: Vercel CLI**
```bash
npm install -g vercel
cd cricket-guru
vercel
```

### Step 4 — Add Environment Variables in Vercel
In your Vercel project → Settings → Environment Variables, add:

```
CRICAPI_KEY        = your_cricapi_key_here
ANTHROPIC_API_KEY  = your_anthropic_key_here
```

---

## 🏃 Run locally

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local
cp .env.local.example .env.local
# Edit .env.local and add your keys

# 3. Run dev server
npm run dev

# 4. Open http://localhost:3000
```

---

## 📱 How to use

1. **Tap "Fetch Live"** — auto-loads current IPL match from CricAPI (refreshes every 45s)
2. **Score tab** — add ball-by-ball or enter batsman/bowler names manually
3. **Session tab** — set YES/NO odds, over target, session type
4. **ASK GURU** or chat — AI gives you sharp YES/NO calls with full reasoning

---

## 🔑 API Keys — Security

- Keys are stored as **server-side environment variables** in Vercel
- They are **never exposed** to the browser
- All API calls go through `/api/score` and `/api/ai` backend routes
- **Never commit .env.local to git** (it's in .gitignore)

---

## 📁 Project Structure

```
cricket-guru/
├── app/
│   ├── api/
│   │   ├── score/route.ts   ← Fetches live IPL from CricAPI
│   │   └── ai/route.ts      ← Proxies to Anthropic API
│   ├── page.tsx             ← Main app UI
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── constants.ts         ← Teams, venues, pitch info
│   ├── types.ts             ← TypeScript types
│   └── buildContext.ts      ← AI system prompt builder
├── .env.local.example
└── package.json
```

---

## 🆓 Free tier limits

| Service | Free Limit |
|---------|-----------|
| CricAPI | 100 calls/day |
| Vercel | Unlimited hobby deploys |
| Anthropic | Pay per use (~$0.003/message) |

For personal use during IPL season, 100 CricAPI calls/day is plenty (app refreshes every 45s = ~130 calls/day if open all day — upgrade to paid plan at $10/month for unlimited if needed).
