# MindFul-Space 🧠✨ — Next-Gen AI Mental Health & Journaling Ecosystem

> **A high-performance, production-ready Mental Health & Wellness Web Application built with Next.js 16 (App Router), React 19, Prisma ORM, Supabase Auth & Storage, Groq LLaMA models, and n8n Workflow Automation.**

---

## 🚀 Executive Summary & The "X-Factor"

**MindFul-Space** is not just another digital diary—it is an **intelligent, context-aware mental health ecosystem** designed to bridge the gap between self-reflection, productivity, and empathetic AI guidance.

### 🌟 Why This Project Stands Out (The Recruiter / Employer View)
* **Production-Grade Dual AI Architecture:** Combines ultra-fast direct LLM inference (**Groq LLaMA 3.3 70B & LLaMA 4 Scout**) with **n8n Automation Webhooks** for asynchronous background sentiment analysis and real-time mood categorization.
* **Context-Aware AI Mental Health Coach:** Unlike standard chatbots, MindFul-Space feeds the LLM a holistic synthesis of the user's active journal entries, daily todo tasks, and long-term goals to deliver deeply personalized, empathetic responses.
* **Enterprise Security & 7-Day OTP Gate:** Features Supabase Auth (Email/Password & Google OAuth), Next.js 16 Bouncer Proxy Middleware (`src/proxy.ts`), and an automated **6-digit 7-Day Email OTP Verification Gate** using the Resend API.
* **Mood-Reactive UI & Interactive Physics:** Built with **Tailwind CSS v4**, **Framer Motion**, and **Three.js ambient shaders**. Includes a real-time reactive **Growing Plant canvas component** that grows and shifts color palettes depending on detected emotions.
* **Robust Data Layer & Caching:** PostgreSQL database hosted on Supabase, managed via **Prisma ORM**, with **SWR 2.3** client-side data fetching for optimistic UI updates.
* **Roadmap for Vector RAG (Retrieval-Augmented Generation):** Designed to leverage Supabase `pgvector` for semantic long-term memory search across months of journal history.

---

## 🛠️ Technology Stack Matrix

| Layer | Technology / Tool | Highlights |
|---|---|---|
| **Framework** | **Next.js 16 (App Router)** | Server Components, Proxy Middleware, API Routes, Turbopack |
| **UI Library** | **React 19** | Modern hooks, Concurrent rendering |
| **Styling & FX** | **Tailwind CSS v4 + Framer Motion** | Glassmorphism, smooth micro-animations |
| **Graphics & Shaders** | **Three.js** | Mood-adaptive ambient background shaders |
| **Database & ORM** | **PostgreSQL + Prisma ORM** | Shared relational models, UUID keys, type-safe queries |
| **Authentication** | **Supabase Auth + SSR** | Google OAuth, Email/Password, Cookie-based session proxy |
| **Storage** | **Supabase Storage Bucket** | Public CDN image uploads for entry attachments (`journal-attachments`) |
| **AI Models** | **Groq LLaMA 3.3 70B & LLaMA 4 Scout** | Sub-second sentiment scoring & cognitive analysis |
| **Automation** | **n8n Workflows** | Webhook triggers for sentiment analysis & mood suggestions |
| **Email Delivery** | **Resend API** | Transactional emails for 7-Day OTP & daily journaling reminders |
| **Data Fetching** | **SWR 2.3** | Stale-While-Revalidate caching, optimistic updates |

---

## 🧠 System Architecture & Workflow Pipeline

```text
                               ┌─────────────────────────────────────────────────────────┐
                               │                    USER INTERFACE                       │
                               │ Next.js 16 (App Router) + React 19 + Tailwind CSS + 3.js│
                               └──────────────────────────┬──────────────────────────────┘
                                                          │
                                             Next.js 16 Proxy Checkpoint
                                                  (src/proxy.ts)
                                                          │
                                                          ▼
                               ┌─────────────────────────────────────────────────────────┐
                               │                    NEXT.JS API ROUTES                   │
                               │   /api/entries   /api/chats   /api/tasks   /api/goals   │
                               └──────────────┬───────────────────────────┬──────────────┘
                                              │                           │
                                              ▼                           ▼
                        ┌───────────────────────────┐       ┌──────────────────────────────┐
                        │   POSTGRESQL DATABASE     │       │    AI & AUTOMATION PIPELINE   │
                        │    (Supabase + Prisma)    │       │ Groq LLaMA 3.3 70B / Scout   │
                        │ Users, Entries, Tasks,    │       │ n8n Automation Webhooks      │
                        │ Goals, Messages, Quotes   │       │ Resend Transactional Emails  │
                        └───────────────────────────┘       └──────────────────────────────┘
```

---

## 🔥 Key Features Deep Dive

