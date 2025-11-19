# Database Setup

## Overview

This project uses PostgreSQL (Neon recommended) with the following schema:

## Tables

1. **users** - User accounts (admin/agent roles)
2. **business_types** - Business categories (e.g., C-Store, Gas Station)
3. **carriers** - Insurance carriers
4. **carrier_appetite** - Detailed carrier appetite with playbook data (JSONB)
5. **submissions** - Agent submissions
6. **carrier_quotes** - Individual carrier quotes per submission
7. **insured_information** - Centralized insured data from eforms
8. **insured_summaries** - Future table for summary data

## Setup Instructions

### 1. Create Database

Create a PostgreSQL database (Neon recommended) and get your connection string.

### 2. Set Environment Variable

Add to `.env.local`:
```env
DATABASE_URL=your-postgresql-connection-string
```

### 3. Run Schema

#### Option A: Using Neon Dashboard
1. Go to your Neon project dashboard
2. Navigate to SQL Editor
3. Copy contents of `database/schema.sql`
4. Paste and execute

#### Option B: Using psql
```bash
psql $DATABASE_URL -f database/schema.sql
```

### 4. Run Migrations

```bash
npm run run-migration
```

This will create:
- `insured_information` table
- `insured_summaries` table
- Update `submissions` table with new columns

### 5. Seed Initial Data

```bash
npm run seed-db
```

### 6. Load Carrier Playbook (Optional)

```bash
npm run load-playbook
```

## Database Features

- All tables use UUID primary keys
- `carrier_appetite` has detailed `playbook_data` JSONB field for RAG pipeline
- `insured_information` stores comprehensive insured data with JSONB fields for flexible data
- Automatic `updated_at` timestamps via triggers
- Indexes created for performance

## Schema Files

- `schema.sql` - Main database schema
- `migration_add_insured_information.sql` - Eform integration migration
- `migration_add_submitted_status.sql` - Status enum update

## Verification

Test your connection:
```bash
npm run test-db
```
