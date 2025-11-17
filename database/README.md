# Database Setup Instructions

## 1. Connect to Neon Database

Use the connection string provided:
```
postgresql://neondb_owner:npg_dLgKYFQ4yh0l@ep-blue-leaf-afu1nh62-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## 2. Run Schema

### Option A: Using Neon Dashboard
1. Go to your Neon project dashboard
2. Navigate to SQL Editor
3. Copy contents of `database/schema.sql`
4. Paste and execute

### Option B: Using psql
```bash
psql 'postgresql://neondb_owner:npg_dLgKYFQ4yh0l@ep-blue-leaf-afu1nh62-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f database/schema.sql
```

## 3. Set Environment Variable

Create `.env.local` file:
```
DATABASE_URL=postgresql://neondb_owner:npg_dLgKYFQ4yh0l@ep-blue-leaf-afu1nh62-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your-secret-key-here
```

## 4. Seed Initial Data (Optional)

Run the seed script to create initial users and data:
```bash
npm run seed
```

## 5. Verify Connection

The app will automatically connect when you start it:
```bash
npm run dev
```

## Database Tables Created

1. **users** - User accounts (admin/agent)
2. **business_types** - Business categories
3. **carriers** - Insurance carriers
4. **carrier_appetite** - Detailed carrier appetite with playbook data
5. **submissions** - Agent submissions
6. **carrier_quotes** - Individual carrier quotes per submission

## Notes

- All tables use UUID primary keys
- `carrier_appetite` has detailed playbook_data JSONB field for RAG pipeline
- Indexes are created for performance
- Triggers update `updated_at` timestamps automatically
