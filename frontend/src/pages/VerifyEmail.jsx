import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); setMessage('No token provided.'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then((res) => { setStatus('success'); setMessage(res.data.message); })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.error || 'Verification failed'); });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <div>
            <div className="w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Verifying your email...</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <Link to="/login" className="btn-primary">Sign In Now</Link>
          </div>
        )}
        {status === 'error' && (
          <div>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <Link to="/register" className="btn-secondary">Register Again</Link>
          </div>
        )}
      </div>
    </div>
  );
}
