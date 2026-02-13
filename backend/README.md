# OpsFlow Backend

This directory contains the backend services for **OpsFlow**, powered by Node.js and Express.

For full project documentation, setup instructions, and deployment details, please refer to the [Main README](../README.md).

## Quick Start
```bash
npm install
npx prisma db push
node seed_demo_data.js
npm run dev
```

## Features
- **Real-time Engine:** Socket.IO for live dashboard updates.
- **AI Integration:** Google Gemini API for smart messaging and automation.
- **Database:** Prisma ORM with PostgreSQL compatibility.
- **REST API:** Robust endpoints for Lead & Booking management.
