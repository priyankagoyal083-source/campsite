"use client";

import { adminDeleteProject } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Users, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  archived_at: string | null;
  member_count: number;
  todo_count: number;
  creator_name: string;
};

export function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  async function handleDelete(projectId: string, name: string) {
    if (!confirm(`Delete project "${name}" and all its data? This cannot be undone.`)) return;
    const result = await adminDeleteProject(projectId);
    if (result?.error) toast.error(result.error);
    else toast.success(`Deleted ${name}`);
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-bc-meta mb-4">{projects.length} projects total</div>
      {projects.map((project) => (
        <div
          key={project.id}
          className="flex items-center gap-3 py-3 px-3 border border-bc-divider rounded-md"
        >
          <div className="flex-1 min-w-0">
            <Link
              href={`/projects/${project.id}`}
              className="font-medium hover:text-bc-link truncate block"
            >
              {project.name}
            </Link>
            <p className="text-sm text-bc-meta">
              Created by {project.creator_name} on{" "}
              {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {project.member_count}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <CheckSquare className="h-3 w-3" />
              {project.todo_count}
            </Badge>
            {project.archived_at && (
              <Badge variant="outline">Archived</Badge>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive"
              onClick={() => handleDelete(project.id, project.name)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
