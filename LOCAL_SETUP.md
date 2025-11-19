# Local Development Setup

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Neon PostgreSQL Database** (or any PostgreSQL database)
3. **Environment Variables** configured

---

## Step 1: Install Dependencies

```bash
npm install
```

---

## Step 2: Set Up Environment Variables

Create or update `.env.local` in the project root:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# JWT Secret (for authentication)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Eform Integration (optional, for eform integration)
EFORM_API_KEY=your-eform-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# GoHighLevel Integration (optional, if using GHL)
GHL_API_KEY=your-ghl-api-key
GHL_LOCATION_ID=your-ghl-location-id
```

---

## Step 3: Run Database Migration

The new `insured_information` table needs to be created. Run the migration:

### Option A: Using psql (Recommended)

```bash
psql 'your-database-connection-string' -f database/migration_add_insured_information.sql
```

### Option B: Using Neon Console

1. Go to your Neon dashboard
2. Open SQL Editor
3. Copy contents of `database/migration_add_insured_information.sql`
4. Paste and execute

### Option C: Using a Database Client

Open `database/migration_add_insured_information.sql` in your database client (DBeaver, pgAdmin, etc.) and execute it.

---

## Step 4: Verify Database Connection

Test the database connection:

```bash
npm run test-db
```

You should see: `✅ Database connection successful!`

---

## Step 5: Seed Database (First Time Only)

If this is a fresh database, seed it with initial data:

```bash
npm run seed-db
```

This creates:
- Admin user (username: `admin`, password: `admin`)
- Agent user (username: `agent`, password: `agent`)
- Business types
- Carriers

**⚠️ Change default passwords in production!**

---

## Step 6: Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## Step 7: Login

### Admin Portal
- URL: http://localhost:3000/admin
- Username: `admin`
- Password: `admin`

### Agent Portal
- URL: http://localhost:3000/agent
- Username: `agent`
- Password: `agent`

---

## Troubleshooting

### Error: "No database connection string was provided"

- Check `.env.local` exists
- Verify `DATABASE_URL` is set correctly
- Restart the dev server after changing `.env.local`

### Error: "relation 'insured_information' does not exist"

- Run the database migration: `database/migration_add_insured_information.sql`

### Error: "uuid_generate_v4() does not exist"

- Enable UUID extension in your database:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  ```

### Port 3000 already in use

- Change port: `PORT=3001 npm run dev`
- Or kill the process using port 3000

---

## Quick Start Checklist

- [ ] `npm install` completed
- [ ] `.env.local` created with `DATABASE_URL` and `JWT_SECRET`
- [ ] Database migration run (`migration_add_insured_information.sql`)
- [ ] Database connection tested (`npm run test-db`)
- [ ] Database seeded (`npm run seed-db`) - first time only
- [ ] Dev server started (`npm run dev`)
- [ ] App accessible at http://localhost:3000

---

## Next Steps

1. **Test Eform Integration:**
   - Set `EFORM_API_KEY` in `.env.local`
   - Test the `/api/integrations/eform` endpoint

2. **Test GHL Integration:**
   - Set `GHL_API_KEY` and `GHL_LOCATION_ID` in `.env.local`
   - Test GHL opportunity search in agent portal

3. **Load Carrier Playbook:**
   - Run `npm run load-playbook` to load carrier appetite data

---

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Test database connection
npm run test-db

# Seed database (first time)
npm run seed-db

# Load carrier playbook data
npm run load-playbook

# Clean up business types
npm run cleanup-lobs
```

---

## Need Help?

- Check `EFORM_INTEGRATION_GUIDE.md` for eform integration
- Check `GHL_SETUP.md` for GoHighLevel setup
- Check `DATABASE_DESIGN_RECOMMENDATION.md` for database design

