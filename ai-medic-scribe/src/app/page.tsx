"use client";

import { Dashboard } from "@/components/dashboard/Dashboard";

export default function HomePage() {
  console.log("✅ SUCCESS: Loading REAL Dashboard from /ai-medic-scribe/src/app/page.tsx");
  console.log("✅ Timestamp: ", new Date().toISOString());

  return <Dashboard />;
}