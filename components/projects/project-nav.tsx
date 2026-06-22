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
    <nav className="flex gap-4 mb-8">
      {tabs.map((tab) => {
        const href = `/projects/${projectId}/${tab.href}`;
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-bc-meta hover:text-foreground hover:bg-muted"
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
