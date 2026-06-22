import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-sm text-bc-meta hover:text-foreground transition-colors"
      >
        &larr; Dashboard
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight mt-1 mb-4">
        Admin
      </h1>
      <nav className="flex gap-3 mb-8">
        <Link
          href="/admin/users"
          className="px-3 py-1.5 rounded-full text-sm bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Users
        </Link>
        <Link
          href="/admin/projects"
          className="px-3 py-1.5 rounded-full text-sm bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Projects
        </Link>
      </nav>
      {children}
    </div>
  );
}
