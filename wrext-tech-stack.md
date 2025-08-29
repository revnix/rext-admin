# Wrext Tech Stack

## Backend

Note: This is the backend that I've already built and it's in a separate repo. I'm mentioning it here for reference.

- Python
- LangGraph
- LangSmith
- LangGraph's Search Tool
- Web Scrapping
- Different LLMs including OpenAI, Groq's APIs, Some Hugging Face Models/Transformers
- PGVector for RAG

## Frontend

**Frontend Framework:** Next.js 15+ (App Router)
- **Rationale:** Perfect for your Vercel deployment, excellent SEO, server components for performance
- **Benefits:** Built-in optimization, API routes, easy deployment

**UI Framework:** 
- **Primary:** Tailwind CSS 4 (already configured)
- **Component Library:** shadcn/ui 3 + Radix UI
- **Rationale:** Consistent design system, accessibility, customizable

**State Management:**
- **Global State:** Zustand (lightweight, TypeScript-friendly)
- **Server State:** TanStack Query (React Query)
- **Rationale:** Minimal boilerplate, excellent caching, optimistic updates

**Additional Key Libraries:**
- **Forms:** React Hook Form + Zod validation
- **Charts/Analytics:** Recharts or Chart.js
- **Date/Time:** date-fns
- **HTTP Client:** Axios with interceptors (not sure about this)
- **Real-time:** WebSocket or Server-Sent Events (not sure about this too)


## Database

- PostgreSQL
- PGVector

## Hosting

- Vercel