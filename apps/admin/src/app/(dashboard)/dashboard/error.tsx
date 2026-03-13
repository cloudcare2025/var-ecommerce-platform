"use client";

import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
        <AlertTriangle size={24} className="text-red-500" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-admin-text">
          Something went wrong
        </h2>
        <p className="text-sm text-admin-text-muted mt-1 max-w-md">
          The dashboard failed to load. This is usually a temporary issue with
          the database connection.
        </p>
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium text-white bg-admin-accent rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
