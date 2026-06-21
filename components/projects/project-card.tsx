import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { ProjectWithMemberCount } from "@/lib/types/database";

export function ProjectCard({
  project,
}: {
  project: ProjectWithMemberCount;
}) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          {project.description && (
            <CardDescription className="line-clamp-2">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {project.member_count} {project.member_count === 1 ? "member" : "members"}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
