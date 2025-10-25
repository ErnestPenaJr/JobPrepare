import mysql, { Pool } from 'mysql2/promise'

let pool: Pool | null = null

function required(name: string, value?: string) {
  if (!value || !value.trim()) throw new Error(`Missing env ${name}`)
  return value
}

export function getPool(): Pool {
  if (pool) return pool
  const host = process.env.MYSQL_HOST
  const port = Number(process.env.MYSQL_PORT || 3306)
  const user = process.env.MYSQL_USER
  const password = process.env.MYSQL_PASSWORD
  const database = process.env.MYSQL_DATABASE
  // Validate requireds but allow database to be optional for ping
  required('MYSQL_HOST', host)
  required('MYSQL_USER', user)
  required('MYSQL_PASSWORD', password)
  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database: database || undefined,
    connectionLimit: 5,
    ssl: process.env.MYSQL_SSL?.toLowerCase() === 'true' ? { rejectUnauthorized: false } as any : undefined,
  })
  return pool
}

export async function ping() {
  const p = getPool()
  const [rows] = await p.query('SELECT 1 AS ok')
  return rows
}

