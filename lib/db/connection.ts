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

// Create a template literal tag function that works with lazy initialization
const sql = function(strings: TemplateStringsArray, ...values: any[]): any {
  const instance = getSql();
  return (instance as any)(strings, ...values);
} as NeonQueryFunction<false, false>;

// Use Proxy to intercept property access and method calls
const sqlProxy = new Proxy(sql, {
  get(_target, prop) {
    // Handle template literal calls
    if (prop === Symbol.toPrimitive) {
      return undefined;
    }
    const instance = getSql();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
}) as NeonQueryFunction<false, false>;

export default sqlProxy;

// Helper function for transactions
// Note: Neon serverless doesn't support traditional transactions
// For transactions, use Neon's transaction API or handle at application level
export async function transaction<T>(
  callback: (sql: NeonQueryFunction<false, false>) => Promise<T>
): Promise<T> {
  return callback(getSql());
}
