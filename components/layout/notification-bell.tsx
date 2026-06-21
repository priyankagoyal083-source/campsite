"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import { getNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

export function NotificationBell({ initialCount }: { initialCount: number }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  async function loadNotifications() {
    const data = await getNotifications();
    setNotifications(data as Notification[]);
    setUnreadCount((data as Notification[]).filter((n) => !n.read).length);
    setLoaded(true);
  }

  async function handleClick(notification: Notification) {
    if (!notification.read) {
      await markAsRead(notification.id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }
    if (notification.link) {
      router.push(notification.link);
    }
  }

  async function handleMarkAllRead() {
    await markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open && !loaded) loadNotifications(); }}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" />
        }
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center px-1">
            {unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        {loaded && notifications.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        )}
        {!loaded && (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        )}
        {notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            onClick={() => handleClick(notification)}
            className={cn(
              "flex flex-col items-start gap-0.5 px-3 py-2 cursor-pointer",
              !notification.read && "bg-primary/5"
            )}
          >
            <div className="flex items-center gap-2 w-full">
              {!notification.read && (
                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              )}
              <span className="text-sm font-medium truncate">
                {notification.title}
              </span>
            </div>
            <span className="text-xs text-muted-foreground line-clamp-2">
              {notification.message}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(notification.created_at).toLocaleDateString()}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
