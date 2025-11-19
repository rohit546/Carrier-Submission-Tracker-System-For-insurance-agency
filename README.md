# Coversheet - Insurance Submission Tracker

A modern Next.js application for insurance agencies to track carrier submissions, manage carrier appetite, and integrate with external systems.

## Features

- ✅ **Admin Portal**: Manage carriers, business types, and detailed carrier appetite
- ✅ **Agent Portal**: Create and manage submissions with carrier quoting
- ✅ **GoHighLevel Integration**: Fetch opportunities and auto-populate submissions
- ✅ **Eform Integration**: Automatic submission creation from external eforms
- ✅ **Insured Information**: Centralized insured data management
- ✅ **Database**: PostgreSQL with Neon (production-ready)
- ✅ **Authentication**: JWT-based role-based access (Admin/Agent)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT (jose)
- **Password Hashing**: bcryptjs

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended)
- Environment variables configured

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npm run run-migration

# Seed database
npm run seed-db

# Load carrier playbook data (optional)
npm run load-playbook

# Run development server
npm run dev
```

Visit http://localhost:3000

## Environment Variables

Create `.env.local` with the following:

```env
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET=your-secret-key-here
GHL_API_KEY=your-ghl-api-key (optional)
GHL_LOCATION_ID=your-ghl-location-id (optional)
GHL_PIPELINE_STAGE_ID=your-ghl-stage-id (optional)
EFORM_API_KEY=your-eform-api-key (optional)
DEFAULT_AGENT_ID=default-agent-uuid (optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Setup

1. Create a PostgreSQL database (Neon recommended)
2. Run the schema:
   ```bash
   psql $DATABASE_URL -f database/schema.sql
   ```
3. Run migrations:
   ```bash
   npm run run-migration
   ```
4. Seed initial data:
   ```bash
   npm run seed-db
   ```

## Default Credentials

After seeding:
- **Admin**: username: `admin`, password: `admin123`
- **Agent**: username: `agent`, password: `agent123`

⚠️ **Change these in production!**

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin pages
│   ├── agent/             # Agent pages
│   ├── api/               # API routes
│   └── ...
├── components/            # React components
│   ├── admin/            # Admin components
│   └── agent/            # Agent components
├── lib/                   # Utilities and helpers
│   ├── db/               # Database queries
│   └── ...
├── database/              # Database schemas and migrations
├── scripts/               # Utility scripts
└── automation/            # RPA automation service (Phase 3)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed-db` - Seed database with initial data
- `npm run load-playbook` - Load carrier playbook data
- `npm run run-migration` - Run database migrations
- `npm run test-db` - Test database connection

## Deployment

### Railway

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed instructions.

### Other Platforms

The app can be deployed to any Node.js hosting platform:
- Vercel
- Netlify
- AWS
- Google Cloud

## Documentation

- [Local Setup Guide](./LOCAL_SETUP.md)
- [Eform Integration Guide](./EFORM_INTEGRATION_GUIDE.md)
- [GoHighLevel Setup](./GHL_SETUP.md)
- [Railway Deployment](./RAILWAY_DEPLOYMENT.md)

## License

ISC
