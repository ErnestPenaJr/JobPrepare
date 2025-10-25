"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

type Attachment = { key: string; name: string; type: string; size: number; dataUrl?: string };
type Feedback = { id: string; type: string; title: string; description: string; email?: string|null; url?: string|null; severity?: string|null; created_at?: string; attachments?: Attachment[] };

export default function AdminFeedback(){
  const [key, setKey] = useState<string>("");
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Feedback | null>(null);
  const addToast = ({ title, description, variant }: { title?: string; description?: string; variant?: 'default'|'destructive' }) => {
    ensureSwal().then((Swal: any) => {
      if (!Swal) return;
      Swal.fire({ title: title || '', text: description || '', icon: variant === 'destructive' ? 'error' : 'success', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    }).catch(()=>{});
  };

  useEffect(()=>{
    try { const k = localStorage.getItem('admin_key'); if (k) setKey(k); } catch {}
  },[]);

  async function load(){
    if (!key) { addToast({ title: 'Missing admin key', description: 'Enter FEEDBACK_ADMIN_KEY' }); return; }
    setLoading(true);
    try{
      const r = await fetch('/api/feedback/list', { headers: { 'x-admin-key': key } });
      const data = await r.json();
      if (!r.ok || data?.error) throw new Error(data?.error || 'Failed');
      setItems(data.items || []);
      try{ localStorage.setItem('admin_key', key); }catch{}
    }catch(e:any){ addToast({ title: 'Load failed', description: e?.message || String(e), variant: 'destructive' }); }
    finally{ setLoading(false); }
  }

  function exportJSON(){
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `feedback-${new Date().toISOString()}.json`; a.click(); URL.revokeObjectURL(url);
  }

  function openGallery(item: Feedback){ setActive(item); setOpen(true); }

  async function del(id: string){
    if (!key){ addToast({ title: 'Missing admin key', description: 'Enter FEEDBACK_ADMIN_KEY' }); return; }
    const SwalAny = await ensureSwal();
    const ret = await SwalAny.fire({ title: 'Delete?', text: 'Delete this feedback entry?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete' });
    if (!ret.isConfirmed) return;
    try{
      const r = await fetch(`/api/feedback/${id}`, { method: 'DELETE', headers: { 'x-admin-key': key } });
      if (!r.ok) throw new Error('Delete failed');
      setItems((prev)=> prev.filter((it)=> it.id !== id));
      addToast({ title: 'Deleted', description: id });
    }catch(e:any){ addToast({ title: 'Delete failed', description: e?.message || String(e), variant: 'destructive' }); }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Feedback Admin</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
            <div className="grid gap-2">
              <Label htmlFor="key">FEEDBACK_ADMIN_KEY</Label>
              <Input id="key" value={key} onChange={(e)=> setKey(e.target.value)} placeholder="Enter admin key" />
            </div>
            <Button onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Load'}</Button>
            <Button onClick={exportJSON} disabled={!items.length}>Export JSON</Button>
          </div>
          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-2">Created</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Severity</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">URL</th>
                  <th className="text-left p-2">Shots</th>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it)=> (
                  <tr key={it.id} className="border-t">
                    <td className="p-2 whitespace-nowrap">{it.created_at || ''}</td>
                    <td className="p-2 whitespace-nowrap">{it.type}</td>
                    <td className="p-2">{it.title}</td>
                    <td className="p-2 whitespace-nowrap">{it.severity || ''}</td>
                    <td className="p-2 whitespace-nowrap">{it.email || ''}</td>
                    <td className="p-2 max-w-64 truncate" title={it.url || ''}>{it.url || ''}</td>
                    <td className="p-2">
                      <button className="text-xs underline" onClick={()=> openGallery(it)} disabled={!(it.attachments||[]).length}>
                        {(it.attachments||[]).length ? `${(it.attachments||[]).length} screenshots` : '—'}
                      </button>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{it.id}</td>
                    <td className="p-2 whitespace-nowrap">
                      <Button variant="outline" size="sm" onClick={()=> del(it.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr><td className="p-3 text-muted-foreground" colSpan={7}>No items</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Screenshots</SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-3 overflow-auto">
                {!active?.attachments?.length && <div className="text-sm text-muted-foreground">No attachments</div>}
                {active?.attachments?.map((a, i) => (
                  <div key={i} className="space-y-2">
                    {a.dataUrl ? (
                      <img src={a.dataUrl} alt={a.name} className="max-h-80 w-auto rounded border" />
                    ) : (
                      <div className="text-xs">{a.name}</div>
                    )}
                    <div className="text-xs flex items-center gap-3">
                      <a href={a.dataUrl || '#'} download={a.name} className="underline" onClick={(e)=> { if (!a.dataUrl) e.preventDefault(); }}>Download</a>
                      <span className="text-muted-foreground">{a.type} • {Math.round((a.size||0)/1024)} KB</span>
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>
    </div>
  );
}