### 📝 1. Mood-Adaptive Journal Editor
* **Live Keyword & AI Detection:** Scans text in real-time using word-boundary matching and Groq AI for instant mood label suggestions (*Happy, Calm, Anxious, Energetic, Grateful*, etc.).
* **Growing Plant Companion:** Interactive canvas plant that grows visually as word count increases and changes color gradients based on detected emotional tone.
* **Fire-and-Forget Sentiment Analysis:** Upon saving, dispatches entry text to calculate a normalized sentiment score (`-1.0` to `+1.0`) stored in PostgreSQL.
* **Multi-Media Attachments:** Upload image files directly to Supabase Storage or attach external web references with inline thumbnails.

### 🤖 2. Context-Aware AI Mental Health Coach
* **Holistic Memory Integration:** Reads recent chat history, active journal context, current todo tasks, and long-term goals to provide empathetic guidance.
* **Resilient Dual-Engine Fallback:** Tries n8n webhook workflows first; if n8n is offline or times out, seamlessly falls back to direct **Groq LLaMA 3.3 70B** inference so the chat is 100% reliable.
* **Contextual Entry Discussions:** 1-click *"Talk about this entry"* button on any past journal entry to launch a targeted chat session.

### 📋 3. Task Management & Daily Carry-Over
* **Priority-Based Todos:** Organize daily tasks by `HIGH`, `MEDIUM`, and `LOW` priorities with visual indicators.
* **Automatic Carry-Over:** One-click banner to push yesterday's unfinished tasks to today's schedule to maintain user momentum.
* **Long-Term Wellness Goals:** Set category-based goals (Health, Career, Personal) with real-time percentage progress bars.

### 📊 4. Trends, AI Cognitive Insights & Analytics
* **Interactive Mood Charts:** Stacked area charts, sentiment score trendlines, mood distribution pie charts, and daily task completion bar charts powered by Recharts.
* **AI Cognitive Synthesis:** Deep AI analysis of entry text, vocabulary frequency, writing streaks, and task alignment with actionable wellness recommendations.
* **Direct Coach Triggers:** Click *"Discuss this insight"* on any AI-generated finding to open a chat session about that specific pattern.

### 🔐 5. Security, Reminders & Data Privacy
* **7-Day Email OTP Gate:** 6-digit verification code sent via Resend on first login or after 7 days of inactivity.
* **Daily Journaling Reminders:** Toggle email reminders ON/OFF in Settings with a custom time picker (e.g., 8:00 PM).
* **Data Portability:** Download all journal entries, sentiments, and metadata as JSON at any time.

---

## 🔮 Future Engineering Roadmap (RAG Architecture)

To expand MindFul-Space into a lifelong personal AI assistant, the next planned architectural upgrade is **Vector Retrieval-Augmented Generation (RAG)**:

```text
[ Journal Entry Saved ] ──► [ Embedding Model ] ──► [ Supabase pgvector Table ]
                                                              │
[ User Query: "Why was I stressed last month?" ] ─────────────┤
                                                              ▼
                                               [ Semantic Cosine Similarity ]
                                                              │
                                                              ▼
                                            [ Retrieve Top 3 Relevant Entries ]
                                                              │
                                                              ▼
                                            [ Feed Context to Groq LLaMA 3.3 ]
```

* **Vector Database:** Utilize Supabase's native `pgvector` extension for storing high-dimensional vector embeddings of all past journal entries.
* **Semantic Search:** When a user asks historical questions in the AI Chat, execute cosine similarity search to retrieve the most relevant past entries and feed them to Groq for zero-hallucination answers.

---

## 💻 Local Setup & Installation

### Prerequisites
* **Node.js**: `>= 18.0.0`
* **Package Manager**: `pnpm` (v9+) or `npm`
* **Database**: Hosted Supabase PostgreSQL instance

### 1. Clone & Install
```bash
git clone https://github.com/SamamaKarim092/MindFul-Space.git
cd MindFul-Space
pnpm install
```

### 2. Configure Environment Variables (`.env`)
Create a `.env` file in the root directory:
```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.xxx:password@host:port/postgres"
DIRECT_URL="postgresql://postgres.xxx:password@host:port/postgres"

# Supabase Auth & Storage
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# AI Inference (Groq)
GROQ_API_KEY="gsk_your_groq_api_key"

# Transactional Emails (Resend)
RESEND_API_KEY="re_your_resend_api_key"

# Optional n8n Webhooks
N8N_CHAT_WEBHOOK_URL="http://localhost:5678/webhook/ai-chat"
N8N_MOOD_SUGGEST_WEBHOOK_URL="http://localhost:5678/webhook/mood-suggestion"
```

### 3. Database Migration & Prisma Client
```bash
pnpm prisma generate
pnpm prisma db push
```

### 4. Run Development Server
```bash
pnpm dev
```
Open `http://localhost:3000` in your browser.

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for details.

---

<p align="center">
  <b>MindFul-Space</b> — Crafted for mental wellness, engineered for scale. ✨
</p>
