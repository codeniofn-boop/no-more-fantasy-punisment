import type { Metadata } from "next";

import { FantasyShieldApp } from "@/components/FantasyShieldApp";

export const metadata: Metadata = {
  title: "Dashboard — FantasyShield",
  description: "Automated, high-precision roster optimization so you never lose your fantasy league again.",
};

export default function DashboardPage() {
  return <FantasyShieldApp />;
}
