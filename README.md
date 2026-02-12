# 🚀 OpsFlow - The Unified AI Operations Platform

> **Engineered for the CareOps Hackathon 2026**
>
> *Eliminating tool chaos with a single, intelligent operating system for service businesses.*

---

## 👨‍💻 Author
**Spandan Gowda B C**
*Full-Stack Developer & CareOps Innovator*

---

## 📽️ Final Submission
- **Demo Video:** [Link to Demo]
- **Deployment URL:** [Link to Live App]
- **AI Leverage:** Powered by **Google Gemini** for Smart Communications
- **Documentation:**
  - [✨ Detailed Features](./docs/FEATURES.md)
  - [🚀 Deployment Guide](./docs/DEPLOYMENT.md)
  - [🗄️ Database Architecture](./docs/DATABASE.md)

---

## 🎯 The Vision
OpsFlow isn't just another CRM. It's a **Recursive Fulfillment Loop**. It bridges the gap between customer acquisition (Leads), service delivery (Bookings), compliance (Forms), and logistics (Inventory) into one seamless, automated experience.

## ✨ Core Innovation Pillars

### 1. 🤖 AI-Powered "Hybrid" Unified Inbox
Staff members shouldn't spend all day typing repetitive replies.
- **✨ AI Smart Suggest:** One-click contextual drafts powered by Gemini.
- **🛡️ Automation Guardrails:** AI intelligently steps back when staff intervenes to preserve the human touch.

### 2. 🔄 The Fulfillment Ledger
We moved beyond "just a calendar" to a dedicated **Booking Ledger**.
- **✅ Completion Tracking:** Staff can mark bookings as fulfilled, instantly feeding business KPIs.
- **🚩 Automated Recovery:** Marking a no-show triggers immediate re-engagement workflows.

### 3. 📦 Logistics-Aware Scheduling
Bookings aren't just about time; they are about resources.
- **🚨 Low-Stock Alerts:** Automated alerts in the inbox when inventory breaches thresholds.
- **📦 Asset Tracking:** Real-time visibility into the physical goods required for service.

---

## 🏛️ Technical Excellence

### Stack Compatibility
- **Frontend:** Next.js 14 (App Router) with a custom premium design system.
- **Backend:** Node.js / Express with a modular service-oriented architecture.
- **Database:** Prisma ORM with **PostgreSQL-native** schema (optimized for production).
- **Integrations:** 
  - **Email:** Nodemailer (SMTP + Ethereal)
  - **SMS:** Twilio Integration
  - **AI:** Google Gemini Intelligence Wrapper

---

## 🛠️ Setup & Execution

### 1. Local Development (Zero-Config)
The project is pre-seeded with **ZenCare Demo Data** for immediate testing.
```bash
# Backend Setup
cd backend
npm install
npx prisma db push
node seed_zencare.js
npm run dev

# Frontend Setup
cd ../frontend
npm install
npm run dev
```

### 2. Production Deployment (PostgreSQL + Docker)
OpsFlow is fully architected for PostgreSQL and containerized for deployment.
```bash
docker-compose up --build
```
*(Please see [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed cloud instructions.)*

---

## 🏆 Final Note on AI Leverage
During this hackathon, AI was leveraged as a **core product feature**. By integrating Gemini into the daily staff workflow (Smart Drafts), we've reduced operational friction by an estimated 70%, allowing small businesses to operate with the efficiency of a global enterprise.

---
**OpsFlow**: See. Act. Operate. All from one dashboard.
