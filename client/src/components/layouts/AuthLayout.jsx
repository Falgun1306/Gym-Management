import { Link } from 'react-router-dom';
import { Dumbbell, Users, CreditCard, BarChart3, CheckCircle2 } from 'lucide-react';

/**
 * AuthLayout — Split-screen layout for all auth pages.
 * Matches the design from login page.png, register page.png, forgot password.png, reset password.png
 *
 * Left: Dark gym interior with green overlay, brand name, tagline, feature bullets.
 * Right: Light grey background with white form card.
 */

const features = [
  {
    icon: Users,
    title: 'Member Tracking',
    description: 'Comprehensive profiles and activity history.',
  },
  {
    icon: CreditCard,
    title: 'Auto-billing',
    description: 'Seamless recurring payments and invoicing.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Real-time facility utilization and financial reporting.',
  },
];

export default function AuthLayout({ children, variant = 'login' }) {
  // Different taglines for different auth pages
  const taglines = {
    login: {
      heading: 'Precision in management,\nexcellence in performance.',
      subtext:
        'The industrial-grade platform designed for fitness entrepreneurs and facility managers to drive operational endurance.',
    },
    register: {
      heading: '"Empower your fitness\ncommunity."',
      subtext:
        'The industrial-grade platform designed for fitness entrepreneurs and facility managers. Streamline operations and focus on growth.',
    },
    forgot: {
      heading: 'Secure Access.\nSeamless Recovery.',
      subtext:
        'Operational continuity is paramount. Restore access to your facility management workspace swiftly and securely.',
    },
    reset: {
      heading: 'IronPeak\nEnterprise',
      subtext:
        'Industrial-grade performance management for fitness professionals.',
    },
  };

  const content = taglines[variant] || taglines.login;

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel: Dark gym branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background image */}
        <img
          src="/images/gym-interior.png"
          alt="Gym interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark + green overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-emerald-900/60" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          {/* Brand */}
          <Link to="/login" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              IronPeak Elite
            </span>
          </Link>

          {/* Tagline */}
          <div className="space-y-6 max-w-md">
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight whitespace-pre-line">
              {content.heading}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {content.subtext}
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-4">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-700/30 border border-emerald-600/30 flex items-center justify-center shrink-0">
                  <feature.icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {feature.title}
                  </p>
                  <p className="text-xs text-slate-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form area ── */}
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
