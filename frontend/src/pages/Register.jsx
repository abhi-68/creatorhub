import { useState } from 'react';
import { useForm } from '../hooks/useForm';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { SparklesIcon, EyeIcon, EyeSlashIcon, CameraIcon, MegaphoneIcon, FilmIcon, PaintBrushIcon } from '@heroicons/react/24/outline';

const roles = [
  { value: 'user', label: 'User', desc: 'Browse & hire creators', icon: '👤' },
  { value: 'vendor', label: 'Vendor', desc: 'Showcase your work & get hired', icon: '🌟' },
];

const categories = [
  { value: 'photographer', label: 'Photographer', icon: '📷' },
  { value: 'influencer', label: 'Influencer', icon: '📱' },
  { value: 'videographer', label: 'Videographer', icon: '🎬' },
  { value: 'graphic_designer', label: 'Graphic Designer', icon: '🎨' },
  { value: 'content_creator', label: 'Content Creator', icon: '✍️' },
  { value: 'model', label: 'Model', icon: '✨' },
  { value: 'makeup_artist', label: 'Makeup Artist', icon: '💄' },
  { value: 'other', label: 'Other', icon: '🌟' },
];

export default function Register() {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(searchParams.get('role') || 'user');
  const [category, setCategory] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { values, handleChange } = useForm({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (values.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.post('/auth/register', {
        ...values,
        role,
        ...(role === 'vendor' && category ? { vendorCategory: category } : {}),
      });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">📧</div>
          <h2 className="text-2xl font-bold text-white mb-3">Check your email!</h2>
          <p className="text-gray-400 mb-6">We sent a verification link to <strong className="text-primary-400">{values.email}</strong>. Click it to activate your account.</p>
          <Link to="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-4">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Join CreatorHub</h1>
          <p className="text-gray-400 mt-2">Create your free account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-5">
          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">I want to...</label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${role === r.value ? 'border-primary-500 bg-primary-500/10' : 'border-gray-700 hover:border-gray-600'}`}
                >
                  <div className="text-xl mb-1">{r.icon}</div>
                  <div className="font-medium text-white text-sm">{r.label}</div>
                  <div className="text-xs text-gray-400">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Vendor category */}
          {role === 'vendor' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Your Category</label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`p-2 rounded-lg border text-center transition-all ${category === c.value ? 'border-primary-500 bg-primary-500/10' : 'border-gray-700 hover:border-gray-600'}`}
                  >
                    <div className="text-lg">{c.icon}</div>
                    <div className="text-xs text-gray-300 mt-0.5 leading-tight">{c.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input type="text" name="name" value={values.name} onChange={handleChange} required placeholder="Your name" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input type="email" name="email" value={values.email} onChange={handleChange} required placeholder="you@example.com" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                value={values.password}
                onChange={handleChange}
                required
                placeholder="Min. 6 characters"
                className="input pr-12"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showPass ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating account...
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
