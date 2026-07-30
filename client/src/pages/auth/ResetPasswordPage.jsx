import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui';
import { resetPassword } from '@/services/authService';

/**
 * ResetPasswordPage — matching reset password.png mockup.
 * Reads ?token= from URL query params.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (response) => {
      setSuccess(true);
      toast.success(response.message || 'Password reset successful!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reset password');
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.newPassword)
      newErrors.newPassword = 'Password is required';
    else if (form.newPassword.length < 8)
      newErrors.newPassword = 'Must be at least 8 characters';
    if (!form.confirmPassword)
      newErrors.confirmPassword = 'Please confirm your password';
    else if (form.newPassword !== form.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }
    resetMutation.mutate({
      token,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword,
    });
  };

  return (
    <AuthLayout variant="reset">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">
        {success ? (
          /* Success state */
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900">
                Password Reset Successful
              </h2>
              <p className="text-sm text-slate-500">
                You can now log in with your new password.
              </p>
            </div>
            <Button onClick={() => navigate('/login', { replace: true })}>
              Go to Login
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-slate-900">
                Set New Password
              </h1>
              <p className="text-sm text-slate-500">
                Ensure your account is secure.
              </p>
            </div>

            {!token && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                No reset token found. Please use the link from your email.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="reset-password"
                  className="block text-sm font-medium text-slate-700"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="reset-password"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full rounded-lg border bg-white text-slate-900 placeholder:text-slate-400
                      px-3.5 py-2.5 pr-10 text-sm transition-all duration-150
                      focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600
                      ${errors.newPassword ? 'border-red-500' : 'border-slate-300 hover:border-slate-400'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword ? (
                  <p className="text-xs text-red-600 font-medium">
                    {errors.newPassword}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Must be at least 8 characters long.
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="reset-confirm"
                  className="block text-sm font-medium text-slate-700"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="reset-confirm"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full rounded-lg border bg-white text-slate-900 placeholder:text-slate-400
                      px-3.5 py-2.5 pr-10 text-sm transition-all duration-150
                      focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600
                      ${errors.confirmPassword ? 'border-red-500' : 'border-slate-300 hover:border-slate-400'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 font-medium">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                loading={resetMutation.isPending}
                disabled={!token}
                className="w-full !py-2.5"
              >
                Reset Password
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
