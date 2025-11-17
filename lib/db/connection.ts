import { neon, NeonQueryFunction } from '@neondatabase/serverless';

// Neon connection with connection pooling
const sql = neon(process.env.DATABASE_URL!);

export default sql;

// Helper function for transactions
// Note: Neon serverless doesn't support traditional transactions
// For transactions, use Neon's transaction API or handle at application level
export async function transaction<T>(
  callback: (sql: NeonQueryFunction<false, false>) => Promise<T>
): Promise<T> {
  return callback(sql);
}
