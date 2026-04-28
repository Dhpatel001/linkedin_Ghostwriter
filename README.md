# LinkedIn Ghostwriter

A full‑stack application that generates LinkedIn posts using AI.

## Project Structure
- **backend** – Express API server (authentication, voice routes, billing, etc.)
- **frontend** – Next.js (app router) with TypeScript, Tailwind CSS, Shadcn UI and additional UI libraries.

## Getting Started
```bash
# Clone the repo
git clone https://github.com/Dhpatel001/linkedin_Ghostwriter.git
cd linkedin_Ghostwriter

# Backend
cd backend
npm install
npm run dev   # runs on http://localhost:5000

# Frontend
cd ../frontend
npm install
npm run dev   # runs on http://localhost:3000
```

## Environment
Create a `.env.local` file inside `frontend/` with:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## UI Libraries
The frontend uses:
- **framer‑motion** – animations
- **axios** – HTTP client
- **swr** – data fetching
- **sonner** – toast notifications
- **lucide-react** – icons
- **react‑hook‑form**, **@hookform/resolvers**, **zod** – form validation
- **shadcn/ui** – component library (button, card, dialog, tabs, badge, slider, textarea, input, separator, avatar)

## License
MIT
