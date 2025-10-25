export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
const extract = require('@/lib/extract')

type MatchRequest = {
  resume?: { text?: string }
  location?: string
  limit?: number
  q?: string
  sources?: ("indeed"|"remotive"|"themuse")[]
  remoteOnly?: boolean
}

function buildQuery(input: MatchRequest): { q: string; l?: string }{
  const text = input?.resume?.text || ''
  const cand = extract.buildCandidate(text || '', '')
  // Compose query from likely role terms + top skills
  const roleGuess = (() => {
    // naive: prefer common engineering titles found in resume
    const t = (text || '').toLowerCase()
    if (/data\s+scientist|data\s+science/.test(t)) return 'data scientist'
    if (/machine\s+learning|ml\b/.test(t)) return 'machine learning engineer'
    if (/front\s*end|frontend/.test(t)) return 'frontend engineer'
    if (/back\s*end|backend/.test(t)) return 'backend engineer'
    if (/full\s*stack/.test(t)) return 'full stack engineer'
    if (/devops|sre|site reliability/.test(t)) return 'devops engineer'
    if (/business intelligence|bi\b/.test(t)) return 'bi developer'
    if (/analyst/.test(t)) return 'data analyst'
    return 'software engineer'
  })()
  const skills = (cand?.skills || []).slice(0, 6)
  const terms = [roleGuess, ...skills].filter(Boolean).join(' ')
  let l: string | undefined = input?.location
  if (!l && cand?.location) {
    const { city, state } = cand.location
    if (city || state) l = [city, state].filter(Boolean).join(', ')
  }
  return { q: terms || 'software engineer', l }
}

function parseIndeedRss(xml: string){
  // Simple RSS <item> parser without external deps
  const items: any[] = []
  const itemRe = /<item>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml))) {
    const block = m[1]
    const get = (tag: string) => {
      const r = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'i')
      const mm = r.exec(block)
      return mm ? mm[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''
    }
    const title = get('title')
    const link = get('link')
    const description = get('description')
    const pubDate = get('pubDate')
    // Naive company/location parse from title/description
    let company: string | undefined
    let location: string | undefined
    const m1 = title.match(/-\s*([^\-]+)$/) // often "Role - Company"
    if (m1) company = m1[1].trim()
    const md = description.match(/Location:\s*([^<]+)/i)
    if (md) location = md[1].trim()
    items.push({ title, link, description, pubDate, company, location })
  }
  return items
}

export async function POST(req: Request){
  try{
    const body = (await req.json().catch(()=> ({}))) as MatchRequest
    const { q, l } = body.q ? { q: body.q, l: body.location } : buildQuery(body)
    const limit = Math.max(1, Math.min(50, Number(body.limit || 20)))
    const sources = (body.sources && body.sources.length) ? body.sources : ["indeed","remotive","themuse"]
    const remoteOnly = !!body.remoteOnly

    const results: any[] = []
    async function fetchIndeed(){
      try{
        const url = new URL('https://rss.indeed.com/rss')
        url.searchParams.set('q', q)
        if (l) url.searchParams.set('l', l)
        url.searchParams.set('sort', 'date')
        const res = await fetch(url.toString(), { headers: { 'User-Agent': 'JobPrep/1.0' } })
        if (!res.ok) return
        const xml = await res.text()
        const items = parseIndeedRss(xml).map((it:any)=> ({ ...it, source: 'indeed' }))
        results.push(...items)
      } catch {}
    }
    async function fetchRemotive(){
      try{
        const url = new URL('https://remotive.com/api/remote-jobs')
        if (q) url.searchParams.set('search', q)
        const res = await fetch(url.toString(), { headers: { 'User-Agent': 'JobPrep/1.0' } })
        if (!res.ok) return
        const data = await res.json()
        const items = (data?.jobs || []).map((j:any)=> ({
          title: j.title,
          link: j.url,
          description: j.description,
          pubDate: j.publication_date,
          company: j.company_name,
          location: j.candidate_required_location,
          source: 'remotive',
          remote: true,
        }))
        results.push(...items)
      } catch {}
    }
    async function fetchTheMuse(){
      try{
        const url = new URL('https://www.themuse.com/api/public/jobs')
        if (q) url.searchParams.set('category', q)
        if (l) url.searchParams.set('location', l)
        url.searchParams.set('page', '1')
        const res = await fetch(url.toString(), { headers: { 'User-Agent': 'JobPrep/1.0' } })
        if (!res.ok) return
        const data = await res.json()
        const items = (data?.results || []).map((j:any)=> ({
          title: j.name,
          link: j.refs?.landing_page,
          description: (j.contents || '').replace(/<[^>]+>/g, ' ').slice(0, 300),
          pubDate: j.publication_date,
          company: j.company?.name,
          location: (j.locations || []).map((loc:any)=> loc.name).join(', '),
          source: 'themuse',
          remote: /remote/i.test((j.locations || []).map((loc:any)=> loc.name).join(', '))
        }))
        results.push(...items)
      } catch {}
    }

    await Promise.all([
      sources.includes('indeed') ? fetchIndeed() : null,
      sources.includes('remotive') ? fetchRemotive() : null,
      sources.includes('themuse') ? fetchTheMuse() : null,
    ])

    let items = results
      .filter(Boolean)
      .filter(it => it && it.title && it.link)
    if (remoteOnly) items = items.filter(it => it.remote || /remote/i.test(`${it.title} ${it.description} ${it.location||''}`))
    // crude de-dup by title+company
    const seen = new Set<string>()
    const dedup: any[] = []
    for (const it of items){
      const key = `${(it.title||'').toLowerCase()}|${(it.company||'').toLowerCase()}`
      if (seen.has(key)) continue; seen.add(key); dedup.push(it)
    }
    items = dedup.slice(0, limit)
    return NextResponse.json({ q, l, items })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'Match failed' }, { status: 400 })
  }
}
