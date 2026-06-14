# XENO CRM 🚀

An AI-Native Mini CRM built to help direct-to-consumer brands intelligently reach their shoppers. Instead of manually filtering spreadsheets, marketers can simply chat with an AI Agent to segment customers, draft personalized multi-channel campaigns, and automatically dispatch them.

## 🌟 Key Features

1. **AI-Powered Customer Segmentation**: Built with a LangChain Tool-Calling Agent and powered by Groq's Llama 3.3 70B model. Simply ask, *"Find all customers in Mumbai who haven't ordered in the last 30 days"* and the AI maps it directly into dynamic PostgreSQL queries via Supabase.
2. **Generative Campaign Copy**: The agent automatically drafts highly-converting, personalized marketing copy tailored to the targeted segment across WhatsApp, Email, and SMS.
3. **Conversational "Human-in-the-Loop" Workflow**: The AI operates in a 3-step conversation (Find → Draft → Send), allowing the marketer to review the audience size and the drafted copy before giving the final "Send" command.
4. **Mock Dispatch & Tracking**: Once dispatched, the campaign is handed off to an asynchronous Channel Service (simulating a provider like Twilio/SendGrid) with exponential backoff retries and webhook delivery callbacks (Delivered, Opened, Clicked).
5. **Premium Glassmorphic UI**: A stunning, responsive dashboard built with React 19, Vite, and Tailwind CSS.

## 🏗 Architecture

- **Frontend**: React 19, Vite, Tailwind CSS, Recharts, Lucide Icons.
- **Backend**: FastAPI (Python 3), LangChain, Groq API (LLaMA 3.3 70B).
- **Database**: Supabase (PostgreSQL) with `exec_sql` RPC for dynamic AI queries.
- **Microservice**: Background Channel Service (FastAPI) to handle mock dispatch and delivery webhooks.

## 🚀 Getting Started

### 1. Database Setup
Create a new Supabase project and run the provided SQL schema (which includes tables for `customers`, `orders`, `campaigns`, and `communications`, plus the required `exec_sql` RPC function).

### 2. Backend & Agent
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*Note: Make sure to set your `SUPABASE_URL`, `SUPABASE_KEY`, and `GROQ_API_KEY` in `backend/app/database.py` and `backend/app/agent.py`.*

### 3. Channel Service (Mock Delivery)
```bash
cd channel-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### 4. Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```

## 🧠 Demo Flow

1. Open the **AI Assistant** tab.
2. Type: `Find all customers in Mumbai who haven't ordered in the last 30 days.`
3. The AI will query the DB and return the exact audience size.
4. Type: `Draft a win-back campaign for them.`
5. Review the generated, channel-specific copy.
6. Type: `Looks great. Send it.`
7. Navigate to the **Campaigns** tab to watch the delivery statuses update in real-time!

---
*Built as a Take-Home Assignment for Xeno.*
