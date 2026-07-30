import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, HelpCircle, ArrowLeft, Search, Dumbbell } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui';

/**
 * NotFoundPage — premium 404 page matching the UI mockup.
 *
 * Split-card layout:
 *  Left:  Gym-themed illustration with a "System Error" search chip
 *  Right: 404 heading, description, contextual nav buttons, brand footer
 *
 * Adapts CTAs based on auth state:
 *  - Authenticated → "Back to Dashboard"
 *  - Guest → "Go to Login"
 */
export default function NotFoundPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      {/* Main card container */}
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden animate-fade-in">
        <div className="flex flex-col md:flex-row min-h-[480px]">

          {/* ── Left Panel: Illustration ── */}
          <div className="relative md:w-1/2 bg-slate-900 overflow-hidden flex items-stretch">
            {/* Search chip overlay */}
            <div className="absolute top-5 left-5 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-slate-200">
              <Search className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">System Error</span>
            </div>

            {/* Illustration image */}
            <img
              src="/images/404-illustration.png"
              alt="Confused person looking at a gym floor plan"
              className="w-full h-full object-cover"
            />

            {/* Subtle gradient overlay for polish */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* ── Right Panel: Content ── */}
          <div className="md:w-1/2 flex flex-col justify-center p-8 md:p-10 lg:p-12">
            {/* 404 number */}
            <h1
              className="text-7xl md:text-8xl font-extrabold tracking-tight text-emerald-700 leading-none"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              404
            </h1>

            {/* Heading */}
            <h2 className="mt-3 text-2xl md:text-3xl font-bold text-slate-900">
              Page Not Found
            </h2>

            {/* Description */}
            <p className="mt-3 text-sm leading-relaxed text-slate-500 max-w-sm">
              It looks like you've wandered off the training floor.
              The page you are looking for might have been removed,
              had its name changed, or is temporarily unavailable.
            </p>

            {/* Action buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go to Login
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                Go Back
              </Button>
            </div>

            {/* Brand footer */}
            <div className="mt-10 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-400">
                <Dumbbell className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold uppercase tracking-widest">
                  IronPeak Management System
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
