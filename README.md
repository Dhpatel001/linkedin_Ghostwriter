# VoicePost: AI-Powered LinkedIn Ghostwriter 🚀

Stop meaning to post. Let AI learn your voice. VoicePost is a full-stack SaaS application built for founders, consultants, and coaches to grow their LinkedIn presence without the hassle of writing from scratch. 

It connects to your LinkedIn, analyzes your past writing style to build a custom "Voice Profile," and automatically generates 3 high-quality posts in your exact tone every single week.

---

## ✨ Features

- **🧠 Voice Fingerprinting:** Paste 5-15 past posts, and the AI will analyze your vocabulary, sentence rhythm, opening style, and formatting habits to build a unique Voice Profile.
- **📬 Weekly Post Automation:** Get 3 ready-to-review posts delivered to your dashboard every Monday morning.
- **✅ Approve, Edit, Discard:** Review generated posts in a beautiful Kanban-style interface. Rate them out of 10 to help the AI improve over time.
- **🔗 Seamless LinkedIn OAuth:** 1-click login and secure API connection via LinkedIn.
- **🔥 Streak Tracker & Analytics:** Track consecutive weeks posted and save performance metrics (impressions, likes, comments) directly in the app.
- **💳 Subscription Tiers:** Starter, Pro, and Scale plans, fully integrated with Razorpay/Stripe billing checkout flows.

---

## 🛠️ Technology Stack

**Frontend**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** Shadcn UI, Headless UI, Lucide Icons
- **State & Data Fetching:** SWR, Axios
- **Animations:** Framer Motion

**Backend**
- **Runtime:** Node.js + Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** LinkedIn OAuth v2 + JWT Cookies
- **AI Integration:** Google Gemini / OpenAI (for voice analysis and content generation)

---

## 💻 Running the Project Locally

### 1. Clone the repository
```bash
git clone https://github.com/Dhpatel001/linkedin_Ghostwriter.git
cd linkedin_Ghostwriter
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory with the required API keys, MongoDB URI, and LinkedIn Client secrets.
```bash
npm run dev
# The backend will start on http://localhost:5000
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Ensure you have your `.env.local` file pointing to the backend:
```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
```
```bash
npm run dev
# The frontend will start on http://localhost:3000
```

---

## 🎨 Design & Architecture

VoicePost relies on a premium, clean user interface tailored for professionals. The frontend features glassmorphism, dynamic Framer Motion micro-animations, and a robust Next.js middleware system that correctly routes authenticated traffic versus landing page traffic. 

The backend architecture securely stores LinkedIn OAuth tokens, manages the cron-style generation workflow for weekly post generation, and persists user feedback (Voice Score loop) to iteratively prompt the LLM for higher accuracy.

---

## 📄 License
MIT License
