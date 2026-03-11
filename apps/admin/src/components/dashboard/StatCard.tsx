"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  prefix?: string;
}

export default function StatCard({ label, value, change, icon, prefix }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="bg-admin-card rounded-xl border border-admin-border p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-admin-text-muted mb-1">{label}</p>
          <p className="text-2xl font-semibold text-admin-text">
            {prefix}
            {value}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-admin-accent/10 flex items-center justify-center shrink-0">
          <span className="text-admin-accent">{icon}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {isPositive ? (
          <TrendingUp size={14} className="text-admin-success" />
        ) : (
          <TrendingDown size={14} className="text-admin-danger" />
        )}
        <span
          className={`text-xs font-medium ${
            isPositive ? "text-admin-success" : "text-admin-danger"
          }`}
        >
          {isPositive ? "+" : ""}
          {change}%
        </span>
        <span className="text-xs text-admin-text-muted">vs last month</span>
      </div>
    </div>
  );
}
