/**
 * Database client initialization for Vercel Postgres
 */

import { sql } from '@vercel/postgres';

/**
 * Execute a database query using Vercel Postgres
 * @param query SQL query string
 * @param params Query parameters
 */
export async function query<T = unknown>(
  query: string,
  params?: unknown[]
): Promise<T[]> {
  try {
    const result = await sql.query(query, params);
    return result.rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get database connection for transactions
 */
export const db = {
  query: sql.query.bind(sql),
  sql,
};

export default db;
