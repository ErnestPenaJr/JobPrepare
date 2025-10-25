"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiHome, FiSun, FiMoon, FiFileText, FiMessageSquare } from "react-icons/fi";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(()=>{
    const root = document.documentElement;
    const hasStored = localStorage.getItem('theme_dark');
    const initial = hasStored ? (hasStored === '1') : true; // default to dark per style guide
    setDark(initial);
    root.classList.toggle('dark', initial);
  },[]);
  return (
    <button
      onClick={()=>{
        const next = !dark; setDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme_dark', next ? '1' : '0');
      }}
      className="text-xs px-2 py-1 rounded-md border hover:bg-accent inline-flex items-center gap-1.5"
      aria-label="Toggle theme"
    >{dark ? <FiMoon /> : <FiSun />} {dark ? 'Dark' : 'Light'}</button>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }){
  const [hasData, setHasData] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const ce = e as CustomEvent;
        setHasData(!!ce.detail);
      } catch {}
    };
    window.addEventListener('inputs-has-data', handler as EventListener);
    return () => window.removeEventListener('inputs-has-data', handler as EventListener);
  }, []);
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="text-lg font-semibold tracking-tight">JobPrep</div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/" className="inline-flex items-center gap-2">
                      <FiHome />
                      <span>Analyzer</span>
                      {hasData && <span className="ml-2 h-2 w-2 rounded-full bg-green-500" title="Inputs loaded" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/landing" className="inline-flex items-center gap-2">
                      <FiHome />
                      <span>Landing</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/pricing" className="inline-flex items-center gap-2">
                      <FiFileText />
                      <span>Pricing</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/report" className="inline-flex items-center gap-2">
                      <FiFileText />
                      <span>Report</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/feedback" className="inline-flex items-center gap-2">
                      <FiMessageSquare />
                      <span>Feedback</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/admin/feedback" className="inline-flex items-center gap-2">
                      <FiMessageSquare />
                      <span>Feedback Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>v0.1 • <Badge variant="secondary">Prototype</Badge></div>
            <ThemeToggle />
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <main className="p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
