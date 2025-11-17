# Carrier Submission Tracker System

Insurance agency submission tracking system with GoHighLevel integration and carrier portal automation.

## Features

- ✅ **Admin Portal**: Manage carriers, business types, and carrier appetite
- ✅ **Agent Portal**: Create and manage submissions
- ✅ **GoHighLevel Integration**: Fetch opportunities and auto-populate submissions
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
- PostgreSQL database (Neon or local)
- GoHighLevel API credentials

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Seed database
npm run seed-db

# Load carrier playbook data
npm run load-playbook

# Run development server
npm run dev
```

Visit http://localhost:3000

## Environment Variables

See `.env.example` for all required environment variables.

### Required Variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `GHL_API_KEY` - GoHighLevel API key
- `GHL_LOCATION_ID` - GoHighLevel location ID
- `GHL_PIPELINE_STAGE_ID` - GoHighLevel pipeline stage ID

## Database Setup

1. Create a PostgreSQL database (Neon recommended)
2. Run the schema:
   ```bash
   psql $DATABASE_URL -f database/schema.sql
   ```
3. Seed initial data:
   ```bash
   npm run seed-db
   ```
4. Load carrier playbook:
   ```bash
   npm run load-playbook
   ```

## Default Credentials

After seeding:
- **Admin**: username: `admin`, password: `admin123`
- **Agent**: username: `agent`, password: `agent123`

⚠️ **Change these in production!**

## Deployment

### Railway Deployment

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed Railway deployment instructions.

Quick steps:
1. Connect GitHub repo to Railway
2. Add environment variables
3. Deploy automatically

### Other Platforms

The app can be deployed to:
- Vercel
- Netlify
- AWS
- Google Cloud
- Any Node.js hosting platform

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

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed-db` - Seed database with initial data
- `npm run load-playbook` - Load carrier playbook data
- `npm run test-db` - Test database connection

## Development

### Adding a New Carrier

1. Admin logs in
2. Go to Admin Dashboard
3. Add carrier in "Carriers" section
4. Set carrier appetite for business types

### Creating a Submission

1. Agent logs in
2. Click "New Submission"
3. Optionally search GoHighLevel for opportunities
4. Select business type and enter details
5. System suggests carriers based on appetite
6. Agent adds quotes and remarks
7. Save submission

## API Endpoints

- `POST /api/login` - User authentication
- `GET /api/submissions` - List submissions
- `POST /api/submissions` - Create submission
- `GET /api/carriers` - List carriers
- `GET /api/business-types` - List business types
- `POST /api/ghl/search` - Search GHL opportunities
- `GET /api/ghl/contact/[id]` - Get GHL contact details

## License

ISC

## Support

For issues or questions, please open an issue on GitHub.

