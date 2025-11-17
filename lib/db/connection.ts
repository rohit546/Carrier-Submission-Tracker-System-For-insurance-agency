import { neon } from '@neondatabase/serverless';

// Neon connection with connection pooling
const sql = neon(process.env.DATABASE_URL!);

export default sql;

// Helper function for transactions
export async function transaction<T>(
  callback: (sql: typeof neon) => Promise<T>
): Promise<T> {
  // Note: Neon serverless doesn't support traditional transactions
  // For transactions, use Neon's transaction API or handle at application level
  return callback(sql);
}
