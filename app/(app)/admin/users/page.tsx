import { createClient } from "@/lib/supabase/server";
import { UsersTable } from "@/components/admin/users-table";

export const metadata = {
  title: "Admin — Users — Campsite",
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <h2 className="text-xl font-bold mb-4">Users</h2>
      <UsersTable users={users || []} currentUserId={user!.id} />
    </>
  );
}
