import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import React from 'react';
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
  Clock,
  TrendingUp,
  User,
  Ticket,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { logoutUser } from '@/services/authService';
import { Avatar } from '@/components/ui';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';

/**
 * DashboardLayout — Main application shell.
 * Matches the sidebar + topbar structure from admin dashboard.png,
 * member dashboard.png, and Trainer dashboard.png mockups.
 */

// ── Role-specific navigation config ──
const adminNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/members', icon: Users, label: 'Members' },
  { to: '/dashboard/trainers', icon: GraduationCap, label: 'Trainers' },
  { to: '/dashboard/trainer-applications', icon: UserCheck, label: 'Applications' },
  { to: '/dashboard/membership-plans', icon: CreditCard, label: 'Plans & Subs' },
  { to: '/dashboard/coupons', icon: Ticket, label: 'Coupons' },
  { to: '/dashboard/gym-classes', icon: CalendarDays, label: 'Gym Classes' },
  { to: '/dashboard/time-slots', icon: Clock, label: 'Time Slots & Space' },
  { to: '/dashboard/payments', icon: ClipboardList, label: 'Payments' },
  { to: '/dashboard/equipment', icon: Wrench, label: 'Equipment' },
  { to: '/dashboard/complaints', icon: MessageSquare, label: 'Complaints' },
  { to: '/dashboard/reports', icon: BarChart3, label: 'Reports' },
];

const trainerNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/my-members', icon: Users, label: 'My Members' },
  { to: '/dashboard/time-slots', icon: Clock, label: 'Time Slots & Space' },
  { to: '/dashboard/workout-plans', icon: Dumbbell, label: 'Workout Plans' },
  { to: '/dashboard/diet-plans', icon: UtensilsCrossed, label: 'Diet Plans' },
  { to: '/dashboard/exercises', icon: BookOpen, label: 'Exercises' },
  { to: '/dashboard/my-schedule', icon: CalendarClock, label: 'My Schedule' },
  { to: '/dashboard/attendance', icon: UserCheck, label: 'Attendance' },
  { to: '/dashboard/class-bookings', icon: CalendarDays, label: 'Class Bookings' },
];

const memberNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/my-membership', icon: CreditCard, label: 'My Membership' },
  { to: '/dashboard/my-time-slot', icon: Clock, label: 'My Time Slot' },
  { to: '/dashboard/my-attendance', icon: UserCheck, label: 'My Attendance' },
  { to: '/dashboard/my-workout', icon: Dumbbell, label: 'My Workout' },
  { to: '/dashboard/my-diet', icon: UtensilsCrossed, label: 'My Diet' },
  { to: '/dashboard/my-progress', icon: TrendingUp, label: 'My Progress' },
  { to: '/dashboard/classes', icon: CalendarDays, label: 'Classes' },
  { to: '/dashboard/my-support', icon: MessageSquare, label: 'Support & Apply' },
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
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const role = user?.role || 'MEMBER';
  const navItems = getNavItems(role);
  const breadcrumbParts = getBreadcrumb(location.pathname);

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      storeLogout();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    },
    onError: () => {
      storeLogout();
      navigate('/login', { replace: true });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen flex bg-slate-50 relative overflow-x-hidden">
      {/* ── Mobile Backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-white transition-all duration-200 shadow-xl md:shadow-none',
          // Mobile responsive classes:
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0',
          // Desktop collapsed width:
          sidebarCollapsed ? 'md:w-16' : 'md:w-60'
        )}
      >
        {/* Brand header */}
        <div className={cn('p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between', sidebarCollapsed && 'md:px-3')}>
          {(!sidebarCollapsed || mobileOpen) && (
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                firstName={user?.username?.[0]}
                lastName=""
                size="md"
                className="!bg-emerald-700 !text-white !border-emerald-600 shrink-0"
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
          )}

          {sidebarCollapsed && !mobileOpen && (
            <div className="flex items-center justify-center w-full">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
            </div>
          )}

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                  sidebarCollapsed && !mobileOpen && 'md:justify-center md:px-2'
                )
              }
            >
              <item.icon className={cn('w-[18px] h-[18px] shrink-0')} />
              {(!sidebarCollapsed || mobileOpen) && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className={cn('border-t border-slate-800 p-3 space-y-1', sidebarCollapsed && !mobileOpen && 'md:px-2')}>
          <NavLink
            to="/dashboard/profile"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full',
                isActive ? 'bg-emerald-700/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800',
                sidebarCollapsed && !mobileOpen && 'md:justify-center md:px-2'
              )
            }
          >
            <User className="w-[18px] h-[18px]" />
            {(!sidebarCollapsed || mobileOpen) && <span>My Profile</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full',
              sidebarCollapsed && !mobileOpen && 'md:justify-center md:px-2'
            )}
          >
            <LogOut className="w-[18px] h-[18px]" />
            {(!sidebarCollapsed || mobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-200',
          'ml-0', // Default mobile margin
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
        )}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Sidebar toggle button (Mobile opens drawer, Desktop collapses) */}
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileOpen((prev) => !prev);
                } else {
                  toggleSidebar();
                }
              }}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm truncate">
              <span className="text-slate-500 font-medium">
                {role === 'ADMIN' ? 'Admin' : role === 'TRAINER' ? 'Trainer' : 'Member'}
              </span>
              {breadcrumbParts?.map((part, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-700 font-medium truncate">{part}</span>
                </span>
              ))}
            </div>

            {/* Mobile Title preview if breadcrumbs hidden */}
            <span className="sm:hidden text-sm font-bold text-slate-800 truncate">
              Vajra Fitness
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Portal label */}
            <span className="hidden lg:block text-sm font-semibold text-slate-700">
              {getPortalLabel(role)}
            </span>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-44 lg:w-52">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
              />
            </div>

            {/* Notification Dropdown */}
            <NotificationDropdown />

            {/* Help */}
            <button className="hidden sm:block p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* User avatar */}
            <Link to="/dashboard/profile" title="View Profile">
              <Avatar
                firstName={user?.username?.[0]}
                lastName=""
                size="sm"
                className="cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
              />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3.5 sm:p-6 pb-20 md:pb-6 overflow-x-hidden">
          <Outlet />
        </main>

        {/* ── Mobile Bottom Navigation Bar ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-lg text-[11px]">
          {role === 'ADMIN' && (
            <>
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                    isActive ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Home</span>
              </NavLink>
              <NavLink
                to="/dashboard/gym-classes"
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                    isActive ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                <CalendarDays className="w-5 h-5" />
                <span>Classes</span>
              </NavLink>
              <NavLink
                to="/dashboard/members"
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                    isActive ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                <Users className="w-5 h-5" />
                <span>Members</span>
              </NavLink>
              <NavLink
                to="/dashboard/profile"
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                    isActive ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </NavLink>
            </>
          )}

          {role === 'TRAINER' && (
            <>
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                    isActive ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Home</span>
              </NavLink>
              <NavLink
                to="/dashboard/class-bookings"
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                    isActive ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                <CalendarDays className="w-5 h-5" />
                <span>Classes</span>
              </NavLink>
              <NavLink
                to="/dashboard/attendance"
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                    isActive ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                <UserCheck className="w-5 h-5" />
                <span>Attendance</span>
              </NavLink>
              <NavLink
                to="/dashboard/profile"
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                    isActive ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </NavLink>
            </>
          )}

          {role === 'MEMBER' && (
            <>
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                    isActive ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Home</span>
              </NavLink>
              <NavLink
                to="/dashboard/classes"
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                    isActive ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                <CalendarDays className="w-5 h-5" />
                <span>Classes</span>
              </NavLink>
              <NavLink
                to="/dashboard/my-attendance"
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                    isActive ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                <UserCheck className="w-5 h-5" />
                <span>Attendance</span>
              </NavLink>
              <NavLink
                to="/dashboard/profile"
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                    isActive ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
