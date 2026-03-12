"use client";

import { useState } from "react";
import {
  RefreshCw,
  Database,
  List,
  AlertTriangle,
  Clock,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  Layers,
} from "lucide-react";
import { triggerSyncAction } from "@/lib/db/actions";

interface SyncJob {
  id: string;
  jobType: string;
  distributor: string | null;
  status: string;
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsFailed: number;
  errorLog: unknown;
  startedAt: Date;
  completedAt: Date | null;
}

interface SyncStats {
  totalSyncProducts: number;
  totalListings: number;
  unresolvedBrandsCount: number;
  lastSyncAt: Date | null;
  vendorCount: number;
  inStockCount: number;
  multiDistributorCount: number;
}

interface Props {
  initialJobs: SyncJob[];
  stats: SyncStats;
}

function formatDuration(start: Date, end: Date | null): string {
  if (!end) return "Running...";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

function formatJobType(type: string): string {
  switch (type) {
    case "full_catalog": return "Full Catalog";
    case "incremental_pna": return "Incremental P&A";
    case "webhook_update": return "Webhook Update";
    default: return type;
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <CheckCircle2 size={12} /> Completed
        </span>
      );
    case "running":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Loader2 size={12} className="animate-spin" /> Running
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          <XCircle size={12} /> Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
          {status}
        </span>
      );
  }
}

export default function SyncDashboardClient({ initialJobs, stats }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTrigger(type: "full_catalog" | "incremental", tier?: "hot" | "standard" | "cold") {
    setLoading(tier ?? type);
    setError(null);

    const result = await triggerSyncAction(type, tier);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(null);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-admin-text">Supply Chain Sync</h1>
        <p className="text-sm text-admin-text-muted mt-1">
          Manage distributor catalog syncs, product discovery, and brand resolution
        </p>
      </div>

      {/* Stats cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-admin-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Database size={18} />
            </div>
            <span className="text-sm font-medium text-admin-text-muted">Sync Products</span>
          </div>
          <p className="text-2xl font-semibold text-admin-text">{stats.totalSyncProducts.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl border border-admin-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <List size={18} />
            </div>
            <span className="text-sm font-medium text-admin-text-muted">Distributor Listings</span>
          </div>
          <p className="text-2xl font-semibold text-admin-text">{stats.totalListings.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl border border-admin-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Truck size={18} />
            </div>
            <span className="text-sm font-medium text-admin-text-muted">Vendors</span>
          </div>
          <p className="text-2xl font-semibold text-admin-text">{stats.vendorCount.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl border border-admin-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
              <AlertTriangle size={18} />
            </div>
            <span className="text-sm font-medium text-admin-text-muted">Unresolved Brands</span>
          </div>
          <p className="text-2xl font-semibold text-admin-text">{stats.unresolvedBrandsCount}</p>
        </div>
      </div>

      {/* Stats cards - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-admin-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
              <Layers size={18} />
            </div>
            <span className="text-sm font-medium text-admin-text-muted">Multi-Distributor Products</span>
          </div>
          <p className="text-2xl font-semibold text-admin-text">{stats.multiDistributorCount.toLocaleString()}</p>
          <p className="text-xs text-admin-text-muted mt-1">Products with 2+ distributor listings</p>
        </div>

        <div className="bg-white rounded-xl border border-admin-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Package size={18} />
            </div>
            <span className="text-sm font-medium text-admin-text-muted">In Stock</span>
          </div>
          <p className="text-2xl font-semibold text-admin-text">{stats.inStockCount.toLocaleString()}</p>
          <p className="text-xs text-admin-text-muted mt-1">Products with available inventory</p>
        </div>

        <div className="bg-white rounded-xl border border-admin-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Clock size={18} />
            </div>
            <span className="text-sm font-medium text-admin-text-muted">Last Sync</span>
          </div>
          <p className="text-sm font-semibold text-admin-text">
            {stats.lastSyncAt ? new Date(stats.lastSyncAt).toLocaleString() : "Never"}
          </p>
        </div>
      </div>

      {/* Trigger buttons */}
      <div className="bg-white rounded-xl border border-admin-border p-5">
        <h2 className="text-lg font-semibold text-admin-text mb-4">Trigger Sync</h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleTrigger("full_catalog")}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent/90 disabled:opacity-50 transition-colors"
          >
            {loading === "full_catalog" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Full Catalog Sync
          </button>

          {(["hot", "standard", "cold"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => handleTrigger("incremental", tier)}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-admin-text text-sm font-medium border border-admin-border hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {loading === tier ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Incremental ({tier})
            </button>
          ))}
        </div>
      </div>

      {/* Recent sync jobs table */}
      <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
        <div className="px-5 py-4 border-b border-admin-border">
          <h2 className="text-lg font-semibold text-admin-text">Recent Sync Jobs</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-gray-50/50">
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Type</th>
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Distributor</th>
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Status</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Processed</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Created</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Updated</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Failed</th>
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Duration</th>
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Started</th>
              </tr>
            </thead>
            <tbody>
              {initialJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-admin-text-muted">
                    No sync jobs yet. Click a trigger button above to start.
                  </td>
                </tr>
              ) : (
                initialJobs.map((job) => (
                  <tr key={job.id} className="border-b border-admin-border last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-admin-text">{formatJobType(job.jobType)}</td>
                    <td className="px-5 py-3 text-admin-text-muted">{job.distributor ?? "All"}</td>
                    <td className="px-5 py-3"><StatusBadge status={job.status} /></td>
                    <td className="px-5 py-3 text-right tabular-nums">{job.itemsProcessed.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-green-600">{job.itemsCreated.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-blue-600">{job.itemsUpdated.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-red-600">{job.itemsFailed > 0 ? job.itemsFailed.toLocaleString() : "—"}</td>
                    <td className="px-5 py-3 text-admin-text-muted">{formatDuration(job.startedAt, job.completedAt)}</td>
                    <td className="px-5 py-3 text-admin-text-muted">{new Date(job.startedAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
