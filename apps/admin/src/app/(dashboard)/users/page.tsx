export const dynamic = "force-dynamic";

import { getUsers, getRoleCounts } from "@/lib/db/queries";
import UsersClient from "./users-client";

export default async function UsersPage() {
  const [users, roleCounts] = await Promise.all([
    getUsers(),
    getRoleCounts(),
  ]);
  return <UsersClient initialUsers={users} roleCounts={roleCounts} />;
}
