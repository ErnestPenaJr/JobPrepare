export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=> ({}))
    const email = String(body?.email || '').trim().toLowerCase()
    const name = String(body?.name || '').trim() || null
    const tier = String(body?.tier || '').trim().toLowerCase() || undefined
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      user = await prisma.user.create({ data: { email, name: name || undefined, tier: tier || 'free' } })
    } else if (tier && user.tier !== tier) {
      user = await prisma.user.update({ where: { id: user.id }, data: { tier } })
    }
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, tier: user.tier } })
    res.cookies.set('uid', user.id, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return res
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'Login failed' }, { status: 400 })
  }
}

