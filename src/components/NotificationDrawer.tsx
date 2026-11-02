"use client";

import { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationRead?: () => void;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  onNotificationRead,
}: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onNotificationRead) onNotificationRead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingle = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (onNotificationRead) onNotificationRead();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-sm bg-white h-full shadow-dropdown flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-corporate-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Notifications
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-medium text-corporate-600 hover:text-corporate-700 hover:underline transition-colors"
              title="Mark all as read"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-md bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs font-medium space-y-1">
              <Check className="w-6 h-6 text-slate-300 mx-auto" />
              <p>No new notifications</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.isRead && handleMarkSingle(item.id)}
                className={`p-3 rounded-md border transition-all duration-150 cursor-pointer ${
                  item.isRead
                    ? "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
                    : "bg-blue-50/40 border-blue-200/80 text-slate-900 shadow-subtle hover:bg-blue-50/70"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    {!item.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-corporate-600 animate-pulse" />
                    )}
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.message}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-200/80 bg-slate-50/50 text-[11px] text-slate-400 text-center font-mono">
          Event Synced
        </div>
      </div>
    </div>
  );
}