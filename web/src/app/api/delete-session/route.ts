export const runtime = 'nodejs'
import { NextResponse } from 'next/server'

export async function POST(){
  // Stateless in Netlify; nothing to clear server-side
  return new NextResponse(null, { status: 204 })
}

