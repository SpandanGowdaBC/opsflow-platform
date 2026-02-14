# 🗄️ Database Architecture & Scalability

OpsFlow is designed for extreme operational scale. The entire schema is **PostgreSQL-native** and optimized for production workloads.

---

## 🚀 PostgreSQL Architecture
Our database schema is architected to utilize PostgreSQL's advanced features for service-business reliability:

1.  **Relational Integrity**: Strict foreign key constraints across Leads, Bookings, and Inventory models.
2.  **Scalable Indexing**: Optimized lookups for real-time messaging, dashboard metrics, and fulfillment status.
3.  **Concurrency Support**: Designed to handle simultaneous updates from the AI Optimization engine and manual staff interventions without data loss.
4.  **Operational Resilience**: Every critical action—from a booking confirmation to an inventory alert—is ACID-compliant.

---

## 🛠️ Database Setup

### Production (Render)
The production environment uses a managed PostgreSQL instance. The schema is pushed directly using Prisma:
```bash
npx prisma db push
```

### Local Development
1. Ensure a local PostgreSQL instance is running.
2. Configure your `DATABASE_URL` in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/opsflow_db"
   ```
3. Run migrations or schema synchronization:
   ```bash
   npx prisma db push
   ```

---

## 📊 Data Models Summary
- **Business**: Multi-tenant isolation for all records.
- **Leads**: CRM layer with scoring and source tracking.
- **Bookings**: The "Fulfillment Ledger" for service orchestration.
- **Inventory**: Proactive logistics tracking with reorder logic.
- **Conversations/Messages**: Real-time communication hub.

---
**OpsFlow**: Unified. Scalable. Data-Driven.
