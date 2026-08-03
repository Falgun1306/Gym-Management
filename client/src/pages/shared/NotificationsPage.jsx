import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyNotifications, markNotificationRead, markAllRead } from '@/services/notificationService';
import { Card, CardHeader, Button } from '@/components/ui';
import { BellRing, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notificationsRes, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
  });

  const notifications = notificationsRes?.data || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const readAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BellRing className="w-7 h-7 text-emerald-600" />
            Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay updated with your latest alerts and system messages.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => readAllMutation.mutate()}
            loading={readAllMutation.isPending}
            icon={CheckCircle2}
          >
            Mark all as read
          </Button>
        )}
      </div>

      <Card className="shadow-md border-slate-200/80">
        <CardHeader title="All Notifications" subtitle={`You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.`} />
        
        <div className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <BellRing className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No notifications yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-2">
                When you receive alerts, reminders, or updates, they will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-6 transition-colors flex gap-4 ${
                    !notif.isRead ? 'bg-emerald-50/20' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${!notif.isRead ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className={`text-base ${!notif.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                        {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-3xl whitespace-pre-wrap">
                      {notif.message}
                    </p>
                    
                    {!notif.isRead && (
                      <button
                        onClick={() => readMutation.mutate(notif.id)}
                        className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
