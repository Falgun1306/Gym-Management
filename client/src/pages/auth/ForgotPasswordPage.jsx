import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui';
import { forgotPassword } from '@/services/authService';

/**
 * ForgotPasswordPage — matching forgot password.png mockup.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const forgotMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (response) => {
      setSent(true);
      toast.success(response.message || 'Reset link sent!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send reset link');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setError('');
    forgotMutation.mutate({ email: email.trim() });
  };

  return (
    <AuthLayout variant="forgot">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">
        {sent ? (
          /* Success state */
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900">Check your email</h2>
              <p className="text-sm text-slate-500">
                If an account with <span className="font-medium text-slate-700">{email}</span> exists,
                we've sent a password reset link.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setSent(false)}
              className="mx-auto"
            >
              Send another link
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-slate-900">
                Forgot Password?
              </h1>
              <p className="text-sm text-slate-500">
                Enter your email to receive a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="forgot-email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="manager@facility.com"
                    className={`w-full rounded-lg border bg-white text-slate-900 placeholder:text-slate-400
                      pl-10 pr-3.5 py-2.5 text-sm transition-all duration-150
                      focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600
                      ${error ? 'border-red-500' : 'border-slate-300 hover:border-slate-400'}`}
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                loading={forgotMutation.isPending}
                icon={Send}
                className="w-full !py-2.5"
              >
                Send Reset Link
              </Button>
            </form>
          </>
        )}

        {/* Back to Login */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
