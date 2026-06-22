import { adminGetProjects } from "@/actions/admin";
import { ProjectsTable } from "@/components/admin/projects-table";

export const metadata = {
  title: "Admin — Projects — Campsite",
};

export default async function AdminProjectsPage() {
  const projects = await adminGetProjects();

  return (
    <>
      <h2 className="text-xl font-bold mb-4">Projects</h2>
      <ProjectsTable projects={projects} />
    </>
  );
}
