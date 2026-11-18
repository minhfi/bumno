import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminReports } from "@/components/admin/reports/AdminReports";

export const metadata: Metadata = {
  title: "Báo cáo — Bumno",
};

export default function AdminReportsPage() {
  return (
    <main>
      <Suspense>
        <AdminReports />
      </Suspense>
    </main>
  );
}
