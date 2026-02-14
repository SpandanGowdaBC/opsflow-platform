# ⚙️ OpsFlow Backend

The core intelligence and API layer of the OpsFlow platform.

## 🚀 Tech Stack
- **Node.js & Express**: API Framework.
- **Prisma**: Type-safe database client.
- **PostgreSQL**: Production database.
- **Socket.IO**: Real-time events.
- **Google Gemini**: AI Intelligence.

## 🛠️ Development
```bash
npm install
npx prisma db push
node seed_cloud_init.js
node seed_demo_data.js
npm run dev
```

## 🌐 API Structure
- `/api/auth`: Authentication.
- `/api/leads`: CRM & Lead tracking.
- `/api/bookings`: Service orchestration.
- `/api/inventory`: Logistics management.
- `/api/tasks`: Command center operations.
- `/api/ai`: Gemini intelligence wrappers.
