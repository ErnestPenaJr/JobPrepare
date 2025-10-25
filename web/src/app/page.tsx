"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FiLink, FiUpload, FiPlay, FiTrash2, FiCheckCircle, FiInfo, FiDownload, FiPrinter, FiCopy, FiRefreshCcw } from "react-icons/fi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// SweetAlert2: load from CDN at runtime to avoid bundler resolution
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
import { Switch } from "@/components/ui/switch";

type LocationMeta = { city?: string | null; state?: string | null; onsite?: boolean; days_on_site?: number | null };
type AnalyzeResponse = {
  scorecard: { iterations: number[]; final_score: number; iteration_labels?: string[]; stability?: { reeval_score: number; delta: number } };
  gaps: string[];
  keywords: { matched: string[]; missing: string[] };
  decision: "accept" | "reject";
  stop_conditions_triggered?: string[];
  meta?: { jd?: { title?: string | null; company?: string | null; location?: LocationMeta } };
  stop_details?: {
    stop_keywords_found?: string[];
    min_score?: { final?: number; threshold?: number };
    years?: { required?: number | null; threshold?: number };
    management?: { required?: number | null; threshold?: number };
    onsite?: { days?: number | null; threshold?: number; ca_or_ny?: boolean; no_remote?: boolean };
  };
};

// Labels describing each iteration pass (PRP §5.1 order)
const ITERATION_LABELS: string[] = [
  'Python/Django Focus',
  'Backend Depth',
  'Data/Modeling',
  'Cloud/BI',
  'Transferability',
  'Domain Fit',
  'Experience Tenure',
  'Keyword Match Strict',
  'Learning Agility',
  'Holistic',
];

type UploadResponse = { fileId?: string; name?: string; type?: string; size?: number; text?: string };

const SETTINGS_KEY = "jobs_settings_v1";
type Settings = {
  timezone?: string;
  minFinalScore?: number;
  stopKeywords?: string[];
  checks?: string[];
  yearsMinRequiredStop?: number;
  managementRequiredStop?: number;
  onsiteDaysStop?: number;
  autoReanalyze?: boolean;
};
function loadSettings(): Settings {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") as Settings; } catch { return {}; }
}

const API = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL as string | undefined;
  // If an external API base is provided, use it; otherwise use same-origin /api
  return envUrl !== undefined ? envUrl : '/api';
})();

