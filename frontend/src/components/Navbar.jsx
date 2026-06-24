import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bars3Icon, XMarkIcon, ChatBubbleLeftRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

const categoryColors = {
  admin: 'bg-red-500/20 text-red-400',
  vendor: 'bg-primary-500/20 text-primary-400',
  user: 'bg-green-500/20 text-green-400',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'vendor') {
      if (!user?.vendorProfile?.idDocument) return '/vendor/id-upload';
      if (!user?.vendorProfile?.idVerified) return '/vendor/dashboard'; // shows pending screen
      return '/vendor/dashboard';
    }
    return '/dashboard';
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">CreatorHub</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/explore" className={`text-sm font-medium transition-colors ${isActive('/explore') ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}>
              Explore
            </Link>
            {user && (
              <>
                <Link to="/chat" className={`text-sm font-medium transition-colors flex items-center gap-1 ${isActive('/chat') ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}>
                  <ChatBubbleLeftRightIcon className="w-4 h-4" /> Messages
                </Link>
                <Link to={getDashboardLink()} className={`text-sm font-medium transition-colors ${isActive(getDashboardLink()) ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}>
                  Dashboard
                </Link>
              </>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className={`badge ${categoryColors[user.role] || categoryColors.user}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-500/50" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-sm font-bold">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-300">{user.name}</span>
                </div>
                <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 px-4">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Join Free</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 py-4 space-y-3 animate-fade-in">
          <Link to="/explore" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white py-2">Explore</Link>
          {user ? (
            <>
              <Link to="/chat" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white py-2">Messages</Link>
              <Link to={getDashboardLink()} onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white py-2">Dashboard</Link>
              <div className="pt-2 border-t border-gray-800">
                <p className="text-sm text-gray-400 mb-2">{user.name} · <span className="text-primary-400">{user.role}</span></p>
                <button onClick={handleLogout} className="btn-secondary w-full text-sm">Logout</button>
              </div>
            </>
          ) : (
            <div className="flex gap-2 pt-2 border-t border-gray-800">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary flex-1 text-center text-sm py-2">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 text-center text-sm py-2">Join Free</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
