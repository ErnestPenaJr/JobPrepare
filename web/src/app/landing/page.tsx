"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FiZap, FiShield, FiCheckCircle, FiArrowRight, FiStar } from "react-icons/fi";
import { PricingGrid } from "@/components/pricing-cards";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-12">
      {/* Hero */}
      <section className="text-center space-y-6 py-6">
        <Badge className="inline-flex items-center gap-1" variant="secondary">
          <FiZap /> JobPrep
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">
          Know your fit before you apply
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Paste a job description and your resume. Get a clear score, gaps, and a tailored cover letter in minutes.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">
              Try the Analyzer <FiArrowRight className="ml-1" />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="#pricing">View Pricing</Link>
          </Button>
        </div>
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-2">
          <span className="inline-flex items-center gap-1"><FiCheckCircle /> No fabrication</span>
          <span className="inline-flex items-center gap-1"><FiShield /> Your files stay private</span>
        </div>
      </section>

      {/* How it works */}
      <section className="grid gap-4 sm:grid-cols-3">
        {["Upload", "Analyze", "Apply"].map((step, i) => (
          <Card key={step}>
            <CardHeader>
              <CardTitle className="text-base">{i + 1}. {step}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {i === 0 && "Add your JD link or paste text, plus your resume."}
              {i === 1 && "We score across multiple lenses and surface keyword gaps."}
              {i === 2 && "Generate a cover letter and export your report."}
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Value props */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base inline-flex items-center gap-2"><FiCheckCircle /> Focus your efforts</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Target roles where you’re a strong fit and skip the rest.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base inline-flex items-center gap-2"><FiStar /> Stand out</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Tailored cover letters aligned to the job — without fabricating skills.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base inline-flex items-center gap-2"><FiShield /> Private by default</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">We never sell data. You control your files and history.</CardContent>
        </Card>
      </section>

      {/* Pricing */}
      <section id="pricing" className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Simple, flexible pricing</h2>
          <p className="text-sm text-muted-foreground">Start free. Upgrade when your search gets serious.</p>
        </div>
        <PricingGrid />
        <p className="text-xs text-muted-foreground text-center">Annual plans available. Student discounts and trials per promotions.</p>
      </section>
    </div>
  );
}
