import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectCard } from "@/components/projects/project-card";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Dashboard — Campsite",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projectMembers } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", user!.id);

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

  const projectsWithCounts = await Promise.all(
    projects.map(async (project) => {
      const { count } = await supabase
        .from("project_members")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id);
      return { ...project, member_count: count || 0 };
    })
  );

  return (
    <>
      <PageHeader
        title="Projects"
        description="All your projects in one place"
        action={
          <CreateProjectDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New project
            </Button>
          </CreateProjectDialog>
        }
      />

      {projectsWithCounts.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-lg font-medium">No projects yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Create your first project to get started
          </p>
          <CreateProjectDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create a project
            </Button>
          </CreateProjectDialog>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectsWithCounts.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  );
}
