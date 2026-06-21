import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const { data: projectMembers } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", user.id);

  const projectIds = projectMembers?.map((pm) => pm.project_id) || [];

  let projects: any[] = [];
  if (projectIds.length > 0) {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .in("id", projectIds)
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    projects = data || [];
  }

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar projects={projects} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header profile={profile} unreadNotifications={unreadCount || 0} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
