import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui';
import { registerUser } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * RegisterPage — matching register page.png mockup design.
 * Split-screen with username, email, password, confirm password form.
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (response) => {
      const { user, token } = response.data;
      setAuth(token, user);
      toast.success(response.message || 'Account created successfully!');
      navigate('/dashboard', { replace: true });
    },
    onError: (error) => {
      toast.error(error.message || 'Registration failed');
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
    if (!form.username.trim()) newErrors.username = 'Username is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8)
      newErrors.password = 'Must be at least 8 characters';
    if (!form.confirmPassword)
      newErrors.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    registerMutation.mutate({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
    });
  };

  return (
    <AuthLayout variant="register">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="text-sm text-slate-500">Join the elite gym network</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-username"
              className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider"
            >
              Username
            </label>
            <input
              id="reg-username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder="johndoe"
              className={`w-full rounded-lg border bg-white text-slate-900 placeholder:text-slate-400
                px-3.5 py-2.5 text-sm transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600
                ${errors.username ? 'border-red-500' : 'border-slate-300 hover:border-slate-400'}`}
            />
            {errors.username && (
              <p className="text-xs text-red-600 font-medium">
                {errors.username}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-email"
              className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider"
            >
              Email Address
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="jane@facility.com"
              className={`w-full rounded-lg border bg-white text-slate-900 placeholder:text-slate-400
                px-3.5 py-2.5 text-sm transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600
                ${errors.email ? 'border-red-500' : 'border-slate-300 hover:border-slate-400'}`}
            />
            {errors.email && (
              <p className="text-xs text-red-600 font-medium">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-password"
              className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="reg-password"
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

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-confirm"
              className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="reg-confirm"
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
            loading={registerMutation.isPending}
            className="w-full !py-2.5"
          >
            Register Account
          </Button>
        </form>

        {/* Footer link */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
