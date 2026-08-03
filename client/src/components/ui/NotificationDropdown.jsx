import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, BellRing } from 'lucide-react';
import { getMyNotifications, markNotificationRead, markAllRead } from '@/services/notificationService';
import toast from 'react-hot-toast';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const { data: notificationsRes } = useQuery({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
    refetchInterval: 30000, // Refetch every 30s
  });

  const notifications = notificationsRes?.data || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  // Show up to 5 notifications in the dropdown
  const recentNotifications = notifications.slice(0, 5);

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

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      readMutation.mutate(notification.id);
    }
    setIsOpen(false);
    navigate('/dashboard/notifications');
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/dashboard/notifications');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in origin-top-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-xs py-0.5 px-2 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => readAllMutation.mutate()}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center text-slate-500 flex flex-col items-center">
                <BellRing className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-sm font-medium">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentNotifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                      !notif.isRead ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-emerald-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1.5">
                        {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-slate-100 bg-slate-50">
            <button
              onClick={handleViewAll}
              className="w-full py-2 text-sm font-bold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
