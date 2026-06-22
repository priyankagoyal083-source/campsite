import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProjectNav } from "@/components/projects/project-nav";
import Link from "next/link";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: membership } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-sm text-bc-meta hover:text-foreground transition-colors"
      >
        &larr; Dashboard
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight mt-1 mb-4">
        {project.name}
      </h1>
      <ProjectNav projectId={projectId} />
      {children}
    </div>
  );
}
