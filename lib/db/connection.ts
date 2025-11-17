import { neon, NeonQueryFunction } from '@neondatabase/serverless';

// Lazy initialization to avoid connection during build time
let sqlInstance: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!sqlInstance) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('No database connection string was provided to `neon()`. Perhaps an environment variable has not been set?');
    }
    sqlInstance = neon(databaseUrl);
  }
  return sqlInstance;
}

// Export a getter function that initializes on first use
const sql = new Proxy({} as NeonQueryFunction<false, false>, {
  get(_target, prop) {
    const instance = getSql();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
  apply(_target, _thisArg, argumentsList) {
    const instance = getSql();
    return (instance as any)(...argumentsList);
  }
});

export default sql;

// Helper function for transactions
// Note: Neon serverless doesn't support traditional transactions
// For transactions, use Neon's transaction API or handle at application level
export async function transaction<T>(
  callback: (sql: NeonQueryFunction<false, false>) => Promise<T>
): Promise<T> {
  return callback(getSql());
}