export default function Home() {
  const [jdUrl, setJdUrl] = useState("");
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [clText, setClText] = useState("");
  const [tab, setTab] = useState<string>('jd');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  // last analyzed timestamp displayed on Report; keep localStorage write only here
  const [cover, setCover] = useState("");
  // On-the-fly stop condition sliders
  const [minScore, setMinScore] = useState<number>(8.0);
  const [yearsStop, setYearsStop] = useState<number>(8);
  const [mgmtStop, setMgmtStop] = useState<number>(5);
  const [onsiteStop, setOnsiteStop] = useState<number>(5);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoReanalyze, setAutoReanalyze] = useState<boolean>(true);
  const [autoPending, setAutoPending] = useState<boolean>(false);
  const [thresholdsSaved, setThresholdsSaved] = useState<boolean>(false);
  // Initialize with a stable SSR-safe default; hydrate from localStorage after mount
  const [quickStart, setQuickStart] = useState<boolean>(true);
  useEffect(() => {
    try {
      const v = localStorage.getItem('quick_start');
      if (v != null) setQuickStart(v === '1');
    } catch {}
  }, []);
  const CHECK_IDS = useMemo(()=> (["jdKeywords","minScore","yrs8","mgmt5","architectNoIC","legacy","locationNoRemote","devopsOnly","qaOnly","pmOnly"] as const), []);
  type CheckID = typeof CHECK_IDS[number];
  const [checksMap, setChecksMap] = useState<Record<CheckID, boolean>>({
    jdKeywords: true, minScore: true, yrs8: true, mgmt5: true, architectNoIC: true, legacy: true, locationNoRemote: true, devopsOnly: true, qaOnly: true, pmOnly: true,
  });
  const [stopKeywords, setStopKeywords] = useState<string[]>(["manufacturing","plant","factory","warehouse","warehousing","industrial","supply chain operations","logistics"]);
  const [jdFile, setJdFile] = useState<{ id?: string; name?: string } | null>(null);
  const [resumeFile, setResumeFile] = useState<{ id?: string; name?: string } | null>(null);
  const [clFile, setClFile] = useState<{ id?: string; name?: string } | null>(null);

  // Matching jobs (Indeed RSS)
  type JobItem = { title: string; link: string; description?: string; pubDate?: string; company?: string; location?: string };
  const [jobs, setJobs] = useState<JobItem[] | null>(null);
  const [jobsLoading, setJobsLoading] = useState<boolean>(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const lastResumeKey = useRef<string | null>(null);
  const [jobsLocation, setJobsLocation] = useState<string>("");
  const [jobsRemoteOnly, setJobsRemoteOnly] = useState<boolean>(false);
  const fetchMatchingJobs = useCallback(async () => {
    const resume = (resumeText || '').trim();
    if (!resume) return;
    const key = resume.slice(0, 1000);
    if (lastResumeKey.current === key) return;
    lastResumeKey.current = key;
    setJobsLoading(true); setJobsError(null);
    try{
      const r = await fetch(`${API}/jobs/match`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resume: { text: resume }, location: jobsLocation || undefined, remoteOnly: jobsRemoteOnly, limit: 20 }) });
      const data = await r.json();
      if (!r.ok || data?.error) throw new Error(data?.error || 'Failed to load jobs');
      setJobs(data.items || []);
    } catch(e){
      const msg = e instanceof Error ? e.message : String(e);
      setJobsError(msg);
    } finally { setJobsLoading(false); }
  }, [resumeText, jobsLocation, jobsRemoteOnly]);

  const jdPickerRef = useRef<HTMLInputElement>(null);
  const resumePickerRef = useRef<HTMLInputElement>(null);
  const [resumeRawFile, setResumeRawFile] = useState<File | null>(null);
  const [jdRawFile, setJdRawFile] = useState<File | null>(null);
  const [clRawFile, setClRawFile] = useState<File | null>(null);
  const [ocrLang, setOcrLang] = useState<string>('eng');
  const [ocrMaxPages, setOcrMaxPages] = useState<number>(5);
  const [ocrSettingsOpen, setOcrSettingsOpen] = useState<boolean>(false);
  const ocrCancelRef = useRef<{ cancel: boolean } | null>(null);
  const [ocrAllPct, setOcrAllPct] = useState<number>(0);
  const [ocrAllRunning, setOcrAllRunning] = useState<boolean>(false);
  const clPickerRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const addToast = useCallback(({ title, description, variant }: { title?: string; description?: string; variant?: 'default'|'destructive' }) => {
    ensureSwal()
      .then((Swal: any) => {
        if (!Swal) return;
        Swal.fire({
          title: title || '',
          text: description || '',
          icon: variant === 'destructive' ? 'error' : 'success',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
      })
      .catch(() => {});
  }, []);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const analyze = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const st = loadSettings();
      const body = {
        jd: { text: jdText, fileId: jdFile?.id },
        resume: { text: resumeText, fileId: resumeFile?.id },
        coverLetter: clText || clFile ? { text: clText, fileId: clFile?.id } : undefined,
        settings: {
          timezone: st.timezone || "America/Chicago",
          today,
          minFinalScore: minScore,
          stopKeywords: stopKeywords,
          checks: CHECK_IDS.filter(id => checksMap[id]),
          // thresholds from current state
          yearsMinRequiredStop: yearsStop,
          managementRequiredStop: mgmtStop,
          onsiteDaysStop: onsiteStop,
        },
      };
      const r = await fetch(`${API}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok || (data && data.error)) {
        throw new Error((data && data.error) || `Analyze failed (${r.status})`);
      }
      setResult(data as AnalyzeResponse);
      const at = Date.now();
      try { localStorage.setItem('jobs_result_v1', JSON.stringify({ at, data })); } catch {}
      addToast({ title: "Analysis complete", description: `Decision: ${data.decision}` });
      setTimeout(() => {
        if (resultsRef.current) resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addToast({ title: "Analyze failed", description: msg, variant: "destructive" });
      setResult(null);
    } finally { setLoading(false); setAutoPending(false); }
  }, [jdText, jdFile, resumeText, resumeFile, clText, clFile, today, addToast, minScore, yearsStop, mgmtStop, onsiteStop, stopKeywords, checksMap, CHECK_IDS]);

  useEffect(() => {
    const handler = () => { analyze(); };
    window.addEventListener('global-analyze', handler as EventListener);
    return () => window.removeEventListener('global-analyze', handler as EventListener);
  }, [analyze]);

  // Load persisted inputs on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('jobs_inputs_v1');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.jdText) setJdText(s.jdText);
        if (s.resumeText) setResumeText(s.resumeText);
        if (s.clText) setClText(s.clText);
        if (s.tab) setTab(s.tab);
        if (s.jdUrl) setJdUrl(s.jdUrl);
        if (s.jdFile) setJdFile(s.jdFile);
        if (s.resumeFile) setResumeFile(s.resumeFile);
        if (s.clFile) setClFile(s.clFile);
      }
    } catch {}
    try {
      const rawR = localStorage.getItem('jobs_result_v1');
      if (rawR) {
        const s = JSON.parse(rawR);
        if (s?.data) setResult(s.data);
      }
    } catch {}
    try {
      const st = loadSettings();
      if (typeof st.minFinalScore === 'number') setMinScore(st.minFinalScore);
      if (typeof st.yearsMinRequiredStop === 'number') setYearsStop(st.yearsMinRequiredStop);
      if (typeof st.managementRequiredStop === 'number') setMgmtStop(st.managementRequiredStop);
      if (typeof st.onsiteDaysStop === 'number') setOnsiteStop(st.onsiteDaysStop);
      if (Array.isArray((st as Settings & { stopKeywords?: string[] }).stopKeywords)) setStopKeywords(((st as Settings & { stopKeywords?: string[] }).stopKeywords as string[]).filter(Boolean));
      if (Array.isArray((st as Settings & { checks?: string[] }).checks)) {
        const set: Record<CheckID, boolean> = { jdKeywords:true,minScore:true,yrs8:true,mgmt5:true,architectNoIC:true,legacy:true,locationNoRemote:true,devopsOnly:true,qaOnly:true,pmOnly:true };
        (CHECK_IDS as ReadonlyArray<CheckID>).forEach(id=> set[id] = (((st as Settings & { checks?: string[] }).checks) || []).includes(id));
        setChecksMap(set);
      }
    } catch {}
    // load autoReanalyze preference
    try {
      const st = loadSettings();
      if (typeof st.autoReanalyze === 'boolean') setAutoReanalyze(st.autoReanalyze);
    } catch {}
  }, [CHECK_IDS]);

  // Save quick start preference
  useEffect(() => {
    try { localStorage.setItem('quick_start', quickStart ? '1' : '0'); } catch {}
  }, [quickStart]);

  // Guided tour on first visit (toasts)
  useEffect(() => {
    try {
      if (!localStorage.getItem('tour_done_v1')) {
        addToast({ title: 'Step 1: Add inputs', description: 'Upload or paste JD and Resume.' });
        setTimeout(()=> addToast({ title: 'Step 2: (Optional) Filters', description: 'Open Advanced filters to adjust stop conditions.' }), 1200);
        setTimeout(()=> addToast({ title: 'Step 3: Results', description: 'Click Analyze to view score and gaps.' }), 2400);
        localStorage.setItem('tour_done_v1', '1');
      }
    } catch {}
  }, []);

  // Persist inputs when changed
  useEffect(() => {
    const payload = { jdText, resumeText, clText, tab, jdUrl, jdFile, resumeFile, clFile };
    try { localStorage.setItem('jobs_inputs_v1', JSON.stringify(payload)); } catch {}
  }, [jdText, resumeText, clText, tab, jdUrl, jdFile, resumeFile, clFile]);


  // Persist slider settings to settings store so backend receives them
  useEffect(() => {
    const st = loadSettings();
    const out = Object.assign({}, st, {
      minFinalScore: minScore,
      yearsMinRequiredStop: yearsStop,
      managementRequiredStop: mgmtStop,
      onsiteDaysStop: onsiteStop,
      autoReanalyze,
      stopKeywords,
      checks: CHECK_IDS.filter(id => checksMap[id]),
    });
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(out)); } catch {}
    setThresholdsSaved(true);
    const t = setTimeout(()=> setThresholdsSaved(false), 1200);
    return () => clearTimeout(t);
  }, [minScore, yearsStop, mgmtStop, onsiteStop, autoReanalyze, stopKeywords, checksMap, CHECK_IDS]);

  // Auto-reanalyze (debounced) when stop sliders change
  useEffect(() => {
    if (!autoReanalyze) return;
    if (autoTimer.current) clearTimeout(autoTimer.current as unknown as number);
    setAutoPending(true);
    autoTimer.current = setTimeout(() => {
      analyze();
    }, 500);
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current as unknown as number); };
  }, [minScore, yearsStop, mgmtStop, onsiteStop, analyze, autoReanalyze]);

  // Toast on auto re-analyze toggle
  useEffect(() => {
    addToast({ title: 'Auto re-analyze', description: autoReanalyze ? 'Enabled' : 'Disabled' });
  }, [autoReanalyze]);

  

  const TIER = (process.env.NEXT_PUBLIC_TIER as string) || 'free';
  const canGenCover = useMemo(() => {
    if (!result) return false;
    // PRP: Offer cover letter generation only if final score ≥ 7.0
    const meetsScore = (result.scorecard?.final_score ?? 0) >= 7.0;
    const hasTier = TIER !== 'free';
    return meetsScore && hasTier;
  }, [result]);

  async function fetchUrl() {
    if (!jdUrl) return;
    try {
      const r = await fetch(`${API}/fetch-url`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: jdUrl }), });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setJdText(data.text || "");
      addToast({ title: "JD fetched", description: "Loaded content from URL" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addToast({ title: "Fetch failed", description: msg, variant: "destructive" });
    }
  }

  

  async function generateCover() {
    try {
      const st = loadSettings();
      const body = { jd: { text: jdText, fileId: jdFile?.id }, resume: { text: resumeText, fileId: resumeFile?.id }, existingCoverLetter: { text: clText, fileId: clFile?.id }, settings: { today, timezone: st.timezone || "America/Chicago" } };
      const r = await fetch(`${API}/cover-letter`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok || (data && data.error)) {
        throw new Error((data && data.error) || `Cover letter failed (${r.status})`);
      }
      const text = data.revisedCoverLetter || "";
      setCover(text);
      try { localStorage.setItem('jobs_cover_v1', JSON.stringify({ at: Date.now(), text })); } catch {}
      addToast({ title: 'Cover letter generated', description: 'Tailored letter created.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addToast({ title: "Cover letter failed", description: msg, variant: "destructive" });
    }
  }

  // Auto-generate cover letter once when threshold is met (decision === 'accept') for current inputs
  const lastCoverKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!result || result.decision !== 'accept') return;
    const key = `${(jdText||'').slice(0,500)}|${(resumeText||'').slice(0,500)}|${(clText||'').slice(0,500)}`;
    if (lastCoverKeyRef.current === key) return;
    lastCoverKeyRef.current = key;
    generateCover();
  }, [result?.decision]);

  function copyCover(){
    try {
      navigator.clipboard.writeText(cover || '');
      addToast({ title: 'Copied', description: 'Cover letter copied to clipboard.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addToast({ title: 'Copy failed', description: msg || 'Unable to copy', variant: 'destructive' });
    }
  }

  async function uploadFile(file: File): Promise<UploadResponse> {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`${API}/upload`, { method: "POST", body: fd });
    if (!r.ok) throw new Error("Upload failed");
    return (await r.json()) as UploadResponse;
  }

  async function ocrFile(kind: "jd" | "resume" | "cl", file: File){
    try{
      addToast({ title: 'OCR', description: 'Attempting to extract text…' });
      // Helper to load scripts from CDN when packages are unavailable
      const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
        const el = document.createElement('script'); el.src = src; el.async = true; el.crossOrigin = 'anonymous';
        el.onload = () => resolve(); el.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(el);
      });

      // Ensure Tesseract is available (prefer global via CDN to avoid bundler resolution)
      // Try multiple CDNs/versions with a short timeout
      async function ensureTesseract(): Promise<any> {
        const w: any = window as any;
        if (w.Tesseract?.recognize) return w.Tesseract;
        const candidates = [
          'https://cdn.jsdelivr.net/npm/tesseract.js@2.1.5/dist/tesseract.min.js',
          'https://unpkg.com/tesseract.js@2.1.5/dist/tesseract.min.js',
          'https://cdn.jsdelivr.net/npm/tesseract.js@4.0.2/dist/tesseract.min.js',
          'https://unpkg.com/tesseract.js@4.0.2/dist/tesseract.min.js',
        ];
        for (const src of candidates) {
          try { await loadScript(src); } catch { /* try next */ }
          if (w.Tesseract?.recognize) return w.Tesseract;
        }
        throw new Error('Tesseract not available');
      }
      const TesseractAny = await ensureTesseract();
      const recognize = TesseractAny.recognize.bind(TesseractAny);

      // Load pdfjs if file is a PDF (prefer module, fallback to CDN global)
      let pdfjs: any = null;
      const isPdf = (file.type && file.type.includes('pdf')) || file.name.toLowerCase().endsWith('.pdf');
      if (isPdf){
        // Load via CDN to avoid bundler resolution errors
        const pdfCandidates = [
          'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
          'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js',
        ];
        for (const src of pdfCandidates){
          try { await loadScript(src); } catch { /* try next */ }
          pdfjs = (window as any).pdfjsLib || (window as any).pdfjsDistBuildPdf;
          if (pdfjs) break;
        }
        if (pdfjs && pdfjs.GlobalWorkerOptions) {
          try { pdfjs.GlobalWorkerOptions.workerSrc = null; } catch {}
        }
      }

      let text = '';
      if (pdfjs && pdfjs.getDocument) {
        const ab = await file.arrayBuffer();
        // @ts-ignore disableWorker flag acceptable
        const pdf = await (pdfjs as any).getDocument({ data: new Uint8Array(ab), disableWorker: true }).promise;
        const pages = Math.min(pdf.numPages || 0, 5);
        // First try native text extraction
        for (let i=1; i<=pages; i++){
          const page = await pdf.getPage(i);
          const tc = await page.getTextContent().catch(()=> null as any);
          if (tc && Array.isArray((tc as any).items)){
            const pageText = ((tc as any).items || []).map((it: any)=> it.str || '').join(' ');
            text += pageText + '\n';
          }
        }
        text = text.replace(/\s+/g,' ').trim();
        // If still empty, fall back to OCR of rendered pages
        if (!text){
          for (let i=1; i<=pages; i++){
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d'); if (!ctx) continue;
            canvas.width = Math.floor(viewport.width); canvas.height = Math.floor(viewport.height);
            // @ts-ignore
            await page.render({ canvasContext: ctx, viewport }).promise;
            const dataUrl = canvas.toDataURL('image/png');
            const res = await recognize(dataUrl, 'eng', { logger: (m: any) => { /* console.log('ocr', m); */ } });
            text += (res?.data?.text || '') + '\n';
          }
        }
      } else {
        const dataUrl = URL.createObjectURL(file);
        const res = await recognize(dataUrl, 'eng', { logger: (m: any) => { /* console.log('ocr', m); */ } });
        text = res?.data?.text || '';
        URL.revokeObjectURL(dataUrl);
      }
      text = text.replace(/\s+/g,' ').trim();
      if (kind === 'jd') setJdText(prev => text || prev);
      if (kind === 'resume') setResumeText(prev => text || prev);
      if (kind === 'cl') setClText(prev => text || prev);
      addToast({ title: 'OCR complete', description: text ? 'Extracted text added.' : 'No text detected.' });
    } catch (e){
      console.error('OCR failed', e);
      // Be less noisy if we already have some text entered
      const hasAnyText = kind === 'resume' ? (resumeText||'').trim().length>0 : kind==='jd' ? (jdText||'').trim().length>0 : (clText||'').trim().length>0;
      if (hasAnyText) {
        addToast({ title: 'OCR unavailable', description: 'Kept original text. Try the "OCR all pages" button if needed.' });
      } else {
        addToast({ title: 'OCR failed', description: 'Unable to extract text from this file. Please try another format or paste text manually.', variant: 'destructive' });
      }
    }
}

  async function onPick(kind: "jd" | "resume" | "cl", e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const res = await uploadFile(f);
      if (kind === "jd") { setJdFile(res.fileId ? { id: res.fileId, name: res.name } : { name: res.name }); setJdText(res.text || jdText); setJdRawFile(f); }
      if (kind === "resume") { setResumeFile(res.fileId ? { id: res.fileId, name: res.name } : { name: res.name }); setResumeText(res.text || resumeText); setResumeRawFile(f); }
      if (kind === "cl") { setClFile(res.fileId ? { id: res.fileId, name: res.name } : { name: res.name }); setClText(res.text || clText); setClRawFile(f); }
      addToast({ title: "File uploaded", description: res.name || 'file' });
      // Only prompt OCR automatically for PDFs with zero selectable text
      if (((!res.text || !res.text.trim())) && (/pdf/i.test(f.type) || /\.pdf$/i.test(f.name))) {
        const SwalAny = await ensureSwal();
        const ret = await SwalAny.fire({ title: 'OCR?', text: 'No selectable text found. Try OCR?', icon: 'question', showCancelButton: true, confirmButtonText: 'Run OCR' });
        if (ret.isConfirmed) await ocrFile(kind, f);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast({ title: "Upload failed", description: msg || "Upload failed", variant: "destructive" });
    }
    // reset input so same file can be chosen again
    e.target.value = "";
  }

  async function ocrAllPages(kind: "jd" | "resume" | "cl"){
    try{
      const file = kind === 'resume' ? resumeRawFile : (kind === 'jd' ? jdRawFile : clRawFile);
      if (!file) throw new Error('No file to OCR');
      const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
        const el = document.createElement('script'); el.src = src; el.async = true;
        el.onload = () => resolve(); el.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(el);
      });
      async function ensureTesseract(): Promise<any> {
        const w: any = window as any;
        if (w.Tesseract?.recognize) return w.Tesseract;
        const candidates = [
          'https://cdn.jsdelivr.net/npm/tesseract.js@2.1.5/dist/tesseract.min.js',
          'https://unpkg.com/tesseract.js@2.1.5/dist/tesseract.min.js',
          'https://cdn.jsdelivr.net/npm/tesseract.js@4.0.2/dist/tesseract.min.js',
          'https://unpkg.com/tesseract.js@4.0.2/dist/tesseract.min.js',
        ];
        for (const src of candidates) { try { await loadScript(src); } catch {} if ((w as any).Tesseract?.recognize) break; }
        return (window as any).Tesseract;
      }
      async function ensurePdfJs(): Promise<any> {
        let lib: any = (window as any).pdfjsLib || (window as any).pdfjsDistBuildPdf;
        if (lib) return lib;
        const pdfCandidates = [
          'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
          'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js',
        ];
        for (const src of pdfCandidates){ try { await loadScript(src); } catch {} lib = (window as any).pdfjsLib || (window as any).pdfjsDistBuildPdf; if (lib) break; }
        return lib;
      }
      const isPdf = (file.type && file.type.includes('pdf')) || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) throw new Error('All-pages OCR is only available for PDF');
      const pdfjs = await ensurePdfJs();
      const T = await ensureTesseract();
      const recognize = T.recognize.bind(T);
      const ab = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(ab), disableWorker: true }).promise;
      const total = pdf.numPages || 1;
      setOcrAllRunning(true); setOcrAllPct(0);
      ocrCancelRef.current = { cancel: false };
      let text = '';
      const maxPages = Math.min(total, Math.max(1, ocrMaxPages));
      for (let i=1; i<= maxPages; i++){
        if (ocrCancelRef.current?.cancel) break;
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d'); if (!ctx) continue;
        canvas.width = Math.floor(viewport.width); canvas.height = Math.floor(viewport.height);
        // @ts-ignore
        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/png');
        const res = await recognize(dataUrl, ocrLang || 'eng');
        text += (res?.data?.text || '') + '\n';
        setOcrAllPct(Math.round(i / maxPages * 100));
      }
      // If user canceled, exit quietly without toasts
      if (ocrCancelRef.current?.cancel) return;
      text = text.replace(/\s+/g,' ').trim();
      if (kind === 'resume') setResumeText(prev => text || prev);
      if (kind === 'jd') setJdText(prev => text || prev);
      if (kind === 'cl') setClText(prev => text || prev);
      addToast({ title: 'OCR complete', description: text ? `Extracted ${text.length} chars` : 'No text detected.' });
    } catch (e){
      const hasAnyText = kind === 'resume' ? (resumeText||'').trim().length>0 : kind==='jd' ? (jdText||'').trim().length>0 : (clText||'').trim().length>0;
      if (!hasAnyText) {
        const msg = e instanceof Error ? e.message : String(e);
        addToast({ title: 'OCR failed', description: msg || 'Unable to OCR this PDF. Try another format or paste text.', variant: 'destructive' });
      }
    } finally { setOcrAllRunning(false); setOcrAllPct(0); }
  }

  async function onDrop(kind: "jd" | "resume" | "cl", ev: React.DragEvent<HTMLDivElement>) {
    ev.preventDefault();
    const f = ev.dataTransfer.files?.[0];
    if (!f) return;
    try {
      const res = await uploadFile(f);
      if (kind === "jd") { setJdFile(res.fileId ? { id: res.fileId, name: res.name } : { name: res.name }); setJdText(res.text || jdText); }
      if (kind === "resume") { setResumeFile(res.fileId ? { id: res.fileId, name: res.name } : { name: res.name }); setResumeText(res.text || resumeText); setResumeRawFile(f); }
      if (kind === "cl") { setClFile(res.fileId ? { id: res.fileId, name: res.name } : { name: res.name }); setClText(res.text || clText); }
      addToast({ title: "File dropped", description: res.name || 'file' });
      if (((!res.text || !res.text.trim())) && (/pdf/i.test(f.type) || /\.pdf$/i.test(f.name))) {
        const SwalAny = await ensureSwal();
        const ret = await SwalAny.fire({ title: 'OCR?', text: 'No selectable text found. Try OCR?', icon: 'question', showCancelButton: true, confirmButtonText: 'Run OCR' });
        if (ret.isConfirmed) await ocrFile(kind, f);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast({ title: "Upload failed", description: msg || "Upload failed", variant: "destructive" });
    }
  }

  function DropArea({ kind, children }: { kind: "jd" | "resume" | "cl"; children: React.ReactNode }) {
    return (
      <div onDragOver={(e)=> e.preventDefault()} onDrop={(e)=> onDrop(kind, e)} className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
        {children}
      </div>
    );
  }

  const jdHasText = (jdText || "").trim().length > 0;
  const resumeHasText = (resumeText || "").trim().length > 0;
  const clHasText = (clText || "").trim().length > 0;

  // Notify shell whether any inputs have data
  useEffect(() => {
    const hasAny = !!(jdFile || resumeFile || clFile || jdHasText || resumeHasText || clHasText);
    window.dispatchEvent(new CustomEvent('inputs-has-data', { detail: hasAny }));
  }, [jdFile, resumeFile, clFile, jdHasText, resumeHasText, clHasText]);

  // Auto-fetch matching jobs after resume text is available/changed (debounced)
  useEffect(() => {
    if (!resumeHasText) return;
    const t = setTimeout(() => fetchMatchingJobs(), 800);
    return () => clearTimeout(t);
  }, [resumeHasText, resumeText, fetchMatchingJobs]);

  function exportMarkdown(){
    try {
      if (!result) throw new Error('Run Analyze first.');
      const lines: string[] = [];
      lines.push('# Analysis Report');
      lines.push('');
      lines.push(`Final Score: ${result.scorecard.final_score.toFixed(1)}`);
      if (result.scorecard.stability) lines.push(`Re-eval: ${result.scorecard.stability.reeval_score.toFixed(2)} (Δ ${result.scorecard.stability.delta.toFixed(2)})`);
      lines.push('');
      lines.push(`Thresholds: min ${minScore.toFixed(1)} • years ${yearsStop} • mgmt ${mgmtStop} • onsite ${onsiteStop}`);
      lines.push('');
      lines.push('## Iteration Scores');
      result.scorecard.iterations.forEach((v,i)=> {
        const label = (result.scorecard as any).iteration_labels?.[i] || `Iteration ${i+1}`;
        lines.push(`- ${label}: ${v.toFixed(2)}`)
      });
      lines.push('');
      lines.push('## Matched Keywords');
      if (result.keywords.matched.length) result.keywords.matched.forEach(k=> lines.push(`- ${k}`)); else lines.push('-');
      lines.push('');
      lines.push('## Missing Keywords');
      if (result.keywords.missing.length) result.keywords.missing.forEach(k=> lines.push(`- ${k}`)); else lines.push('-');
      lines.push('');
      lines.push('## Gaps');
      if (result.gaps.length) result.gaps.forEach(g=> lines.push(`- ${g}`)); else lines.push('-');
      const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `analysis-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(a.href);
      addToast({ title: 'Exported Markdown', description: 'Saved analysis report.' });
    } catch(e){ const msg = e instanceof Error ? e.message : String(e); addToast({ title: 'Export failed', description: msg || 'Unable to export', variant: 'destructive' }); }
  }

  function printReport(){
    try { window.print(); addToast({ title: 'Print', description: 'Opening print dialog…' }); }
    catch(e){ const msg = e instanceof Error ? e.message : String(e); addToast({ title: 'Print failed', description: msg || 'Unable to print', variant: 'destructive' }); }
  }


  function copyAnalysis(){
    try {
      if (!result) throw new Error('Run Analyze first.');
      const lines: string[] = [];
      lines.push('# Analysis Summary');
      lines.push(`Decision: ${result.decision.toUpperCase()}`);
      lines.push(`Final Score: ${result.scorecard.final_score.toFixed(1)}`);
      if (result.scorecard.stability) lines.push(`Re-eval: ${result.scorecard.stability.reeval_score.toFixed(2)} (Δ ${result.scorecard.stability.delta.toFixed(2)})`);
      lines.push('');
      lines.push('Matched:');
      if (result.keywords.matched.length) result.keywords.matched.forEach(k=> lines.push(`- ${k}`)); else lines.push('-');
      lines.push('');
      lines.push('Missing:');
      if (result.keywords.missing.length) result.keywords.missing.forEach(k=> lines.push(`- ${k}`)); else lines.push('-');
      lines.push('');
      lines.push('Gaps:');
      if (result.gaps.length) result.gaps.forEach(g=> lines.push(`- ${g}`)); else lines.push('-');
      navigator.clipboard.writeText(lines.join('\n'));
      addToast({ title: 'Copied', description: 'Analysis copied to clipboard.' });
    } catch (e) { const msg = e instanceof Error ? e.message : String(e); addToast({ title: 'Copy failed', description: msg || 'Unable to copy', variant: 'destructive' }); }
  }

  return (
    <div className="space-y-4">
      {/* Compact helper banner */}
      <div className="rounded-md border p-3 bg-card text-sm flex items-center gap-3">
        <FiInfo />
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>1) Upload or paste Job Description</span>
          <span>2) Upload or paste Resume</span>
          <span>3) Click Analyze</span>
        </div>
      </div>

      {/* Step indicator & quick start toggle */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className={`inline-flex items-center gap-2 ${result ? 'text-muted-foreground' : 'text-foreground'}`}>
          <span className={`h-5 w-5 rounded-full border inline-flex items-center justify-center ${result ? 'bg-muted' : 'bg-primary text-primary-foreground border-primary'}`}>1</span>
          <span>Inputs</span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className={`inline-flex items-center gap-2 ${result ? 'text-foreground' : 'text-muted-foreground'}`}>
          <span className={`h-5 w-5 rounded-full border inline-flex items-center justify-center ${result ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted'}`}>2</span>
          <span>Results</span>
        </div>
        <div className="ml-auto inline-flex items-center gap-2">
          <span>Quick Start</span>
          <Switch checked={quickStart} onCheckedChange={(v)=> setQuickStart(!!v)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Decision</CardTitle></CardHeader>
          <CardContent>
            {result ? (
              <div className="inline-flex items-center gap-2">
                <Badge className={result.decision === 'accept' ? 'badge-accept' : 'badge-reject'}>
                  {String(result.decision || '').toUpperCase()}
                </Badge>
                {autoPending && <FiRefreshCcw className="animate-spin text-muted-foreground" />}
              </div>
            ) : <div className="text-sm text-muted-foreground">—</div>}
            {autoReanalyze && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-muted-foreground mt-2 cursor-help">Changes apply automatically</div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs max-w-xs">Updates run about 500ms after you stop moving the sliders. You can turn auto re‑analyze off in the Stop Conditions card.</div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Final Score</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-semibold tabular-nums">{(result?.scorecard?.final_score != null) ? result.scorecard.final_score.toFixed(1) : '—'}</div>
              {autoPending && <FiRefreshCcw className="animate-spin text-muted-foreground" />}
            </div>
            <div className="mt-2"><Progress value={(result?.scorecard?.final_score != null) ? Math.max(0, Math.min(100, ((result.scorecard.final_score - 1) / 9) * 100)) : 0} /></div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-muted-foreground">Thresholds: min {minScore.toFixed(1)} • years {yearsStop} • mgmt {mgmtStop} • onsite {onsiteStop}</div>
              {!autoReanalyze && <Button size="sm" variant="outline" onClick={()=> { addToast({ title: 'Applying changes', description: 'Re-running analysis' }); analyze(); }} className="inline-flex items-center gap-2"><FiPlay /> Apply now</Button>}
            </div>
          </CardContent>
        </Card>
        {/* Stability and timestamps are available in details below to reduce visual noise */}
      </div>

      {/* Collapse advanced controls by default to declutter; hide entirely in Quick Start */}
      {!quickStart && (
      <details className="rounded-md border" open={false}>
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium flex items-center justify-between">
          <span>Advanced filters (Stop Conditions)</span>
          <span className="text-xs text-muted-foreground">min {minScore.toFixed(1)} • years {yearsStop} • mgmt {mgmtStop} • onsite {onsiteStop}</span>
        </summary>
        <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-full flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Auto re‑analyze when sliders change</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Off</span>
              <Switch checked={autoReanalyze} onCheckedChange={(v)=> setAutoReanalyze(!!v)} />
              <span className="text-xs text-muted-foreground">On</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Minimum passing score: {minScore.toFixed(1)}</div>
            <input type="range" min={1} max={10} step={0.1} value={minScore} onChange={(e)=> setMinScore(parseFloat((e.target as HTMLInputElement).value))} className="w-full" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Required years threshold: {yearsStop}</div>
            <input type="range" min={0} max={15} step={1} value={yearsStop} onChange={(e)=> setYearsStop(parseInt((e.target as HTMLInputElement).value))} className="w-full" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Mgmt direct reports threshold: {mgmtStop}</div>
            <input type="range" min={0} max={15} step={1} value={mgmtStop} onChange={(e)=> setMgmtStop(parseInt((e.target as HTMLInputElement).value))} className="w-full" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Onsite days/week threshold: {onsiteStop}</div>
            <input type="range" min={0} max={5} step={1} value={onsiteStop} onChange={(e)=> setOnsiteStop(parseInt((e.target as HTMLInputElement).value))} className="w-full" />
          </div>
          <div className="col-span-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setMinScore(8.0); setYearsStop(8); setMgmtStop(5); setOnsiteStop(5); addToast({ title: 'Thresholds reset', description: 'Stop conditions restored to defaults.' }); }}>Reset thresholds</Button>
            </div>
            <div className="flex items-center gap-3">
              {thresholdsSaved && <span className="text-xs text-muted-foreground">Saved</span>}
              {autoPending && <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><FiRefreshCcw className="animate-spin" /> Re‑running analysis…</div>}
            </div>
          </div>
          {/* Manage keywords */}
          <div className="col-span-full">
            <details>
              <summary className="cursor-pointer text-sm">Manage disqualifying keywords</summary>
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {stopKeywords.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                  {stopKeywords.map((k, i)=> (
                    <Badge key={`kw-${i}`} variant="outline" className="inline-flex items-center gap-2">
                      {k}
                      <button className="text-xs" onClick={(e)=> { e.preventDefault(); setStopKeywords(stopKeywords.filter(x=> x!==k)); }}>×</button>
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input placeholder="Add keyword" onKeyDown={(e)=> { if (e.key==='Enter') { e.preventDefault(); const v=(e.target as HTMLInputElement).value.trim(); if (v && !stopKeywords.includes(v)) { setStopKeywords([...stopKeywords, v]); (e.target as HTMLInputElement).value=''; } } }} />
                  <Button variant="outline" onClick={()=> { const input = document.querySelector<HTMLInputElement>('input[placeholder="Add keyword"]'); if (input){ const v=input.value.trim(); if (v && !stopKeywords.includes(v)) { setStopKeywords([...stopKeywords, v]); input.value=''; }}}}>Add</Button>
                </div>
              </div>
            </details>
          </div>
          {/* Enabled checks */}
          <div className="col-span-full">
            <details>
              <summary className="cursor-pointer text-sm">Enabled checks</summary>
              <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                {CHECK_IDS.map((id)=> (
                  <label key={id} className="inline-flex items-center gap-2">
                    <Switch checked={!!checksMap[id]} onCheckedChange={(v)=> setChecksMap(prev=> ({...prev, [id]: !!v}))} />
                    <span>{id}</span>
                  </label>
                ))}
              </div>
            </details>
          </div>
          {/* Settings export/import/reset */}
          <div className="col-span-full">
            <details>
              <summary className="cursor-pointer text-sm">Export / Import settings</summary>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <Button variant="outline" onClick={()=> {
                  const st = localStorage.getItem(SETTINGS_KEY) || '{}';
                  const blob = new Blob([st], { type: 'application/json' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = 'settings.json';
                  a.click();
                  URL.revokeObjectURL(a.href);
                  addToast({ title: 'Exported', description: 'Settings saved as settings.json' });
                }}>Export</Button>
                <input type="file" accept="application/json" onChange={async (e)=> {
                  const f = e.target.files?.[0]; if (!f) return;
                  const text = await f.text();
                  try {
                    const json = JSON.parse(text);
                    localStorage.setItem(SETTINGS_KEY, JSON.stringify(json));
                    // reflect imported values
                    if (typeof json.minFinalScore === 'number') setMinScore(json.minFinalScore);
                    if (typeof json.yearsMinRequiredStop === 'number') setYearsStop(json.yearsMinRequiredStop);
                    if (typeof json.managementRequiredStop === 'number') setMgmtStop(json.managementRequiredStop);
                    if (typeof json.onsiteDaysStop === 'number') setOnsiteStop(json.onsiteDaysStop);
                    if (Array.isArray(json.stopKeywords)) setStopKeywords(json.stopKeywords);
                    if (Array.isArray(json.checks)) {
                      const map: Record<CheckID, boolean> = { jdKeywords:true,minScore:true,yrs8:true,mgmt5:true,architectNoIC:true,legacy:true,locationNoRemote:true,devopsOnly:true,qaOnly:true,pmOnly:true };
                      CHECK_IDS.forEach(id=> map[id] = json.checks.includes(id));
                      setChecksMap(map);
                    }
                    addToast({ title: 'Imported', description: 'Settings applied' });
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    addToast({ title: 'Import failed', description: msg, variant: 'destructive' });
                  }
                }} />
                <Button variant="outline" onClick={()=> {
                  const defaults = {
                    minFinalScore: 8.0,
                    yearsMinRequiredStop: 8,
                    managementRequiredStop: 5,
                    onsiteDaysStop: 5,
                    autoReanalyze: true,
                    stopKeywords: ["manufacturing","plant","factory","warehouse","warehousing","industrial","supply chain operations","logistics"],
                    checks: CHECK_IDS,
                  };
                  localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
                  setMinScore(8.0); setYearsStop(8); setMgmtStop(5); setOnsiteStop(5); setAutoReanalyze(true); setStopKeywords(defaults.stopKeywords);
                  const map: Record<CheckID, boolean> = { jdKeywords:true,minScore:true,yrs8:true,mgmt5:true,architectNoIC:true,legacy:true,locationNoRemote:true,devopsOnly:true,qaOnly:true,pmOnly:true };
                  setChecksMap(map);
                  addToast({ title: 'Reset', description: 'All settings restored to defaults' });
                }}>Reset all</Button>
              </div>
            </details>
          </div>
        </div>
      </details>
      )}
      {quickStart && (
        <div className="rounded-md border px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
          <div>Advanced filters are hidden in Quick Start mode.</div>
          <Button size="sm" variant="outline" onClick={()=> setQuickStart(false)}>Show Advanced</Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Inputs</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jdUrl">Job Description URL</Label>
              <div className="flex gap-2">
                <Input id="jdUrl" value={jdUrl} onChange={(e)=> setJdUrl(e.target.value)} placeholder="https://..." />
                <Button onClick={fetchUrl} variant="secondary" className="inline-flex items-center gap-2"><FiLink /> Fetch</Button>
              </div>
            </div>
            <Tabs value={tab} onValueChange={(v)=> setTab(v)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="jd">
                  <span className="inline-flex items-center gap-2">
                    JD
                    {jdFile ? (
                      <FiUpload className="text-primary" title="File uploaded" />
                    ) : jdHasText ? (
                      <FiCheckCircle className="text-green-600" title="Text loaded" />
                    ) : null}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="resume">
                  <span className="inline-flex items-center gap-2">
                    Resume
                    {resumeFile ? (
                      <FiUpload className="text-primary" title="File uploaded" />
                    ) : resumeHasText ? (
                      <FiCheckCircle className="text-green-600" title="Text loaded" />
                    ) : null}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="cl" disabled={!(result && result.decision === 'accept')}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`inline-flex items-center gap-2 ${!((result?.scorecard?.final_score ?? 0) >= 7.0) ? 'opacity-60' : ''}`}>
                          Cover
                          {clFile ? (
                            <FiUpload className="text-primary" title="File uploaded" />
                          ) : clHasText ? (
                            <FiCheckCircle className="text-green-600" title="Text loaded" />
                          ) : null}
                        </span>
                      </TooltipTrigger>
                      {(!((result?.scorecard?.final_score ?? 0) >= 7.0)) && (
                        <TooltipContent>
                          <div className="text-xs max-w-xs">Cover letter is available once your final score is at least 7.0. Run Analyze first and consider addressing key gaps.</div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="jd" className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Job Description</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setJdText("");
                      setJdFile(null);
                      setJdUrl("");
                      addToast({ title: 'Cleared', description: 'Job Description cleared' });
                    }}
                    className="inline-flex items-center gap-2"
                  >
                    <FiTrash2 /> Clear
                  </Button>
                </div>
                <DropArea kind="jd">
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2"><FiUpload /> Drop PDF/DOCX/TXT here or</div>
                    <div className="flex items-center gap-2">
                      <input ref={jdPickerRef} onChange={(e)=> onPick("jd", e)} className="hidden" type="file" accept=".pdf,.docx,.txt,.md" />
                      <Button size="sm" variant="outline" onClick={()=> jdPickerRef.current?.click()} className="inline-flex items-center gap-2"><FiUpload /> Upload</Button>
                      {jdFile && <Badge variant="secondary" title={jdFile.name}>{jdFile.name || 'JD file'}</Badge>}
                      {jdFile && <Button size="sm" variant="ghost" onClick={()=> setJdFile(null)} className="inline-flex items-center gap-2"><FiTrash2 /> Clear</Button>}
                    </div>
                  </div>
                </DropArea>
                <Textarea className="h-64 overflow-auto resize-y" value={jdText} onChange={(e)=> setJdText(e.target.value)} placeholder="Paste JD text here..." />
                <div className="text-xs flex items-center gap-2 flex-wrap">
                  {jdFile ? <Badge variant="secondary">File: {jdFile.name || 'uploaded'}</Badge> : jdHasText ? <Badge variant="outline">Text input</Badge> : <span className="text-muted-foreground">No data</span>}
                  {(jdRawFile && ((jdRawFile.type && jdRawFile.type.includes('pdf')) || jdRawFile.name.toLowerCase().endsWith('.pdf'))) && (
                    <>
                      <Button size="sm" variant="outline" onClick={()=> ocrAllPages('jd')} disabled={ocrAllRunning} className="ml-auto">{ocrAllRunning ? `OCR… ${ocrAllPct}%` : 'OCR all pages'}</Button>
                      {ocrAllRunning && <Button size="sm" variant="ghost" onClick={()=> { if (ocrCancelRef.current) ocrCancelRef.current.cancel = true; }}>Cancel</Button>}
                    </>
                  )}
                </div>
                </TabsContent>
              <TabsContent value="resume" className="space-y-2">
                <Label>Resume</Label>
                <DropArea kind="resume">
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2"><FiUpload /> Drop PDF/DOCX/TXT here or</div>
                    <div className="flex items-center gap-2">
                      <input ref={resumePickerRef} onChange={(e)=> onPick("resume", e)} className="hidden" type="file" accept=".pdf,.doc,.docx,.txt,.md" />
                      <Button size="sm" variant="outline" onClick={()=> resumePickerRef.current?.click()} className="inline-flex items-center gap-2"><FiUpload /> Upload</Button>
                      {resumeFile && <Badge variant="secondary" title={resumeFile.name}>{resumeFile.name || 'Resume file'}</Badge>}
                      {resumeFile && <Button size="sm" variant="ghost" onClick={()=> setResumeFile(null)} className="inline-flex items-center gap-2"><FiTrash2 /> Clear</Button>}
                    </div>
                  </div>
                </DropArea>
                <Textarea className="h-64 overflow-auto resize-y" value={resumeText} onChange={(e)=> setResumeText(e.target.value)} placeholder="Paste resume text here..." />
                <div className="text-xs flex items-center gap-2 flex-wrap">
                  {resumeFile ? <Badge variant="secondary">File: {resumeFile.name || 'uploaded'}</Badge> : resumeHasText ? <Badge variant="outline">Text input</Badge> : <span className="text-muted-foreground">No data</span>}
                  <span className="text-muted-foreground">Having trouble with .doc? Save as PDF or DOCX for best results.</span>
                  {(resumeRawFile && ((resumeRawFile.type && resumeRawFile.type.includes('pdf')) || resumeRawFile.name.toLowerCase().endsWith('.pdf'))) && (
                    <>
                      <Button size="sm" variant="outline" onClick={()=> ocrAllPages('resume')} disabled={ocrAllRunning} className="ml-auto">{ocrAllRunning ? `OCR… ${ocrAllPct}%` : 'OCR all pages'}</Button>
                      {ocrAllRunning && <Button size="sm" variant="ghost" onClick={()=> { if (ocrCancelRef.current) ocrCancelRef.current.cancel = true; }}>Cancel</Button>}
                    </>
                  )}
                </div>
                {(
                  (resumeRawFile && resumeRawFile.name.toLowerCase().endsWith('.pdf')) ||
                  (jdRawFile && jdRawFile.name.toLowerCase().endsWith('.pdf')) ||
                  (clRawFile && clRawFile.name.toLowerCase().endsWith('.pdf'))
                ) && (
                  <div className="mt-2 border rounded-md p-2">
                    <button className="text-xs underline" onClick={()=> setOcrSettingsOpen(v=> !v)}>{ocrSettingsOpen ? 'Hide OCR settings' : 'Show OCR settings'}</button>
                    {ocrSettingsOpen && (
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <label className="inline-flex items-center gap-1">Lang<input className="border rounded px-1 py-0.5 w-20" value={ocrLang} onChange={(e)=> setOcrLang(e.target.value)} placeholder="eng" /></label>
                        <label className="inline-flex items-center gap-1">Max pages<input className="border rounded px-1 py-0.5 w-16" type="number" min={1} max={50} value={ocrMaxPages} onChange={(e)=> setOcrMaxPages(parseInt(e.target.value||'5')||5)} /></label>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="cl" className="space-y-2">
                <Label>Cover Letter (optional)</Label>
                <DropArea kind="cl">
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2"><FiUpload /> Drop PDF/DOCX/TXT here or</div>
                    <div className="flex items-center gap-2">
                      <input ref={clPickerRef} onChange={(e)=> onPick("cl", e)} className="hidden" type="file" accept=".pdf,.docx,.txt,.md" />
                      <Button size="sm" variant="outline" onClick={()=> clPickerRef.current?.click()} className="inline-flex items-center gap-2"><FiUpload /> Upload</Button>
                      {clFile && <Badge variant="secondary" title={clFile.name}>{clFile.name || 'Cover letter file'}</Badge>}
                      {clFile && <Button size="sm" variant="ghost" onClick={()=> setClFile(null)} className="inline-flex items-center gap-2"><FiTrash2 /> Clear</Button>}
                    </div>
                  </div>
                </DropArea>
                <Textarea className="h-64 overflow-auto resize-y" value={clText} onChange={(e)=> setClText(e.target.value)} placeholder="Paste cover letter text..." />
                <div className="text-xs flex items-center gap-2 flex-wrap">
                  {clFile ? <Badge variant="secondary">File: {clFile.name || 'uploaded'}</Badge> : clHasText ? <Badge variant="outline">Text input</Badge> : <span className="text-muted-foreground">No data</span>}
                  {(clRawFile && ((clRawFile.type && clRawFile.type.includes('pdf')) || clRawFile.name.toLowerCase().endsWith('.pdf'))) && (
                    <>
                      <Button size="sm" variant="outline" onClick={()=> ocrAllPages('cl')} disabled={ocrAllRunning} className="ml-auto">{ocrAllRunning ? `OCR… ${ocrAllPct}%` : 'OCR all pages'}</Button>
                      {ocrAllRunning && <Button size="sm" variant="ghost" onClick={()=> { if (ocrCancelRef.current) ocrCancelRef.current.cancel = true; }}>Cancel</Button>}
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <div className="sticky bottom-0 border-t pt-2 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-2 px-2">
              <div className="flex items-center gap-2">
                <Button onClick={analyze} disabled={loading} className="inline-flex items-center gap-2">{loading ? <FiPlay className="animate-pulse" /> : <FiPlay />} {loading ? "Analyzing…" : "Analyze"}</Button>
                <Button variant="outline" onClick={()=> { setJdText(""); setResumeText(""); setClText(""); setResult(null); setCover(""); setJdFile(null); setResumeFile(null); setClFile(null); }} className="inline-flex items-center gap-2"><FiTrash2 /> Clear</Button>
                <Button variant="outline" onClick={copyAnalysis} disabled={!result} className="inline-flex items-center gap-2"><FiCopy /> Copy Analysis</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card ref={resultsRef} className="md:col-span-1 lg:col-span-2">
          <CardHeader><CardTitle>Analysis Results</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!result && <div className="text-sm text-muted-foreground">Run Analyze to see results.</div>}
            {result && (
              <div className="space-y-3">
                <div className={`rounded-md border p-2 text-sm ${result.decision === 'accept' ? 'border-green-600/50 bg-green-500/10' : 'border-red-600/50 bg-red-500/10'}`}>
                  Decision: <span className="font-medium">{result.decision}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm">Final Score:</div>
                  <div className="text-xl font-semibold tabular-nums">{(result?.scorecard?.final_score != null) ? result.scorecard.final_score.toFixed(1) : '—'}</div>
                </div>
                {result?.scorecard?.stability && (
                  <div className="text-xs text-muted-foreground">Re-eval {result.scorecard.stability.reeval_score.toFixed(2)} (Δ {result.scorecard.stability.delta.toFixed(2)})</div>
                )}
                <div>
                  <div className="text-sm font-medium">Iteration Scores</div>
                  <ul className="pl-4 text-sm grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-y-1">
                    {(result?.scorecard?.iterations || []).map((v,i)=> {
                      const label = (result?.scorecard as any)?.iteration_labels?.[i] || `Iteration ${i+1}`;
                      return (
                        <li key={i} className="list-disc ml-4">
                          <span className="font-medium">{i+1}.</span> {label} — {v.toFixed(2)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="space-y-3">
                  {/* Must-have */}
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">Must‑Have Keywords</div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs cursor-default" aria-label="About must-have keywords"><FiInfo /></span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs max-w-xs">
                              From JD “must_have”. A keyword is counted as matched if found in your resume/cover text or extracted skills. Matching is case‑insensitive and includes simple synonyms (e.g., SQL Server ≈ MS‑SQL).
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">Required keywords from the JD compared to your resume/cover letter.</div>
                    <div className="text-xs mb-1">
                      Matched ({((result?.keywords?.must?.matched?.length ?? result?.keywords?.matched?.length) ?? 0)}/
                      {(((result?.keywords?.must?.matched?.length ?? 0) + (result?.keywords?.must?.missing?.length ?? result?.keywords?.missing?.length ?? 0)) ?? 0)})
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(((result?.keywords?.must?.matched ?? result?.keywords?.matched) ?? []).length === 0) && <div className="text-sm text-muted-foreground">None</div>}
                      {(((result?.keywords?.must?.matched ?? result?.keywords?.matched) ?? []) as string[]).map((k, i)=> {
                        const prov = result?.keywords?.must?.provenance?.[k.toLowerCase()];
                        const desc = prov?.length ? `Matched via ${prov.join(', ')}` : undefined;
                        return (
                          <TooltipProvider key={`mm-${i}`}>
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
                    <div className="text-xs mb-1">Missing ({((result?.keywords?.must?.missing?.length ?? result?.keywords?.missing?.length) ?? 0)}/
                      {(((result?.keywords?.must?.matched?.length ?? 0) + (result?.keywords?.must?.missing?.length ?? result?.keywords?.missing?.length ?? 0)) ?? 0)})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(((result?.keywords?.must?.missing ?? result?.keywords?.missing) ?? []).length === 0) && <div className="text-sm text-muted-foreground">None</div>}
                      {(((result?.keywords?.must?.missing ?? result?.keywords?.missing) ?? []) as string[]).map((k, i)=> <Badge key={`ms-${i}`} className="badge-reject">{k}</Badge>)}
                    </div>
                  </div>
                  {/* Preferred */}
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">Preferred Keywords</div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs cursor-default" aria-label="About preferred keywords"><FiInfo /></span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs max-w-xs">
                              From JD “nice_to_have”. These improve overall fit but are not required. Matching uses the same rules as must‑have keywords.
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">Nice‑to‑have keywords from the JD.</div>
                    <div className="text-xs mb-1">Matched ({(result?.keywords?.preferred?.matched?.length ?? 0)}/{(((result?.keywords?.preferred?.matched?.length ?? 0) + (result?.keywords?.preferred?.missing?.length ?? 0)) ?? 0)})</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(result?.keywords?.preferred?.matched?.length ?? 0) === 0 && <div className="text-sm text-muted-foreground">None</div>}
                      {(((result?.keywords?.preferred?.matched) ?? []) as string[]).map((k, i)=> {
                        const prov = result?.keywords?.preferred?.provenance?.[k.toLowerCase()];
                        const desc = prov?.length ? `Matched via ${prov.join(', ')}` : undefined;
                        return (
                          <TooltipProvider key={`pm-${i}`}>
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
                    <div className="text-xs mb-1">Missing ({(result?.keywords?.preferred?.missing?.length ?? 0)}/{(((result?.keywords?.preferred?.matched?.length ?? 0) + (result?.keywords?.preferred?.missing?.length ?? 0)) ?? 0)})</div>
                    <div className="flex flex-wrap gap-2">
                      {(result?.keywords?.preferred?.missing?.length ?? 0) === 0 && <div className="text-sm text-muted-foreground">None</div>}
                      {(((result?.keywords?.preferred?.missing) ?? []) as string[]).map((k, i)=> <Badge key={`ps-${i}`} variant="outline">{k}</Badge>)}
                    </div>
                  </div>
                </div>
                {result.stop_conditions_triggered?.length ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Stop Conditions</div>
                    <div className="flex flex-wrap gap-2">
                      {result.stop_conditions_triggered.map((r,i)=> <Badge key={i} className="badge-reject">{r}</Badge>)}
                    </div>
                    {result.stop_details && (
                      <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                        {result.stop_details.min_score && (
                          <li>Score {(typeof result.stop_details.min_score.final === 'number') ? result.stop_details.min_score.final.toFixed(2) : result.stop_details.min_score.final} &lt; min {result.stop_details.min_score.threshold}</li>
                        )}
                        {result.stop_details.years && result.stop_details.years.required != null && (
                          <li>Required years {result.stop_details.years.required} ≥ threshold {result.stop_details.years.threshold}</li>
                        )}
                        {result.stop_details.management && result.stop_details.management.required != null && (
                          <li>Direct reports {result.stop_details.management.required} ≥ threshold {result.stop_details.management.threshold}</li>
                        )}
                        {result.stop_details.onsite && (
                          <li>Onsite days {result.stop_details.onsite.days ?? 'n/a'} ≥ threshold {result.stop_details.onsite.threshold}{result.stop_details.onsite.ca_or_ny ? ' • CA/NY' : ''}{result.stop_details.onsite.no_remote ? ' • no remote' : ''}</li>
                        )}
                        {result.stop_details.stop_keywords_found && result.stop_details.stop_keywords_found.length ? (
                          <li>JD disqualifying keywords: {result.stop_details.stop_keywords_found.join(', ')}</li>
                        ) : null}
                      </ul>
                    )}
                  </div>
                ) : null}
              <div>
                <div className="text-sm font-medium">Gaps</div>
                <ul className="list-disc pl-4 text-sm grid grid-cols-1 md:grid-cols-2 gap-1">
                  {(result?.gaps ?? []).map((g,i)=> <li key={i}>{g}</li>)}
                </ul>
              </div>
              {/* Placeholder for custom analysis sections (per design screenshots) */}
            </div>
          )}
        </CardContent>
      </Card>

        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={generateCover} disabled={!canGenCover}>Generate Cover Letter</Button>
            {((result?.scorecard?.final_score ?? 0) >= 7.0 && ((process.env.NEXT_PUBLIC_TIER as string)||'free')==='free') && (
              <div className="text-xs text-muted-foreground">Requires Starter tier or higher.</div>
            )}
            <Textarea rows={14} value={cover} readOnly placeholder="Generated cover letter will appear here" />
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportMarkdown} disabled={!result} className="inline-flex items-center gap-2"><FiDownload /> Export Markdown</Button>
              <Button variant="outline" onClick={printReport} className="inline-flex items-center gap-2"><FiPrinter /> Print</Button>
              <Button variant="outline" onClick={copyCover} disabled={!cover} className="inline-flex items-center gap-2"><FiCopy /> Copy Cover</Button>
            </div>
            <div>
              <Button
                onClick={() => { if (jdUrl) window.open(jdUrl, '_blank'); else addToast({ title: 'Missing URL', description: 'Enter a Job Description URL first', variant: 'destructive' }); }}
                disabled={!result || result.decision !== 'accept'}
                className="w-full"
              >
                Apply on Site
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Matching Jobs</CardTitle></CardHeader>
          <CardContent>
            {!resumeHasText && <div className="text-sm text-muted-foreground">Upload or paste your resume to fetch matching jobs.</div>}
            {resumeHasText && jobsLoading && <div className="text-sm text-muted-foreground">Finding jobs…</div>}
            {resumeHasText && jobsError && <div className="text-sm text-red-600">{jobsError}</div>}
            {resumeHasText && !jobsLoading && !jobsError && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Input placeholder="Preferred location (optional)" value={jobsLocation} onChange={(e)=> setJobsLocation(e.target.value)} />
                  <div className="inline-flex items-center gap-2"><span>Remote only</span><Switch checked={jobsRemoteOnly} onCheckedChange={(v)=> setJobsRemoteOnly(!!v)} /></div>
                  <Button variant="outline" size="sm" onClick={()=> { lastResumeKey.current = null; fetchMatchingJobs(); }}>Apply</Button>
                </div>
                <div className="space-y-2 max-h-72 overflow-auto">
                  {(jobs || []).slice(0, 10).map((it, i) => (
                    <div key={i} className="text-sm">
                      <a href={it.link} target="_blank" rel="noreferrer" className="font-medium underline">
                        {it.title}
                      </a>
                      <div className="text-xs text-muted-foreground">
                        {[it.company, it.location].filter(Boolean).join(' • ')}{it.pubDate ? ` • ${new Date(it.pubDate).toLocaleDateString()}` : ''}
                      </div>
                    </div>
                  ))}
                  {(!jobs || jobs.length === 0) && <div className="text-sm text-muted-foreground">No results yet. Try adding skills to your resume text.</div>}
                  <div>
                    <Button variant="outline" size="sm" onClick={fetchMatchingJobs}>Refresh</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
