import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from '../hooks/useForm';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const { values, handleChange } = useForm({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', values);
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'vendor') {
        if (!data.user.vendorProfile?.idDocument) navigate('/vendor/id-upload');
        else navigate('/vendor/dashboard');
      }
      else navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.needsVerification) {
        setUnverifiedEmail(data.email || values.email);
      } else {
        toast.error(data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-4">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-400 mt-2">Sign in to your CreatorHub account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input type="email" name="email" value={values.email} onChange={handleChange} required placeholder="you@example.com" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} name="password" value={values.password} onChange={handleChange} required placeholder="••••••••" className="input pr-12" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showPass ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            <div className="text-right mt-1">
              <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300">Forgot password?</Link>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</span> : 'Sign In'}
          </button>

          {unverifiedEmail && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
              <p className="text-yellow-300 text-sm font-medium mb-1">Email not verified</p>
              <p className="text-yellow-200/70 text-xs mb-3">You must verify your email before you can log in.</p>
              <Link
                to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="text-sm text-yellow-300 hover:text-yellow-200 font-medium underline underline-offset-2"
              >
                Enter verification code →
              </Link>
            </div>
          )}
        </form>

        <p className="text-center text-gray-400 mt-4 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
