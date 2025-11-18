"use client";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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

const API = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL as string | undefined;
  return envUrl && envUrl.trim() ? envUrl : '/api';
})();

export default function FeedbackPage() {
  const [type, setType] = useState<"feature" | "bug" | "other">("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadPct, setUploadPct] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const addToast = ({ title, description, variant }: { title?: string; description?: string; variant?: 'default'|'destructive' }) => {
    ensureSwal().then((Swal: any) => {
      if (!Swal) return;
      Swal.fire({ title: title || '', text: description || '', icon: variant === 'destructive' ? 'error' : 'success', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    }).catch(()=>{});
  };

  const MAX_FILES = 8;
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const onDropAccepted = useCallback((accepted: File[]) => {
    setFiles(prev => [...prev, ...accepted].slice(0, MAX_FILES));
  }, []);
  const onDropRejected = useCallback((rejections: any[]) => {
    const msgs: string[] = [];
    rejections.forEach(r => {
      const name = r.file?.name || 'file';
      (r.errors || []).forEach((e: any) => {
        if (e.code === 'file-too-large') msgs.push(`${name} is too large (max 5MB)`);
        else if (e.code === 'file-invalid-type') msgs.push(`${name} is not an image`);
        else msgs.push(`${name}: ${e.message}`);
      });
    });
    setFileErrors(msgs.slice(0,5));
    setTimeout(()=> setFileErrors([]), 5000);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: true,
    maxSize: MAX_SIZE,
    onDropAccepted,
    onDropRejected,
  });

  function removeFile(idx: number){ setFiles(prev => prev.filter((_,i)=> i!==idx)); }

  const previews = useMemo(() => files.map(f => ({ f, url: URL.createObjectURL(f) })), [files]);
  // Revoke object URLs on unmount or when files change
  useEffect(() => {
    return () => { previews.forEach(p => URL.revokeObjectURL(p.url)); };
  }, [previews]);

  async function submit() {
    if (!title.trim() || !description.trim()) {
      addToast({ title: "Missing fields", description: "Please fill title and description", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const payload: any = { type, title, description, email: email.trim() || undefined, url: url.trim() || (typeof window !== 'undefined' ? window.location.href : undefined) };
      if (type === 'bug') payload.severity = severity;
      const fd = new FormData();
      fd.append('payload', JSON.stringify(payload));
      files.forEach(f => fd.append('files', f));
      setUploading(true); setUploadPct(0);
      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API}/feedback`);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploadPct(Math.round(ev.loaded / ev.total * 100));
          }
        };
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            try {
              const json = JSON.parse(xhr.responseText || '{}');
              if (xhr.status >= 200 && xhr.status < 300) resolve(json);
              else reject(new Error(json?.error || `Submit failed (${xhr.status})`));
            } catch { reject(new Error('Submit failed')); }
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(fd);
      });
      if (!data?.ok) throw new Error(data?.error || 'Submit failed');
      addToast({ title: 'Thanks!', description: 'Your feedback was submitted.' });
      setTitle(""); setDescription(""); setEmail(""); setUrl(""); setSeverity("medium"); setType("feature"); setFiles([]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addToast({ title: 'Submit failed', description: msg, variant: 'destructive' });
    } finally { setLoading(false); setUploading(false); setUploadPct(0); }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <select id="type" value={type} onChange={(e)=> setType(e.target.value as any)} className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm">
              <option value="feature">Feature request</option>
              <option value="bug">Bug / error</option>
              <option value="other">Other</option>
            </select>
          </div>

          {type === 'bug' && (
            <div className="grid gap-2">
              <Label htmlFor="severity">Severity</Label>
              <select id="severity" value={severity} onChange={(e)=> setSeverity(e.target.value)} className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e)=> setTitle(e.target.value)} placeholder="Short summary" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Details</Label>
            <Textarea id="description" rows={8} value={description} onChange={(e)=> setDescription(e.target.value)} placeholder="What happened or what would you like to see?" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" value={email} onChange={(e)=> setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">Page URL (optional)</Label>
              <Input id="url" type="url" value={url} onChange={(e)=> setUrl(e.target.value)} placeholder="https://…" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Screenshots (optional)</Label>
            <div {...getRootProps()} className={`rounded-md border border-dashed p-4 text-sm ${isDragActive ? 'bg-accent/30' : 'text-muted-foreground'}`}>
              <input {...getInputProps()} />
              <div className="flex items-center justify-between gap-3">
                <div>{isDragActive ? 'Drop images to upload…' : 'Drag & drop images here, or'}</div>
                <div>
                  <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e)=> { const list = Array.from(e.target.files || []); onDropAccepted(list); e.target.value=''; }} />
                  <Button type="button" variant="secondary" onClick={()=> inputRef.current?.click()}>Choose files</Button>
                </div>
              </div>
              {previews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {previews.map((p, idx)=> (
                    <div key={idx} className="relative group">
                      <img src={p.url} alt={p.f.name} className="h-20 w-full object-cover rounded" />
                      <button type="button" onClick={()=> removeFile(idx)} className="absolute top-1 right-1 text-xs bg-background/80 border rounded px-1 opacity-0 group-hover:opacity-100">×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2 text-xs">Up to 8 images • Max 5MB each.</div>
              {fileErrors.length > 0 && (
                <div className="mt-2 text-xs text-red-600">
                  {fileErrors.map((m,i)=> <div key={i}>• {m}</div>)}
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <Button onClick={submit} disabled={loading || uploading}>{(loading || uploading) ? 'Submitting…' : 'Submit feedback'}</Button>
              {(uploading || uploadPct>0) && (
                <div className="text-xs text-muted-foreground">Uploading {uploadPct}%</div>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Stored locally on the server (no external services).</div>
        </CardContent>
      </Card>
    </div>
  );
}
