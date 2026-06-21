"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CheckSquare, MessageSquare, Users } from "lucide-react";

const tabs = [
  { label: "To-dos", href: "todos", icon: CheckSquare },
  { label: "Messages", href: "messages", icon: MessageSquare },
  { label: "People", href: "people", icon: Users },
];

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b mb-6">
      {tabs.map((tab) => {
        const href = `/projects/${projectId}/${tab.href}`;
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
