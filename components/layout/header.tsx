"use client";

import { signOut } from "@/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import type { Profile } from "@/lib/types/database";

export function Header({
  profile,
  unreadNotifications,
}: {
  profile: Profile;
  unreadNotifications: number;
}) {
  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : profile.email[0].toUpperCase();

  return (
    <header className="border-b bg-card px-4 md:px-6 h-14 flex items-center justify-end gap-2">
      <NotificationBell initialCount={unreadNotifications} />
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
          <span className="text-sm hidden sm:inline">
            {profile.full_name || profile.email}
          </span>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-muted-foreground text-xs" disabled>
            {profile.email}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => signOut()}
            className="text-destructive cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
