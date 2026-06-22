"use client";

import { addExistingMember, getAvailableUsers } from "@/actions/team";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type AvailableUser = {
  id: string;
  full_name: string | null;
  email: string;
};

export function AddMemberDialog({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<AvailableUser[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getAvailableUsers(projectId).then((data) => {
        setUsers(data as AvailableUser[]);
        setLoading(false);
      });
    } else {
      setFilter("");
    }
  }, [open, projectId]);

  const filtered = users.filter((u) => {
    const q = filter.toLowerCase();
    return (
      (u.full_name?.toLowerCase().includes(q) ?? false) ||
      u.email.toLowerCase().includes(q)
    );
  });

  async function handleAdd(userId: string, name: string) {
    setAdding(userId);
    const result = await addExistingMember(projectId, userId);
    setAdding(null);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Added ${name} to the project`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a team member</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search by name or email..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          autoFocus
        />
        <div className="max-h-72 overflow-y-auto space-y-1 mt-2">
          {loading && (
            <p className="text-sm text-bc-meta text-center py-4">Loading...</p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-bc-meta text-center py-4">
              {users.length === 0 ? "All users are already members" : "No matching users"}
            </p>
          )}
          {filtered.map((user) => {
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
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.full_name || user.email}
                  </p>
                  {user.full_name && (
                    <p className="text-xs text-bc-meta truncate">{user.email}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  disabled={adding === user.id}
                  onClick={() =>
                    handleAdd(user.id, user.full_name || user.email)
                  }
                >
                  {adding === user.id ? "Adding..." : "Add"}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
