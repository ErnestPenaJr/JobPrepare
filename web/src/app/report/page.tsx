"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FiPrinter, FiCopy, FiInfo, FiDownload } from "react-icons/fi";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
function ensureSwal(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const w = window as any;
  if (w.Swal) return Promise.resolve(w.Swal);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js';
    s.async = true;
    s.onload = () => resolve((window as any).Swal);
    s.onerror = () => reject(new Error('Failed to load SweetAlert2'));
    document.head.appendChild(s);
  });
}

type AnalyzeResponse = {
  scorecard: { iterations: number[]; final_score: number; iteration_labels?: string[]; stability?: { reeval_score: number; delta: number } };
  gaps: string[];
  keywords: { matched: string[]; missing: string[] };
  decision: "accept" | "reject";
  stop_conditions_triggered?: string[];
  meta?: { jd?: { title?: string | null; company?: string | null; location?: { city?: string|null; state?: string|null; onsite?: boolean; days_on_site?: number|null } } };
  stop_details?: {
    min_score?: { threshold?: number };
    years?: { threshold?: number };
    management?: { threshold?: number };
    onsite?: { threshold?: number };
  };
};

// Labels are provided by API in data.scorecard.iteration_labels; fallback not needed here

export default function ReportPage(){
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [cover, setCover] = useState<string>("");
  const addToast = useCallback(({ title, description, variant }: { title?: string; description?: string; variant?: 'default'|'destructive' }) => {
    ensureSwal()
      .then((Swal: any) => {
        if (!Swal) return;
        Swal.fire({ title: title || '', text: description || '', icon: variant === 'destructive' ? 'error' : 'success', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
      })
      .catch(()=>{});
  }, []);
  const [lastAt, setLastAt] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('jobs_result_v1') || '{}');
      if (s?.data) setData(s.data);
      if (s?.at) setLastAt(s.at);
    } catch {}
    try {
      const c = JSON.parse(localStorage.getItem('jobs_cover_v1') || '{}');
      if (c?.text) setCover(c.text);
    } catch {}
  }, []);

  // Auto-refresh when toggled on (every 2s)
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      try {
        const s = JSON.parse(localStorage.getItem('jobs_result_v1') || '{}');
        if (s?.data) setData(s.data);
        if (s?.at) setLastAt(s.at);
        const c = JSON.parse(localStorage.getItem('jobs_cover_v1') || '{}');
        if (c?.text) setCover(c.text);
      } catch {}
    }, 2000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  // Toast when auto refresh toggles
  useEffect(() => {
    addToast({ title: 'Report auto refresh', description: autoRefresh ? 'Enabled' : 'Disabled' });
  }, [autoRefresh]);

  const pct = useMemo(() => data ? Math.max(0, Math.min(100, ((data.scorecard.final_score - 1) / 9) * 100)) : 0, [data]);

  function copyReport(){
    try {
      if (!data) throw new Error('No analysis to copy');
      const lines: string[] = [];
      const title = data.meta?.jd?.title || 'Role';
      const company = data.meta?.jd?.company || '';
      const loc = data.meta?.jd?.location;
      const locStr = loc ? [loc.city, loc.state].filter(Boolean).join(', ') : '';
      lines.push(`# Analysis Report${company ? ` — ${company}` : ''}${title ? ` (${title})` : ''}`);
      if (locStr) lines.push(`Location: ${locStr}${loc?.onsite ? ` • Onsite ${loc?.days_on_site || ''} days/wk` : ''}`);
      lines.push('');
      lines.push(`Decision: ${data.decision.toUpperCase()}`);
      lines.push(`Final Score: ${data.scorecard.final_score.toFixed(1)}`);
      if (data.scorecard.stability) lines.push(`Re-eval: ${data.scorecard.stability.reeval_score.toFixed(2)} (Δ ${data.scorecard.stability.delta.toFixed(2)})`);
      lines.push('');
      lines.push('## Iteration Scores');
      data.scorecard.iterations.forEach((v,i)=> {
        const label = (data.scorecard as any).iteration_labels?.[i] || `Iteration ${i+1}`;
        lines.push(`- ${label}: ${v.toFixed(2)}`);
      });
      lines.push('');
      lines.push('## Matched Keywords');
      if (data.keywords.matched.length) data.keywords.matched.forEach(k=> lines.push(`- ${k}`)); else lines.push('-');
      lines.push('');
      lines.push('## Missing Keywords');
      if (data.keywords.missing.length) data.keywords.missing.forEach(k=> lines.push(`- ${k}`)); else lines.push('-');
      lines.push('');
      lines.push('## Gaps');
      if (data.gaps.length) data.gaps.forEach(g=> lines.push(`- ${g}`)); else lines.push('-');
      if (data.stop_conditions_triggered?.length){
        lines.push('');
        lines.push('## Stop Conditions');
        data.stop_conditions_triggered.forEach(r=> lines.push(`- ${r}`));
      }
      if (data.stop_details){
        lines.push('');
        lines.push('## Stop Settings');
        if (data.stop_details.min_score) lines.push(`- Min score: ${data.stop_details.min_score.threshold}`);
        if (data.stop_details.years) lines.push(`- Years threshold: ${data.stop_details.years.threshold}`);
        if (data.stop_details.management) lines.push(`- Mgmt threshold: ${data.stop_details.management.threshold}`);
        if (data.stop_details.onsite) lines.push(`- Onsite days threshold: ${data.stop_details.onsite.threshold}`);
      }
      if (cover){
        lines.push('');
        lines.push('## Cover Letter');
        lines.push(cover);
      }
      const text = lines.join('\n');
      navigator.clipboard.writeText(text);
      addToast({ title: 'Copied', description: 'Report copied to clipboard.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addToast({ title: 'Copy failed', description: msg || 'Unable to copy', variant: 'destructive' });
    }
  }

  function handleDownloadPDF(){
    const prev = document.title;
    const ts = new Date(lastAt ?? Date.now());
    const pad = (n:number)=> String(n).padStart(2,'0');
    const name = `analysis-${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}`;
    document.title = name;
    window.print();
    setTimeout(()=> { document.title = prev; }, 500);
  }

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Analysis Report</h1>
          <span className="text-xs text-muted-foreground">Last updated: {lastAt ? new Date(lastAt).toLocaleString() : new Date().toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
            <span>Auto refresh</span>
            <Switch checked={autoRefresh} onCheckedChange={(v)=> setAutoRefresh(!!v)} />
          </div>
          <Button variant="outline" onClick={copyReport} className="inline-flex items-center gap-2"><FiCopy /> Copy</Button>
          <Button variant="outline" onClick={()=> window.print()} className="inline-flex items-center gap-2"><FiPrinter /> Print</Button>
          <Button variant="outline" onClick={handleDownloadPDF} className="inline-flex items-center gap-2"><FiDownload /> Download PDF</Button>
        </div>
      </div>

      {!data && <div className="text-sm text-muted-foreground">No analysis found. Run Analyze first.</div>}

      {data && (
        <>
          <Card className="break-inside-avoid">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              {data.meta?.jd && (
                <div className="text-sm text-muted-foreground">
                  {(data.meta.jd.title || data.meta.jd.company) && (
                    <div>
                      {data.meta.jd.title ? <span className="font-medium">{data.meta.jd.title}</span> : null}
                      {data.meta.jd.company ? <span>{data.meta.jd.title ? ' • ' : ''}{data.meta.jd.company}</span> : null}
                    </div>
                  )}
                  {data.meta.jd.location && (
                    <div>
                      {[
                        data.meta.jd.location.city,
                        data.meta.jd.location.state,
                      ].filter(Boolean).join(', ')}
                      {data.meta.jd.location.onsite ? ` • Onsite ${data.meta.jd.location.days_on_site || ''} days/wk` : ''}
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Decision</div>
                <div>{data.decision === 'accept' ? <Badge className="badge-accept">ACCEPT</Badge> : <Badge className="badge-reject">REJECT</Badge>}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Final Score</div>
                <div className="text-2xl font-semibold tabular-nums">{data.scorecard.final_score.toFixed(1)}</div>
                <div className="mt-2"><Progress value={pct} /></div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Stability</div>
                <div className="text-sm">{data.scorecard.stability ? `Δ ${data.scorecard.stability.delta.toFixed(2)} (re ${data.scorecard.stability.reeval_score.toFixed(2)})` : '—'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Generated</div>
                <div className="text-sm">{lastAt ? new Date(lastAt).toLocaleString() : new Date().toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
          {data?.stop_details && (
            <Card className="break-inside-avoid">
              <CardHeader><CardTitle>Stop Settings</CardTitle></CardHeader>
              <CardContent>
                <ul className="text-sm grid sm:grid-cols-2 gap-y-1 list-disc pl-6">
                  {data.stop_details.min_score && <li>Minimum passing score: {data.stop_details.min_score.threshold}</li>}
                  {data.stop_details.years && <li>Required years threshold: {data.stop_details.years.threshold}</li>}
                  {data.stop_details.management && <li>Management threshold: {data.stop_details.management.threshold}</li>}
                  {data.stop_details.onsite && <li>Onsite days threshold: {data.stop_details.onsite.threshold}</li>}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="break-inside-avoid">
            <CardHeader><CardTitle>Iterations</CardTitle></CardHeader>
            <CardContent>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 list-disc pl-6 gap-y-1">
                {data.scorecard.iterations.map((v,i)=> {
                  const label = (data.scorecard as any).iteration_labels?.[i] || `Iteration ${i+1}`;
                  return <li key={i}><span className="font-medium">{i+1}.</span> {label} — {v.toFixed(2)}</li>;
                })}
              </ul>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2"><CardTitle>Must‑Have Keywords</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs cursor-default" aria-label="About must-have keywords"><FiInfo /></span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs max-w-xs">From JD “must_have”. A keyword is counted as matched if found in your resume/cover text or extracted skills. Matching is case‑insensitive and includes simple synonyms.</div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-1">Required keywords from the JD compared to your resume/cover letter.</div>
                <div className="text-xs mb-1">Matched ({(data.keywords.must?.matched?.length ?? data.keywords.matched.length)}/
                  {((data.keywords.must?.matched?.length ?? 0) + (data.keywords.must?.missing?.length ?? data.keywords.missing.length))})</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {((data.keywords.must?.matched ?? data.keywords.matched).length === 0) && <div className="text-sm text-muted-foreground">None</div>}
                  {(data.keywords.must?.matched ?? data.keywords.matched).map((k,i)=> {
                    const prov = data.keywords.must?.provenance?.[k.toLowerCase()];
                    const desc = prov?.length ? `Matched via ${prov.join(', ')}` : undefined;
                    return (
                      <TooltipProvider key={`rmm-${i}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary">{k}</Badge>
                          </TooltipTrigger>
                          {desc && <TooltipContent><div className="text-xs">{desc}</div></TooltipContent>}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
                <div className="text-xs mb-1">Missing ({(data.keywords.must?.missing?.length ?? data.keywords.missing.length)}/
                  {((data.keywords.must?.matched?.length ?? 0) + (data.keywords.must?.missing?.length ?? data.keywords.missing.length))})</div>
                <div className="flex flex-wrap gap-2">
                  {((data.keywords.must?.missing ?? data.keywords.missing).length === 0) && <div className="text-sm text-muted-foreground">None</div>}
                  {(data.keywords.must?.missing ?? data.keywords.missing).map((k,i)=> <Badge key={`rms-${i}`} className="badge-reject">{k}</Badge>)}
                </div>
              </CardContent>
            </Card>
            <Card className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2"><CardTitle>Preferred Keywords</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs cursor-default" aria-label="About preferred keywords"><FiInfo /></span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs max-w-xs">From JD “nice_to_have”. These improve overall fit but are not required. Matching uses the same rules as must‑have keywords.</div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-1">Nice‑to‑have keywords from the JD.</div>
                <div className="text-xs mb-1">Matched ({data.keywords.preferred?.matched?.length ?? 0}/{((data.keywords.preferred?.matched?.length ?? 0) + (data.keywords.preferred?.missing?.length ?? 0))})</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(data.keywords.preferred?.matched?.length ?? 0) === 0 && <div className="text-sm text-muted-foreground">None</div>}
                  {(data.keywords.preferred?.matched ?? []).map((k,i)=> {
                    const prov = data.keywords.preferred?.provenance?.[k.toLowerCase()];
                    const desc = prov?.length ? `Matched via ${prov.join(', ')}` : undefined;
                    return (
                      <TooltipProvider key={`rpm-${i}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary">{k}</Badge>
                          </TooltipTrigger>
                          {desc && <TooltipContent><div className="text-xs">{desc}</div></TooltipContent>}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
                <div className="text-xs mb-1">Missing ({data.keywords.preferred?.missing?.length ?? 0}/{((data.keywords.preferred?.matched?.length ?? 0) + (data.keywords.preferred?.missing?.length ?? 0))})</div>
                <div className="flex flex-wrap gap-2">
                  {(data.keywords.preferred?.missing?.length ?? 0) === 0 && <div className="text-sm text-muted-foreground">None</div>}
                  {(data.keywords.preferred?.missing ?? []).map((k,i)=> <Badge key={`rps-${i}`} variant="outline">{k}</Badge>)}
                </div>
              </CardContent>
            </Card>
          </div>

          {data.stop_conditions_triggered?.length ? (
            <Card className="break-inside-avoid">
              <CardHeader><CardTitle>Stop Conditions</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.stop_conditions_triggered.map((r,i)=> <Badge key={i} className="badge-reject">{r}</Badge>)}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="break-inside-avoid">
            <CardHeader><CardTitle>Gaps</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc pl-6">
                {data.gaps.length ? data.gaps.map((g,i)=> <li key={i}>{g}</li>) : <li>None</li>}
              </ul>
            </CardContent>
          </Card>

          {cover ? (
            <Card className="break-inside-avoid">
              <CardHeader><CardTitle>Cover Letter</CardTitle></CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm leading-6">{cover}</pre>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
