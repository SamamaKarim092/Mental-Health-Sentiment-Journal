# MindFul-Space — Easy Project Guide 🧠✨

Welcome to **MindFul-Space**! This guide explains what this project is, what it does, and how it works in plain, simple English.

---

## 1. What Is MindFul-Space? 🤔

**MindFul-Space** is a digital journal and mental health companion web application. 

Think of it like a smart private diary. Instead of just writing on paper, MindFul-Space listens to what you write, understands your emotions, helps you stay organized with daily tasks, and offers a friendly AI coach to chat with whenever you need someone to talk to.

---

## 2. What Does the Application Do? 🌟

Here is everything a user can do inside MindFul-Space:

### 📝 1. Write Journal Entries
* You can write about your day, your feelings, thoughts, or ideas.
* Add titles, custom mood labels, tags, and select how you feel.

### 🌱 2. Interactive Plant Companion
* As you type your journal entry, a virtual plant on the screen grows in real-time!
* The plant changes colors depending on your mood (e.g., happy, calm, sad, or energetic) to make writing fun and comforting.

### 🔍 3. Automatic AI Mood & Sentiment Detection
* **Instant Keyword Match:** As you type words like *"happy"*, *"stressed"*, or *"gym"*, the app immediately suggests matching mood tags (like *Happy*, *Anxious*, or *Energetic*).
* **Deep AI Sentiment Score:** When you save an entry, AI analyzes your words and calculates an emotion score from `-1.0` (very down/negative) to `+1.0` (very happy/positive).

### 🤖 4. AI Mental Health Coach Chat
* Talk to a supportive AI assistant anytime.
* The AI coach isn't just generic—it remembers your journal entries, your daily tasks, and your wellness goals so it can give personalized advice.
* You can also click *"Talk about this entry"* on any past entry to start a targeted chat session.

### 📋 5. Daily Tasks & Wellness Goals
* Create daily to-do items. If you don't finish a task today, it automatically carries over to tomorrow!
* Set long-term wellness goals (e.g., *"Meditate 10 mins daily"*, *"Drink 2L water"*).

### 📊 6. Mood Analytics & Calendar
* View charts showing how your mood changes over time.
* Check your journaling streak, average mood score, and total entries saved.

---

## 3. How Does It Work Behind the Scenes? ⚙️

Here is how all the technology pieces work together:

```text
[ User Interface ]  --->  [ Security Check (Proxy) ]  --->  [ Next.js API Routes ]
   (React/Tailwind)              (Supabase Auth)                  (Backend Code)
                                                                        |
                                            +---------------------------+---------------------------+
                                            |                                                       |
                                    [ Database (Prisma) ]                                  [ AI Engines (Groq / n8n) ]
                              Stores Users, Entries, Tasks, Chats                     Calculates Sentiment & AI Answers
```

### 🔹 1. Frontend (What You See)
* Built with **Next.js 16**, **React 19**, and **Tailwind CSS**.
* Uses **Framer Motion** and **Three.js** for smooth glass animations and ambient background effects.

### 🔹 2. User Accounts & Security
* Powered by **Supabase Auth**. Users can log in using Email & Password or Google Account.
* Next.js **Proxy Middleware** checks cookies before allowing access to private dashboard pages.

### 🔹 3. Database (Storing Information)
* Uses **PostgreSQL** database managed with **Prisma ORM**.
* Tables store Users, Entries, Attachments, Chats, Messages, Daily Tasks, Goals, and Motivational Quotes safely.

### 🔹 4. AI Brain (Artificial Intelligence)
* Uses **Groq API** (`meta-llama/llama-4-scout-17b-16e-instruct`) and **n8n Webhooks**.
* Analyzes text asynchronously without slowing down entry saving.
* Feeds context (messages, tasks, entries) into the LLM model to return thoughtful, empathetic chatbot responses.

---

## 🎯 Summary

MindFul-Space combines **journaling**, **emotional AI tracking**, **task management**, and **empathetic AI coaching** into one beautiful, easy-to-use platform to help users take care of their mind every single day.
