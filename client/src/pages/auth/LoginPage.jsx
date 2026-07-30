import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui';
import { loginUser } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * LoginPage — matching login page.png mockup design.
 * Split-screen layout with email-or-username / password form.
 * Backend accepts { email, password } or { username, password } — we auto-detect.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    identifier: '',
    password: '',
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (response) => {
      const { user, token } = response.data;
      setAuth(token, user);
      toast.success(response.message || 'Welcome back!');
      navigate('/dashboard', { replace: true });
    },
    onError: (error) => {
      toast.error(error.message || 'Login failed');
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.identifier.trim()) newErrors.identifier = 'Email or username is required';
    if (!form.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const trimmed = form.identifier.trim();
    const isEmail = trimmed.includes('@');

    loginMutation.mutate({
      ...(isEmail ? { email: trimmed } : { username: trimmed }),
      password: form.password,
    });
  };

  return (
    <AuthLayout variant="login">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-sm text-slate-500">
            Login to your account to manage your facility.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email or Username */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-identifier"
              className="block text-sm font-medium text-slate-700"
            >
              Email or Username
            </label>
            <div className="relative">
              <input
                id="login-identifier"
                name="identifier"
                type="text"
                value={form.identifier}
                onChange={handleChange}
                placeholder="email@example.com or username"
                autoComplete="username"
                className={`w-full rounded-lg border bg-white text-slate-900 placeholder:text-slate-400
                  px-3.5 py-2.5 text-sm transition-all duration-150
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600
                  ${errors.identifier ? 'border-red-500' : 'border-slate-300 hover:border-slate-400'}`}
              />
            </div>
            {errors.identifier && (
              <p className="text-xs text-red-600 font-medium">{errors.identifier}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full rounded-lg border bg-white text-slate-900 placeholder:text-slate-400
                  px-3.5 py-2.5 pr-10 text-sm transition-all duration-150
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600
                  ${errors.password ? 'border-red-500' : 'border-slate-300 hover:border-slate-400'}`}
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
            {errors.password && (
              <p className="text-xs text-red-600 font-medium">
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={handleChange}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-4 h-4"
            />
            <span className="text-sm text-slate-600">
              Remember me for 30 days
            </span>
          </label>

          {/* Submit */}
          <Button
            type="submit"
            loading={loginMutation.isPending}
            className="w-full !py-2.5"
          >
            Sign In
          </Button>
        </form>

        {/* Footer link */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Register facility
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
