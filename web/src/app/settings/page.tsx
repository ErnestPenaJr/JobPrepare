"use client";
import { useEffect } from "react";
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
import { useRouter } from "next/navigation";

export default function SettingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    ensureSwal().then((Swal: any)=> {
      if (!Swal) return;
      Swal.fire({ title: 'Settings moved', text: 'Settings are now in Advanced filters on Analyzer.', icon: 'info', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    }).catch(()=>{});
    router.replace("/");
  }, [router]);
  return null;
}
