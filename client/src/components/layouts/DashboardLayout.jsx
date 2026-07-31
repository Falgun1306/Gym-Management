import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  GraduationCap,
  CalendarDays,
  CreditCard,
  ClipboardList,
  BarChart3,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Search,
  HelpCircle,
  Plus,
  ChevronRight,
  Menu,
  X,
  Wrench,
  UtensilsCrossed,
  BookOpen,
  UserCheck,
  CalendarClock,
  TrendingUp,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { logoutUser } from '@/services/authService';
import { Avatar } from '@/components/ui';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

/**
 * DashboardLayout — Main application shell.
 * Matches the sidebar + topbar structure from admin dashboard.png,
 * member dashboard.png, and Trainer dashboard.png mockups.
 */

// ── Role-specific navigation config ──
const adminNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/members', icon: Users, label: 'Members' },
  { to: '/dashboard/classes', icon: CalendarDays, label: 'Classes' },
  { to: '/dashboard/trainers', icon: GraduationCap, label: 'Staff' },
  { to: '/dashboard/reports', icon: BarChart3, label: 'Reports' },
];

const trainerNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/my-members', icon: Users, label: 'My Members' },
  { to: '/dashboard/workout-plans', icon: Dumbbell, label: 'Workout Plans' },
  { to: '/dashboard/diet-plans', icon: UtensilsCrossed, label: 'Diet Plans' },
  { to: '/dashboard/exercises', icon: BookOpen, label: 'Exercises' },
  { to: '/dashboard/my-schedule', icon: CalendarClock, label: 'My Schedule' },
  { to: '/dashboard/attendance', icon: UserCheck, label: 'Attendance' },
  { to: '/dashboard/class-bookings', icon: CalendarDays, label: 'Class Bookings' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
];

const memberNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/my-membership', icon: CreditCard, label: 'My Membership' },
  { to: '/dashboard/my-attendance', icon: UserCheck, label: 'My Attendance' },
  { to: '/dashboard/my-workout', icon: Dumbbell, label: 'My Workout' },
  { to: '/dashboard/my-diet', icon: UtensilsCrossed, label: 'My Diet' },
  { to: '/dashboard/classes', icon: CalendarDays, label: 'Classes' },
];

function getNavItems(role) {
  switch (role) {
    case 'ADMIN':
      return adminNav;
    case 'TRAINER':
      return trainerNav;
    case 'MEMBER':
      return memberNav;
    default:
      return adminNav;
  }
}

function getRoleLabel(role) {
  switch (role) {
    case 'ADMIN':
      return 'Facility Manager';
    case 'TRAINER':
      return 'Trainer Management';
    case 'MEMBER':
      return 'Member Portal';
    default:
      return 'Management';
  }
}

function getPortalLabel(role) {
  switch (role) {
    case 'ADMIN':
      return 'Admin Dashboard';
    case 'TRAINER':
      return 'Trainer Portal';
    case 'MEMBER':
      return 'Member Portal';
    default:
      return 'Dashboard';
  }
}

// ── Breadcrumb helper ──
function getBreadcrumb(pathname) {
  const parts = pathname.replace('/dashboard', '').split('/').filter(Boolean);
  if (parts.length === 0) return null;
  return parts.map((part) =>
    part
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: storeLogout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const role = user?.role || 'MEMBER';
  const navItems = getNavItems(role);
  const breadcrumbParts = getBreadcrumb(location.pathname);

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      storeLogout();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    },
    onError: () => {
      // Even if server logout fails, clear client state
      storeLogout();
      navigate('/login', { replace: true });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-900 text-white transition-all duration-200',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Brand header */}
        <div className={cn('p-5 border-b border-slate-800', sidebarCollapsed && 'px-3')}>
          {!sidebarCollapsed && (
            <>
              {/* Avatar + brand */}
              <div className="flex items-center gap-2.5 mb-3">
                <Avatar
                  firstName={user?.username?.[0]}
                  lastName=""
                  size="md"
                  className="!bg-emerald-700 !text-white !border-emerald-600"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {user?.username || 'User'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {getRoleLabel(role)}
                  </p>
                </div>
              </div>

              <h2 className="text-lg font-bold text-emerald-400 tracking-tight">
                IronPeak Elite
              </h2>
            </>
          )}
          {sidebarCollapsed && (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* New Check-in button */}
        {!sidebarCollapsed && (
          <div className="px-4 pt-4">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" />
              New Check-in
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-emerald-700/20 text-emerald-400 border-l-[3px] border-emerald-400 -ml-px'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800',
                  sidebarCollapsed && 'justify-center px-2'
                )
              }
            >
              <item.icon className={cn('w-[18px] h-[18px] shrink-0')} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className={cn('border-t border-slate-800 p-3 space-y-1', sidebarCollapsed && 'px-2')}>
          <button
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full',
              sidebarCollapsed && 'justify-center px-2'
            )}
          >
            <Settings className="w-[18px] h-[18px]" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full',
              sidebarCollapsed && 'justify-center px-2'
            )}
          >
            <LogOut className="w-[18px] h-[18px]" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-200',
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        )}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Sidebar toggle (mobile + collapse) */}
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {sidebarCollapsed ? (
                <Menu className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-500 font-medium">
                {role === 'ADMIN' ? 'Admin' : role === 'TRAINER' ? 'Trainer' : 'Member'}
              </span>
              {breadcrumbParts?.map((part, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-700 font-medium">{part}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Portal label */}
            <span className="hidden md:block text-sm font-semibold text-slate-700">
              {getPortalLabel(role)}
            </span>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-52">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
              />
            </div>

            {/* Notification bell */}
            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Help */}
            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* User avatar */}
            <Avatar
              firstName={user?.username?.[0]}
              lastName=""
              size="sm"
              className="cursor-pointer"
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
