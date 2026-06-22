"use client";

import { adminToggleAdmin, adminDeleteUser } from "@/actions/admin";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";

export function UsersTable({
  users,
  currentUserId,
}: {
  users: Profile[];
  currentUserId: string;
}) {
  async function handleToggleAdmin(userId: string, name: string) {
    const result = await adminToggleAdmin(userId);
    if (result?.error) toast.error(result.error);
    else toast.success(`Updated admin status for ${name}`);
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    const result = await adminDeleteUser(userId);
    if (result?.error) toast.error(result.error);
    else toast.success(`Deleted ${name}`);
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-bc-meta mb-4">{users.length} users total</div>
      {users.map((user) => {
        const initials = user.full_name
          ? user.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : user.email[0].toUpperCase();

        return (
          <div
            key={user.id}
            className="flex items-center gap-3 py-3 px-3 border border-bc-divider rounded-md"
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {user.full_name || user.email}
              </p>
              <p className="text-sm text-bc-meta truncate">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {user.is_admin && (
                <Badge variant="default" className="bg-bc-green text-white">Admin</Badge>
              )}
              <span className="text-xs text-bc-meta">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
              {user.id !== currentUserId && (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      handleToggleAdmin(
                        user.id,
                        user.full_name || user.email
                      )
                    }
                    title={user.is_admin ? "Remove admin" : "Make admin"}
                  >
                    {user.is_admin ? (
                      <ShieldOff className="h-4 w-4" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() =>
                      handleDelete(
                        user.id,
                        user.full_name || user.email
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
