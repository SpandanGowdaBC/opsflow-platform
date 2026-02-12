# 🗄️ Database Architecture & Scalability

OpsFlow is designed for extreme operational scale. While our local development environment uses SQLite for zero-config execution, the entire schema is **PostgreSQL-native** and optimized for production workloads.

## 🚀 PostgreSQL Readiness
Our `prisma/schema.prisma` is architected to utilize PostgreSQL's advanced features:
- **Relational Integrity**: Strict foreign key constraints across Leads, Bookings, and Inventory.
- **Scalable Indexing**: Optimized lookups for real-time messaging and dashboard metrics.
- **Concurrency**: Designed to handle simultaneous updates from the AI Optimization engine and manual staff interventions.

## 🛠️ How to Switch to PostgreSQL
For the final production deployment, follow these two steps:

1. **Update Schema**:
   In `backend/prisma/schema.prisma`, change the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Configure Environment**:
   Add your connection string to `backend/.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/opsflow_db"
   ```

3. **Deploy**:
   Run `npx prisma db push` to synchronize the schema with your Postgres instance.

---
*This architecture ensures that OpsFlow can grow from a single-clinic tool to a multi-national healthcare operating system without rewriting a single line of business logic.*
