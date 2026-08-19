import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Dumbbell,
  Download,
  CheckCircle2,
  QrCode,
  Users,
  Activity,
  Calendar,
  CreditCard,
  TrendingUp,
  Apple as NutritionIcon,
  ShieldCheck,
  Clock,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Laptop,
  Layers,
  ArrowUpRight,
  HelpCircle,
  ChevronDown,
  Wrench,
  MessageSquare,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useAppMode } from '@/hooks/useAppMode';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { isInstalled, installApp } = usePWAInstall();
  const isAppMode = useAppMode();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState('members');
  const [openFaq, setOpenFaq] = useState(0);

  // If running as an installed PWA or APK wrapper, immediately bypass the landing page
  if (isAppMode) {
    return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
  }

  const handleInstallClick = async () => {
    await installApp();
  };

  const roleFeatures = {
    members: {
      title: 'Dedicated Member Portal',
      subtitle: 'Everything members need to track progress, access facilities, and hit fitness milestones.',
      tag: 'Member Experience',
      badge: 'text-emerald-700 border-emerald-300 bg-emerald-50',
      bullets: [
        { title: 'Digital QR Pass', desc: 'Instant contactless check-in at the front desk using personal dynamic QR code.' },
        { title: 'Personalized Workout Plans', desc: 'Access day-by-day routines with sets, reps, target muscle groups, and demo notes.' },
        { title: 'Tailored Diet & Macros', desc: 'View calories, macronutrient splits, meal timings, and hydration goals assigned by trainers.' },
        { title: 'Time Slot & Class Booking', desc: 'Reserve workout time-slots and book spots in Yoga, HIIT, and Spin classes in advance.' },
        { title: 'Progress & Metric Logs', desc: 'Track body weight, measurements, BMI, and personal best records over time.' },
      ],
      previewStats: [
        { label: 'Active Plan', value: 'Elite Strength 6-Day' },
        { label: 'This Month Attendance', value: '18 Days' },
        { label: 'Calories Target', value: '2,400 kcal' },
        { label: 'Next Booked Class', value: 'HIIT at 6:00 PM' },
      ],
    },
    trainers: {
      title: 'Trainer Command Workspace',
      subtitle: 'Empower coaches to oversee trainees, craft routines, and log class attendances.',
      tag: 'Coach & Trainer Hub',
      badge: 'text-indigo-700 border-indigo-300 bg-indigo-50',
      bullets: [
        { title: 'Client Roster Management', desc: 'View all assigned members, their health records, goals, and workout compliance.' },
        { title: 'Interactive Workout Builder', desc: 'Draft custom multi-day workout regimens from an extensive exercise database.' },
        { title: 'Diet & Nutrition Customizer', desc: 'Design meal plans with automated macro calculations tailored to client needs.' },
        { title: 'Class & Roster Management', desc: 'Manage registered attendees for group classes and mark live attendance.' },
        { title: 'Time Slot Schedule Controls', desc: 'Set personal training availability and monitor client booking slots.' },
      ],
      previewStats: [
        { label: 'Assigned Clients', value: '24 Members' },
        { label: 'Active Workout Plans', value: '19 Custom' },
        { label: 'Today Scheduled Classes', value: '3 Sessions' },
        { label: 'Trainee Avg Adherence', value: '94.2%' },
      ],
    },
    admins: {
      title: 'Executive Facility Management',
      subtitle: 'Complete end-to-end control of memberships, financials, staff, and gym equipment.',
      tag: 'Admin & Owner Control',
      badge: 'text-amber-800 border-amber-300 bg-amber-50',
      bullets: [
        { title: 'Real-time Financial Analytics', desc: 'Monitor revenue streams, membership renewals, pending dues, and growth metrics.' },
        { title: 'Membership & Coupon Engine', desc: 'Create tiered membership plans, promotional coupons, and seasonal discount codes.' },
        { title: 'Trainer & Staff Oversight', desc: 'Review trainer applications, approve credentials, assign clients, and track performance.' },
        { title: 'Equipment & Maintenance Desk', desc: 'Track gym machine health, log maintenance requests, and prevent downtime.' },
        { title: 'Member Support & Grievances', desc: 'Review feedback, resolve complaints, and maintain a 5-star gym experience.' },
      ],
      previewStats: [
        { label: 'Monthly Revenue', value: '$48,920' },
        { label: 'Total Active Members', value: '628 Members' },
        { label: 'Facility Capacity', value: '68% Current' },
        { label: 'Equipment Health', value: '98.5% OK' },
      ],
    },
  };

  const featureCards = [
    {
      icon: QrCode,
      title: 'Contactless QR Check-In',
      description: 'Lightning-fast camera scanning under 0.5s for seamless member and trainer facility entry with anti-fraud safeguards.',
      badge: 'Instant Access',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      icon: Users,
      title: 'Member CRM & Profiles',
      description: 'Comprehensive directory tracking member statuses, expiration dates, emergency contacts, medical history, and renewals.',
      badge: 'CRM Core',
      color: 'text-teal-700 bg-teal-50 border-teal-200',
    },
    {
      icon: Dumbbell,
      title: 'Workout & Routine Planner',
      description: 'Build rich exercise libraries, structured day-by-day regimens, target muscle categorizations, and video exercise guides.',
      badge: 'Performance',
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
    {
      icon: NutritionIcon,
      title: 'Precision Nutrition & Diet Plans',
      description: 'Detailed meal schedule builder with calorie and macro targets (Proteins, Carbs, Fats) tailored by personal coaches.',
      badge: 'Nutrition',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      icon: Calendar,
      title: 'Group Class Scheduling',
      description: 'Manage high-demand fitness classes (Yoga, HIIT, CrossFit, Spin) with seat limits, waitlists, and trainer assignments.',
      badge: 'Classes',
      color: 'text-purple-700 bg-purple-50 border-purple-200',
    },
    {
      icon: Clock,
      title: 'Time Slot Capacity Balancer',
      description: 'Prevent floor crowding by letting members book dedicated workout time windows with real-time occupancy limits.',
      badge: 'Capacity',
      color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
    },
    {
      icon: CreditCard,
      title: 'Automated Billing & Coupons',
      description: 'Track membership transactions, export invoices, and launch promotional campaigns with customizable coupon codes.',
      badge: 'Finance',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      icon: Wrench,
      title: 'Equipment & Asset Maintenance',
      description: 'Keep your gym in prime condition. Track equipment serial numbers, maintenance schedules, and breakdown alerts.',
      badge: 'Facility',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      icon: MessageSquare,
      title: 'Member Support & Feedback',
      description: 'Integrated grievance ticketing desk where members submit feedback and administrators deliver swift resolutions.',
      badge: 'Support Desk',
      color: 'text-rose-700 bg-rose-50 border-rose-200',
    },
  ];

  const faqs = [
    {
      q: 'How do I install the Vajra Fitness app in Google Chrome (PWA)?',
      a: 'Vajra Fitness is a high-performance Progressive Web App. When opened in Google Chrome on Desktop or Android, Chrome automatically detects it and displays an "Install" icon directly on the right side of the address bar (omnibox). Alternatively, click Chrome’s top-right ⋮ (three dots menu) and select "Install Vajra Fitness...". You can also click the "Install App" button right on this page!',
    },
    {
      q: 'Does Vajra Fitness support different user roles?',
      a: 'Yes! Vajra Fitness features dedicated, role-tailored dashboards and permissions for Gym Members, Certified Trainers/Coaches, and Administrators/Gym Owners with strict Role-Based Access Control (RBAC).',
    },
    {
      q: 'Can members check into the gym using their mobile phones?',
      a: 'Absolutely. Every member receives a secure, dynamic QR code inside their member portal. Front desk staff or camera scanners instantly verify membership status and log attendance in under 0.5 seconds.',
    },
    {
      q: 'Can trainers create custom diets and exercise plans?',
      a: 'Yes. Trainers have an intuitive visual builder to craft daily workout routines (exercises, sets, reps, rest intervals) and nutritional meal plans (calories, protein, carbs, fats) directly linked to their assigned trainees.',
    },
    {
      q: 'Can I use Vajra Fitness offline or on weak mobile connections?',
      a: 'Yes. Thanks to modern Service Worker caching and PWA architecture, core pages, QR credentials, and workout plans load instantly even with low connectivity.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-emerald-500 selection:text-white font-sans antialiased overflow-x-hidden">
      
      {/* ─── Top Notification / Install Banner (Light Theme) ─── */}
      <div className="bg-emerald-50 border-b border-emerald-200/80 py-2 px-4 text-xs text-emerald-950">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>
              <strong className="text-emerald-800 font-semibold">Native PWA Enabled:</strong> Install directly in Chrome via address bar icon or menu.
            </span>
          </div>

          <button
            onClick={handleInstallClick}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 text-[11px] font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3 text-emerald-700" />
            <span>Install App</span>
          </button>
        </div>
      </div>

      {/* ─── Sticky Navbar (Light Theme) ─── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/images/app-icon.png"
              alt="Vajra Fitness Logo"
              className="w-9 h-9 rounded-xl object-contain shadow-md shadow-emerald-600/10 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                VAJRA FITNESS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#roles" className="hover:text-emerald-600 transition-colors">Portals &amp; Roles</a>
            <a href="#faqs" className="hover:text-emerald-600 transition-colors">FAQ</a>
          </nav>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Install Button */}
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs transition-all cursor-pointer"
              title="Install Vajra Fitness as a Progressive Web App"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isInstalled ? 'App Installed ✓' : 'Install App'}</span>
            </button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all"
              >
                <span>Dashboard ({user?.role || 'User'})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all"
                >
                  <span>Get Started</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu (Light Theme) */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-5 space-y-3 animate-fade-in shadow-lg">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 hover:text-emerald-700"
              >
                Features
              </a>
              <a
                href="#roles"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 hover:text-emerald-700"
              >
                Portals &amp; Roles
              </a>
              <a
                href="#faqs"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 hover:text-emerald-700"
              >
                FAQ
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleInstallClick();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>{isInstalled ? 'App Installed' : 'Install PWA App'}</span>
              </button>

              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white"
                >
                  <span>Go to Dashboard</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 text-center border border-slate-300"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-center"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero Section (Light Theme) ─── */}
      <section className="relative pt-12 pb-20 md:pt-18 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100/80">
        {/* Subtle decorative glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[350px] bg-gradient-to-tr from-emerald-100/60 via-teal-100/40 to-indigo-100/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Next-Gen Gym Operating System &amp; PWA</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Precision Management. <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">
                Peak Fitness Performance.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              From sub-second contactless QR check-ins &amp; capacity time-slot booking to customized workout builders, macro nutrition planners, and facility financial analytics.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02]"
                >
                  <span>Launch Your Dashboard</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02]"
                  >
                    <span>Get Started</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-sm border border-slate-300 shadow-xs transition-colors"
                  >
                    <span>Member &amp; Staff Login</span>
                  </Link>
                </>
              )}

              {/* Install PWA Button in Hero */}
              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-sm border border-emerald-300 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Install Chrome App (PWA)</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-y-3 gap-x-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>99.9% Cloud Uptime</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Sub-Second QR Entry</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Works Offline as PWA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bank-Grade JWT Security</span>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ─── Comprehensive Feature Matrix Grid (Light Theme) ─── */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full System Feature Suite</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Every Stage of Gym Operations
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Every tool required to run a high-capacity fitness center, retain members, and empower coaches in one unified platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 group shadow-xs"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${feat.color}`}>
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {feat.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-2">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── Role Portals Showcase (Interactive Tabs - Light Theme) ─── */}
      <section id="roles" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Multi-Role Experiences</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              Built Specifically for Members, Coaches &amp; Admins
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Explore how each role interacts with the Vajra Fitness platform.
            </p>

            {/* Tab Selector */}
            <div className="flex justify-center pt-4">
              <div className="inline-flex rounded-xl bg-slate-100 p-1.5 border border-slate-200">
                <button
                  onClick={() => setActiveRoleTab('members')}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeRoleTab === 'members'
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Member Portal
                </button>
                <button
                  onClick={() => setActiveRoleTab('trainers')}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeRoleTab === 'trainers'
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Trainer Workspace
                </button>
                <button
                  onClick={() => setActiveRoleTab('admins')}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeRoleTab === 'admins'
                      ? 'bg-white text-amber-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin &amp; Owner Suite
                </button>
              </div>
            </div>
          </div>

          {/* Active Role Content Card */}
          {(() => {
            const role = roleFeatures[activeRoleTab];
            return (
              <div className="p-6 sm:p-10 rounded-2xl bg-slate-50 border border-slate-200 shadow-md">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Left Column: Role Details & Bullets */}
                  <div className="lg:col-span-7 space-y-6">
                    <div>
                      <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border mb-2 ${role.badge}`}>
                        {role.tag}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        {role.title}
                      </h3>
                      <p className="text-slate-600 text-sm mt-1">
                        {role.subtitle}
                      </p>
                    </div>

                    <div className="space-y-3.5">
                      {role.bullets.map((b, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900">{b.title}: </span>
                            <span className="text-xs text-slate-600">{b.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <Link
                        to="/login"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-300 shadow-2xs transition-colors"
                      >
                        <span>Access This Portal</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Right Column: Live Mockup Card */}
                  <div className="lg:col-span-5">
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-lg space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-600" />
                          {activeRoleTab === 'members' && 'Member Quick Overview'}
                          {activeRoleTab === 'trainers' && 'Coach Active Metrics'}
                          {activeRoleTab === 'admins' && 'Facility Health KPI'}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                          ACTIVE
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {role.previewStats.map((stat, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="text-[11px] text-slate-500">{stat.label}</div>
                            <div className="text-sm font-bold text-slate-900 mt-0.5">{stat.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between font-medium">
                        <span>Role Status: Synchronized</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}

        </div>
      </section>

      {/* ─── Frequently Asked Questions (FAQ - Light Theme) ─── */}
      <section id="faqs" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-sm">
              Everything you need to know about Vajra Fitness features, PWA setup, and role capabilities.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── Footer (Light Theme) ─── */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <img
                  src="/images/app-icon.png"
                  alt="Vajra Fitness Logo"
                  className="w-8 h-8 rounded-lg object-contain shadow-xs"
                />
                <span className="text-base font-bold text-slate-900 tracking-tight">Vajra Fitness</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Industrial-grade gym and fitness center management operating system.
              </p>
              <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                PWA Service Worker Online
              </div>
            </div>

            {/* Quick Portals */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Access Portals</h4>
              <ul className="space-y-2">
                <li><Link to="/login" className="hover:text-emerald-600 transition-colors">Member Sign In</Link></li>
                <li><Link to="/login" className="hover:text-emerald-600 transition-colors">Trainer Workspace</Link></li>
                <li><Link to="/login" className="hover:text-emerald-600 transition-colors">Executive Admin Portal</Link></li>
                <li><Link to="/register" className="hover:text-emerald-600 transition-colors">New Registration</Link></li>
              </ul>
            </div>

            {/* Features */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Capabilities</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-emerald-600 transition-colors">QR Attendance Check-In</a></li>
                <li><a href="#features" className="hover:text-emerald-600 transition-colors">Workout &amp; Diet Architect</a></li>
                <li><a href="#features" className="hover:text-emerald-600 transition-colors">Class Bookings &amp; Slots</a></li>
                <li><a href="#features" className="hover:text-emerald-600 transition-colors">Financials &amp; Billing</a></li>
              </ul>
            </div>

            {/* PWA & Install */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">App Installation</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Install Vajra Fitness as a native desktop or mobile application via Chrome address bar (omnibox).
              </p>
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Install Chrome App (PWA)</span>
              </button>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} Vajra Fitness Management Platform. All rights reserved.
            </div>
            <div className="flex gap-4">
              <a href="#faqs" className="hover:text-slate-700 transition-colors">Privacy Policy</a>
              <a href="#faqs" className="hover:text-slate-700 transition-colors">Terms of Service</a>
              <a href="#faqs" className="hover:text-slate-700 transition-colors">System Status</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
