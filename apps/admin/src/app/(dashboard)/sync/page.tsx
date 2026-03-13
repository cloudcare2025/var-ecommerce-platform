export const dynamic = "force-dynamic";

import { getSyncJobs, getSyncStats } from "@/lib/db/queries";
import SyncDashboardClient from "./sync-client";

export default async function SyncPage() {
  const [jobs, stats] = await Promise.all([
    getSyncJobs(20),
    getSyncStats(),
  ]);

  // Serialize Date objects to ISO strings for client component
  const serializedJobs = jobs.map((job) => ({
    ...job,
    startedAt: job.startedAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  }));
  const serializedStats = {
    ...stats,
    lastSyncAt: stats.lastSyncAt?.toISOString() ?? null,
  };

  return <SyncDashboardClient initialJobs={serializedJobs} stats={serializedStats} />;
}
