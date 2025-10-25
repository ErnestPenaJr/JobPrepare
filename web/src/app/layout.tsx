import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/app-shell";
import { ToastProvider } from "@/components/toast-provider";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "JobPrep — Job Application Analyzer",
  description: "Analyze your resume against any job description, get gaps, and tailor cover letters without fabrication.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} antialiased`}>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
