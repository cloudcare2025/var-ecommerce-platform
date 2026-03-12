"use client";

import { useState } from "react";
import {
  UserPlus,
  Search,
  MoreHorizontal,
  Mail,
  X,
} from "lucide-react";
import { inviteUserAction } from "@/lib/db/actions";

const ROLE_CONFIG: Record<string, { label: string; color: string; permissions: string }> = {
  super_admin: { label: "Super Admin", color: "bg-red-50 text-red-700 border-red-200", permissions: "Full system access across all brands" },
  admin: { label: "Admin", color: "bg-blue-50 text-blue-700 border-blue-200", permissions: "Full access within the platform" },
  manager: { label: "Manager", color: "bg-purple-50 text-purple-700 border-purple-200", permissions: "Manage products, orders, and content" },
  sales_rep: { label: "Sales Rep", color: "bg-indigo-50 text-indigo-700 border-indigo-200", permissions: "Process orders and manage customers" },
  warehouse: { label: "Warehouse", color: "bg-orange-50 text-orange-700 border-orange-200", permissions: "Manage inventory and fulfillment" },
  viewer: { label: "Viewer", color: "bg-gray-50 text-gray-600 border-gray-200", permissions: "Read-only access to data" },
};

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role] ?? { label: role, color: "bg-gray-50 text-gray-600 border-gray-200" };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}

interface UsersClientProps {
  initialUsers: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: string;
    status: string;
    lastLoginAt: string | null;
  }>;
  roleCounts: Record<string, number>;
}

export default function UsersClient({ initialUsers, roleCounts }: UsersClientProps) {
  const [search, setSearch] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");

  const filtered = initialUsers.filter((user) => {
    if (!search) return true;
    return (
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const result = await inviteUserAction(inviteEmail, inviteRole);
    if (result.success) {
      setInviteModalOpen(false);
      setInviteEmail("");
    } else {
      alert(result.error || "Failed to send invite");
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-admin-text">Users</h1>
          <p className="text-sm text-admin-text-muted mt-1">
            Manage team members and their permissions
          </p>
        </div>
        <button
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center gap-2 h-10 px-4 bg-admin-accent hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <UserPlus size={16} />
          Invite User
        </button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["super_admin", "admin", "manager", "viewer"] as string[]).map((role) => {
          const count = roleCounts[role] || 0;
          const config = ROLE_CONFIG[role];
          return (
            <div key={role} className="bg-admin-card rounded-xl border border-admin-border p-4">
              <div className="text-sm text-admin-text-muted">{config?.label ?? role}s</div>
              <div className="text-2xl font-semibold text-admin-text mt-1">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="bg-admin-card rounded-xl border border-admin-border p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text placeholder:text-slate-400 focus:outline-none focus:border-admin-accent transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-admin-card rounded-xl border border-admin-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border bg-slate-50/50">
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">User</th>
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">Role</th>
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">Last Login</th>
                <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3">Status</th>
                <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="admin-table-row border-b border-admin-border last:border-0">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-admin-accent text-white flex items-center justify-center text-xs font-semibold shrink-0">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-admin-text">{user.name}</div>
                        <div className="text-xs text-admin-text-muted flex items-center gap-1">
                          <Mail size={10} />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-sm text-admin-text-muted whitespace-nowrap">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "Never"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                        user.status === "active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : user.status === "invited"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-admin-accent" />
                <h2 className="text-lg font-semibold text-admin-text">Invite User</h2>
              </div>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-admin-text mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                  className="w-full h-10 px-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-text mb-1.5">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
                >
                  {Object.entries(ROLE_CONFIG).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-admin-text-muted mt-1.5">
                  {ROLE_CONFIG[inviteRole]?.permissions ?? ""}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="flex-1 h-10 border border-admin-border rounded-lg text-sm font-medium text-admin-text hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-admin-accent hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
