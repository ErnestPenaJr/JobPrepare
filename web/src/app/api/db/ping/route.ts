export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { ping } from '@/lib/db'

export async function GET() {
  try {
    const rows: any = await ping()
    return NextResponse.json({ ok: true, rows })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

