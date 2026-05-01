<div align="center">

# 🎙️ VoicePost — AI-Powered LinkedIn Ghostwriter

**Stop staring at a blank page. Let AI learn your voice and grow your LinkedIn presence — on autopilot.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Claude AI](https://img.shields.io/badge/Claude-Anthropic-8A2BE2?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Getting Started](#-getting-started-locally) · [Environment Variables](#-environment-variables) · [API Reference](#-api-reference) · [Contributing](#-contributing)

</div>

---

## 📌 Overview

**VoicePost** is a production-ready, full-stack SaaS application built for **founders, consultants, coaches, and creators** who want to dominate LinkedIn — without spending hours writing every week.

The platform connects to your LinkedIn account, **analyzes your past posts** to build a unique AI *Voice Profile*, and then **auto-generates high-quality, on-brand posts** — delivered straight to your approval dashboard. You review, edit, and approve. The AI learns from your feedback and gets sharper over time.

> **Think of it as a ghostwriter that never sleeps, never charges per word, and knows your voice better than you do.**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **Voice Fingerprinting** | Paste 5–15 of your past posts. The AI analyzes your vocabulary, sentence rhythm, opening hooks, and formatting habits to build a proprietary *Voice Profile*. |
| 📝 **Hook-Body-Lesson-CTA Framework** | Every generated post follows a proven LinkedIn content structure — an arresting hook, a substantive body, a key takeaway, and a compelling call-to-action. |
| 🖼️ **Professional SVG Image Generation** | Multi-style AI-designed visuals (data, quote, story, framework cards) generated natively as scalable SVG assets — no stock photos, no generic AI art. |
| 🔍 **LinkedIn Report Analysis** | Ingests your real LinkedIn analytics (impressions, engagement, follower growth) and uses them to optimize future content strategy. |
| ✨ **Post Enhancement Engine** | One-click enhancement to punch up hooks, sharpen calls-to-action, and improve readability before you approve. |
| 📬 **Weekly Post Automation** | Fully-written posts land in your dashboard every Monday morning — ready for your review. |
| ✅ **Approve / Edit / Discard** | A clean review interface. Rate posts out of 10 to fuel the AI feedback loop. |
| 🔗 **1-Click LinkedIn OAuth** | Secure, scoped LinkedIn OAuth 2.0 login. No password stored, ever. |
| 🔥 **Streak Tracker & Analytics** | Track consecutive posting weeks and save performance metrics (impressions, likes, comments) directly in the app. |
| 💳 **Subscription Tiers** | Starter, Pro, and Scale plans with Razorpay-powered billing, webhook handling, and subscription lifecycle management. |
| 🛡️ **Rate Limiting & Security** | Upstash Redis-backed rate limiting, Helmet.js headers, and JWT HttpOnly cookie sessions. |
| 📧 **Transactional Emails** | Welcome emails, weekly post notifications, and billing receipts powered by Resend. |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | Core framework, server components, routing, middleware |
| **TypeScript** | Type safety across the entire codebase |
| **Tailwind CSS** | Utility-first styling |
| **Shadcn UI** | Accessible, composable component library |
| **Framer Motion** | Micro-animations and page transitions |
| **SWR + Axios** | Data fetching with stale-while-revalidate caching |
| **Lucide Icons** | Consistent icon system |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express.js** | REST API server |
| **MongoDB + Mongoose** | Primary database and ODM |
| **LinkedIn OAuth v2** | Authentication and profile access |
| **JWT (HttpOnly Cookies)** | Stateless, secure session management |
| **Anthropic Claude API** | Voice analysis, post generation, and content enhancement |
| **Razorpay** | Subscription billing, webhooks, plan management |
| **Upstash Redis** | Rate limiting and caching layer |
| **node-cron** | Scheduled weekly post generation jobs |
| **Resend** | Transactional email delivery |

---

## 🏗️ Architecture

```
linkedin_Ghostwriter/
├── backend/
│   ├── src/
│   │   ├── config/                 # DB, Redis, and service configuration
│   │   ├── controllers/            # Route handler logic (auth, posts, voice, billing)
│   │   ├── middleware/             # Auth guard, subscription check, rate limiter, error handler
│   │   ├── models/                 # Mongoose schemas (User, Post, VoiceProfile)
│   │   ├── routes/                 # Express routers (auth, posts, voice, billing)
│   │   ├── services/
│   │   │   ├── voiceService.js     # 🧠 Core AI engine — voice analysis & post generation
│   │   │   ├── imageService.js     # 🖼️  SVG image generation (data/quote/story/framework)
│   │   │   ├── postEnhancementService.js # ✨ Hook & CTA sharpening
│   │   │   ├── linkedinReportService.js  # 📊 LinkedIn analytics ingestion & strategy
│   │   │   ├── generateService.js  # Orchestration layer for content pipelines
│   │   │   ├── billingService.js   # Razorpay subscription management
│   │   │   ├── emailService.js     # Resend transactional emails
│   │   │   └── linkedinService.js  # LinkedIn API integration
│   │   └── server.js               # Express app entrypoint
│   ├── .env.example                # Environment variable template
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── (landing)/              # Public marketing page
│   │   ├── auth/                   # OAuth callback handler
│   │   ├── dashboard/              # Main post review dashboard
│   │   ├── onboarding/             # Voice profile setup wizard
│   │   ├── billing/                # Subscription & plan management
│   │   ├── settings/               # User account settings
│   │   ├── linkedin/               # LinkedIn OAuth redirect handler
│   │   ├── contact/                # Contact page
│   │   ├── privacy/                # Privacy policy
│   │   └── terms/                  # Terms of service
│   ├── components/                 # Reusable UI components (PostCard, providers…)
│   ├── hooks/
│   │   ├── useUser.ts              # Auth state & user profile
│   │   ├── usePosts.ts             # Post CRUD & approval workflow
│   │   ├── useVoiceProfile.ts      # Voice profile fetch & status
│   │   └── useInsights.ts          # Analytics data fetching
│   ├── lib/                        # Shared utilities and API client
│   ├── middleware.ts               # Next.js auth & routing middleware
│   └── package.json
│
└── README.md
```

---

## 🤖 AI Content Engine

The AI pipeline is the heart of VoicePost and runs in several stages:

### 1. Voice Analysis (`voiceService.js`)
- Accepts 5–15 sample posts from the user
- Uses Claude to extract: vocabulary fingerprint, sentence rhythm, hook patterns, tone, formatting style, and favourite topics
- Stores the resulting **Voice Profile** in MongoDB for use across all future generation

### 2. Content Generation (Hook-Body-Lesson-CTA)
- Every post is structured around the **Hook → Body → Lesson → CTA** framework — the gold standard for high-performing LinkedIn content
- The generator references the user's Voice Profile so output sounds authentically human, not "AI-written"

### 3. Post Enhancement (`postEnhancementService.js`)
- Optional one-click improvement pass: sharpens the opening hook, improves the CTA, and tightens the copy
- Runs as a separate API call so users stay in control

### 4. SVG Image Generation (`imageService.js`)
- Generates professional, on-brand visual assets as pure SVG (no raster images, no third-party APIs)
- Supports four card styles: **Data Card**, **Quote Card**, **Story Card**, and **Framework Card**

### 5. LinkedIn Report Analysis (`linkedinReportService.js`)
- Users can paste their LinkedIn analytics CSV / dashboard data
- Claude extracts performance trends and feeds them back into the generation strategy

---

## 🚀 Getting Started Locally

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **MongoDB Atlas** cluster (free tier works perfectly)
- A **LinkedIn Developer App** with OAuth credentials
- An **Anthropic** API key (for Claude)
- A **Razorpay** account (for billing)
- An **Upstash Redis** database (free tier)
- A **Resend** account (for emails)

### 1. Clone the Repository

```bash
git clone https://github.com/Dhpatel001/linkedin_Ghostwriter.git
cd linkedin_Ghostwriter
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy the environment template and fill in your secrets:

```bash
cp .env.example .env
# Now open .env and populate all the required values
```

Start the development server:

```bash
npm run dev
# ✅ Backend running at http://localhost:5000
```

### 3. Frontend Setup

Open a **new terminal window**:

```bash
cd frontend
npm install
```

Create the local environment file:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
```

Start the Next.js dev server:

```bash
npm run dev
# ✅ Frontend running at http://localhost:3000
```

---

## 🔐 Environment Variables

All required environment variables for the backend are documented in [`backend/.env.example`](./backend/.env.example).

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on (default: `5000`) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Min. 32-character secret for signing JWTs |
| `LINKEDIN_CLIENT_ID` | LinkedIn Developer App Client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn Developer App Client Secret |
| `LINKEDIN_REDIRECT_URI` | OAuth callback URI (must match LinkedIn app settings) |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key for AI generation |
| `RAZORPAY_KEY_ID` | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `RAZORPAY_WEBHOOK_SECRET` | For verifying Razorpay webhook signatures |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `FROM_EMAIL` | Sender email address for outbound emails |
| `FRONTEND_URL` | Frontend origin URL for CORS and redirects |

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

## 📡 API Reference

All API routes are prefixed with `/api`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/auth/linkedin` | ❌ | Initiates LinkedIn OAuth flow |
| `GET` | `/api/auth/linkedin/callback` | ❌ | Handles OAuth callback, issues JWT |
| `POST` | `/api/auth/logout` | ✅ | Clears session cookie |
| `GET` | `/api/posts` | ✅ | Fetch all posts for the authenticated user |
| `PATCH` | `/api/posts/:id/approve` | ✅ | Approve a generated post |
| `PATCH` | `/api/posts/:id/discard` | ✅ | Discard a generated post |
| `PATCH` | `/api/posts/:id/rate` | ✅ | Submit a quality rating for a post |
| `POST` | `/api/posts/:id/enhance` | ✅ | Enhance a post's hook, CTA, and readability |
| `POST` | `/api/voice/analyze` | ✅ | Submit sample posts for voice analysis |
| `GET` | `/api/voice/profile` | ✅ | Retrieve the user's Voice Profile |
| `POST` | `/api/voice/linkedin-report` | ✅ | Submit LinkedIn analytics for strategy optimization |
| `POST` | `/api/billing/create-subscription` | ✅ | Create a Razorpay subscription |
| `POST` | `/api/billing/webhook` | ❌ | Razorpay webhook handler |
| `GET` | `/api/billing/status` | ✅ | Get current subscription status |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by **[Dhruv Patel](https://github.com/Dhpatel001)**

⭐ **Star this repo** if you found it useful!

</div>
