import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/users/account');
      logout();
      toast.success('Account deleted');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome, {user?.name}! 👋</h1>
        <p className="text-gray-400 mt-1">Manage your account and explore creators</p>
      </div>

      {!user?.isVerified && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-yellow-400">Email not verified</p>
            <p className="text-yellow-300/80 text-sm">Please check your inbox and click the verification link.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link to="/explore" className="card p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform">
          <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center text-2xl">🔍</div>
          <div>
            <p className="font-semibold text-white">Explore</p>
            <p className="text-gray-400 text-sm">Find creators</p>
          </div>
        </Link>
        <Link to="/chat" className="card p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform">
          <div className="w-12 h-12 bg-accent-500/20 rounded-xl flex items-center justify-center text-2xl">💬</div>
          <div>
            <p className="font-semibold text-white">Messages</p>
            <p className="text-gray-400 text-sm">Your chats</p>
          </div>
        </Link>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-2xl">⭐</div>
          <div>
            <p className="font-semibold text-white">Reviews</p>
            <p className="text-gray-400 text-sm">Your activity</p>
          </div>
        </div>
      </div>

      {/* Profile card */}
      <div className="card p-6">
        <h2 className="font-semibold text-white text-lg mb-4">My Profile</h2>
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-2xl font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-white text-lg">{user?.name}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className="badge bg-green-500/20 text-green-400 mt-1">User</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-500/30 rounded-2xl p-6">
        <h2 className="font-semibold text-red-400 text-lg mb-1">Danger Zone</h2>
        <p className="text-gray-400 text-sm mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold px-5 py-2 rounded-xl transition-all text-sm">
            🗑 Delete My Account
          </button>
        ) : (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-300 font-medium mb-3">Are you absolutely sure? This will delete your account, all messages and reviews permanently.</p>
            <div className="flex gap-3">
              <button onClick={handleDeleteAccount} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-xl transition-all text-sm disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary text-sm py-2">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
