export const dynamic = "force-dynamic";

import { getSyncJobs, getSyncStats } from "@/lib/db/queries";
import SyncDashboardClient from "./sync-client";

export default async function SyncPage() {
  const [jobs, stats] = await Promise.all([
    getSyncJobs(20),
    getSyncStats(),
  ]);

  return <SyncDashboardClient initialJobs={jobs} stats={stats} />;
}
